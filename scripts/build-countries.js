#!/usr/bin/env node
/**
 * Merge data/countries/<iso>.json (80 hand-maintained per-country files) into
 * public/countries.json — the single-file format the rest of the pipeline
 * (scripts/split-countries.js, scripts/validate-schema.js, the app itself)
 * still consumes.
 *
 * Why per-country source files: public/countries.json used to be the file
 * people hand-edited directly — a single 300KB+ JSON array where any two
 * concurrent edits collide, and a PR touching one country's data has no way
 * to show a reviewer "this changed" without a 300KB diff. Editing
 * data/countries/<iso>.json instead means a PR's diff *is* the change, and
 * two contributors editing different countries never conflict.
 *
 * public/countries.json remains a real, committed, generated file (Vercel's
 * static deploy serves it directly — it cannot be gitignored and built only
 * in CI). What changes is that it's no longer hand-edited: CI's
 * `npm run validate` step (see scripts/verify-generated-data.js) fails the
 * build if public/countries.json doesn't match what this script would
 * produce right now, which is what actually prevents silent drift between
 * the generated file and its source.
 *
 * Run: node scripts/build-countries.js
 * Then (as before): node scripts/split-countries.js
 * Or just: npm run build-data
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "data", "countries");
const OUT_FILE = path.join(ROOT, "public", "countries.json");

// The one true top-level field order. Applied on every build regardless of
// the order fields happen to be written in the source file, so contributors
// never have to think about key order and the generated output never drifts
// based on who last touched a file. Keep this in sync with CONTRIBUTING.md's
// field table if you add/remove/rename a field.
export const FIELD_ORDER = [
  "isoCode",
  "countryEn",
  "countryZh",
  "agencyEn",
  "agencyZh",
  "website",
  "flagUrl",
  "descriptionZh",
  "descriptionEn",
  "region",
  "established",
  "responsibilities",
  "contact",
  "treaties",
  "epiScore",
  "netZeroTarget",
  "keyLaws",
  "parisAgreement",
  "montrealProtocol",
  "cbd",
  "carbonPricing",
  "reportingStatus",
  "climateEquity",
  "desertification",
  "treatyRatification",
  "legacyData",
];

export function reorderFields(country, order = FIELD_ORDER) {
  const out = {};
  for (const key of order) {
    if (key in country) out[key] = country[key];
  }
  // Any field not in FIELD_ORDER (e.g. a newly-added one nobody's registered
  // yet) is kept, appended in its original order, rather than silently
  // dropped — surfaces as a visible tail instead of losing data.
  for (const key of Object.keys(country)) {
    if (!(key in out)) out[key] = country[key];
  }
  return out;
}

export function buildCountries({ srcDir = SRC_DIR } = {}) {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`${srcDir} does not exist — nothing to build from`);
  }
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".json"))
    .sort(); // filesystem order isn't guaranteed; sort for determinism

  const countries = files.map((file) => {
    const isoFromFilename = path.basename(file, ".json");
    let country;
    try {
      country = JSON.parse(fs.readFileSync(path.join(srcDir, file), "utf8"));
    } catch (err) {
      throw new Error(`data/countries/${file}: invalid JSON — ${err.message}`, { cause: err });
    }
    if (country.isoCode !== isoFromFilename) {
      throw new Error(
        `data/countries/${file}: isoCode "${country.isoCode}" does not match filename`
      );
    }
    return reorderFields(country);
  });

  // Stable overall ordering (by isoCode) so the merged array doesn't reorder
  // itself based on directory listing quirks across OSes/filesystems.
  countries.sort((a, b) => a.isoCode.localeCompare(b.isoCode));
  return countries;
}

export function serialize(countries) {
  return JSON.stringify(countries, null, 2) + "\n";
}

// Shared read/write helpers for scripts that patch individual countries
// (e.g. merge-treaty-extensions.js, merge-treaty-ratification.js) — they
// used to read/mutate/write the single public/countries.json array; now they
// do the same thing per-file against data/countries/<iso>.json.
export function listIsoCodes(srcDir = SRC_DIR) {
  return fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"))
    .sort();
}

export function readCountryFile(iso, srcDir = SRC_DIR) {
  return JSON.parse(fs.readFileSync(path.join(srcDir, `${iso}.json`), "utf8"));
}

export function writeCountryFile(country, srcDir = SRC_DIR) {
  const reordered = reorderFields(country);
  fs.writeFileSync(
    path.join(srcDir, `${country.isoCode}.json`),
    JSON.stringify(reordered, null, 2) + "\n"
  );
}

function main() {
  const countries = buildCountries();
  const json = serialize(countries);
  fs.writeFileSync(OUT_FILE, json);
  console.log(`✓ Built public/countries.json from ${countries.length} files in data/countries/`);
}

// Only run when invoked directly (`node scripts/build-countries.js`), not
// when imported by scripts/verify-generated-data.js.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
