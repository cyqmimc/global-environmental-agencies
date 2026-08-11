/**
 * Groups countries by the data year recorded for a given wb-data.json field
 * (see WorldBankData.dataYear in types.js). Used to detect and disclose when
 * an indicator mixes measurement years/methodologies across countries — e.g.
 * pm25 is 2020 World Bank ground-station data for 13 countries but 2024
 * IQAir data for the other 67, which is not an apples-to-apples comparison.
 *
 * IMPORTANT: always pass the full, unfiltered country list. Computing this
 * from a filtered subset would make the warning appear/disappear as the user
 * changes filters, which misrepresents a fixed property of the data source.
 */
export function yearBreakdown(countries, field) {
  const groups = {};
  countries.forEach((c) => {
    const y = c.wb?.dataYear?.[field];
    if (y == null) return;
    (groups[y] ||= []).push(c);
  });
  return groups;
}

export function isYearInconsistent(countries, field) {
  return Object.keys(yearBreakdown(countries, field)).length > 1;
}
