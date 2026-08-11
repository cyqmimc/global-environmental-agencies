import { test } from "node:test";
import assert from "node:assert/strict";
import {
  winsorizedBounds,
  minMaxNormalize,
  weightedScore,
  computeStateIndices,
  computeGovernanceIndices,
  computePercentile,
  percentileToGrade,
  encodeWeights,
  decodeWeights,
  isDefaultWeights,
  DEFAULT_STATE_WEIGHTS,
  DEFAULT_GOVERNANCE_WEIGHTS,
  MIN_VALID_DIMENSIONS,
} from "../utils/score.js";

// ---- minMaxNormalize boundaries ----

test("minMaxNormalize: value at the low bound scores 0", () => {
  assert.equal(minMaxNormalize(0, [0, 25, 50, 75, 100]), 0);
});

test("minMaxNormalize: value at the high bound scores 100", () => {
  assert.equal(minMaxNormalize(100, [0, 25, 50, 75, 100]), 100);
});

test("minMaxNormalize: value above the winsorized high bound clamps to 100, not beyond", () => {
  // 1000 is a wild outlier; with winsorizing the p95 bound sits well below it.
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1000];
  const score = minMaxNormalize(1000, values);
  assert.equal(score, 100);
});

test("minMaxNormalize: value below the winsorized low bound clamps to 0, not negative", () => {
  const values = [-1000, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const score = minMaxNormalize(-1000, values);
  assert.equal(score, 0);
});

test("minMaxNormalize: invert flips low/high", () => {
  const values = [0, 25, 50, 75, 100];
  assert.equal(minMaxNormalize(0, values, { invert: true }), 100);
  assert.equal(minMaxNormalize(100, values, { invert: true }), 0);
});

test("minMaxNormalize: null/undefined value returns null, not a crash", () => {
  assert.equal(minMaxNormalize(null, [1, 2, 3]), null);
  assert.equal(minMaxNormalize(undefined, [1, 2, 3]), null);
});

test("minMaxNormalize: empty dataset returns null", () => {
  assert.equal(minMaxNormalize(50, []), null);
});

test("minMaxNormalize: degenerate all-equal dataset returns neutral 50, not NaN", () => {
  assert.equal(minMaxNormalize(7, [7, 7, 7, 7]), 50);
});

// ---- winsorizedBounds ----

test("winsorizedBounds: excludes nulls before computing percentiles", () => {
  const b = winsorizedBounds([null, undefined, 10, 20, 30, 40, 50]);
  assert.ok(b.lo >= 10 && b.hi <= 50);
});

test("winsorizedBounds: single value dataset returns that value for both bounds", () => {
  const b = winsorizedBounds([42]);
  assert.equal(b.lo, 42);
  assert.equal(b.hi, 42);
});

test("winsorizedBounds: no valid values returns null", () => {
  assert.equal(winsorizedBounds([null, undefined, NaN]), null);
});

// ---- weightedScore: missing-value renormalization ----

test("weightedScore: all dimensions present sums to the weighted average", () => {
  const dimScores = { a: 100, b: 0, c: 50, d: 50 };
  const weights = { a: 25, b: 25, c: 25, d: 25 };
  const { score, validCount } = weightedScore(dimScores, weights);
  assert.equal(score, 50);
  assert.equal(validCount, 4);
});

test("weightedScore: with more than MIN_VALID_DIMENSIONS total dims, one missing dimension excludes it and renormalizes remaining weights proportionally", () => {
  // 8-dimension set (like Governance): 7 present at 100, 1 missing. The
  // missing dim's weight is redistributed among the rest, so the average of
  // seven 100s is still 100 — not dragged down by treating it as 0.
  const dimScores = { a: 100, b: 100, c: 100, d: 100, e: 100, f: 100, g: 100, h: null };
  const weights = { a: 12.5, b: 12.5, c: 12.5, d: 12.5, e: 12.5, f: 12.5, g: 12.5, h: 12.5 };
  const { score, validCount } = weightedScore(dimScores, weights);
  assert.equal(score, 100);
  assert.equal(validCount, 7);
});

test("weightedScore: when total dims equals MIN_VALID_DIMENSIONS, even one missing dimension makes the index insufficient (no partial score)", () => {
  // A 4-dimension index (like State) requires all 4 — this is the literal
  // "insufficient data" threshold at work on a small dimension set.
  const dimScores = { a: 100, b: 100, c: 100, d: null };
  const weights = DEFAULT_STATE_WEIGHTS;
  const relabeled = { forest: dimScores.a, protected: dimScores.b, air: dimScores.c, epi: dimScores.d };
  const { score, validCount } = weightedScore(relabeled, weights);
  assert.equal(score, null);
  assert.equal(validCount, 3);
});

test("weightedScore: fewer than MIN_VALID_DIMENSIONS valid entries returns null (insufficient data)", () => {
  const weights = DEFAULT_GOVERNANCE_WEIGHTS;
  const dimScores = { ndcRating: 100 }; // only 1 of 8 governance dims present
  const { score, validCount } = weightedScore(dimScores, weights);
  assert.equal(score, null);
  assert.equal(validCount, 1);
  assert.ok(validCount < MIN_VALID_DIMENSIONS);
});

test("weightedScore: exactly MIN_VALID_DIMENSIONS valid entries out of a larger set still produces a score", () => {
  const weights = DEFAULT_GOVERNANCE_WEIGHTS;
  const dimScores = { ndcRating: 80, carbonPricing: 60, btr: 40, kigali: 20 }; // 4 of 8 present
  const { score, validCount } = weightedScore(dimScores, weights);
  assert.equal(validCount, 4);
  assert.ok(typeof score === "number");
});

test("weightedScore: all dimensions missing returns null, not NaN or 0", () => {
  const dimScores = { a: null, b: null, c: null, d: null };
  const { score } = weightedScore(dimScores, DEFAULT_STATE_WEIGHTS);
  assert.equal(score, null);
});

test("weightedScore: default State weights sum to 100 (weights-sum-to-1 check)", () => {
  const sum = Object.values(DEFAULT_STATE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100);
});

test("weightedScore: default Governance weights sum to 100 (weights-sum-to-1 check)", () => {
  const sum = Object.values(DEFAULT_GOVERNANCE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100);
});

test("weightedScore: arbitrary (non-100-summing) weights still renormalize to a valid 0-100 score", () => {
  // Sliders don't have to sum to 100 as the user drags them — the function
  // renormalizes by total weight internally.
  const dimScores = { a: 100, b: 100, c: 100, d: 100 };
  const weights = { a: 7, b: 3, c: 11, d: 2 }; // sums to 23, not 100
  const { score } = weightedScore(dimScores, weights);
  assert.equal(score, 100);
});

// ---- Index computation (integration) ----

function makeCountry(overrides = {}) {
  return {
    isoCode: "xx",
    epiScore: 50,
    wb: { forestArea: 30, protectedAreas: 20, pm25: 15, renewableEnergy: 25, co2Mt: 100, gdp: 1e11 },
    parisAgreement: { ndcRating: "2C", ndc3Submitted: true },
    carbonPricing: { priceUSD: 20, coveragePercent: 50 },
    reportingStatus: { btrSubmitted: true },
    montrealProtocol: { kigaliAmendment: true },
    desertification: { ldnTargetSet: true },
    ...overrides,
  };
}

test("computeStateIndices: a country with all dims better than the rest scores higher", () => {
  const good = makeCountry({ epiScore: 90, wb: { forestArea: 80, protectedAreas: 80, pm25: 2, renewableEnergy: 25, co2Mt: 100, gdp: 1e11 } });
  const bad = makeCountry({ epiScore: 10, wb: { forestArea: 5, protectedAreas: 5, pm25: 90, renewableEnergy: 25, co2Mt: 100, gdp: 1e11 } });
  const mid = makeCountry({ isoCode: "mid" });
  const results = computeStateIndices([good, bad, mid]);
  assert.ok(results.get(good).score > results.get(mid).score);
  assert.ok(results.get(mid).score > results.get(bad).score);
});

test("computeStateIndices: State only has 4 dimensions total, so missing even one (EPI) makes that country's index insufficient data", () => {
  const noEpi = makeCountry({ epiScore: null });
  const withEpi = makeCountry({ isoCode: "yy" });
  const results = computeStateIndices([noEpi, withEpi]);
  assert.equal(results.get(noEpi).validCount, 3);
  assert.equal(results.get(noEpi).score, null);
  assert.ok(typeof results.get(withEpi).score === "number");
});

test("computeGovernanceIndices: missing one of the 8 dimensions still yields a renormalized score", () => {
  const noNdc3 = makeCountry({ parisAgreement: { ndcRating: "2C", ndc3Submitted: null } });
  const results = computeGovernanceIndices([noNdc3, makeCountry({ isoCode: "yy" })]);
  assert.equal(results.get(noNdc3).validCount, 7);
  assert.ok(typeof results.get(noNdc3).score === "number");
});

test("computeGovernanceIndices: boolean dimensions aren't dataset-normalized (preNormalized bypass)", () => {
  // If every country in the set has btrSubmitted=true, naive min-max would
  // collapse them all to the degenerate 50 fallback. preNormalized dims must
  // instead pass the raw 100 straight through.
  const a = makeCountry({ isoCode: "a" });
  const b = makeCountry({ isoCode: "b" });
  const results = computeGovernanceIndices([a, b]);
  assert.equal(results.get(a).dimScores.btr, 100);
  assert.equal(results.get(b).dimScores.btr, 100);
});

test("computeGovernanceIndices: no carbon price is a real 0, not an excluded dimension", () => {
  const noPricing = makeCountry({ carbonPricing: { priceUSD: null, coveragePercent: 0 } });
  const results = computeGovernanceIndices([noPricing, makeCountry({ isoCode: "b" })]);
  assert.equal(results.get(noPricing).dimScores.carbonPricing, 0);
});

test("computeGovernanceIndices: not_assessed NDC rating is excluded, not scored as worst", () => {
  const notAssessed = makeCountry({ parisAgreement: { ndcRating: "not_assessed", ndc3Submitted: true } });
  const worst = makeCountry({ isoCode: "worst", parisAgreement: { ndcRating: "critically_insufficient", ndc3Submitted: true } });
  const results = computeGovernanceIndices([notAssessed, worst]);
  assert.equal(results.get(notAssessed).dimScores.ndcRating, null);
  assert.equal(results.get(worst).dimScores.ndcRating, 16.7);
});

// ---- percentile / grade ----

test("percentileToGrade: boundaries", () => {
  assert.equal(percentileToGrade(95), "A+");
  assert.equal(percentileToGrade(94.9), "A");
  assert.equal(percentileToGrade(50), "B");
  assert.equal(percentileToGrade(0), "F");
});

test("computePercentile: null value returns null", () => {
  assert.equal(computePercentile(null, [1, 2, 3]), null);
});

// ---- weight URL encode/decode ----

test("encodeWeights/decodeWeights round-trip preserves values", () => {
  const encoded = encodeWeights(DEFAULT_STATE_WEIGHTS, DEFAULT_GOVERNANCE_WEIGHTS);
  const { stateWeights, governanceWeights } = decodeWeights(encoded);
  assert.deepEqual(stateWeights, DEFAULT_STATE_WEIGHTS);
  assert.deepEqual(governanceWeights, DEFAULT_GOVERNANCE_WEIGHTS);
});

test("decodeWeights: malformed input falls back entirely to defaults, not a partial parse", () => {
  const { stateWeights, governanceWeights } = decodeWeights("garbage");
  assert.deepEqual(stateWeights, DEFAULT_STATE_WEIGHTS);
  assert.deepEqual(governanceWeights, DEFAULT_GOVERNANCE_WEIGHTS);
});

test("decodeWeights: wrong dimension count falls back to defaults", () => {
  const { stateWeights } = decodeWeights("25,25,25-20,15,10,10,15,10,10,10");
  assert.deepEqual(stateWeights, DEFAULT_STATE_WEIGHTS);
});

test("decodeWeights: negative weight falls back to defaults", () => {
  const { stateWeights } = decodeWeights("25,25,25,-5-20,15,10,10,15,10,10,10");
  assert.deepEqual(stateWeights, DEFAULT_STATE_WEIGHTS);
});

test("isDefaultWeights: true for defaults, false after a change", () => {
  assert.equal(isDefaultWeights(DEFAULT_STATE_WEIGHTS, DEFAULT_GOVERNANCE_WEIGHTS), true);
  const changed = { ...DEFAULT_STATE_WEIGHTS, forest: 40 };
  assert.equal(isDefaultWeights(changed, DEFAULT_GOVERNANCE_WEIGHTS), false);
});
