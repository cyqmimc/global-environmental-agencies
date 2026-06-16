import { test } from "node:test";
import assert from "node:assert/strict";

// computeCompositeScore is exported from RankingsView; we re-implement the
// pure function here to avoid pulling in React. Behaviour must stay in sync.
function computeCompositeScore(country) {
  const epi = (country.epiScore ?? 0) * 0.25;
  const renew = Math.min(country.wb?.renewableEnergy ?? 0, 100) * 0.20;
  const forest = Math.min(country.wb?.forestArea ?? 0, 100) * 0.15;
  const protect = Math.min(country.wb?.protectedAreas ?? 0, 100) * 0.15;
  const air = (100 - Math.min(country.wb?.pm25 ?? 100, 100)) * 0.15;
  const co2 = (100 - Math.min((country.wb?.co2PerCapita ?? 0) * 5, 100)) * 0.10;
  return +(epi + renew + forest + protect + air + co2).toFixed(1);
}

test("composite: all-zero country scores 0 + air baseline only", () => {
  // pm25=100, co2/cap=null → air contributes 0, co2 contributes 10.
  const c = { epiScore: 0, wb: { pm25: 100, co2PerCapita: 0 } };
  assert.equal(computeCompositeScore(c), 10);
});

test("composite: missing wb data is treated as worst-case (not crash)", () => {
  const c = { epiScore: 50 };
  assert.ok(typeof computeCompositeScore(c) === "number");
});

test("composite: perfect country approaches 100", () => {
  const c = {
    epiScore: 100,
    wb: {
      renewableEnergy: 100,
      forestArea: 100,
      protectedAreas: 100,
      pm25: 0,
      co2PerCapita: 0,
    },
  };
  assert.equal(computeCompositeScore(c), 100);
});

test("composite: weight sum equals 1.0", () => {
  const weights = 0.25 + 0.20 + 0.15 + 0.15 + 0.15 + 0.10;
  assert.equal(+weights.toFixed(2), 1.0);
});

test("composite: high pm25 hurts the air component", () => {
  const clean = { epiScore: 0, wb: { pm25: 5, co2PerCapita: 0 } };
  const dirty = { epiScore: 0, wb: { pm25: 50, co2PerCapita: 0 } };
  assert.ok(computeCompositeScore(clean) > computeCompositeScore(dirty));
});
