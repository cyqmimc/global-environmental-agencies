#!/usr/bin/env node
/**
 * Split countries.json into core (52KB) + detail (136KB) for lazy loading.
 * Run: node scripts/split-countries.js
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "public", "countries.json");
const data = JSON.parse(fs.readFileSync(src, "utf8"));

const core = data.map((c) => ({
  countryEn: c.countryEn,
  countryZh: c.countryZh,
  agencyEn: c.agencyEn,
  agencyZh: c.agencyZh,
  website: c.website,
  flagUrl: c.flagUrl,
  data: c.data,
  region: c.region,
  established: c.established,
  responsibilities: c.responsibilities,
  epiScore: c.epiScore,
  netZeroTarget: c.netZeroTarget,
  isoCode: c.isoCode,
  parisAgreement: c.parisAgreement
    ? { ndcRating: c.parisAgreement.ndcRating }
    : null,
  montrealProtocol: c.montrealProtocol
    ? { kigaliAmendment: c.montrealProtocol.kigaliAmendment }
    : null,
  carbonPricing: c.carbonPricing
    ? { priceUSD: c.carbonPricing.priceUSD, hasETS: c.carbonPricing.hasETS, hasCarbonTax: c.carbonPricing.hasCarbonTax }
    : null,
  reportingStatus: c.reportingStatus
    ? { btrSubmitted: c.reportingStatus.btrSubmitted }
    : null,
  climateEquity: c.climateEquity || null,
}));

const detail = {};
data.forEach((c) => {
  detail[c.isoCode] = {
    descriptionZh: c.descriptionZh,
    descriptionEn: c.descriptionEn,
    contact: c.contact,
    treaties: c.treaties,
    keyLaws: c.keyLaws,
    parisAgreement: c.parisAgreement,
    montrealProtocol: c.montrealProtocol,
    cbd: c.cbd,
    carbonPricing: c.carbonPricing,
    reportingStatus: c.reportingStatus,
  };
});

const outDir = path.join(__dirname, "..", "public");
fs.writeFileSync(path.join(outDir, "countries-core.json"), JSON.stringify(core));
fs.writeFileSync(path.join(outDir, "countries-detail.json"), JSON.stringify(detail));

// OG image data (minimal subset for Edge Function)
let wbData = { countries: {} };
try {
  wbData = JSON.parse(fs.readFileSync(path.join(outDir, "wb-data.json"), "utf8"));
} catch {}

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
    region: c.region, flag: c.flagUrl,
  };
});
fs.writeFileSync(path.join(outDir, "og-data.json"), JSON.stringify(ogData));

const coreSize = (Buffer.byteLength(JSON.stringify(core)) / 1024).toFixed(1);
const detailSize = (Buffer.byteLength(JSON.stringify(detail)) / 1024).toFixed(1);
const ogSize = (Buffer.byteLength(JSON.stringify(ogData)) / 1024).toFixed(1);
console.log(`✓ countries-core.json: ${coreSize} KB`);
console.log(`✓ countries-detail.json: ${detailSize} KB`);
console.log(`✓ og-data.json: ${ogSize} KB`);
