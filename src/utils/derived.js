/**
 * Derived metrics computed from raw World Bank fields (population, gdp,
 * co2Mt, co2PerCapita). Kept pure so they're easy to unit-test.
 */

/**
 * Carbon intensity of the economy: kilograms of CO₂ per USD of GDP.
 * Smaller = greener economy per dollar.
 *
 * Source values: co2Mt is megatonnes (1Mt = 1e9 kg), gdp is USD.
 * @returns {number|null} kg/USD or null if either input is missing
 */
export function carbonIntensity(country) {
  const co2Mt = country?.wb?.co2Mt;
  const gdp = country?.wb?.gdp;
  if (co2Mt == null || gdp == null || gdp <= 0) return null;
  return (co2Mt * 1e9) / gdp;
}

/**
 * GDP per capita in USD.
 * @returns {number|null}
 */
export function gdpPerCapita(country) {
  const gdp = country?.wb?.gdp;
  const pop = country?.wb?.population;
  if (gdp == null || pop == null || pop <= 0) return null;
  return gdp / pop;
}

/** Format a population to compact "K/M/B" notation. */
export function formatPopulation(n) {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

/** Format a USD GDP figure to compact "$B/T" notation. */
export function formatGdp(n) {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

/** Format USD per capita as $X,XXX. */
export function formatGdpPerCapita(n) {
  if (n == null) return "—";
  if (n >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toFixed(0)}`;
}

/** Format kg CO₂/USD as "X g/$" for readability (multiply by 1000). */
export function formatCarbonIntensity(n) {
  if (n == null) return "—";
  // values typically fall in the 0.05–1.5 kg/$ range; show as g/$ to avoid leading zeros
  const grams = n * 1000;
  if (grams >= 100) return `${grams.toFixed(0)} g/$`;
  if (grams >= 10) return `${grams.toFixed(1)} g/$`;
  return `${grams.toFixed(2)} g/$`;
}
