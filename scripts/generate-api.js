#!/usr/bin/env node
/**
 * Static JSON API — build-time generation, zero backend.
 *
 * Writes:
 *   dist/api/v1/countries.json        — all 80 countries, flattened
 *   dist/api/v1/country/<iso>.json    — one file per country, 80 files
 *   dist/api/v1/rankings.json         — State/Governance scores + grades,
 *                                        default weights (see README)
 *
 * Run: node scripts/generate-api.js  (after `vite build`, see package.json)
 *
 * IMPORTANT — licensing: this API mixes data from several sources with
 * DIFFERENT licenses (see `_meta.license` in every response, and README.md's
 * "公共 API" section). In particular `epiScore` is Yale EPI data under
 * CC BY-NC-SA 4.0 (non-commercial, share-alike) and `ndcRating` is a
 * Climate Action Tracker assessment that is not openly licensed at all —
 * neither may be redistributed/reused under the same terms as the World
 * Bank fields (CC BY 4.0) or this project's own compiled fields. Read
 * `_meta.license.fields` in the response before bulk-reusing anything.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  computeStateIndices,
  computeGovernanceIndices,
  computePercentile,
  percentileToGrade,
  DEFAULT_STATE_WEIGHTS,
  DEFAULT_GOVERNANCE_WEIGHTS,
} from "../src/utils/score.js";
import { BASE_URL } from "./site-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const API_VERSION = "1.0";
const REPO_URL = "https://github.com/cyqmimc/global-environmental-agencies";
const PROJECT_NAME = "Global Environmental Governance Tracker";

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

// ---------------------------------------------------------------------
// _meta — every response carries this. Not one blended license: the
// dataset is a compilation of sources with genuinely different terms, and
// papering over that is exactly the "二次分发的坑" (redistribution
// pitfall) this needs to avoid. See README.md's "公共 API" section for the
// full citation-format guidance this summarizes.
// ---------------------------------------------------------------------
function buildMeta({ endpoint, count, wbMeta }) {
  return {
    version: API_VERSION,
    generatedAt: new Date().toISOString(),
    endpoint,
    ...(count != null ? { count } : {}),
    dataAsOf: {
      worldBank: wbMeta?.fetchedAt ?? null,
      pm25Note: wbMeta?.pm25Source ?? null,
    },
    project: {
      name: PROJECT_NAME,
      url: BASE_URL,
      repository: REPO_URL,
      documentation: `${BASE_URL}/#about`,
    },
    suggestedCitation:
      `${PROJECT_NAME} (${new Date().getUTCFullYear()}). Retrieved from ${BASE_URL}/api/v1/. ` +
      `Underlying figures are from World Bank Open Data, Yale EPI, and Climate Action Tracker — ` +
      `see license.fields below for which applies to which field before reuse.`,
    license: {
      summary:
        "This is a compiled dataset, not a single-license one — see `fields` below. " +
        "This project's own code is MIT; that does NOT extend to the third-party figures it compiles.",
      fields: {
        default: {
          appliesTo: "isoCode, countryEn/Zh, agencyEn/Zh, agencyWebsite, region, netZeroTargetYear, carbonPrice*, hasETS/hasCarbonTax, btr*, kigaliAmendmentRatified, ndc3Submitted, ldnTargetSet, state*/governance* (this project's own computed scores)",
          license: "CC BY 4.0",
          note: "This project's own curation/computation — attribute this project (see suggestedCitation above).",
        },
        epiScore: {
          appliesTo: "epiScore, epiScoreYear",
          source: "Yale Environmental Performance Index (EPI)",
          sourceUrl: "https://epi.yale.edu/",
          license: "CC BY-NC-SA 4.0",
          note: "Non-commercial use only, share-alike. Do not use in a commercial product or service without checking Yale EPI's own terms first.",
        },
        ndcRating: {
          appliesTo: "ndcRating",
          source: "Climate Action Tracker",
          sourceUrl: "https://climateactiontracker.org/",
          license: "Not openly licensed — CAT's own terms apply",
          note: "Attribution required. CAT asks to be contacted before bulk redistribution or commercial reuse of its ratings — this is an independent assessment CAT produces, not this project's own data.",
        },
        worldBank: {
          appliesTo: "forestAreaPercent, co2Mt, co2PerCapitaT, renewableEnergyPercent, pm25, protectedAreaPercent (and their *Year fields)",
          source: "World Bank Open Data",
          sourceUrl: "https://data.worldbank.org/",
          license: "CC BY 4.0",
        },
      },
    },
  };
}

