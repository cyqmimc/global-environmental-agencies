import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SDG_INDICATORS, sortSdgCountries, formatSdgValue } from "../utils/sdg.js";
import { pickLatestObservation } from "../../scripts/fetch-un-sdg-data.js";
import { buildCSV, getUrlParams, setUrlParams } from "../constants.js";

test("new population indicators select national totals, not urban/rural or regional estimates", () => {
  for (const key of ["safeDrinkingWater", "cleanCooking"]) {
    const config = SDG_INDICATORS.find((item) => item.key === key);
    const rows = [
      { geoAreaCode: "840", value: "12", timePeriodStart: 2024, dimensions: { Location: "RURAL", "Reporting Type": "G" } },
      { geoAreaCode: "840", value: "50", timePeriodStart: 2024, dimensions: { Location: "ALLAREA", "Reporting Type": "R" } },
      { geoAreaCode: "840", value: "0", timePeriodStart: 2024, dimensions: config.dimensions },
    ];
    assert.equal(pickLatestObservation(rows, config, "840").value, 0);
  }
});

test("SDG sorting retains zero and always puts missing and non-applicable values last", () => {
  const countries = [
    { isoCode: "a", sdg: { cleanCooking: { status: "missing" } } },
    { isoCode: "b", sdg: { cleanCooking: { status: "available", value: 0 } } },
    { isoCode: "c", sdg: { cleanCooking: { status: "available", value: 90 } } },
    { isoCode: "d", sdg: { cleanCooking: { status: "not_applicable" } } },
  ];
  assert.deepEqual(sortSdgCountries(countries, "cleanCooking", true).map((c) => c.isoCode), ["c", "b", "a", "d"]);
  assert.deepEqual(sortSdgCountries(countries, "cleanCooking", false).map((c) => c.isoCode), ["b", "c", "a", "d"]);
  assert.equal(countries[0].isoCode, "a");
  assert.equal(formatSdgValue("redListIndex", { status: "available", value: 0.82952 }), "0.830");
  assert.equal(formatSdgValue("cleanCooking", { status: "missing" }), "—");
});

test("CSV exports all SDG fields, preserves missing states, and uses the per-capita emissions year", () => {
  const country = {
    countryEn: "Test", responsibilities: [], isoCode: "xx",
    wb: { co2PerCapita: 2, dataYear: { co2Mt: 2024, co2PerCapita: 2023 } },
    sdg: { cleanCooking: { status: "available", value: 0, year: 2024, nature: "E" }, marineKbaProtected: { status: "not_applicable" } },
  };
  const csv = buildCSV([country], "en");
  const [header, row] = csv.trim().split("\n").map((line) => [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((match) => match[1]));
  assert.equal(row.length, header.length);
  assert.equal(row[header.indexOf("CO₂ Data Year")], "2023");
  assert.equal(row[header.indexOf("SDG 7.1.2 Clean cooking fuels and technology (%)")], "0");
  assert.equal(row[header.indexOf("Marine KBA protection Status")], "not_applicable");
  for (const definition of SDG_INDICATORS) assert.ok(header.some((label) => label.startsWith(`SDG ${definition.indicator} `)));
});

test("official snapshot has matching coverage and bounded new indicators", () => {
  const snapshot = JSON.parse(fs.readFileSync(new URL("../../public/sdg-latest.json", import.meta.url)));
  for (const definition of SDG_INDICATORS) {
    const records = Object.values(snapshot.countries).map((country) => country[definition.key]);
    assert.ok(records.every((record) => record && ["available", "missing", "not_applicable"].includes(record.status)));
    const available = records.filter((record) => record.status === "available");
    assert.equal(available.length, snapshot.meta.indicators[definition.key].coverage);
    assert.ok(available.every((record) => record.year === snapshot.meta.indicators[definition.key].dataYear));
    if (["safeDrinkingWater", "cleanCooking", "redListIndex"].includes(definition.key)) {
      assert.ok(available.every((record) => record.value >= 0 && record.value <= (definition.key === "redListIndex" ? 1 : 100)));
    }
  }
});

test("SDG metric and direction survive a share-link round trip, invalid metrics fall back safely", () => {
  const previousWindow = globalThis.window;
  let shared;
  globalThis.window = {
    location: { search: "?view=sdg&sdg=redListIndex&sdgOrder=asc", pathname: "/" },
    history: { replaceState: (_state, _title, url) => { shared = url; } },
  };
  try {
    const params = getUrlParams();
    assert.equal(params.sdgMetric, "redListIndex");
    assert.equal(params.sdgDescending, false);
    setUrlParams({ view: params.view, sdgMetric: params.sdgMetric, sdgDescending: params.sdgDescending });
    assert.equal(shared, "/?view=sdg&sdg=redListIndex&sdgOrder=asc");
    globalThis.window.location.search = "?sdg=unknown";
    assert.equal(getUrlParams().sdgMetric, "safeDrinkingWater");
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
