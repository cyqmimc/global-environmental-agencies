import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import WorldMap from "./WorldMap";
import useCountryData from "./hooks/useCountryData";
import useFilters from "./hooks/useFilters";
import useFavorites from "./hooks/useFavorites";
import useDarkMode from "./hooks/useDarkMode";
import {
  RESPONSIBILITY_LABELS,
  getUrlParams,
  setUrlParams,
  exportCSV,
  activeFilterCount,
} from "./constants";
import { formatCarbonIntensity } from "./utils/derived";
import CountryCard from "./components/CountryCard";
import CompareBar from "./components/CompareBar";
import Pagination from "./components/Pagination";

const DetailDialog = lazy(() => import("./components/DetailDialog"));
const CompareDialog = lazy(() => import("./components/CompareDialog"));
const ClimateEquityView = lazy(() => import("./components/ClimateEquityView"));
const AboutPage = lazy(() => import("./components/AboutPage"));
const RankingsView = lazy(() => import("./components/RankingsView"));

const REGIONS = [
  { value: "", labelZh: "全部地区", labelEn: "All Regions" },
  { value: "Asia", labelZh: "亚洲", labelEn: "Asia" },
  { value: "North America", labelZh: "北美洲", labelEn: "North America" },
  { value: "Europe", labelZh: "欧洲", labelEn: "Europe" },
  { value: "Africa", labelZh: "非洲", labelEn: "Africa" },
  { value: "Oceania", labelZh: "大洋洲", labelEn: "Oceania" },
  { value: "South America", labelZh: "南美洲", labelEn: "South America" },
];

const COMPLIANCE_FILTERS = [
  { key: "", zh: "全部", en: "All", active: "bg-green-600 text-white" },
  { key: "ndc_good", zh: "NDC 达标", en: "NDC On Track", active: "bg-green-600 text-white" },
  { key: "ndc_bad", zh: "NDC 不足", en: "NDC Insufficient", active: "bg-red-600 text-white" },
  { key: "has_carbon_price", zh: "有碳价", en: "Has Carbon Price", active: "bg-amber-600 text-white" },
  { key: "no_carbon_price", zh: "无碳价", en: "No Carbon Price", active: "bg-gray-600 text-white" },
  { key: "btr_submitted", zh: "BTR 已交", en: "BTR Submitted", active: "bg-green-600 text-white" },
  { key: "btr_pending", zh: "BTR 未交", en: "BTR Pending", active: "bg-red-600 text-white" },
  { key: "kigali_yes", zh: "基加利 ✓", en: "Kigali ✓", active: "bg-cyan-600 text-white" },
  { key: "30x30_met", zh: "30×30 达标", en: "30×30 Met", active: "bg-emerald-600 text-white" },
];

