#!/usr/bin/env node
/**
 * Merge scripts/data/treaty-ratification.json into data/countries/<iso>.json
 * under a new `treatyRatification` field per country.
 *
 * This is the structured, per-treaty ratification record that supersedes the
 * flat `treaties[]` sample array as the source of truth once populated.
 * `treaties[]` itself is left untouched here — P0-2's UI stopgap already
 * relabels it as "Selected Treaties" until callers migrate to
 * `treatyRatification`.
 *
 * Idempotent: re-running over already-merged files overwrites
 * `treatyRatification` in place without touching other fields.
 *
 * Patches data/countries/<iso>.json directly — NOT public/countries.json,
 * which is now a generated file (run `npm run build-data` afterward to
 * regenerate it, same as after any data/countries/ edit).
 *
 *   Run: node scripts/merge-treaty-ratification.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { listIsoCodes, readCountryFile, writeCountryFile } from "./build-countries.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RATIFICATION = path.join(__dirname, "data", "treaty-ratification.json");
const { _meta, ...ratificationByIso } = JSON.parse(fs.readFileSync(RATIFICATION, "utf8"));

let added = 0, updated = 0;
const missing = [];
const statusCounts = {};

listIsoCodes().forEach((iso) => {
  const entry = ratificationByIso[iso];
  if (!entry) {
    missing.push(iso);
    return;
  }

  const c = readCountryFile(iso);
  const before = JSON.stringify(c.treatyRatification || null);
  c.treatyRatification = entry;
  const after = JSON.stringify(entry);
  if (before !== after) {
    if (before === "null") added++; else updated++;
    writeCountryFile(c);
  }

  Object.values(entry).forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
});

console.log(`✓ Merged treatyRatification into data/countries/<iso>.json`);
console.log(`  · source: ${RATIFICATION}`);
console.log(`  · retrievedAt: ${_meta?.retrievedAt || "unknown"}`);
console.log(`  · countries added: ${added}, updated: ${updated}`);
console.log(`  · status breakdown:`, statusCounts);
if (missing.length) {
  console.warn(`⚠ No treaty-ratification entry for ${missing.length} countries:`, missing.join(", "));
}
console.log(`\nRun \`npm run build-data\` to regenerate public/countries.json.`);