function flattenCountry(country, wbRow, scores) {
  const wb = wbRow || {};
  const dataYear = wb.dataYear || {};
  return {
    isoCode: country.isoCode,
    countryEn: country.countryEn,
    countryZh: country.countryZh,
    region: country.region,
    agencyEn: country.agencyEn,
    agencyZh: country.agencyZh,
    agencyWebsite: country.website,

    epiScore: country.epiScore ?? null,
    epiScoreYear: country.epiScore != null ? 2024 : null, // see PROVENANCE.epiScore in src/constants.js

    ndcRating: country.parisAgreement?.ndcRating ?? null,
    ndc3Submitted: country.parisAgreement?.ndc3Submitted ?? null,
    netZeroTargetYear: country.netZeroTarget ?? null,

    carbonPriceUsdPerTon: country.carbonPricing?.priceUSD ?? null,
    carbonPriceCoveragePercent: country.carbonPricing?.coveragePercent ?? null,
    hasEmissionsTradingSystem: country.carbonPricing?.hasETS ?? null,
    hasCarbonTax: country.carbonPricing?.hasCarbonTax ?? null,

    btrSubmitted: country.reportingStatus?.btrSubmitted ?? null,
    btrYear: country.reportingStatus?.btrYear ?? null,

    kigaliAmendmentRatified: country.montrealProtocol?.kigaliAmendment ?? null,
    ldnTargetSet: country.desertification?.ldnTargetSet ?? null,

    forestAreaPercent: wb.forestArea ?? null,
    forestAreaYear: dataYear.forestArea ?? null,
    co2Mt: wb.co2Mt ?? null,
    co2PerCapitaT: wb.co2PerCapita ?? null,
    co2Year: dataYear.co2Mt ?? null,
    renewableEnergyPercent: wb.renewableEnergy ?? null,
    renewableEnergyYear: dataYear.renewableEnergy ?? null,
    pm25: wb.pm25 ?? null,
    pm25Year: dataYear.pm25 ?? null,
    protectedAreaPercent: wb.protectedAreas ?? null,
    protectedAreaYear: dataYear.protectedAreas ?? null,

    stateScore: scores.state.score,
    stateGrade: scores.state.grade,
    statePercentile: scores.state.percentile,
    governanceScore: scores.governance.score,
    governanceGrade: scores.governance.grade,
    governancePercentile: scores.governance.percentile,
  };
}

function computeAllScores(merged) {
  const stateIndices = computeStateIndices(merged, DEFAULT_STATE_WEIGHTS);
  const governanceIndices = computeGovernanceIndices(merged, DEFAULT_GOVERNANCE_WEIGHTS);
  const stateScores = merged.map((c) => stateIndices.get(c)?.score).filter((v) => v != null);
  const governanceScores = merged.map((c) => governanceIndices.get(c)?.score).filter((v) => v != null);

  const byIso = new Map();
  merged.forEach((c) => {
    const state = stateIndices.get(c);
    const governance = governanceIndices.get(c);
    const statePct = state?.score != null ? computePercentile(state.score, stateScores) : null;
    const govPct = governance?.score != null ? computePercentile(governance.score, governanceScores) : null;
    byIso.set(c.isoCode, {
      state: { score: state?.score ?? null, grade: percentileToGrade(statePct), percentile: statePct },
      governance: { score: governance?.score ?? null, grade: percentileToGrade(govPct), percentile: govPct },
    });
  });
  return byIso;
}

function main() {
  const countries = readJson(join(ROOT, "public", "countries.json"));
  const wb = readJson(join(ROOT, "public", "wb-latest.json"));
  const merged = countries.map((c) => ({ ...c, wb: wb.countries?.[c.isoCode] || null }));
  const scoresByIso = computeAllScores(merged);

  const flattened = countries.map((c) =>
    flattenCountry(c, wb.countries?.[c.isoCode], scoresByIso.get(c.isoCode))
  );

  const apiDir = join(DIST, "api", "v1");
  const countryDir = join(apiDir, "country");
  mkdirSync(countryDir, { recursive: true });

  // 1. Bulk endpoint
  writeFileSync(
    join(apiDir, "countries.json"),
    JSON.stringify(
      { _meta: buildMeta({ endpoint: "/api/v1/countries.json", count: flattened.length, wbMeta: wb.meta }), countries: flattened },
      null,
      2
    ) + "\n"
  );

  // 2. Per-country endpoints
  flattened.forEach((c) => {
    writeFileSync(
      join(countryDir, `${c.isoCode}.json`),
      JSON.stringify(
        { _meta: buildMeta({ endpoint: `/api/v1/country/${c.isoCode}.json`, wbMeta: wb.meta }), country: c },
        null,
        2
      ) + "\n"
    );
  });

  // 3. Rankings — sorted by Governance score (this project's point of
  // differentiation, see README's methodology section), State included
  // alongside since neither is meant to be read as "the" ranking alone.
  const rankings = [...flattened]
    .filter((c) => c.governanceScore != null)
    .sort((a, b) => b.governanceScore - a.governanceScore)
    .map((c, i) => ({
      governanceRank: i + 1,
      isoCode: c.isoCode,
      countryEn: c.countryEn,
      countryZh: c.countryZh,
      region: c.region,
      stateScore: c.stateScore,
      stateGrade: c.stateGrade,
      governanceScore: c.governanceScore,
      governanceGrade: c.governanceGrade,
    }));
  writeFileSync(
    join(apiDir, "rankings.json"),
    JSON.stringify(
      {
        _meta: {
          ...buildMeta({ endpoint: "/api/v1/rankings.json", count: rankings.length, wbMeta: wb.meta }),
          methodology: `${BASE_URL}/#about`,
          weights: { state: DEFAULT_STATE_WEIGHTS, governance: DEFAULT_GOVERNANCE_WEIGHTS },
          note: "Computed with this project's default dimension weights. The interactive site lets a viewer re-weight dimensions (?w= URL param) — this static snapshot always reflects the defaults.",
        },
        rankings,
      },
      null,
      2
    ) + "\n"
  );

  console.log(`✓ Wrote dist/api/v1/countries.json (${flattened.length} countries)`);
  console.log(`✓ Wrote dist/api/v1/country/<iso>.json (${flattened.length} files)`);
  console.log(`✓ Wrote dist/api/v1/rankings.json (${rankings.length} ranked)`);
  if (BASE_URL.includes("REPLACE_WITH_PRODUCTION_DOMAIN")) {
    console.warn(`⚠ BASE_URL is still a placeholder — _meta.project.url in every API response reflects that.`);
  }
}

main();
