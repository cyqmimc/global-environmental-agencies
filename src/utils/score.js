/**
 * Composite scoring: two independently normalized 0-100 indices instead of
 * one blended number.
 *
 *  - State index: natural/structural endowment (forest cover, protected
 *    areas, air quality, EPI). A country doesn't "earn" these through a
 *    single policy choice — a resource-rich or naturally low-density
 *    country scores well here regardless of governance quality.
 *  - Governance index: policy choices and follow-through (NDC ambition,
 *    carbon pricing, BTR/NDC3.0/Kigali/LDN compliance, renewable energy
 *    share, carbon intensity). This is the project's actual point of
 *    differentiation — ranking who is *doing* something, not who was born
 *    with a rainforest.
 *
 * Blending them back into one number would recreate the exact problem this
 * module exists to fix (Finland/DR Congo score high on natural endowment
 * regardless of policy; Singapore scores low regardless of policy), so
 * State and Governance are kept and displayed as two separate numbers.
 *
 * Every non-boolean, non-ordinal dimension is normalized independently
 * across the current country list using winsorized (5th/95th percentile
 * clipped) min-max scaling, so a single extreme outlier can't compress
 * everyone else into a narrow band. Missing raw values exclude that
 * dimension for that country and the remaining weights are renormalized
 * proportionally. If fewer than MIN_VALID_DIMENSIONS are available, the
 * index is `null` ("insufficient data") rather than silently scored on a
 * partial, misleadingly-precise basis.
 */
import { carbonIntensity } from "./derived.js";

export const MIN_VALID_DIMENSIONS = 4;

// ---------------------------------------------------------------------
// Normalization primitives
// ---------------------------------------------------------------------

