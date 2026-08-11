#!/usr/bin/env node
/**
 * Compares the hand-written legacy numbers in public/countries.json
 * (data.forestCoverage / data.carbonEmission) against the authoritative
 * World Bank values in public/wb-latest.json (wb.forestArea / wb.co2Mt).
 *
 * Flags:
 *   - forest coverage: absolute difference > 3 percentage points
 *   - carbon emission: relative difference > 5%
 *
 * Run: node scripts/audit-data-drift.js
 * Exit code is non-zero when any country is flagged, so this can gate CI.
 */
const fs = require("fs");
const path = require("path");

const FOREST_THRESHOLD_PP = 3;
const CARBON_THRESHOLD_PCT = 5;

const countries = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "public", "countries.json"), "utf8")
);
const wb = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "public", "wb-latest.json"), "utf8")
);

const rows = [];

for (const c of countries) {
  const legacyForest = c.legacyData?.forestCoverage;
  const legacyCarbon = c.legacyData?.carbonEmission;
  const wbRow = wb.countries?.[c.isoCode];
  if (!wbRow) continue;

  const wbForest = wbRow.forestArea;
  const wbCarbon = wbRow.co2Mt;

  const forestDiffPP =
    legacyForest != null && wbForest != null ? Math.abs(legacyForest - wbForest) : null;
  const carbonDiffPct =
    legacyCarbon != null && wbCarbon != null && wbCarbon !== 0
      ? (Math.abs(legacyCarbon - wbCarbon) / wbCarbon) * 100
      : null;

  const forestFlagged = forestDiffPP != null && forestDiffPP > FOREST_THRESHOLD_PP;
  const carbonFlagged = carbonDiffPct != null && carbonDiffPct > CARBON_THRESHOLD_PCT;

  if (forestFlagged || carbonFlagged) {
    rows.push({
      iso: c.isoCode,
      country: c.countryEn,
      legacyForest,
      wbForest,
      forestDiffPP,
      forestFlagged,
      legacyCarbon,
      wbCarbon,
      carbonDiffPct,
      carbonFlagged,
    });
  }
}

rows.sort((a, b) => (b.carbonDiffPct || 0) - (a.carbonDiffPct || 0));

function fmt(n, digits = 1) {
  return n == null ? "—" : n.toFixed(digits);
}

console.log(
  `Comparing ${countries.length} countries · thresholds: forest >${FOREST_THRESHOLD_PP}pp, carbon >${CARBON_THRESHOLD_PCT}%\n`
);

if (rows.length === 0) {
  console.log("✓ No drift beyond thresholds.");
  process.exit(0);
}

const header = [
  "ISO",
  "Country",
  "Forest legacy",
  "Forest WB",
  "Forest Δpp",
  "Carbon legacy",
  "Carbon WB",
  "Carbon Δ%",
];
console.log(header.join(" | "));
console.log(header.map(() => "---").join(" | "));

for (const r of rows) {
  console.log(
    [
      r.iso,
      r.country,
      fmt(r.legacyForest, 0),
      fmt(r.wbForest, 2),
      r.forestFlagged ? `⚠ ${fmt(r.forestDiffPP, 1)}` : fmt(r.forestDiffPP, 1),
      fmt(r.legacyCarbon, 0),
      fmt(r.wbCarbon, 2),
      r.carbonFlagged ? `⚠ ${fmt(r.carbonDiffPct, 1)}` : fmt(r.carbonDiffPct, 1),
    ].join(" | ")
  );
}

console.log(
  `\n✗ ${rows.length}/${countries.length} countries exceed drift thresholds (${rows.filter((r) => r.forestFlagged).length} forest, ${rows.filter((r) => r.carbonFlagged).length} carbon).`
);
process.exit(1);
