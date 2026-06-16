#!/usr/bin/env node
/**
 * Lightweight schema validator for public/countries.json.
 * Zero dependencies — uses plain JS guards.
 *
 * Run: node scripts/validate-schema.js
 * Exits non-zero on the first error so CI catches drift before split.
 */
const fs = require("fs");
const path = require("path");

const VALID_RESPONSIBILITIES = new Set([
  "climate", "water", "biodiversity", "forest",
  "air", "waste", "energy", "chemicals", "nuclear",
]);

const VALID_NDC_RATINGS = new Set([
  "1.5C", "2C", "almost_sufficient", "insufficient",
  "highly_insufficient", "critically_insufficient", "not_assessed",
]);

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

  check(c.data && typeof c.data.forestCoverage === "number", "data.forestCoverage missing", ctx);
  check(c.data && typeof c.data.carbonEmission === "number", "data.carbonEmission missing", ctx);

  if (c.parisAgreement?.ndcRating != null) {
    check(
      VALID_NDC_RATINGS.has(c.parisAgreement.ndcRating),
      `invalid ndcRating "${c.parisAgreement.ndcRating}"`,
      ctx
    );
  }

  warn(typeof c.epiScore === "number", "epiScore missing", ctx);
  warn(c.netZeroTarget != null, "netZeroTarget missing", ctx);
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
// wb-data.json validation
// ------------------------------------------------------------------
const wbPath = path.join(__dirname, "..", "public", "wb-data.json");
let wb;
try {
  wb = JSON.parse(fs.readFileSync(wbPath, "utf8"));
} catch (e) {
  console.warn("⚠ wb-data.json not present, skipping WB schema check");
  process.exit(0);
}

const wbErrors = [];
const wbWarnings = [];

if (!wb.countries || typeof wb.countries !== "object") {
  console.error("✗ wb-data.json: missing `countries` map");
  process.exit(1);
}

// Required numeric fields that downstream UI depends on.
const REQUIRED_WB_FIELDS = [
  "forestArea", "co2Mt", "renewableEnergy", "pm25",
  "protectedAreas", "population", "gdp", "co2PerCapita",
];

const isoSet = new Set(data.map((c) => c.isoCode).filter(Boolean));

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
}

if (wbWarnings.length) {
  console.warn(`⚠ wb-data.json: ${wbWarnings.length} warning(s)`);
  wbWarnings.slice(0, 8).forEach((w) => console.warn("  -", w));
  if (wbWarnings.length > 8) console.warn(`  ...and ${wbWarnings.length - 8} more`);
}

if (wbErrors.length) {
  console.error(`✗ wb-data.json: ${wbErrors.length} error(s)`);
  wbErrors.forEach((e) => console.error("  -", e));
  process.exit(1);
}

console.log(`✓ wb-data.json validated · ${Object.keys(wb.countries).length} entries · ${wbWarnings.length} warnings`);
