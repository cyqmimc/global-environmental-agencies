/**
 * Fetch environmental indicators from World Bank Open Data API
 * and write to public/wb-data.json
 *
 * Usage: node scripts/fetch-world-bank-data.js
 * No API key required.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const INDICATORS = {
  forestArea: "AG.LND.FRST.ZS",
  co2Mt: "EN.GHG.CO2.MT.CE.AR5",       // CO2 total excl. LULUCF (Mt CO2e) — EDGAR/AR5, data to 2024
  co2PerCapitaDirect: "EN.GHG.CO2.PC.CE.AR5", // CO2 per capita (t CO2e) — direct from WB, data to 2024
  renewableEnergy: "EG.FEC.RNEW.ZS",
  pm25: "EN.ATM.PM25.MC.M3",
  protectedAreas: "ER.PTD.TOTL.ZS",
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
};

// Wider range to capture latest available year per indicator
const DATE_RANGE = "2015:2025";
const BASE_URL = "https://api.worldbank.org/v2";

async function fetchAllPages(url) {
  let page = 1;
  let allData = [];
  while (true) {
    const pageUrl = `${url}&page=${page}&per_page=1000`;
    const res = await fetch(pageUrl);
    if (!res.ok) return allData;
    const json = await res.json();
    if (!json[1] || !Array.isArray(json[1])) break;
    allData = allData.concat(json[1]);
    const meta = json[0];
    if (page >= meta.pages) break;
    page++;
  }
  return allData;
}

// Fetch alpha-3 to alpha-2 mapping from WB country list
let _alpha3to2Cache = null;
async function getAlpha3to2Map() {
  if (_alpha3to2Cache) return _alpha3to2Cache;
  console.log("  Fetching country code mapping...");
  const url = `${BASE_URL}/country?format=json&per_page=500`;
  const res = await fetch(url);
  const json = await res.json();
  const map = {};
  if (json[1]) {
    for (const c of json[1]) {
      if (c.id && c.iso2Code) {
        map[c.id.toUpperCase()] = c.iso2Code.toLowerCase();
      }
    }
  }
  console.log(`  ✓ Mapped ${Object.keys(map).length} country codes`);
  _alpha3to2Cache = map;
  return map;
}

async function fetchIndicator(code, label) {
  const url = `${BASE_URL}/country/all/indicator/${code}?date=${DATE_RANGE}&format=json`;
  console.log(`  Fetching ${label} (${code})...`);

  try {
    const data = await fetchAllPages(url);
    if (!data.length) {
      console.error(`  ✗ No data returned for ${code}`);
      return {};
    }

    const alpha3to2 = await getAlpha3to2Map();

    // Index by country alpha-2 code, keeping both latest + history
    const result = {};
    for (const entry of data) {
      if (entry.value == null) continue;
      const rawId = entry.country?.id;
      if (!rawId) continue;

      let key;
      if (rawId.length === 2) {
        key = rawId.toLowerCase();
      } else if (rawId.length === 3) {
        key = alpha3to2[rawId.toUpperCase()];
      } else {
        continue; // skip aggregates
      }
      if (!key) continue;

      const year = parseInt(entry.date);
      if (!result[key]) result[key] = { value: null, year: 0, history: [] };
      result[key].history.push({ year, value: Math.round(entry.value * 100) / 100 });
      if (year > result[key].year) {
        result[key].value = entry.value;
        result[key].year = year;
      }
    }

    // Sort history by year ascending
    for (const key of Object.keys(result)) {
      result[key].history.sort((a, b) => a.year - b.year);
    }

    console.log(`  ✓ Got data for ${Object.keys(result).length} countries`);
    return result;
  } catch (err) {
    console.error(`  ✗ Error fetching ${code}: ${err.message}`);
    return {};
  }
}

async function main() {
  console.log("🌍 Fetching World Bank environmental data...\n");

  // Step 1: Read existing countries to know which ISO codes we need
  const countriesPath = resolve(ROOT, "public/countries.json");
  const countries = JSON.parse(readFileSync(countriesPath, "utf-8"));
  const isoCodes = new Set(
    countries
      .map((c) => c.isoCode?.toLowerCase())
      .filter(Boolean)
  );
  console.log(`  Target: ${isoCodes.size} countries\n`);

  // Step 2: Fetch all indicators with delay between requests
  const indicatorData = {};
  for (const [key, code] of Object.entries(INDICATORS)) {
    indicatorData[key] = await fetchIndicator(code, key);
    await new Promise((r) => setTimeout(r, 500));
  }

  // Step 3: Build output keyed by alpha-2 code
  const output = {
    meta: {
      fetchedAt: new Date().toISOString(),
      dateRange: DATE_RANGE,
      indicators: { ...INDICATORS },
    },
    countries: {},
  };

  for (const iso2 of isoCodes) {
    const countryData = {};
    const dataYear = {};
    let hasAny = false;

    for (const key of Object.keys(INDICATORS)) {
      const entry = indicatorData[key]?.[iso2];
      if (entry) {
        countryData[key] = Math.round(entry.value * 100) / 100;
        dataYear[key] = entry.year;
        hasAny = true;
      } else {
        countryData[key] = null;
        dataYear[key] = null;
      }
    }

    // Use direct WB per-capita indicator (preferred), fallback to computed
    if (countryData.co2PerCapitaDirect != null) {
      countryData.co2PerCapita = countryData.co2PerCapitaDirect;
    } else if (countryData.co2Mt != null && countryData.population != null && countryData.population > 0) {
      countryData.co2PerCapita = Math.round((countryData.co2Mt * 1e6 / countryData.population) * 100) / 100;
    } else {
      countryData.co2PerCapita = null;
    }
    // Remove helper fields from output
    delete countryData.co2PerCapitaDirect;
    delete dataYear.co2PerCapitaDirect;

    // Collect history only for trend-chart indicators (keep payload small)
    const HISTORY_KEYS = ["forestArea", "co2Mt", "renewableEnergy", "pm25"];
    const history = {};
    for (const key of HISTORY_KEYS) {
      const entry = indicatorData[key]?.[iso2];
      if (entry?.history?.length) {
        history[key] = entry.history;
      }
    }

    if (hasAny) {
      output.countries[iso2] = { ...countryData, dataYear, history };
    }
  }

  // Step 4: Write output
  const outPath = resolve(ROOT, "public/wb-data.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  const matched = Object.keys(output.countries).length;
  console.log(
    `\n✅ Done! Wrote data for ${matched}/${isoCodes.size} countries to public/wb-data.json`
  );

  // Report missing
  for (const iso2 of isoCodes) {
    if (!output.countries[iso2]) {
      console.log(`  ⚠ No data for: ${iso2}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
