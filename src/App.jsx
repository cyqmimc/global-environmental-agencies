import { useState, useEffect, useMemo, useCallback } from "react";
import WorldMap from "./WorldMap";
import DetailDialog from "./components/DetailDialog";
import CompareDialog from "./components/CompareDialog";
import AboutPage from "./components/AboutPage";
import RankingsView from "./components/RankingsView";
import { Bar, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import {
  TREATY_LABELS,
  RESPONSIBILITY_LABELS,
  NDC_RATING_CONFIG,
  getUrlParams,
  setUrlParams,
  exportCSV,
} from "./constants";

ChartJS.register(
  BarElement, CategoryScale, LinearScale,
  RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend
);

export default function GlobalEnvironmentalAgencies() {
  const urlParams = getUrlParams();
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState(urlParams.search);
  const [page, setPage] = useState(urlParams.page);
  const [regionFilter, setRegionFilter] = useState(urlParams.region);
  const [tagFilter, setTagFilter] = useState(urlParams.tag);
  const [complianceFilter, setComplianceFilter] = useState("");
  const [language, setLanguage] = useState(urlParams.lang);
  const [sortOrder, setSortOrder] = useState(urlParams.sort);
  const [openDialogIndex, setOpenDialogIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [wbMeta, setWbMeta] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [viewMode, setViewMode] = useState("cards");

  useEffect(() => {
    Promise.all([
      fetch("/countries.json").then((r) => r.json()),
      fetch("/wb-data.json").then((r) => r.json()).catch(() => ({ countries: {}, meta: null })),
    ]).then(([countriesData, wbData]) => {
      if (wbData.meta) setWbMeta(wbData.meta);
      const merged = countriesData.map((c) => {
        const code = c.isoCode || c.flagUrl?.match(/flagcdn\.com\/(\w{2})\.svg/)?.[1];
        const wb = code ? wbData.countries?.[code] || null : null;
        return { ...c, wb };
      });
      setCountries(merged);
    });
  }, []);

  // Sync state to URL
  useEffect(() => {
    setUrlParams({
      search,
      region: regionFilter,
      tag: tagFilter,
      sort: sortOrder,
      page,
      lang: language,
    });
  }, [search, regionFilter, tagFilter, sortOrder, page, language]);

  const ITEMS_PER_PAGE = 12;
  const t = useCallback(
    (zh, en) => (language === "zh" ? zh : en),
    [language]
  );

  const globalAvg = useMemo(() => {
    if (countries.length === 0) return {};
    const avg = (fn) => {
      const vals = countries.map(fn).filter((v) => v != null);
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
    };
    return {
      forestCoverage: avg((c) => c.data.forestCoverage),
      carbonEmission: avg((c) => c.data.carbonEmission),
      co2PerCapita: avg((c) => c.wb?.co2PerCapita),
      renewableEnergy: avg((c) => c.wb?.renewableEnergy),
      pm25: avg((c) => c.wb?.pm25),
      protectedAreas: avg((c) => c.wb?.protectedAreas),
    };
  }, [countries]);

  const filteredCountries = countries
    .filter(
      (item) =>
        (item.countryEn.toLowerCase().includes(search.toLowerCase()) ||
          item.countryZh.includes(search) ||
          item.agencyEn.toLowerCase().includes(search.toLowerCase()) ||
          item.agencyZh.includes(search)) &&
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
      if (sortOrder === "forestAsc")
        return a.data.forestCoverage - b.data.forestCoverage;
      if (sortOrder === "forestDesc")
        return b.data.forestCoverage - a.data.forestCoverage;
      if (sortOrder === "carbonAsc")
        return a.data.carbonEmission - b.data.carbonEmission;
      if (sortOrder === "carbonDesc")
        return b.data.carbonEmission - a.data.carbonEmission;
      if (sortOrder === "epiAsc") return a.epiScore - b.epiScore;
      if (sortOrder === "epiDesc") return b.epiScore - a.epiScore;
      if (sortOrder === "renewAsc") return (a.wb?.renewableEnergy ?? -1) - (b.wb?.renewableEnergy ?? -1);
      if (sortOrder === "renewDesc") return (b.wb?.renewableEnergy ?? -1) - (a.wb?.renewableEnergy ?? -1);
      if (sortOrder === "pm25Asc") return (a.wb?.pm25 ?? 999) - (b.wb?.pm25 ?? 999);
      if (sortOrder === "pm25Desc") return (b.wb?.pm25 ?? 0) - (a.wb?.pm25 ?? 0);
      if (sortOrder === "co2pcAsc") return (a.wb?.co2PerCapita ?? 999) - (b.wb?.co2PerCapita ?? 999);
      if (sortOrder === "co2pcDesc") return (b.wb?.co2PerCapita ?? 0) - (a.wb?.co2PerCapita ?? 0);
      return 0;
    });

  const pageCount = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);
  const paginatedCountries = filteredCountries.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const regions = [
    { value: "", labelZh: "全部地区", labelEn: "All Regions" },
    { value: "Asia", labelZh: "亚洲", labelEn: "Asia" },
    { value: "North America", labelZh: "北美洲", labelEn: "North America" },
    { value: "Europe", labelZh: "欧洲", labelEn: "Europe" },
    { value: "Africa", labelZh: "非洲", labelEn: "Africa" },
    { value: "Oceania", labelZh: "大洋洲", labelEn: "Oceania" },
    { value: "South America", labelZh: "南美洲", labelEn: "South America" },
  ];

  const regionCount = new Set(countries.map((c) => c.region)).size;

  const selectedCountry =
    openDialogIndex !== null ? paginatedCountries[openDialogIndex] : null;

  const handleCopy = (country) => {
    const name = language === "zh" ? country.agencyZh : country.agencyEn;
    const countryName =
      language === "zh" ? country.countryZh : country.countryEn;
    const responsibilities = country.responsibilities
      .map((r) =>
        RESPONSIBILITY_LABELS[r] ? RESPONSIBILITY_LABELS[r][language] : r
      )
      .join(", ");
    const text = `${countryName} — ${name}\n${t("职能领域", "Responsibilities")}: ${responsibilities}\n${t("官网", "Website")}: ${country.website}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleCompare = (country, e) => {
    e.stopPropagation();
    const id = country.countryEn;
    if (compareList.some((c) => c.countryEn === id)) {
      setCompareList(compareList.filter((c) => c.countryEn !== id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, country]);
    }
  };

  const isInCompare = (country) =>
    compareList.some((c) => c.countryEn === country.countryEn);

  const resetPage = () => setPage(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                🌍 {t("全球环境治理观察", "Global Environmental Governance Tracker")}
              </h1>
              <p className="mt-2 text-green-100 text-lg">
                {t(
                  "各国环保机构 · 环境数据 · 公约履约追踪",
                  "Environmental Agencies · Data · Treaty Compliance Tracking"
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAbout(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg px-3 py-2 transition-colors font-medium cursor-pointer text-lg"
                title={t("关于", "About")}
              >
                ?
              </button>
              <button
                onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg px-4 py-2 transition-colors font-medium cursor-pointer"
              >
                {language === "zh" ? "EN" : "中文"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-6 -mt-4">
        <div className="bg-white rounded-xl shadow-md px-4 py-3 flex flex-wrap gap-4 sm:gap-8 justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-green-700">
              {countries.length}
            </p>
            <p className="text-xs text-gray-500">
              {t("收录国家", "Countries")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-600">3</p>
            <p className="text-xs text-gray-500">
              {t("公约追踪", "Treaties")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-amber-600">
              {countries.filter((c) => c.carbonPricing?.priceUSD != null).length}
            </p>
            <p className="text-xs text-gray-500">
              {t("已碳定价", "Carbon Priced")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-600">
              {countries.filter((c) => c.reportingStatus?.btrSubmitted).length}
            </p>
            <p className="text-xs text-gray-500">
              {t("BTR 已交", "BTR Filed")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-500">
              {countries.filter((c) => {
                const r = c.parisAgreement?.ndcRating;
                return r === "highly_insufficient" || r === "critically_insufficient";
              }).length}
            </p>
            <p className="text-xs text-gray-500">
              {t("NDC 不足", "NDC Weak")}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-4 pb-6">
        {/* World Map */}
        {countries.length > 0 && (
          <WorldMap
            countries={countries}
            language={language}
            onCountryClick={(country) => {
              // Find the country in the full filtered list and open its detail
              const idx = paginatedCountries.findIndex(
                (c) => c.isoCode === country.isoCode
              );
              if (idx >= 0) {
                setOpenDialogIndex(idx);
              } else {
                // Country might be on a different page or filtered out — find in full list
                const fullIdx = filteredCountries.findIndex(
                  (c) => c.isoCode === country.isoCode
                );
                if (fullIdx >= 0) {
                  const targetPage = Math.floor(fullIdx / ITEMS_PER_PAGE) + 1;
                  setPage(targetPage);
                  setTimeout(() => {
                    setOpenDialogIndex(fullIdx % ITEMS_PER_PAGE);
                  }, 50);
                } else {
                  // Country is filtered out — clear filters and show it
                  setSearch("");
                  setRegionFilter("");
                  setTagFilter("");
                  setSortOrder("none");
                  setTimeout(() => {
                    const newIdx = countries.findIndex(
                      (c) => c.isoCode === country.isoCode
                    );
                    if (newIdx >= 0) {
                      const tp = Math.floor(newIdx / ITEMS_PER_PAGE) + 1;
                      setPage(tp);
                      setTimeout(() => setOpenDialogIndex(newIdx % ITEMS_PER_PAGE), 50);
                    }
                  }, 50);
                }
              }
            }}
          />
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder={t(
                  "搜索国家或环境部门...",
                  "Search by country or agency..."
                )}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="w-full border border-gray-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                resetPage();
              }}
              className="border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[140px]"
            >
              {regions.map((r) => (
                <option key={r.value} value={r.value}>
                  {language === "zh" ? r.labelZh : r.labelEn}
                </option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[180px]"
            >
              <option value="none">{t("默认排序", "Default Sorting")}</option>
              <option value="forestAsc">
                {t("森林覆盖率 ↑", "Forest Coverage ↑")}
              </option>
              <option value="forestDesc">
                {t("森林覆盖率 ↓", "Forest Coverage ↓")}
              </option>
              <option value="carbonAsc">
                {t("碳排放 ↑", "Carbon Emissions ↑")}
              </option>
              <option value="carbonDesc">
                {t("碳排放 ↓", "Carbon Emissions ↓")}
              </option>
              <option value="epiAsc">
                {t("EPI 评分 ↑", "EPI Score ↑")}
              </option>
              <option value="epiDesc">
                {t("EPI 评分 ↓", "EPI Score ↓")}
              </option>
              <option value="renewDesc">
                {t("可再生能源 ↓", "Renewable Energy ↓")}
              </option>
              <option value="pm25Asc">
                {t("空气质量 最优", "Best Air Quality")}
              </option>
              <option value="co2pcAsc">
                {t("人均碳排 最低", "Lowest CO₂/Capita")}
              </option>
            </select>
          </div>

          {/* Compliance Filter */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-xs text-gray-400 leading-6 mr-1">{t("履约", "Compliance")}</span>
            {[
              { key: "", zh: "全部", en: "All", active: "bg-green-600 text-white" },
              { key: "ndc_good", zh: "NDC 达标", en: "NDC On Track", active: "bg-green-600 text-white" },
              { key: "ndc_bad", zh: "NDC 不足", en: "NDC Insufficient", active: "bg-red-600 text-white" },
              { key: "has_carbon_price", zh: "有碳价", en: "Has Carbon Price", active: "bg-amber-600 text-white" },
              { key: "no_carbon_price", zh: "无碳价", en: "No Carbon Price", active: "bg-gray-600 text-white" },
              { key: "btr_submitted", zh: "BTR 已交", en: "BTR Submitted", active: "bg-green-600 text-white" },
              { key: "btr_pending", zh: "BTR 未交", en: "BTR Pending", active: "bg-red-600 text-white" },
              { key: "kigali_yes", zh: "基加利 ✓", en: "Kigali ✓", active: "bg-cyan-600 text-white" },
              { key: "30x30_met", zh: "30×30 达标", en: "30×30 Met", active: "bg-emerald-600 text-white" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setComplianceFilter(complianceFilter === f.key ? "" : f.key); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  complianceFilter === f.key
                    ? f.active
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {language === "zh" ? f.zh : f.en}
                {complianceFilter === f.key && f.key !== "" && " ✕"}
              </button>
            ))}
          </div>
          {/* Responsibility Filter */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs text-gray-400 leading-6 mr-1">{t("职能", "Focus")}</span>
            {Object.entries(RESPONSIBILITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTagFilter(tagFilter === key ? "" : key); resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  tagFilter === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {language === "zh" ? label.zh : label.en}
                {tagFilter === key && " ✕"}
              </button>
            ))}
          </div>

          {/* Results count + Export */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-400">
              {t(
                `共 ${filteredCountries.length} 个结果`,
                `${filteredCountries.length} results found`
              )}
            </p>
            {filteredCountries.length > 0 && (
              <button
                onClick={() => exportCSV(filteredCountries, language)}
                className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>📥</span> {t("导出 CSV", "Export CSV")}
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === "cards"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t("卡片", "Cards")}
          </button>
          <button
            onClick={() => setViewMode("rankings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === "rankings"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t("排行榜", "Rankings")}
          </button>
        </div>

        {viewMode === "rankings" ? (
          <RankingsView
            countries={filteredCountries}
            language={language}
            t={t}
            onCountryClick={(country) => {
              const idx = paginatedCountries.findIndex(
                (c) => c.isoCode === country.isoCode
              );
              if (idx >= 0) {
                setOpenDialogIndex(idx);
              } else {
                const fullIdx = filteredCountries.findIndex(
                  (c) => c.isoCode === country.isoCode
                );
                if (fullIdx >= 0) {
                  const targetPage = Math.floor(fullIdx / ITEMS_PER_PAGE) + 1;
                  setPage(targetPage);
                  setTimeout(() => {
                    setOpenDialogIndex(fullIdx % ITEMS_PER_PAGE);
                  }, 50);
                }
              }
            }}
          />
        ) : (
          <>
            {/* Cards Grid */}
            {paginatedCountries.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg">
                  {t("没有找到匹配的结果", "No results found")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {paginatedCountries.map((item, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border rounded-2xl p-5 flex flex-col items-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative ${
                      isInCompare(item)
                        ? "border-green-500 ring-2 ring-green-200"
                        : "border-gray-100"
                    }`}
                    onClick={() => setOpenDialogIndex(idx)}
                  >
                    {/* Compare checkbox */}
                    <button
                      onClick={(e) => toggleCompare(item, e)}
                      className={`absolute top-3 right-3 w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs transition-colors cursor-pointer ${
                        isInCompare(item)
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-gray-300 hover:border-green-400 text-transparent hover:text-green-400"
                      }`}
                      title={t("加入对比", "Add to compare")}
                    >
                      ✓
                    </button>

                    <img
                      src={item.flagUrl}
                      alt={item.countryEn}
                      className="w-16 h-11 object-cover rounded shadow-sm mb-3"
                    />
                    <h2 className="text-lg font-bold text-gray-800 text-center">
                      {language === "zh" ? item.countryZh : item.countryEn}
                    </h2>
                    <p className="text-sm text-gray-500 text-center mt-1 line-clamp-2">
                      {language === "zh" ? item.agencyZh : item.agencyEn}
                    </p>
                    <span className="mt-2 inline-block bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {item.region}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2 justify-center">
                      {item.responsibilities.map((r) => (
                        <span
                          key={r}
                          className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full"
                        >
                          {RESPONSIBILITY_LABELS[r]
                            ? RESPONSIBILITY_LABELS[r][language]
                            : r}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 justify-center">
                      <span>🌲 {item.wb?.forestArea?.toFixed(1) ?? item.data.forestCoverage}%</span>
                      <span>⚡ {item.wb?.renewableEnergy?.toFixed(0) ?? "—"}%</span>
                      <span className="text-amber-600 font-medium">EPI {item.epiScore}</span>
                    </div>
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {t("访问官网", "Visit Website")}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("上一页", "Prev")}
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      p === page
                        ? "bg-green-600 text-white shadow-sm"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("下一页", "Next")}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Compare floating bar */}
      {compareList.length > 0 && !showCompare && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 px-5 py-3 flex flex-col sm:flex-row items-center gap-4 z-40 w-[calc(100%-2rem)] sm:w-auto">
          <div className="flex items-center gap-2">
            {compareList.map((c, i) => (
              <div key={c.countryEn} className="flex items-center gap-1">
                <img
                  src={c.flagUrl}
                  alt={c.countryEn}
                  className="w-8 h-5 object-cover rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {language === "zh" ? c.countryZh : c.countryEn}
                </span>
                <button
                  onClick={() =>
                    setCompareList(
                      compareList.filter((x) => x.countryEn !== c.countryEn)
                    )
                  }
                  className="text-gray-400 hover:text-red-500 text-xs cursor-pointer ml-0.5"
                >
                  ✕
                </button>
                {i < compareList.length - 1 && (
                  <span className="text-gray-300 mx-1">vs</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {compareList.length}/3
          </span>
          <button
            onClick={() => setShowCompare(true)}
            disabled={compareList.length < 2}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
          >
            {t("开始对比", "Compare")}
          </button>
        </div>
      )}

      {/* Compare Dialog */}
      {showCompare && compareList.length >= 2 && (
        <CompareDialog
          compareList={compareList}
          language={language}
          t={t}
          globalAvg={globalAvg}
          onClose={() => setShowCompare(false)}
          onClear={() => {
            setShowCompare(false);
            setCompareList([]);
          }}
        />
      )}

      {/* Detail Dialog */}
      {selectedCountry && !showCompare && (
        <DetailDialog
          selectedCountry={selectedCountry}
          language={language}
          t={t}
          globalAvg={globalAvg}
          onClose={() => {
            setOpenDialogIndex(null);
            setCopied(false);
          }}
          copied={copied}
          onCopy={handleCopy}
          allCountries={countries}
        />
      )}

      {/* About Page */}
      {showAbout && (
        <AboutPage
          language={language}
          onClose={() => setShowAbout(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm space-y-2">
          <p>
            {t(
              "© 2026 全球环境保护机构数据库 · 机构信息来源：各国政府官方网站",
              "© 2026 Global Environmental Agencies Database · Agency data: National government websites"
            )}
          </p>
          <p className="text-gray-500">
            {t(
              "环境数据来源：世界银行公开数据 (World Bank Open Data) · 各指标数据年份因国家和指标而异 (2018-2023)",
              "Environmental data: World Bank Open Data · Data years vary by country and indicator (2018-2023)"
            )}
            {wbMeta?.fetchedAt && (
              <span>
                {" · "}
                {t("数据获取于", "Fetched on")} {wbMeta.fetchedAt.slice(0, 10)}
              </span>
            )}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a
              href="https://github.com/cyqmimc/global-environmental-agencies/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t("报告数据错误", "Report Data Error")}
            </a>
            <span className="text-gray-600">·</span>
            <a
              href="https://github.com/cyqmimc/global-environmental-agencies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t("参与贡献", "Contribute")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
