import { useState, useEffect, useMemo, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const RESPONSIBILITY_LABELS = {
  climate: { zh: "气候", en: "Climate" },
  water: { zh: "水资源", en: "Water" },
  biodiversity: { zh: "生物多样性", en: "Biodiversity" },
  forest: { zh: "森林", en: "Forest" },
  air: { zh: "空气", en: "Air" },
  waste: { zh: "废弃物", en: "Waste" },
  energy: { zh: "能源", en: "Energy" },
  chemicals: { zh: "化学品", en: "Chemicals" },
  nuclear: { zh: "核安全", en: "Nuclear" },
};

// --- URL state helpers ---
function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    search: p.get("q") || "",
    region: p.get("region") || "",
    tag: p.get("tag") || "",
    sort: p.get("sort") || "none",
    page: parseInt(p.get("page"), 10) || 1,
    lang: p.get("lang") || "zh",
  };
}

function setUrlParams(params) {
  const p = new URLSearchParams();
  if (params.search) p.set("q", params.search);
  if (params.region) p.set("region", params.region);
  if (params.tag) p.set("tag", params.tag);
  if (params.sort && params.sort !== "none") p.set("sort", params.sort);
  if (params.page > 1) p.set("page", params.page);
  if (params.lang !== "zh") p.set("lang", params.lang);
  const qs = p.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

// --- CSV export ---
function exportCSV(items, language) {
  const t = (zh, en) => (language === "zh" ? zh : en);
  const header = [
    t("国家", "Country"),
    t("机构名称", "Agency"),
    t("地区", "Region"),
    t("特色领域", "Focus Areas"),
    t("成立年份", "Established"),
    t("森林覆盖率(%)", "Forest Coverage(%)"),
    t("碳排放(Mt)", "Carbon Emission(Mt)"),
    "EPI",
    t("碳中和目标年", "Net Zero Target"),
    t("核心法律", "Key Laws"),
    t("国际公约", "Treaties"),
    t("官网", "Website"),
  ];
  const rows = items.map((c) => [
    language === "zh" ? c.countryZh : c.countryEn,
    language === "zh" ? c.agencyZh : c.agencyEn,
    c.region,
    c.responsibilities
      .map((r) => (RESPONSIBILITY_LABELS[r] ? RESPONSIBILITY_LABELS[r][language] : r))
      .join(" / "),
    c.established,
    c.data.forestCoverage,
    c.data.carbonEmission,
    c.epiScore,
    c.netZeroTarget,
    (c.keyLaws || []).map((l) => (language === "zh" ? l.nameZh : l.nameEn) + "(" + l.year + ")").join(" / "),
    c.treaties.join(" / "),
    c.website,
  ]);
  const BOM = "\uFEFF";
  const csv =
    BOM +
    [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `environmental-agencies-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function GlobalEnvironmentalAgencies() {
  const urlParams = getUrlParams();
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState(urlParams.search);
  const [page, setPage] = useState(urlParams.page);
  const [regionFilter, setRegionFilter] = useState(urlParams.region);
  const [tagFilter, setTagFilter] = useState(urlParams.tag);
  const [language, setLanguage] = useState(urlParams.lang);
  const [sortOrder, setSortOrder] = useState(urlParams.sort);
  const [openDialogIndex, setOpenDialogIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    fetch("/countries.json")
      .then((response) => response.json())
      .then((data) => setCountries(data));
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
    if (countries.length === 0) return { forestCoverage: 0, carbonEmission: 0 };
    return {
      forestCoverage: +(
        countries.reduce((s, c) => s + c.data.forestCoverage, 0) /
        countries.length
      ).toFixed(1),
      carbonEmission: +(
        countries.reduce((s, c) => s + c.data.carbonEmission, 0) /
        countries.length
      ).toFixed(0),
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
        (tagFilter ? item.responsibilities.includes(tagFilter) : true)
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

  // Compare chart colors
  const COMPARE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                🌍 {t("全球环境保护机构", "Global Environmental Agencies")}
              </h1>
              <p className="mt-2 text-green-100 text-lg">
                {t(
                  "探索世界各国环境保护部门及其环境数据",
                  "Explore environmental agencies and data from countries worldwide"
                )}
              </p>
            </div>
            <button
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg px-4 py-2 transition-colors font-medium cursor-pointer"
            >
              {language === "zh" ? "EN" : "中文"}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-6 -mt-4">
        <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap gap-6 justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">
              {countries.length}
            </p>
            <p className="text-sm text-gray-500">
              {t("收录国家", "Countries")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">{regionCount}</p>
            <p className="text-sm text-gray-500">
              {t("覆盖大洲", "Regions")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">2026-04</p>
            <p className="text-sm text-gray-500">
              {t("最近更新", "Last Updated")}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
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
            </select>
          </div>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => {
                setTagFilter("");
                resetPage();
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                tagFilter === ""
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("全部职能", "All")}
            </button>
            {Object.entries(RESPONSIBILITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTagFilter(tagFilter === key ? "" : key);
                  resetPage();
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  tagFilter === key
                    ? "bg-green-600 text-white"
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
                <div className="mt-3 flex gap-3 text-xs text-gray-400">
                  <span>🌲 {item.data.forestCoverage}%</span>
                  <span>💨 {item.data.carbonEmission} Mt</span>
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
      </main>

      {/* Compare floating bar */}
      {compareList.length > 0 && !showCompare && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 px-5 py-3 flex items-center gap-4 z-40">
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
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {t("开始对比", "Compare")}
          </button>
        </div>
      )}

      {/* Compare Dialog */}
      {showCompare && compareList.length >= 2 && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCompare(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-500 p-6 rounded-t-2xl text-white relative">
              <button
                onClick={() => setShowCompare(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-2xl font-bold">
                {t("国家对比", "Country Comparison")}
              </h3>
              <p className="text-blue-100 mt-1">
                {compareList
                  .map((c) => (language === "zh" ? c.countryZh : c.countryEn))
                  .join(" vs ")}
              </p>
            </div>

            <div className="p-6">
              {/* Comparison table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-gray-500 font-medium"></th>
                      {compareList.map((c, i) => (
                        <th key={c.countryEn} className="text-center py-3 px-2">
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={c.flagUrl}
                              alt={c.countryEn}
                              className="w-10 h-7 object-cover rounded shadow-sm"
                            />
                            <span
                              className="font-bold"
                              style={{ color: COMPARE_COLORS[i] }}
                            >
                              {language === "zh" ? c.countryZh : c.countryEn}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("机构名称", "Agency")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center text-gray-700"
                        >
                          {language === "zh" ? c.agencyZh : c.agencyEn}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("成立年份", "Established")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center font-medium"
                        >
                          {c.established}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("特色领域", "Focus Areas")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center"
                        >
                          <div className="flex flex-wrap gap-1 justify-center">
                            {c.responsibilities.map((r) => (
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
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("森林覆盖率", "Forest Coverage")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center font-bold text-green-700"
                        >
                          {c.data.forestCoverage}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("碳排放", "Carbon Emission")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center font-bold text-red-600"
                        >
                          {c.data.carbonEmission} Mt
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("EPI 环境绩效", "EPI Score")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center font-bold text-amber-600"
                        >
                          {c.epiScore}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("碳中和目标", "Net Zero Target")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center font-bold text-cyan-700"
                        >
                          {c.netZeroTarget}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-2 text-gray-500">
                        {t("国际公约", "Treaties")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center"
                        >
                          <div className="flex flex-wrap gap-1 justify-center">
                            {c.treaties.map((tr) => (
                              <span
                                key={tr}
                                className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full"
                              >
                                {tr}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Comparison chart */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">
                  {t("数据对比", "Data Comparison")}
                </h4>
                <Bar
                  data={{
                    labels: [
                      t("森林覆盖率 (%)", "Forest Coverage (%)"),
                      t("碳排放 (Mt)", "Carbon Emission (Mt)"),
                      t("EPI 评分", "EPI Score"),
                    ],
                    datasets: compareList.map((c, i) => ({
                      label:
                        language === "zh" ? c.countryZh : c.countryEn,
                      data: [c.data.forestCoverage, c.data.carbonEmission, c.epiScore],
                      backgroundColor: COMPARE_COLORS[i],
                      borderRadius: 8,
                    })),
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: "bottom",
                        labels: { boxWidth: 12, padding: 16 },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: "#e5e7eb" },
                      },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>

              {/* Close + clear */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCompare(false);
                    setCompareList([]);
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("清除对比", "Clear & Close")}
                </button>
                <button
                  onClick={() => setShowCompare(false)}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  {t("继续选择", "Continue Browsing")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedCountry && !showCompare && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setOpenDialogIndex(null);
            setCopied(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 rounded-t-2xl text-white relative">
              <button
                onClick={() => {
                  setOpenDialogIndex(null);
                  setCopied(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <img
                  src={selectedCountry.flagUrl}
                  alt={selectedCountry.countryEn}
                  className="w-20 h-14 object-cover rounded-lg shadow-md"
                />
                <div>
                  <h3 className="text-2xl font-bold">
                    {language === "zh"
                      ? selectedCountry.countryZh
                      : selectedCountry.countryEn}
                  </h3>
                  <p className="text-green-100 mt-1">
                    {language === "zh"
                      ? selectedCountry.agencyZh
                      : selectedCountry.agencyEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  {selectedCountry.region}
                </span>
                <span className="bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
                  {t("成立于", "Est.")} {selectedCountry.established}
                </span>
                <span className="bg-orange-50 text-orange-700 text-sm font-medium px-3 py-1 rounded-full">
                  EPI {selectedCountry.epiScore}
                </span>
                <span className="bg-cyan-50 text-cyan-700 text-sm font-medium px-3 py-1 rounded-full">
                  {t("碳中和", "Net Zero")} {selectedCountry.netZeroTarget}
                </span>
                <a
                  href={selectedCountry.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  🔗 {t("官方网站", "Official Website")}
                </a>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                {language === "zh"
                  ? selectedCountry.descriptionZh
                  : selectedCountry.descriptionEn}
              </p>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                  {t("特色领域", "Focus Areas")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.responsibilities.map((r) => (
                    <span
                      key={r}
                      className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
                    >
                      {RESPONSIBILITY_LABELS[r]
                        ? RESPONSIBILITY_LABELS[r][language]
                        : r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                  {t("参与国际公约", "International Treaties")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.treaties.map((tr) => (
                    <span
                      key={tr}
                      className="bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full"
                    >
                      {tr}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Laws */}
              {selectedCountry.keyLaws && selectedCountry.keyLaws.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">
                    {t("核心环保法律", "Key Environmental Laws")}
                  </h4>
                  <div className="space-y-2">
                    {selectedCountry.keyLaws.map((law, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">
                          {language === "zh" ? law.nameZh : law.nameEn}
                        </span>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">
                          {law.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCountry.contact?.email && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">
                    {t("联系方式", "Contact")}
                  </h4>
                  <a
                    href={`mailto:${selectedCountry.contact.email}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {selectedCountry.contact.email}
                  </a>
                </div>
              )}

              <button
                onClick={() => handleCopy(selectedCountry)}
                className="mb-6 w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <span className="text-green-600">✓</span>
                    {t("已复制到剪贴板", "Copied to clipboard")}
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    {t("复制机构信息", "Copy agency info")}
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">
                    {selectedCountry.data.forestCoverage}%
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {t("森林覆盖率", "Forest Coverage")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("全球均值", "Global avg.")} {globalAvg.forestCoverage}%
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {selectedCountry.data.carbonEmission}
                  </p>
                  <p className="text-sm text-red-500 mt-1">
                    {t("碳排放 (百万吨)", "Carbon Emission (Mt)")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("全球均值", "Global avg.")} {globalAvg.carbonEmission} Mt
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">
                  {t("与全球均值对比", "Compared to Global Average")}
                </h4>
                <Bar
                  data={{
                    labels: [
                      t("森林覆盖率 (%)", "Forest Coverage (%)"),
                      t("碳排放 (Mt)", "Carbon Emission (Mt)"),
                    ],
                    datasets: [
                      {
                        label:
                          language === "zh"
                            ? selectedCountry.countryZh
                            : selectedCountry.countryEn,
                        data: [
                          selectedCountry.data.forestCoverage,
                          selectedCountry.data.carbonEmission,
                        ],
                        backgroundColor: ["#22c55e", "#ef4444"],
                        borderRadius: 8,
                      },
                      {
                        label: t("全球均值", "Global Average"),
                        data: [
                          globalAvg.forestCoverage,
                          globalAvg.carbonEmission,
                        ],
                        backgroundColor: ["#bbf7d0", "#fecaca"],
                        borderRadius: 8,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: "bottom",
                        labels: { boxWidth: 12, padding: 16 },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: "#e5e7eb" },
                      },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm">
          <p>
            {t(
              "© 2026 全球环境保护机构数据库 · 数据来源：各国政府官方网站、联合国环境规划署、世界银行",
              "© 2026 Global Environmental Agencies Database · Sources: National government websites, UNEP, World Bank"
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
