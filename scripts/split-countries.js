#!/usr/bin/env node
/**
 * Split countries.json into core (52KB) + detail (136KB) for lazy loading.
 * Run: node scripts/split-countries.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export function buildCore(data) {
  return data.map((c) => ({
    countryEn: c.countryEn,
    countryZh: c.countryZh,
    agencyEn: c.agencyEn,
    agencyZh: c.agencyZh,
    website: c.website,
    flagUrl: c.flagUrl,
    region: c.region,
    established: c.established,
    responsibilities: c.responsibilities,
    epiScore: c.epiScore,
    netZeroTarget: c.netZeroTarget,
    isoCode: c.isoCode,
    parisAgreement: c.parisAgreement
      ? {
          ndcRating: c.parisAgreement.ndcRating,
          ndc3Submitted: !!c.parisAgreement.ndc3Submitted,
        }
      : null,
    desertification: c.desertification
      ? {
          affectedParty: !!c.desertification.affectedParty,
          ldnTargetSet: !!c.desertification.ldnTargetSet,
          annex: c.desertification.annex || null,
        }
      : null,
    montrealProtocol: c.montrealProtocol
      ? { kigaliAmendment: c.montrealProtocol.kigaliAmendment }
      : null,
    carbonPricing: c.carbonPricing
      ? {
          priceUSD: c.carbonPricing.priceUSD,
          coveragePercent: c.carbonPricing.coveragePercent,
          hasETS: c.carbonPricing.hasETS,
          hasCarbonTax: c.carbonPricing.hasCarbonTax,
        }
      : null,
    reportingStatus: c.reportingStatus
      ? { btrSubmitted: c.reportingStatus.btrSubmitted }
      : null,
    climateEquity: c.climateEquity || null,
  }));
}

export function buildDetail(data) {
  const detail = {};
  data.forEach((c) => {
    detail[c.isoCode] = {
      descriptionZh: c.descriptionZh,
      descriptionEn: c.descriptionEn,
      contact: c.contact,
      treaties: c.treaties,
      treatyRatification: c.treatyRatification,
      keyLaws: c.keyLaws,
      parisAgreement: c.parisAgreement,
      montrealProtocol: c.montrealProtocol,
      cbd: c.cbd,
      desertification: c.desertification,
      carbonPricing: c.carbonPricing,
      reportingStatus: c.reportingStatus,
    };
  });
  return detail;
}

export function buildOgData(data, wbData) {
  const ogData = {};
  data.forEach((c) => {
    const w = wbData.countries[c.isoCode] || {};
    ogData[c.isoCode] = {
      en: c.countryEn, zh: c.countryZh,
      agency: c.agencyEn, epi: c.epiScore,
      ndc: c.parisAgreement?.ndcRating,
      co2: w.co2PerCapita ?? null, pm25: w.pm25 ?? null,
      renew: w.renewableEnergy ?? null, forest: w.forestArea ?? null,
      carbon: c.carbonPricing?.priceUSD ?? null,
      region: c.region,
    };
  });
  return ogData;
}

function main() {
  const src = path.join(ROOT, "public", "countries.json");
  const data = JSON.parse(fs.readFileSync(src, "utf8"));

  const core = buildCore(data);
  const detail = buildDetail(data);

  const outDir = path.join(ROOT, "public");
  fs.writeFileSync(path.join(outDir, "countries-core.json"), JSON.stringify(core));
  fs.writeFileSync(path.join(outDir, "countries-detail.json"), JSON.stringify(detail));

  // OG image data (minimal subset for Edge Function)
  let wbData = { countries: {} };
  try {
    wbData = JSON.parse(fs.readFileSync(path.join(outDir, "wb-latest.json"), "utf8"));
  } catch {
    // wb-latest.json not generated yet — fall back to the empty default above.
  }

  const ogData = buildOgData(data, wbData);
  fs.writeFileSync(path.join(outDir, "og-data.json"), JSON.stringify(ogData));

  const coreSize = (Buffer.byteLength(JSON.stringify(core)) / 1024).toFixed(1);
  const detailSize = (Buffer.byteLength(JSON.stringify(detail)) / 1024).toFixed(1);
  const ogSize = (Buffer.byteLength(JSON.stringify(ogData)) / 1024).toFixed(1);
  console.log(`✓ countries-core.json: ${coreSize} KB`);
  console.log(`✓ countries-detail.json: ${detailSize} KB`);
  console.log(`✓ og-data.json: ${ogSize} KB`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
