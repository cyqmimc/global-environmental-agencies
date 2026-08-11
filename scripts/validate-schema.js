#!/usr/bin/env node
/**
 * Lightweight schema validator for public/countries.json.
 * Zero dependencies — uses plain JS guards.
 *
 * Run: node scripts/validate-schema.js
 * Exits non-zero on the first error so CI catches drift before split.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VALID_RESPONSIBILITIES = new Set([
  "climate", "water", "biodiversity", "forest",
  "air", "waste", "energy", "chemicals", "nuclear",
]);

const VALID_NDC_RATINGS = new Set([
  "1.5C", "2C", "almost_sufficient", "insufficient",
  "highly_insufficient", "critically_insufficient", "not_assessed",
]);

const VALID_RATIFICATION_STATUSES = new Set([
  "ratified", "acceded", "signed", "not_party", "unknown",
]);
const STATUSES_REQUIRING_DATE_AND_SOURCE = new Set(["ratified", "acceded"]);

const errors = [];
const warnings = [];

function check(cond, msg, ctx) {
  if (!cond) errors.push(`${msg} [${ctx}]`);
}
function warn(cond, msg, ctx) {
  if (!cond) warnings.push(`${msg} [${ctx}]`);
}

const src = path.join(__dirname, "..", "public", "countries.json");
const data = JSON.parse(fs.readFileSync(src, "utf8"));

if (!Array.isArray(data)) {
  console.error("countries.json must be an array");
  process.exit(2);
}

const seenIso = new Set();

data.forEach((c, i) => {
  const ctx = c.countryEn || `index ${i}`;
  check(typeof c.countryEn === "string" && c.countryEn.length, "missing countryEn", ctx);
  check(typeof c.countryZh === "string" && c.countryZh.length, "missing countryZh", ctx);
  check(typeof c.agencyEn === "string" && c.agencyEn.length, "missing agencyEn", ctx);
  check(typeof c.agencyZh === "string" && c.agencyZh.length, "missing agencyZh", ctx);
  check(typeof c.website === "string" && /^https?:\/\//.test(c.website), "invalid website URL", ctx);
  check(typeof c.flagUrl === "string", "missing flagUrl", ctx);
  check(typeof c.region === "string", "missing region", ctx);
  check(typeof c.isoCode === "string" && /^[a-z]{2}$/.test(c.isoCode), "isoCode must be lowercase 2-letter", ctx);
  if (c.isoCode) {
    check(!seenIso.has(c.isoCode), `duplicate isoCode ${c.isoCode}`, ctx);
    seenIso.add(c.isoCode);
  }

  check(Array.isArray(c.responsibilities), "responsibilities must be array", ctx);
  if (Array.isArray(c.responsibilities)) {
    c.responsibilities.forEach((r) =>
      check(VALID_RESPONSIBILITIES.has(r), `unknown responsibility "${r}"`, ctx)
    );
  }

  check(c.legacyData && typeof c.legacyData.forestCoverage === "number", "legacyData.forestCoverage missing", ctx);
  check(c.legacyData && typeof c.legacyData.carbonEmission === "number", "legacyData.carbonEmission missing", ctx);

  if (c.parisAgreement?.ndcRating != null) {
    check(
      VALID_NDC_RATINGS.has(c.parisAgreement.ndcRating),
      `invalid ndcRating "${c.parisAgreement.ndcRating}"`,
      ctx
    );
  }

  warn(typeof c.epiScore === "number", "epiScore missing", ctx);
  warn(c.netZeroTarget != null, "netZeroTarget missing", ctx);

  // UNCCD desertification block (new)
  warn(c.desertification != null, "desertification block missing", ctx);
  if (c.desertification) {
    const d = c.desertification;
    check(typeof d.affectedParty === "boolean", "desertification.affectedParty must be boolean", ctx);
    check(typeof d.ldnTargetSet === "boolean", "desertification.ldnTargetSet must be boolean", ctx);
    if (d.annex !== null) check(["I", "II", "III", "IV", "V"].includes(d.annex), `desertification.annex invalid: "${d.annex}"`, ctx);
    if (d.ldnYear != null) check(Number.isInteger(d.ldnYear) && d.ldnYear >= 2015 && d.ldnYear <= 2050, `desertification.ldnYear out of range: ${d.ldnYear}`, ctx);
    check(typeof d.commitmentZh === "string", "desertification.commitmentZh missing", ctx);
    check(typeof d.commitmentEn === "string", "desertification.commitmentEn missing", ctx);
    check(d.sources && typeof d.sources.ldn === "string", "desertification.sources.ldn missing", ctx);
  }

  // Treaty ratification records (scripts/data/treaty-ratification.json, merged
  // via scripts/merge-treaty-ratification.js)
  warn(c.treatyRatification != null, "treatyRatification block missing", ctx);
  if (c.treatyRatification) {
    Object.entries(c.treatyRatification).forEach(([treatyKey, r]) => {
      check(
        VALID_RATIFICATION_STATUSES.has(r?.status),
        `treatyRatification.${treatyKey}.status invalid "${r?.status}"`,
        ctx
      );
      if (STATUSES_REQUIRING_DATE_AND_SOURCE.has(r?.status)) {
        check(
          typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date),
          `treatyRatification.${treatyKey} status="${r.status}" requires a YYYY-MM-DD date`,
          ctx
        );
        check(
          typeof r.source === "string" && /^https?:\/\//.test(r.source),
          `treatyRatification.${treatyKey} status="${r.status}" requires a source URL`,
          ctx
        );
      }
    });
  }

  // NDC 3.0 (Third NDC) block (new on parisAgreement)
  if (c.parisAgreement) {
    warn(typeof c.parisAgreement.ndc3Submitted === "boolean", "parisAgreement.ndc3Submitted missing", ctx);
    if (c.parisAgreement.ndc3Submitted === true) {
      check(typeof c.parisAgreement.ndc3Date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.parisAgreement.ndc3Date), "parisAgreement.ndc3Date required when ndc3Submitted=true (YYYY-MM-DD)", ctx);
      warn(typeof c.parisAgreement.ndc3Target === "string", "parisAgreement.ndc3Target missing", ctx);
      check(typeof c.parisAgreement.ndc3Source === "string", "parisAgreement.ndc3Source required for traceability", ctx);
    }
  }
});

if (warnings.length) {
  console.warn(`⚠ ${warnings.length} warning(s):`);
  warnings.slice(0, 10).forEach((w) => console.warn("  -", w));
  if (warnings.length > 10) console.warn(`  ...and ${warnings.length - 10} more`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} schema error(s):`);
  errors.forEach((e) => console.error("  -", e));
  process.exit(1);
}

console.log(`✓ countries.json validated · ${data.length} countries · ${warnings.length} warnings`);

// ------------------------------------------------------------------
// wb-latest.json validation
// ------------------------------------------------------------------
const wbPath = path.join(__dirname, "..", "public", "wb-latest.json");
let wb;
try {
  wb = JSON.parse(fs.readFileSync(wbPath, "utf8"));
} catch {
  console.warn("⚠ wb-latest.json not present, skipping WB schema check");
  process.exit(0);
}

const wbErrors = [];
const wbWarnings = [];

if (!wb.countries || typeof wb.countries !== "object") {
  console.error("✗ wb-latest.json: missing `countries` map");
  process.exit(1);
}

// Required numeric fields that downstream UI depends on.
const REQUIRED_WB_FIELDS = [
  "forestArea", "co2Mt", "renewableEnergy", "pm25",
  "protectedAreas", "population", "gdp", "co2PerCapita",
];

const isoSet = new Set(data.map((c) => c.isoCode).filter(Boolean));
const byIso = new Map(data.map((c) => [c.isoCode, c]));

for (const iso of isoSet) {
  const row = wb.countries[iso];
  if (!row) {
    wbWarnings.push(`wb-data missing country ${iso}`);
    continue;
  }
  for (const f of REQUIRED_WB_FIELDS) {
    const v = row[f];
    if (v == null) {
      wbWarnings.push(`${iso}: missing wb.${f}`);
      continue;
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
      wbErrors.push(`${iso}: wb.${f} is not a finite number (got ${typeof v})`);
    }
    if ((f === "gdp" || f === "population") && v <= 0) {
      wbErrors.push(`${iso}: wb.${f} must be > 0 (got ${v})`);
    }
  }
  // Cross-check: co2PerCapita roughly = co2Mt * 1e6 / population (within 20%)
  if (row.co2Mt != null && row.population > 0 && row.co2PerCapita != null) {
    const derived = (row.co2Mt * 1e6) / row.population;
    const ratio = derived / row.co2PerCapita;
    if (ratio < 0.5 || ratio > 2.0) {
      wbWarnings.push(`${iso}: co2PerCapita ${row.co2PerCapita.toFixed(2)} disagrees with co2Mt/pop ${derived.toFixed(2)}`);
    }
  }

  // legacyData is deprecated display data; warn loudly if it drifts far from the
  // authoritative WB numbers so nobody mistakes it for a still-maintained source.
  const legacy = byIso.get(iso)?.legacyData;
  if (legacy) {
    if (typeof legacy.forestCoverage === "number" && row.forestArea != null) {
      const diffPP = Math.abs(legacy.forestCoverage - row.forestArea);
      if (diffPP > row.forestArea * 0.1) {
        wbWarnings.push(`${iso}: legacyData.forestCoverage ${legacy.forestCoverage} drifts >10% from wb.forestArea ${row.forestArea.toFixed(2)}`);
      }
    }
    if (typeof legacy.carbonEmission === "number" && row.co2Mt != null) {
      const diffPct = Math.abs(legacy.carbonEmission - row.co2Mt) / row.co2Mt;
      if (diffPct > 0.1) {
        wbWarnings.push(`${iso}: legacyData.carbonEmission ${legacy.carbonEmission} drifts >10% from wb.co2Mt ${row.co2Mt.toFixed(2)}`);
      }
    }
  }
}

if (wbWarnings.length) {
  console.warn(`⚠ wb-latest.json: ${wbWarnings.length} warning(s)`);
  wbWarnings.slice(0, 8).forEach((w) => console.warn("  -", w));
  if (wbWarnings.length > 8) console.warn(`  ...and ${wbWarnings.length - 8} more`);
}

if (wbErrors.length) {
  console.error(`✗ wb-latest.json: ${wbErrors.length} error(s)`);
  wbErrors.forEach((e) => console.error("  -", e));
  process.exit(1);
}

console.log(`✓ wb-latest.json validated · ${Object.keys(wb.countries).length} entries · ${wbWarnings.length} warnings`);

// ------------------------------------------------------------------
// wb-history.json validation (structure only — trend-chart source)
// ------------------------------------------------------------------
const historyPath = path.join(__dirname, "..", "public", "wb-history.json");
let wbHistory;
try {
  wbHistory = JSON.parse(fs.readFileSync(historyPath, "utf8"));
} catch {
  console.warn("⚠ wb-history.json not present, skipping history schema check");
  process.exit(0);
}

const historyErrors = [];
const HISTORY_KEYS = new Set(["forestArea", "co2Mt", "renewableEnergy", "pm25"]);

if (!wbHistory.countries || typeof wbHistory.countries !== "object") {
  console.error("✗ wb-history.json: missing `countries` map");
  process.exit(1);
}

for (const [iso, row] of Object.entries(wbHistory.countries)) {
  for (const [key, points] of Object.entries(row)) {
    if (!HISTORY_KEYS.has(key)) {
      historyErrors.push(`${iso}: unexpected history key "${key}"`);
      continue;
    }
    if (!Array.isArray(points)) {
      historyErrors.push(`${iso}.${key}: expected an array of {year, value} points`);
      continue;
    }
    for (const p of points) {
      if (typeof p.year !== "number" || (p.value != null && typeof p.value !== "number")) {
        historyErrors.push(`${iso}.${key}: malformed point ${JSON.stringify(p)}`);
        break;
      }
    }
  }
}

if (historyErrors.length) {
  console.error(`✗ wb-history.json: ${historyErrors.length} error(s)`);
  historyErrors.slice(0, 8).forEach((e) => console.error("  -", e));
  process.exit(1);
}

console.log(`✓ wb-history.json validated · ${Object.keys(wbHistory.countries).length} entries`);
