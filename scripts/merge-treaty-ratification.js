#!/usr/bin/env node
/**
 * Merge scripts/data/treaty-ratification.json into public/countries.json
 * under a new `treatyRatification` field per country.
 *
 * This is the structured, per-treaty ratification record that supersedes the
 * flat `treaties[]` sample array as the source of truth once populated.
 * `treaties[]` itself is left untouched here — P0-2's UI stopgap already
 * relabels it as "Selected Treaties" until callers migrate to
 * `treatyRatification`.
 *
 * Idempotent: re-running over an already-merged countries.json overwrites
 * `treatyRatification` in place without touching other fields.
 *
 *   Run: node scripts/merge-treaty-ratification.js
 */
const fs = require("fs");
const path = require("path");

const COUNTRIES = path.join(__dirname, "..", "public", "countries.json");
const RATIFICATION = path.join(__dirname, "data", "treaty-ratification.json");

const countries = JSON.parse(fs.readFileSync(COUNTRIES, "utf8"));
const { _meta, ...ratificationByIso } = JSON.parse(fs.readFileSync(RATIFICATION, "utf8"));

let added = 0, updated = 0;
const missing = [];
const statusCounts = {};

countries.forEach((c) => {
  const iso = c.isoCode;
  if (!iso) return;
  const entry = ratificationByIso[iso];
  if (!entry) {
    missing.push(iso);
    return;
  }

  const before = JSON.stringify(c.treatyRatification || null);
  c.treatyRatification = entry;
  const after = JSON.stringify(entry);
  if (before !== after) {
    if (before === "null") added++; else updated++;
  }

  Object.values(entry).forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
});

fs.writeFileSync(COUNTRIES, JSON.stringify(countries, null, 2) + "\n");

console.log(`✓ Merged treatyRatification into countries.json`);
console.log(`  · source: ${RATIFICATION}`);
console.log(`  · retrievedAt: ${_meta?.retrievedAt || "unknown"}`);
console.log(`  · countries added: ${added}, updated: ${updated}`);
console.log(`  · status breakdown:`, statusCounts);
if (missing.length) {
  console.warn(`⚠ No treaty-ratification entry for ${missing.length} countries:`, missing.join(", "));
}
