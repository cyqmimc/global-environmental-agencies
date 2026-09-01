#!/usr/bin/env node
/**
 * Fetch a deliberately small, environment-focused subset of the official
 * UN Global SDG Indicators Database. The browser never calls the UN API;
 * this script produces a static latest-value snapshot for the 80 countries.
 *
 * Run: node scripts/fetch-un-sdg-data.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const API_BASE = process.env.SDG_API_BASE || "https://unstats.un.org/SDGAPI/v1/sdg";
const SOURCE_URL = "https://unstats.un.org/sdgs/dataportal/database";

export const SERIES_CONFIG = [
  {
    key: "waterStress",
    series: "ER_H2O_STRESS",
    indicator: "6.4.2",
    goal: 6,
    unit: "%",
    direction: "lower",
    labelZh: "水资源压力",
    labelEn: "Water stress",
    dimensions: { Activity: "TOTAL", "Reporting Type": "G" },
  },
  {
    key: "materialConsumptionGdp",
    series: "EN_MAT_DOMCMPG",
    indicator: "12.2.2",
    goal: 12,
    unit: "kg/2020 USD",
    direction: "lower",
    labelZh: "单位 GDP 国内物质消费",
    labelEn: "Material consumption / GDP",
    dimensions: { "Type of product": "ALP", "Reporting Type": "G" },
  },
  {
    key: "marineKbaProtected",
    series: "ER_MRN_MPA",
    indicator: "14.5.1",
    goal: 14,
    unit: "%",
    direction: "higher",
    labelZh: "海洋关键生物多样性区保护覆盖",
    labelEn: "Marine KBA protection",
    dimensions: { "Reporting Type": "G" },
  },
  {
    key: "degradedLand",
    series: "AG_LND_DGRD",
    indicator: "15.3.1",
    goal: 15,
    unit: "%",
    direction: "lower",
    labelZh: "土地退化面积占比",
    labelEn: "Degraded land",
    dimensions: { "Reporting Type": "G" },
  },
];

const COUNTRY_NAME_ALIASES = {
  ae: "United Arab Emirates",
  bo: "Bolivia (Plurinational State of)",
  cd: "Democratic Republic of the Congo",
  cz: "Czechia",
  gb: "United Kingdom of Great Britain and Northern Ireland",
  ir: "Iran (Islamic Republic of)",
  kr: "Republic of Korea",
  nl: "Netherlands (Kingdom of the)",
  ru: "Russian Federation",
  tr: "Türkiye",
  tz: "United Republic of Tanzania",
  us: "United States of America",
  ve: "Venezuela (Bolivarian Republic of)",
};

// Marine-area indicators are genuinely not applicable to these landlocked
// countries. Keep that distinct from an unexplained missing observation.
const LANDLOCKED_ISO = new Set(["at", "bo", "ch", "cz", "et", "hu", "kz", "mn", "np", "uz"]);

function normalizeName(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "global-environmental-governance-tracker/1.0",
    },
    signal: AbortSignal.timeout(120_000),
    ...options,
  });
  if (!response.ok) throw new Error(`UN SDG API ${response.status}: ${url}`);
  return response.json();
}

function dimensionsMatch(row, expected) {
  return Object.entries(expected).every(([key, value]) => row.dimensions?.[key] === value);
}

export function pickLatestObservation(rows, config, geoAreaCode) {
  const matches = rows.filter(
    (row) =>
      String(row.geoAreaCode) === String(geoAreaCode) &&
      dimensionsMatch(row, config.dimensions) &&
      Number.isFinite(Number(row.value)),
  );
  if (!matches.length) return null;
  matches.sort((a, b) => Number(b.timePeriodStart) - Number(a.timePeriodStart));
  const row = matches[0];
  return {
    status: "available",
    value: Number(row.value),
    year: Number(row.timePeriodStart),
    unit: config.unit,
    nature: row.attributes?.Nature || null,
    observationStatus: row.attributes?.["Observation Status"] || null,
  };
}

async function fetchSeriesRows(config, release) {
  const periodsBody = new URLSearchParams();
  periodsBody.append("seriesCodes", config.series);
  const periods = await fetchJson(`${API_BASE}/Series/TimePeriods`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "global-environmental-governance-tracker/1.0",
    },
    body: periodsBody,
  });
  const dataYear = Math.max(...periods.map(Number).filter((year) => year >= 2015));
  if (!Number.isFinite(dataYear)) throw new Error(`No post-2015 data for ${config.series}`);

  const allRows = [];
  let page = 1;
  let totalPages;
  do {
    const params = new URLSearchParams({
      seriesCode: config.series,
      releaseCode: release,
      page: String(page),
      pageSize: "5000",
    });
    // Use the series' latest common release year. This keeps cross-country
    // comparisons on one vintage and avoids the endpoint's broken range
    // behaviour (timePeriodStart/timePeriodEnd returns only the start year).
    params.append("timePeriod", String(dataYear));
    const payload = await fetchJson(`${API_BASE}/Series/Data?${params}`);
    allRows.push(...(payload.data || []));
    totalPages = payload.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return { rows: allRows, dataYear };
}

async function main() {
  const countries = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public", "countries.json"), "utf8"),
  );
  const [geoAreas, availableSeries] = await Promise.all([
    fetchJson(`${API_BASE}/GeoArea/List`),
    fetchJson(`${API_BASE}/Series/List?allreleases=false`),
  ]);

  const geoByName = new Map(geoAreas.map((geo) => [normalizeName(geo.geoAreaName), geo]));
  const geoByIso = new Map();
  for (const country of countries) {
    const officialName = COUNTRY_NAME_ALIASES[country.isoCode] || country.countryEn;
    const geo = geoByName.get(normalizeName(officialName));
    if (!geo) throw new Error(`No UN M49 match for ${country.isoCode}: ${officialName}`);
    geoByIso.set(country.isoCode, geo);
  }

  const definitions = new Map(availableSeries.map((series) => [series.code, series]));
  const fetchedSeries = await Promise.all(
    SERIES_CONFIG.map(async (config) => {
      const definition = definitions.get(config.series);
      if (!definition?.release) throw new Error(`Series unavailable: ${config.series}`);
      const fetched = await fetchSeriesRows(config, definition.release);
      return [
        config.key,
        {
          release: definition.release,
          description: definition.description,
          rows: fetched.rows,
          dataYear: fetched.dataYear,
        },
      ];
    }),
  );
  const rowsByKey = new Map(fetchedSeries);

  const output = {
    meta: {
      fetchedAt: new Date().toISOString(),
      source: "UN Global SDG Indicators Database",
      sourceUrl: SOURCE_URL,
      scope: "Environment-focused subset; latest comparable observation since 2015",
      indicators: {},
    },
    countries: {},
  };

  for (const config of SERIES_CONFIG) {
    const fetched = rowsByKey.get(config.key);
    output.meta.indicators[config.key] = {
      series: config.series,
      indicator: config.indicator,
      goal: config.goal,
      labelZh: config.labelZh,
      labelEn: config.labelEn,
      unit: config.unit,
      direction: config.direction,
      release: fetched.release,
      dataYear: fetched.dataYear,
      description: fetched.description,
      coverage: 0,
    };
  }

  for (const country of countries) {
    const geo = geoByIso.get(country.isoCode);
    const snapshot = {};
    for (const config of SERIES_CONFIG) {
      const observation = pickLatestObservation(
        rowsByKey.get(config.key).rows,
        config,
        geo.geoAreaCode,
      );
      if (observation) {
        snapshot[config.key] = observation;
        output.meta.indicators[config.key].coverage += 1;
      } else if (config.key === "marineKbaProtected" && LANDLOCKED_ISO.has(country.isoCode)) {
        snapshot[config.key] = { status: "not_applicable" };
      } else {
        snapshot[config.key] = { status: "missing" };
      }
    }
    output.countries[country.isoCode] = snapshot;
  }

  const outputPath = path.join(ROOT, "public", "sdg-latest.json");
  fs.writeFileSync(outputPath, JSON.stringify(output));
  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  const coverage = SERIES_CONFIG.map(
    (config) =>
      `${config.indicator}: ${output.meta.indicators[config.key].coverage}/${countries.length}`,
  ).join(" · ");
  console.log(`✓ sdg-latest.json: ${sizeKb} KB`);
  console.log(`✓ ${coverage}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`✗ SDG data fetch failed: ${error.message}`);
    process.exit(1);
  });
}
