import { test } from "node:test";
import assert from "node:assert/strict";
import {
  carbonIntensity,
  gdpPerCapita,
  formatPopulation,
  formatGdp,
  formatGdpPerCapita,
  formatCarbonIntensity,
} from "../utils/derived.js";

test("carbonIntensity: returns kg/USD for valid inputs", () => {
  // US 2024-ish: 4632 Mt CO₂ ÷ $28.75T = ~0.161 kg/USD
  const us = { wb: { co2Mt: 4632.16, gdp: 28750956130731.2 } };
  const v = carbonIntensity(us);
  assert.ok(v > 0.15 && v < 0.18, `expected ~0.16, got ${v}`);
});

test("carbonIntensity: returns null on missing inputs", () => {
  assert.equal(carbonIntensity(null), null);
  assert.equal(carbonIntensity({}), null);
  assert.equal(carbonIntensity({ wb: {} }), null);
  assert.equal(carbonIntensity({ wb: { co2Mt: 100 } }), null);
  assert.equal(carbonIntensity({ wb: { gdp: 1e12 } }), null);
});

test("carbonIntensity: guards against zero/negative GDP (no division blow-up)", () => {
  assert.equal(carbonIntensity({ wb: { co2Mt: 100, gdp: 0 } }), null);
  assert.equal(carbonIntensity({ wb: { co2Mt: 100, gdp: -1 } }), null);
});

test("gdpPerCapita: divides correctly", () => {
  const c = { wb: { gdp: 1e12, population: 1e7 } };
  assert.equal(gdpPerCapita(c), 100000);
});

test("gdpPerCapita: null on bad inputs", () => {
  assert.equal(gdpPerCapita({ wb: { gdp: 1e12, population: 0 } }), null);
  assert.equal(gdpPerCapita({}), null);
});

test("formatPopulation: K/M/B compact", () => {
  assert.equal(formatPopulation(340_110_988), "340.1M");
  assert.equal(formatPopulation(1_400_000_000), "1.40B");
  assert.equal(formatPopulation(500_000), "500K");
  assert.equal(formatPopulation(null), "—");
});

test("formatGdp: $B/T compact", () => {
  assert.equal(formatGdp(28_750_000_000_000), "$28.75T");
  assert.equal(formatGdp(1_400_000_000), "$1.4B");
  assert.equal(formatGdp(null), "—");
});

test("formatGdpPerCapita: thousands separator", () => {
  assert.equal(formatGdpPerCapita(85000), "$85,000");
  assert.equal(formatGdpPerCapita(null), "—");
});

test("formatCarbonIntensity: g/$ with adaptive precision", () => {
  assert.equal(formatCarbonIntensity(0.161), "161 g/$");   // ≥100 → integer
  assert.equal(formatCarbonIntensity(0.05), "50.0 g/$");   // 10-100 → 1dp
  assert.equal(formatCarbonIntensity(0.002), "2.00 g/$"); // <10 → 2dp
  assert.equal(formatCarbonIntensity(null), "—");
});
