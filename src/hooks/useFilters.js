import { useState, useMemo, useCallback, useRef, useEffect } from "react";

const ITEMS_PER_PAGE = 12;

/** Push null/undefined values to the bottom for ascending sorts (or to top for descending). */
function cmp(va, vb, asc) {
  const aNull = va == null;
  const bNull = vb == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1; // always sink nulls
  if (bNull) return -1;
  return asc ? va - vb : vb - va;
}

const SORTERS = {
  forestAsc: (a, b) => cmp(a.data?.forestCoverage, b.data?.forestCoverage, true),
  forestDesc: (a, b) => cmp(a.data?.forestCoverage, b.data?.forestCoverage, false),
  carbonAsc: (a, b) => cmp(a.data?.carbonEmission, b.data?.carbonEmission, true),
  carbonDesc: (a, b) => cmp(a.data?.carbonEmission, b.data?.carbonEmission, false),
  epiAsc: (a, b) => cmp(a.epiScore, b.epiScore, true),
  epiDesc: (a, b) => cmp(a.epiScore, b.epiScore, false),
  renewAsc: (a, b) => cmp(a.wb?.renewableEnergy, b.wb?.renewableEnergy, true),
  renewDesc: (a, b) => cmp(a.wb?.renewableEnergy, b.wb?.renewableEnergy, false),
  pm25Asc: (a, b) => cmp(a.wb?.pm25, b.wb?.pm25, true),
  pm25Desc: (a, b) => cmp(a.wb?.pm25, b.wb?.pm25, false),
  co2pcAsc: (a, b) => cmp(a.wb?.co2PerCapita, b.wb?.co2PerCapita, true),
  co2pcDesc: (a, b) => cmp(a.wb?.co2PerCapita, b.wb?.co2PerCapita, false),
};

function applyCompliance(item, complianceFilter) {
  switch (complianceFilter) {
    case "ndc_good":
      return ["1.5C", "2C", "almost_sufficient"].includes(item.parisAgreement?.ndcRating);
    case "ndc_bad":
      return ["highly_insufficient", "critically_insufficient"].includes(item.parisAgreement?.ndcRating);
    case "has_carbon_price":
      return item.carbonPricing?.priceUSD != null;
    case "no_carbon_price":
      return item.carbonPricing?.priceUSD == null;
    case "btr_submitted":
      return item.reportingStatus?.btrSubmitted === true;
    case "btr_pending":
      return item.reportingStatus?.btrSubmitted === false;
    case "kigali_yes":
      return item.montrealProtocol?.kigaliAmendment === true;
    case "kigali_no":
      return item.montrealProtocol?.kigaliAmendment === false;
    case "30x30_met":
      return (item.wb?.protectedAreas ?? 0) >= 30;
    case "ldn_set":
      return item.desertification?.ldnTargetSet === true;
    case "ndc3_submitted":
      return item.parisAgreement?.ndc3Submitted === true;
    case "ndc3_pending":
      return item.parisAgreement?.ndc3Submitted === false;
    default:
      return true;
  }
}

export default function useFilters(countries, initialParams, favorites = []) {
  const [search, setSearch] = useState(initialParams.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialParams.search);
  const [page, setPage] = useState(initialParams.page);
  const [regionFilter, setRegionFilter] = useState(initialParams.region);
  const [tagFilter, setTagFilter] = useState(initialParams.tag);
  const [complianceFilter, setComplianceFilter] = useState(initialParams.compliance || "");
  const [sortOrder, setSortOrder] = useState(initialParams.sort);
  const [favOnly, setFavOnly] = useState(!!initialParams.favOnly);

  const debounceRef = useRef(null);
  const updateSearch = useCallback((val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 200);
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  const clearAll = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setRegionFilter("");
    setTagFilter("");
    setComplianceFilter("");
    setFavOnly(false);
    setPage(1);
  }, []);

  const filteredCountries = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const favSet = new Set(favorites);
    return countries
      .filter((item) =>
        (item.countryEn.toLowerCase().includes(q) ||
          item.countryZh.includes(debouncedSearch) ||
          item.agencyEn.toLowerCase().includes(q) ||
          item.agencyZh.includes(debouncedSearch)) &&
        (regionFilter ? item.region === regionFilter : true) &&
        (tagFilter ? item.responsibilities.includes(tagFilter) : true) &&
        (favOnly ? favSet.has(item.isoCode) : true) &&
        applyCompliance(item, complianceFilter)
      )
      .sort(SORTERS[sortOrder] || (() => 0));
  }, [countries, debouncedSearch, regionFilter, tagFilter, complianceFilter, sortOrder, favOnly, favorites]);

  const pageCount = Math.max(1, Math.ceil(filteredCountries.length / ITEMS_PER_PAGE));

  // Auto-recover from out-of-range page numbers (e.g., after filter narrows the list).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paginatedCountries = filteredCountries.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return {
    search, updateSearch,
    page, setPage, resetPage, pageCount,
    regionFilter, setRegionFilter,
    tagFilter, setTagFilter,
    complianceFilter, setComplianceFilter,
    sortOrder, setSortOrder,
    favOnly, setFavOnly,
    clearAll,
    filteredCountries, paginatedCountries,
    ITEMS_PER_PAGE,
  };
}
