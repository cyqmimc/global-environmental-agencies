import test from "node:test";
import assert from "node:assert/strict";
import { normalizeComparisonCountries } from "../utils/comparison.js";

test("normalizeComparisonCountries: missing arrays become safe empty arrays", () => {
  const [country] = normalizeComparisonCountries([{ countryEn: "Example" }]);

  assert.deepEqual(country.responsibilities, []);
  assert.deepEqual(country.treaties, []);
});

test("normalizeComparisonCountries: preserves loaded arrays and ignores invalid rows", () => {
  const responsibilities = ["biodiversity"];
  const treaties = ["CBD"];
  const result = normalizeComparisonCountries([
    null,
    { countryEn: "Example", responsibilities, treaties },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].responsibilities, responsibilities);
  assert.equal(result[0].treaties, treaties);
});

test("normalizeComparisonCountries: non-array input is safe", () => {
  assert.deepEqual(normalizeComparisonCountries(undefined), []);
});
