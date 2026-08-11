// Colorblind-safe (CVD-safe) 5-tier palette, validated with the dataviz
// skill's validator (OKLCH lightness band + chroma floor, CVD ΔE ≥ 8 target
// on ALL 10 pairs [--pairs all, since map tiers can be geographically
// adjacent in any combination], normal-vision ΔE ≥ 15 floor, ≥3:1 contrast
// against each surface). Hues deliberately avoid true green/red so the
// "avoid red-green" intent holds beyond the literal math. Order: good→bad.
export const CVD_TIERS = {
  light: ["#006abe", "#00a1a8", "#9876ff", "#c35f46", "#9d200b"],
  dark: ["#007ef5", "#00a89c", "#725aa4", "#db7359", "#d20027"],
};

// Original green→yellow→orange→red scheme, kept as an opt-in for users who
// prefer it (red/green is indistinguishable to red-green colorblind users,
// which is exactly why CVD_TIERS is the default).
export const CLASSIC_TIERS = {
  light: ["#16a34a", "#65a30d", "#eab308", "#f97316", "#dc2626"],
  dark: ["#16a34a", "#65a30d", "#eab308", "#f97316", "#dc2626"],
};

export const NO_DATA_COLOR = { light: "#d1d5db", dark: "#4b5563" };
export const NO_COUNTRY_COLOR = { light: "#e5e7eb", dark: "#374151" };

export function getTierColors(scheme, isDark) {
  const p = scheme === "classic" ? CLASSIC_TIERS : CVD_TIERS;
  return isDark ? p.dark : p.light;
}

export function getNoDataColor(isDark) {
  return isDark ? NO_DATA_COLOR.dark : NO_DATA_COLOR.light;
}

export function getNoCountryColor(isDark) {
  return isDark ? NO_COUNTRY_COLOR.dark : NO_COUNTRY_COLOR.light;
}

// Two-tone trend colors (e.g. CO2 sparkline rising/falling). "up"/"down"
// reuse the 5-tier palette's bad/good extremes for consistency.
const CVD_TREND = {
  light: { up: "#9d200b", down: "#006abe" },
  dark: { up: "#d20027", down: "#007ef5" },
};
const CLASSIC_TREND = {
  light: { up: "#dc2626", down: "#16a34a" },
  dark: { up: "#dc2626", down: "#16a34a" },
};

export function getTrendColors(scheme, isDark) {
  const p = scheme === "classic" ? CLASSIC_TREND : CVD_TREND;
  return isDark ? p.dark : p.light;
}