function percentileOf(sortedValues, pct) {
  if (sortedValues.length === 1) return sortedValues[0];
  const idx = (pct / 100) * (sortedValues.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedValues[lo];
  const frac = idx - lo;
  return sortedValues[lo] + (sortedValues[hi] - sortedValues[lo]) * frac;
}

/**
 * 5th/95th percentile bounds of the valid (non-null, finite) values.
 * Returns null if there are no valid values at all.
 */
export function winsorizedBounds(values, loPct = 5, hiPct = 95) {
  const valid = values.filter((v) => v != null && Number.isFinite(v));
  if (!valid.length) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  return { lo: percentileOf(sorted, loPct), hi: percentileOf(sorted, hiPct) };
}

/**
 * Normalizes `value` to 0-100 using winsorized min-max scaling against
 * `allValues` (the full dataset for that dimension, including `value`
 * itself). Returns null if `value` or the dataset is unusable.
 * `invert: true` flips the scale for "lower raw value is better" dimensions
 * (PM2.5, carbon intensity).
 */
export function minMaxNormalize(value, allValues, { invert = false } = {}) {
  if (value == null || !Number.isFinite(value)) return null;
  const bounds = winsorizedBounds(allValues);
  if (!bounds) return null;
  const { lo, hi } = bounds;
  if (hi === lo) return 50; // degenerate: no spread in the dataset — neutral score
  const clamped = Math.min(hi, Math.max(lo, value));
  let score = ((clamped - lo) / (hi - lo)) * 100;
  if (invert) score = 100 - score;
  return Math.round(score * 10) / 10;
}

// ---------------------------------------------------------------------
// Weighted aggregation with missing-value renormalization
// ---------------------------------------------------------------------

/**
 * @param {Object<string, number|null>} dimScores - 0-100 score per dimension key, null if missing
 * @param {Object<string, number>} weights - relative weight per key (need not sum to 1; renormalized here)
 * @returns {{score: number|null, validCount: number, totalDims: number}}
 */
export function weightedScore(dimScores, weights) {
  const keys = Object.keys(weights);
  const totalDims = keys.length;
  const validKeys = keys.filter(
    (k) => dimScores[k] != null && Number.isFinite(dimScores[k]) && weights[k] > 0
  );
  const threshold = Math.min(MIN_VALID_DIMENSIONS, totalDims);
  if (validKeys.length < threshold) {
    return { score: null, validCount: validKeys.length, totalDims };
  }
  const totalWeight = validKeys.reduce((s, k) => s + weights[k], 0);
  if (totalWeight <= 0) {
    return { score: null, validCount: validKeys.length, totalDims };
  }
  const score = validKeys.reduce(
    (s, k) => s + dimScores[k] * (weights[k] / totalWeight),
    0
  );
  return { score: Math.round(score * 10) / 10, validCount: validKeys.length, totalDims };
}

// ---------------------------------------------------------------------
// Dimension definitions
// ---------------------------------------------------------------------

function boolToRaw(b) {
  return b == null ? null : b ? 100 : 0;
}

function ndcRatingToRaw(rating) {
  const MAP = {
    "1.5C": 100,
    "2C": 83.3,
    almost_sufficient: 66.7,
    insufficient: 50,
    highly_insufficient: 33.3,
    critically_insufficient: 16.7,
  };
  // "not_assessed" and missing both fall through to null (excluded) — neither
  // tells us anything about governance quality, so treating either as a low
  // score would be a fabricated judgment.
  return MAP[rating] ?? null;
}

/**
 * Effective carbon price = headline price × share of emissions covered.
 * `priceUSD == null` means the country genuinely has no ETS/tax (a real,
 * observed governance fact, source: World Bank Carbon Pricing Dashboard) —
 * that's a raw value of 0, not a missing measurement, so it's never excluded.
 */
function carbonPricingRaw(country) {
  const cp = country.carbonPricing;
  if (!cp) return null;
  if (cp.priceUSD == null) return 0;
  return cp.priceUSD * ((cp.coveragePercent ?? 0) / 100);
}

// `preNormalized: true` dimensions are already meaningfully scaled to 0-100
// by construction (booleans → 0/100, NDC rating → its ordinal mapping) and
// must NOT be run through dataset min-max normalization: if every country in
// the current filter happens to share the same boolean value, min-max would
// collapse the dataset spread to zero and mask the real signal behind the
// degenerate "50" fallback.
export const STATE_DIMENSIONS = [
  { key: "forest", zh: "森林覆盖", en: "Forest Coverage", unit: "%", getRaw: (c) => c.wb?.forestArea ?? null, invert: false },
  { key: "protected", zh: "自然保护区", en: "Protected Areas", unit: "%", getRaw: (c) => c.wb?.protectedAreas ?? null, invert: false },
  { key: "air", zh: "空气质量 (PM2.5)", en: "Air Quality (PM2.5)", unit: "µg/m³", getRaw: (c) => c.wb?.pm25 ?? null, invert: true },
  { key: "epi", zh: "EPI 评分", en: "EPI Score", unit: "", getRaw: (c) => c.epiScore ?? null, invert: false },
];

export const DEFAULT_STATE_WEIGHTS = { forest: 25, protected: 25, air: 25, epi: 25 };

export const GOVERNANCE_DIMENSIONS = [
  { key: "ndcRating", zh: "NDC 雄心评级", en: "NDC Ambition Rating", unit: "", getRaw: ndcRatingToRawFromCountry, invert: false, preNormalized: true },
  { key: "carbonPricing", zh: "碳定价强度", en: "Carbon Pricing Strength", unit: "USD/t", getRaw: carbonPricingRaw, invert: false },
  { key: "btr", zh: "BTR 报告提交", en: "BTR Submitted", unit: "", getRaw: (c) => boolToRaw(c.reportingStatus?.btrSubmitted), invert: false, preNormalized: true },
  { key: "kigali", zh: "基加利修正案", en: "Kigali Amendment", unit: "", getRaw: (c) => boolToRaw(c.montrealProtocol?.kigaliAmendment), invert: false, preNormalized: true },
  { key: "ndc3", zh: "NDC 3.0 提交", en: "NDC 3.0 Submitted", unit: "", getRaw: (c) => boolToRaw(c.parisAgreement?.ndc3Submitted), invert: false, preNormalized: true },
  { key: "ldn", zh: "LDN 目标设定", en: "LDN Target Set", unit: "", getRaw: (c) => boolToRaw(c.desertification?.ldnTargetSet), invert: false, preNormalized: true },
  { key: "renewable", zh: "可再生能源占比", en: "Renewable Energy Share", unit: "%", getRaw: (c) => c.wb?.renewableEnergy ?? null, invert: false },
  { key: "carbonIntensity", zh: "碳强度", en: "Carbon Intensity", unit: "kg/USD", getRaw: (c) => carbonIntensity(c), invert: true },
];

function ndcRatingToRawFromCountry(c) {
  return ndcRatingToRaw(c.parisAgreement?.ndcRating);
}

export const DEFAULT_GOVERNANCE_WEIGHTS = {
  ndcRating: 20,
  carbonPricing: 15,
  btr: 10,
  kigali: 10,
  ndc3: 15,
  ldn: 10,
  renewable: 10,
  carbonIntensity: 10,
};

// ---------------------------------------------------------------------
// Index computation
// ---------------------------------------------------------------------

/**
 * Computes 0-100 scores for every dimension of `dimensions`, for every
 * country in `countries`, normalized relative to that same country list.
 * Returns a Map<country, {key: score|null}>.
 */
function computeDimensionScores(countries, dimensions) {
  const rawByDim = {};
  for (const dim of dimensions) {
    rawByDim[dim.key] = countries.map((c) => dim.getRaw(c));
  }
  const result = new Map();
  countries.forEach((country, i) => {
    const scores = {};
    for (const dim of dimensions) {
      const raw = rawByDim[dim.key][i];
      if (dim.preNormalized) {
        scores[dim.key] = raw; // already 0-100 or null
      } else {
        scores[dim.key] = minMaxNormalize(raw, rawByDim[dim.key], { invert: dim.invert });
      }
    }
    result.set(country, scores);
  });
  return result;
}

/**
 * Computes the State index for every country in `countries` (must include
 * the full comparison set — normalization is relative to this list).
 * @returns {Map<country, {score: number|null, validCount, totalDims, dimScores}>}
 */
export function computeStateIndices(countries, weights = DEFAULT_STATE_WEIGHTS) {
  const dimScoresByCountry = computeDimensionScores(countries, STATE_DIMENSIONS);
  const result = new Map();
  countries.forEach((country) => {
    const dimScores = dimScoresByCountry.get(country);
    const { score, validCount, totalDims } = weightedScore(dimScores, weights);
    result.set(country, { score, validCount, totalDims, dimScores });
  });
  return result;
}

/** Same as computeStateIndices but for the Governance dimensions. */
export function computeGovernanceIndices(countries, weights = DEFAULT_GOVERNANCE_WEIGHTS) {
  const dimScoresByCountry = computeDimensionScores(countries, GOVERNANCE_DIMENSIONS);
  const result = new Map();
  countries.forEach((country) => {
    const dimScores = dimScoresByCountry.get(country);
    const { score, validCount, totalDims } = weightedScore(dimScores, weights);
    result.set(country, { score, validCount, totalDims, dimScores });
  });
  return result;
}

/** Convenience single-country accessor built on top of the batch functions above. */
export function computeStateIndex(country, allCountries, weights = DEFAULT_STATE_WEIGHTS) {
  return computeStateIndices(allCountries, weights).get(country);
}

export function computeGovernanceIndex(country, allCountries, weights = DEFAULT_GOVERNANCE_WEIGHTS) {
  return computeGovernanceIndices(allCountries, weights).get(country);
}

// ---------------------------------------------------------------------
// Percentile / grade helpers (shared by Scorecard, RankingsView, PDFs)
// ---------------------------------------------------------------------

export function computePercentile(value, allValues) {
  const valid = allValues.filter((v) => v != null && Number.isFinite(v));
  if (!valid.length || value == null) return null;
  return (valid.filter((v) => v < value).length / valid.length) * 100;
}

export function percentileToGrade(p) {
  if (p == null) return null;
  if (p >= 95) return "A+";
  if (p >= 85) return "A";
  if (p >= 70) return "B+";
  if (p >= 50) return "B";
  if (p >= 30) return "C";
  if (p >= 15) return "D";
  return "F";
}

export const GRADE_COLORS_HEX = {
  "A+": "#166534",
  A: "#16a34a",
  "B+": "#84cc16",
  B: "#eab308",
  C: "#f97316",
  D: "#dc2626",
  F: "#7f1d1d",
};

// ---------------------------------------------------------------------
// Weight URL (de)serialization — `?w=25,25,25,25-20,15,10,10,15,10,10,10`
// State group first (order matches STATE_DIMENSIONS), then Governance
// (order matches GOVERNANCE_DIMENSIONS), separated by "-".
// ---------------------------------------------------------------------

export function encodeWeights(stateWeights, governanceWeights) {
  const s = STATE_DIMENSIONS.map((d) => Math.round(stateWeights[d.key] ?? 0)).join(",");
  const g = GOVERNANCE_DIMENSIONS.map((d) => Math.round(governanceWeights[d.key] ?? 0)).join(",");
  return `${s}-${g}`;
}

/**
 * Parses the `w` URL param. Returns { stateWeights, governanceWeights },
 * falling back entirely to defaults (never partially) on any malformed
 * input — a half-parsed weight set would silently misattribute rankings.
 */
export function decodeWeights(param) {
  const fallback = { stateWeights: DEFAULT_STATE_WEIGHTS, governanceWeights: DEFAULT_GOVERNANCE_WEIGHTS };
  if (!param || typeof param !== "string") return fallback;
  const parts = param.split("-");
  if (parts.length !== 2) return fallback;
  const [sPart, gPart] = parts;
  const sVals = sPart.split(",").map(Number);
  const gVals = gPart.split(",").map(Number);
  if (sVals.length !== STATE_DIMENSIONS.length || gVals.length !== GOVERNANCE_DIMENSIONS.length) {
    return fallback;
  }
  if (sVals.some((v) => !Number.isFinite(v) || v < 0) || gVals.some((v) => !Number.isFinite(v) || v < 0)) {
    return fallback;
  }
  if (sVals.every((v) => v === 0) || gVals.every((v) => v === 0)) return fallback;
  const stateWeights = {};
  STATE_DIMENSIONS.forEach((d, i) => { stateWeights[d.key] = sVals[i]; });
  const governanceWeights = {};
  GOVERNANCE_DIMENSIONS.forEach((d, i) => { governanceWeights[d.key] = gVals[i]; });
  return { stateWeights, governanceWeights };
}

export function isDefaultWeights(stateWeights, governanceWeights) {
  return (
    STATE_DIMENSIONS.every((d) => stateWeights[d.key] === DEFAULT_STATE_WEIGHTS[d.key]) &&
    GOVERNANCE_DIMENSIONS.every((d) => governanceWeights[d.key] === DEFAULT_GOVERNANCE_WEIGHTS[d.key])
  );
}
