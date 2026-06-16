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
