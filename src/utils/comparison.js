/**
 * Normalize the small, asynchronously assembled records used by the compare
 * dialog. The core bundle and the detail bundle intentionally contain
 * different fields, so the UI must be able to render while detail data is
 * unavailable (or a request failed) instead of assuming every array exists.
 */
export function normalizeComparisonCountries(compareList) {
  if (!Array.isArray(compareList)) return [];

  return compareList.filter(Boolean).map((country) => ({
    ...country,
    responsibilities: Array.isArray(country.responsibilities)
      ? country.responsibilities
      : [],
    treaties: Array.isArray(country.treaties) ? country.treaties : [],
  }));
}
