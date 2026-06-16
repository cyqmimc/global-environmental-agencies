#!/usr/bin/env node
/**
 * Merge UNCCD desertification + NDC 3.0 data into public/countries.json.
 *
 * Source files:
 *   scripts/data/desertification.json   — per-country UNCCD status
 *   scripts/data/ndc3.json              — per-country Third NDC submission
 *
 * Idempotent: re-running over an already-merged countries.json updates the
 * fields in place without duplicating other content.
 *
 * Both source files carry `_meta.primarySource(s)` and per-country `source`
 * URLs so every value is traceable back to UNCCD / UNFCCC official pages.
 *
 *   Run: node scripts/merge-treaty-extensions.js
 */
const fs = require("fs");
const path = require("path");

const COUNTRIES = path.join(__dirname, "..", "public", "countries.json");
const D_DATA = path.join(__dirname, "data", "desertification.json");
const N_DATA = path.join(__dirname, "data", "ndc3.json");

const countries = JSON.parse(fs.readFileSync(COUNTRIES, "utf8"));
const desertData = JSON.parse(fs.readFileSync(D_DATA, "utf8"));
const ndcData = JSON.parse(fs.readFileSync(N_DATA, "utf8"));

let added = 0, updated = 0, missing = [];

countries.forEach((c) => {
  const iso = c.isoCode;
  if (!iso) return;
  const d = desertData[iso];
  const n = ndcData[iso];

  if (d) {
    const before = JSON.stringify(c.desertification || null);
    c.desertification = {
      status: "ratified",
      ratifiedDate: d.ratifiedDate || null,
      annex: d.annex || null,
      affectedParty: !!d.affectedParty,
      ldnTargetSet: !!d.ldnTargetSet,
      ldnYear: d.ldnYear || null,
      napSubmitted: !!d.napSubmitted,
      napYear: d.napYear || null,
      commitmentZh: d.commitmentZh || "",
      commitmentEn: d.commitmentEn || "",
      sources: {
        ldn: "https://www.unccd.int/our-work/ldn-target-setting-programme",
        country: `https://www.unccd.int/our-work/country-profile/${iso}`,
        registry: "https://prais.unccd.int",
      },
    };
    if (before !== JSON.stringify(c.desertification)) {
      if (before === "null") added++; else updated++;
    }
  } else {
    missing.push(`desertification: ${iso}`);
  }

  if (n) {
    c.parisAgreement = c.parisAgreement || {};
    c.parisAgreement.ndc3Submitted = !!n.ndc3Submitted;
    c.parisAgreement.ndc3Date = n.ndc3Date || null;
    c.parisAgreement.ndc3Target = n.ndc3Target || null;
    c.parisAgreement.ndc3Source = n.source || "https://unfccc.int/NDCREG";
    if (n.note) c.parisAgreement.ndc3Note = n.note;

    // Keep the ndcHistory timeline in sync if NDC 3.0 was submitted but not
    // yet recorded in the legacy history array.
    if (n.ndc3Submitted && Array.isArray(c.parisAgreement.ndcHistory)) {
      const hasNdc3 = c.parisAgreement.ndcHistory.some((h) =>
        /NDC\s*3(\.0)?|Third\s*NDC/i.test(String(h.version || ""))
      );
      if (!hasNdc3 && n.ndc3Date) {
        c.parisAgreement.ndcHistory.push({
          version: "NDC 3.0",
          year: parseInt(n.ndc3Date.slice(0, 4), 10),
        });
        c.parisAgreement.ndcHistory.sort((a, b) => (a.year || 0) - (b.year || 0));
      }
    }
  } else {
    missing.push(`ndc3: ${iso}`);
  }
});

fs.writeFileSync(COUNTRIES, JSON.stringify(countries, null, 2) + "\n");

console.log(`✓ Merged into countries.json`);
console.log(`  · desertification entries: ${Object.keys(desertData).length - 1}/80`);
console.log(`  · ndc3 entries: ${Object.keys(ndcData).length - 1}/80`);
const ldnCount = Object.values(desertData).filter((x) => x && x.ldnTargetSet).length;
const ndc3Count = Object.values(ndcData).filter((x) => x && x.ndc3Submitted).length;
console.log(`  · LDN targets set: ${ldnCount}/80`);
console.log(`  · NDC 3.0 submitted: ${ndc3Count}/80`);
if (missing.length) {
  console.warn(`⚠ Missing source data for ${missing.length} entries:`);
  missing.slice(0, 5).forEach((m) => console.warn(`    ${m}`));
}
