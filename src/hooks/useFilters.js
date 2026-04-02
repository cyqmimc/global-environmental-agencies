import { useState, useMemo, useCallback, useRef } from "react";

const ITEMS_PER_PAGE = 12;

export default function useFilters(countries, initialParams) {
  const [search, setSearch] = useState(initialParams.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialParams.search);
  const [page, setPage] = useState(initialParams.page);
  const [regionFilter, setRegionFilter] = useState(initialParams.region);
  const [tagFilter, setTagFilter] = useState(initialParams.tag);
  const [complianceFilter, setComplianceFilter] = useState("");
  const [sortOrder, setSortOrder] = useState(initialParams.sort);

  const debounceRef = useRef(null);
  const updateSearch = useCallback((val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 200);
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  const filteredCountries = useMemo(() => countries
    .filter(
      (item) =>
        (item.countryEn.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.countryZh.includes(debouncedSearch) ||
          item.agencyEn.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.agencyZh.includes(debouncedSearch)) &&
        (regionFilter ? item.region === regionFilter : true) &&
        (tagFilter ? item.responsibilities.includes(tagFilter) : true) &&
        (complianceFilter
          ? complianceFilter === "ndc_good" ? (item.parisAgreement?.ndcRating === "1.5C" || item.parisAgreement?.ndcRating === "2C" || item.parisAgreement?.ndcRating === "almost_sufficient")
          : complianceFilter === "ndc_bad" ? (item.parisAgreement?.ndcRating === "highly_insufficient" || item.parisAgreement?.ndcRating === "critically_insufficient")
          : complianceFilter === "has_carbon_price" ? (item.carbonPricing?.priceUSD != null)
          : complianceFilter === "no_carbon_price" ? (item.carbonPricing?.priceUSD == null)
          : complianceFilter === "btr_submitted" ? (item.reportingStatus?.btrSubmitted === true)
          : complianceFilter === "btr_pending" ? (item.reportingStatus?.btrSubmitted === false)
          : complianceFilter === "kigali_yes" ? (item.montrealProtocol?.kigaliAmendment === true)
          : complianceFilter === "kigali_no" ? (item.montrealProtocol?.kigaliAmendment === false)
          : complianceFilter === "30x30_met" ? ((item.wb?.protectedAreas ?? 0) >= 30)
          : true
          : true)
    )
    .sort((a, b) => {
      if (sortOrder === "forestAsc") return a.data.forestCoverage - b.data.forestCoverage;
      if (sortOrder === "forestDesc") return b.data.forestCoverage - a.data.forestCoverage;
      if (sortOrder === "carbonAsc") return a.data.carbonEmission - b.data.carbonEmission;
      if (sortOrder === "carbonDesc") return b.data.carbonEmission - a.data.carbonEmission;
      if (sortOrder === "epiAsc") return a.epiScore - b.epiScore;
      if (sortOrder === "epiDesc") return b.epiScore - a.epiScore;
      if (sortOrder === "renewAsc") return (a.wb?.renewableEnergy ?? -1) - (b.wb?.renewableEnergy ?? -1);
      if (sortOrder === "renewDesc") return (b.wb?.renewableEnergy ?? -1) - (a.wb?.renewableEnergy ?? -1);
      if (sortOrder === "pm25Asc") return (a.wb?.pm25 ?? 999) - (b.wb?.pm25 ?? 999);
      if (sortOrder === "pm25Desc") return (b.wb?.pm25 ?? 0) - (a.wb?.pm25 ?? 0);
      if (sortOrder === "co2pcAsc") return (a.wb?.co2PerCapita ?? 999) - (b.wb?.co2PerCapita ?? 999);
      if (sortOrder === "co2pcDesc") return (b.wb?.co2PerCapita ?? 0) - (a.wb?.co2PerCapita ?? 0);
      return 0;
    }), [countries, debouncedSearch, regionFilter, tagFilter, complianceFilter, sortOrder]);

  const pageCount = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);
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
    filteredCountries, paginatedCountries,
    ITEMS_PER_PAGE,
  };
}