export default function GlobalEnvironmentalAgencies() {
  const urlParams = getUrlParams();
  const [language, setLanguage] = useState(urlParams.lang);
  const [openCountryIso, setOpenCountryIso] = useState(urlParams.country || null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [viewMode, setViewMode] = useState(urlParams.view || "cards");
  const [copied, setCopied] = useState(false);

  const { theme, toggle: toggleTheme } = useDarkMode();
  const { countries, wbMeta, globalAvg, loadDetail } = useCountryData();
  const { favorites, toggle: toggleFav, isFav } = useFavorites();
  // Note: useCountryData prefetches the detail bundle on idle so rankings
  // export and other bulk consumers get full rows without each user click.
  const filters = useFilters(countries, urlParams, favorites);

  const t = useCallback(
    (zh, en) => (language === "zh" ? zh : en),
    [language]
  );

  // year label helper for data-year tooltips on small numbers
  const yearLabel = useCallback(
    (year) => (year ? t(`数据年份 ${year}`, `Data year ${year}`) : ""),
    [t]
  );

  // Sync state to URL
  useEffect(() => {
    setUrlParams({
      search: filters.search,
      region: filters.regionFilter,
      tag: filters.tagFilter,
      compliance: filters.complianceFilter,
      sort: filters.sortOrder,
      page: filters.page,
      lang: language,
      country: openCountryIso || "",
      favOnly: filters.favOnly,
      view: viewMode,
    });
  }, [
    filters.search, filters.regionFilter, filters.tagFilter,
    filters.complianceFilter, filters.sortOrder, filters.page,
    filters.favOnly, language, openCountryIso, viewMode,
  ]);

  // Resolve selected country from ISO code
  const selectedCountryRaw = openCountryIso
    ? countries.find((c) => c.isoCode === openCountryIso) || null
    : null;

  // Eagerly load detail when selected country changes
  useEffect(() => {
    if (selectedCountryRaw && !selectedCountryRaw._detail) {
      loadDetail(selectedCountryRaw);
    }
  }, [selectedCountryRaw, loadDetail]);

  const selectedCountry = selectedCountryRaw
    ? countries.find((c) => c.isoCode === selectedCountryRaw.isoCode && c._detail) || selectedCountryRaw
    : null;

  const handleCopy = (country) => {
    const name = language === "zh" ? country.agencyZh : country.agencyEn;
    const countryName = language === "zh" ? country.countryZh : country.countryEn;
    const responsibilities = country.responsibilities
      .map((r) => RESPONSIBILITY_LABELS[r] ? RESPONSIBILITY_LABELS[r][language] : r)
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

  const openCountryDetail = useCallback((country) => {
    setOpenCountryIso(country.isoCode);
  }, []);

  const activeCount = activeFilterCount({
    search: filters.search,
    region: filters.regionFilter,
    tag: filters.tagFilter,
    compliance: filters.complianceFilter,
    favOnly: filters.favOnly,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 dark:from-green-900 dark:to-emerald-900 text-white shadow-lg">
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
                onClick={toggleTheme}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg px-3 py-2 transition-colors font-medium cursor-pointer text-lg"
                title={t("切换主题", "Toggle theme")}
                aria-label={t("切换主题", "Toggle theme")}
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <button
                onClick={() => setShowAbout(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg px-3 py-2 transition-colors font-medium cursor-pointer text-lg"
                title={t("关于", "About")}
                aria-label={t("关于", "About")}
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md px-4 py-3 flex flex-wrap gap-4 sm:gap-8 justify-center border border-transparent dark:border-gray-800">
          <div className="text-center">
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{countries.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("收录国家", "Countries")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {globalAvg.pm25 ?? "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("均值PM2.5", "Avg PM2.5")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {countries.filter((c) => c.carbonPricing?.priceUSD != null).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("已碳定价", "Carbon Priced")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {countries.filter((c) => c.reportingStatus?.btrSubmitted).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("BTR 已交", "BTR Filed")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-500">
              {countries.filter((c) => {
                const r = c.parisAgreement?.ndcRating;
                return r === "highly_insufficient" || r === "critically_insufficient";
              }).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("NDC 不足", "NDC Weak")}</p>
          </div>
          <div className="text-center" title={t("均值碳强度 (g CO₂/USD GDP)", "Avg carbon intensity (g CO₂/USD GDP)")}>
            <p className="text-xl font-bold text-slate-600 dark:text-slate-300">
              {globalAvg.carbonIntensity != null ? formatCarbonIntensity(globalAvg.carbonIntensity) : "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("均值碳强度", "Avg C.Intensity")}</p>
          </div>
          {favorites.length > 0 && (
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-500">★ {favorites.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("关注", "Favorites")}</p>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-4 pb-6">
        {/* World Map */}
        {countries.length > 0 && (
          <WorldMap
            countries={countries}
            language={language}
            onCountryClick={openCountryDetail}
          />
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 mb-6 border border-transparent dark:border-gray-800">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder={t("搜索国家或环境部门...", "Search by country or agency...")}
                value={filters.search}
                onChange={(e) => { filters.updateSearch(e.target.value); filters.resetPage(); }}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                aria-label={t("搜索", "Search")}
              />
            </div>
            <select
              value={filters.regionFilter}
              onChange={(e) => { filters.setRegionFilter(e.target.value); filters.resetPage(); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[140px]"
              aria-label={t("地区筛选", "Region filter")}
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {language === "zh" ? r.labelZh : r.labelEn}
                </option>
              ))}
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => filters.setSortOrder(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[180px]"
              aria-label={t("排序", "Sort")}
            >
              <option value="none">{t("默认排序", "Default Sorting")}</option>
              <option value="forestAsc">{t("森林覆盖率 ↑", "Forest Coverage ↑")}</option>
              <option value="forestDesc">{t("森林覆盖率 ↓", "Forest Coverage ↓")}</option>
              <option value="carbonAsc">{t("碳排放 ↑", "Carbon Emissions ↑")}</option>
              <option value="carbonDesc">{t("碳排放 ↓", "Carbon Emissions ↓")}</option>
              <option value="epiAsc">{t("EPI 评分 ↑", "EPI Score ↑")}</option>
              <option value="epiDesc">{t("EPI 评分 ↓", "EPI Score ↓")}</option>
              <option value="renewDesc">{t("可再生能源 ↓", "Renewable Energy ↓")}</option>
              <option value="pm25Asc">{t("空气质量 最优", "Best Air Quality")}</option>
              <option value="co2pcAsc">{t("人均碳排 最低", "Lowest CO₂/Capita")}</option>
            </select>
            <button
              onClick={() => { filters.setFavOnly(!filters.favOnly); filters.resetPage(); }}
              disabled={favorites.length === 0 && !filters.favOnly}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                filters.favOnly
                  ? "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 text-yellow-700 dark:text-yellow-300"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
              title={t("仅显示关注国家", "Show favorites only")}
              aria-pressed={filters.favOnly}
            >
              ★ {favorites.length > 0 && <span className="text-xs">{favorites.length}</span>}
            </button>
            {activeCount > 0 && (
              <button
                onClick={() => filters.clearAll()}
                className="px-3 py-2.5 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                title={t("清除所有筛选", "Clear all filters")}
              >
                ✕ {t("清除筛选", "Clear")} ({activeCount})
              </button>
            )}
          </div>

          {/* Compliance Filter */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-xs text-gray-400 leading-6 mr-1">{t("履约", "Compliance")}</span>
            {COMPLIANCE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { filters.setComplianceFilter(filters.complianceFilter === f.key ? "" : f.key); filters.resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  filters.complianceFilter === f.key ? f.active : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {language === "zh" ? f.zh : f.en}
                {filters.complianceFilter === f.key && f.key !== "" && " ✕"}
              </button>
            ))}
          </div>

          {/* Responsibility Filter */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs text-gray-400 leading-6 mr-1">{t("职能", "Focus")}</span>
            {Object.entries(RESPONSIBILITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { filters.setTagFilter(filters.tagFilter === key ? "" : key); filters.resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  filters.tagFilter === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {language === "zh" ? label.zh : label.en}
                {filters.tagFilter === key && " ✕"}
              </button>
            ))}
          </div>

          {/* Results count + Export */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t(`共 ${filters.filteredCountries.length} 个结果`, `${filters.filteredCountries.length} results found`)}
            </p>
            {filters.filteredCountries.length > 0 && (
              <button
                onClick={() => exportCSV(filters.filteredCountries, language)}
                className="text-sm text-green-700 dark:text-green-400 hover:text-green-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>📥</span> {t("导出 CSV", "Export CSV")}
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { key: "cards", zh: "卡片", en: "Cards" },
            { key: "rankings", zh: "排行榜", en: "Rankings" },
            { key: "equity", zh: "气候公平", en: "Climate Equity" },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                viewMode === v.key
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t(v.zh, v.en)}
            </button>
          ))}
        </div>

        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
          {viewMode === "equity" ? (
            <ClimateEquityView
              countries={filters.filteredCountries}
              language={language}
              t={t}
              onCountryClick={openCountryDetail}
            />
          ) : viewMode === "rankings" ? (
            <RankingsView
              countries={filters.filteredCountries}
              language={language}
              t={t}
              onCountryClick={openCountryDetail}
            />
          ) : (
            <>
              {filters.paginatedCountries.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-lg">{t("没有找到匹配的结果", "No results found")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filters.paginatedCountries.map((item) => (
                    <CountryCard
                      key={item.isoCode || item.countryEn}
                      country={item}
                      language={language}
                      t={t}
                      onOpen={() => setOpenCountryIso(item.isoCode)}
                      onToggleCompare={(e) => toggleCompare(item, e)}
                      isInCompare={isInCompare(item)}
                      isFav={isFav(item.isoCode)}
                      onToggleFav={() => toggleFav(item.isoCode)}
                      yearLabel={yearLabel}
                    />
                  ))}
                </div>
              )}

              <Pagination
                page={filters.page}
                pageCount={filters.pageCount}
                onChange={(p) => filters.setPage(p)}
                t={t}
              />
            </>
          )}
        </Suspense>
      </main>

      {/* Compare floating bar */}
      {!showCompare && (
        <CompareBar
          compareList={compareList}
          language={language}
          t={t}
          onRemove={(c) => setCompareList(compareList.filter((x) => x.countryEn !== c.countryEn))}
          onOpen={() => setShowCompare(true)}
        />
      )}

      <Suspense fallback={null}>
        {showCompare && compareList.length >= 2 && (
          <CompareDialog
            compareList={compareList}
            language={language}
            t={t}
            globalAvg={globalAvg}
            onClose={() => setShowCompare(false)}
            onClear={() => { setShowCompare(false); setCompareList([]); }}
          />
        )}
        {selectedCountry && !showCompare && (
          <DetailDialog
            selectedCountry={selectedCountry}
            language={language}
            t={t}
            globalAvg={globalAvg}
            onClose={() => { setOpenCountryIso(null); setCopied(false); }}
            copied={copied}
            onCopy={handleCopy}
            allCountries={countries}
            siblings={filters.filteredCountries}
            onNavigate={(c) => setOpenCountryIso(c.isoCode)}
          />
        )}
        {showAbout && (
          <AboutPage language={language} onClose={() => setShowAbout(false)} />
        )}
      </Suspense>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-950 text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm space-y-2">
          <p>
            {t(
              "© 2026 全球环境保护机构数据库 · 机构信息来源：各国政府官方网站",
              "© 2026 Global Environmental Agencies Database · Agency data: National government websites"
            )}
          </p>
          <p className="text-gray-500">
            {t(
              "环境数据来源：世界银行公开数据 (World Bank Open Data) · 各指标数据年份因国家和指标而异 (2018-2025)",
              "Environmental data: World Bank Open Data · Data years vary by country and indicator (2018-2025)"
            )}
            {wbMeta?.fetchedAt && (
              <span>
                {" · "}
                {t("数据获取于", "Fetched on")} {wbMeta.fetchedAt.slice(0, 10)}
              </span>
            )}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a href="https://github.com/cyqmimc/global-environmental-agencies/issues" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              {t("报告数据错误", "Report Data Error")}
            </a>
            <span className="text-gray-600">·</span>
            <a href="https://github.com/cyqmimc/global-environmental-agencies" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              {t("参与贡献", "Contribute")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
