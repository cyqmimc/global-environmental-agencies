import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import WorldMap from "./WorldMap";
import useCountryData from "./hooks/useCountryData";
import useFilters from "./hooks/useFilters";
import {
  RESPONSIBILITY_LABELS,
  getUrlParams,
  setUrlParams,
  exportCSV,
} from "./constants";

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
  const [copied, setCopied] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [viewMode, setViewMode] = useState("cards");

  const { countries, wbMeta, globalAvg, loadDetail } = useCountryData();
  const filters = useFilters(countries, urlParams);

  const t = useCallback(
    (zh, en) => (language === "zh" ? zh : en),
    [language]
  );

  // Sync state to URL
  useEffect(() => {
    setUrlParams({
      search: filters.search,
      region: filters.regionFilter,
      tag: filters.tagFilter,
      sort: filters.sortOrder,
      page: filters.page,
      lang: language,
      country: openCountryIso || "",
    });
  }, [filters.search, filters.regionFilter, filters.tagFilter, filters.sortOrder, filters.page, language, openCountryIso]);

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

  // Use the enriched version from countries array if available
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
            <p className="text-xl font-bold text-green-700">{countries.length}</p>
            <p className="text-xs text-gray-500">{t("收录国家", "Countries")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">
              {globalAvg.pm25 ?? "—"}
            </p>
            <p className="text-xs text-gray-500">{t("均值PM2.5", "Avg PM2.5")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-amber-600">
              {countries.filter((c) => c.carbonPricing?.priceUSD != null).length}
            </p>
            <p className="text-xs text-gray-500">{t("已碳定价", "Carbon Priced")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-600">
              {countries.filter((c) => c.reportingStatus?.btrSubmitted).length}
            </p>
            <p className="text-xs text-gray-500">{t("BTR 已交", "BTR Filed")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-500">
              {countries.filter((c) => {
                const r = c.parisAgreement?.ndcRating;
                return r === "highly_insufficient" || r === "critically_insufficient";
              }).length}
            </p>
            <p className="text-xs text-gray-500">{t("NDC 不足", "NDC Weak")}</p>
          </div>
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
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder={t("搜索国家或环境部门...", "Search by country or agency...")}
                value={filters.search}
                onChange={(e) => { filters.updateSearch(e.target.value); filters.resetPage(); }}
                className="w-full border border-gray-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            <select
              value={filters.regionFilter}
              onChange={(e) => { filters.setRegionFilter(e.target.value); filters.resetPage(); }}
              className="border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[140px]"
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
              className="border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[180px]"
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
          </div>

          {/* Compliance Filter */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-xs text-gray-400 leading-6 mr-1">{t("履约", "Compliance")}</span>
            {COMPLIANCE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { filters.setComplianceFilter(filters.complianceFilter === f.key ? "" : f.key); filters.resetPage(); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  filters.complianceFilter === f.key ? f.active : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  filters.tagFilter === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {language === "zh" ? label.zh : label.en}
                {filters.tagFilter === key && " ✕"}
              </button>
            ))}
          </div>

          {/* Results count + Export */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-400">
              {t(`共 ${filters.filteredCountries.length} 个结果`, `${filters.filteredCountries.length} results found`)}
            </p>
            {filters.filteredCountries.length > 0 && (
              <button
                onClick={() => exportCSV(filters.filteredCountries, language)}
                className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1 cursor-pointer"
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
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                  {filters.paginatedCountries.map((item, idx) => (
                    <div
                      key={idx}
                      className={`bg-white border rounded-2xl p-5 flex flex-col items-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative ${
                        isInCompare(item) ? "border-green-500 ring-2 ring-green-200" : "border-gray-100"
                      }`}
                      onClick={() => setOpenCountryIso(item.isoCode)}
                    >
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
                      <img src={item.flagUrl} alt={item.countryEn} loading="lazy" className="w-16 h-11 object-cover rounded shadow-sm mb-3" />
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
                          <span key={r} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            {RESPONSIBILITY_LABELS[r] ? RESPONSIBILITY_LABELS[r][language] : r}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 justify-center">
                        <span className="text-amber-600 font-medium">EPI {item.epiScore}</span>
                        <span>⚡ {item.wb?.renewableEnergy?.toFixed(0) ?? "—"}%</span>
                        <span className={item.wb?.pm25 > 25 ? "text-red-500" : item.wb?.pm25 > 10 ? "text-amber-500" : "text-green-600"}>
                          PM {item.wb?.pm25?.toFixed(0) ?? "—"}
                        </span>
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
              {filters.pageCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => filters.setPage((p) => Math.max(1, p - 1))}
                    disabled={filters.page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {t("上一页", "Prev")}
                  </button>
                  {Array.from({ length: filters.pageCount }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => filters.setPage(p)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        p === filters.page ? "bg-green-600 text-white shadow-sm" : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => filters.setPage((p) => Math.min(filters.pageCount, p + 1))}
                    disabled={filters.page === filters.pageCount}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {t("下一页", "Next")}
                  </button>
                </div>
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Compare floating bar */}
      {compareList.length > 0 && !showCompare && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 px-5 py-3 flex flex-col sm:flex-row items-center gap-4 z-40 w-[calc(100%-2rem)] sm:w-auto">
          <div className="flex items-center gap-2">
            {compareList.map((c, i) => (
              <div key={c.countryEn} className="flex items-center gap-1">
                <img src={c.flagUrl} alt={c.countryEn} className="w-8 h-5 object-cover rounded" />
                <span className="text-sm font-medium text-gray-700">
                  {language === "zh" ? c.countryZh : c.countryEn}
                </span>
                <button
                  onClick={() => setCompareList(compareList.filter((x) => x.countryEn !== c.countryEn))}
                  className="text-gray-400 hover:text-red-500 text-xs cursor-pointer ml-0.5"
                >
                  ✕
                </button>
                {i < compareList.length - 1 && <span className="text-gray-300 mx-1">vs</span>}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400">{compareList.length}/3</span>
          <button
            onClick={() => setShowCompare(true)}
            disabled={compareList.length < 2}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
          >
            {t("开始对比", "Compare")}
          </button>
        </div>
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
          />
        )}
        {showAbout && (
          <AboutPage language={language} onClose={() => setShowAbout(false)} />
        )}
      </Suspense>

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
