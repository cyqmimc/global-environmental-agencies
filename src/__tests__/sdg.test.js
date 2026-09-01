import test from "node:test";
import assert from "node:assert/strict";
import { SERIES_CONFIG, pickLatestObservation } from "../../scripts/fetch-un-sdg-data.js";

test("pickLatestObservation selects the latest matching total-series row", () => {
  const config = SERIES_CONFIG.find((item) => item.key === "waterStress");
  const rows = [
    {
      geoAreaCode: "840",
      timePeriodStart: 2022,
      value: "20",
      dimensions: { Activity: "TOTAL", "Reporting Type": "G" },
      attributes: { Nature: "E", "Observation Status": "A" },
    },
    {
      geoAreaCode: "840",
      timePeriodStart: 2023,
      value: "18",
      dimensions: { Activity: "TOTAL", "Reporting Type": "G" },
      attributes: { Nature: "E", "Observation Status": "A" },
    },
    {
      geoAreaCode: "840",
      timePeriodStart: 2023,
      value: "99",
      dimensions: { Activity: "INDUSTRIES", "Reporting Type": "G" },
    },
  ];
  const result = pickLatestObservation(rows, config, "840");
  assert.equal(result.value, 18);
  assert.equal(result.year, 2023);
  assert.equal(result.unit, "%");
});

test("pickLatestObservation does not fabricate a value for missing geography", () => {
  const config = SERIES_CONFIG.find((item) => item.key === "degradedLand");
  assert.equal(pickLatestObservation([], config, "840"), null);
});
