import { useState, useEffect, useMemo, useCallback } from "react";
import WorldMap from "./WorldMap";
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

ChartJS.register(
  BarElement, CategoryScale, LinearScale,
  RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend
);

const TREATY_LABELS = {
  "Paris Agreement": "巴黎协定",
  "CBD": "生物多样性公约",
  "CITES": "濒危物种贸易公约",
  "UNFCCC": "联合国气候变化框架公约",
  "UNCCD": "联合国防治荒漠化公约",
  "Montreal Protocol": "蒙特利尔议定书",
  "Basel Convention": "巴塞尔公约",
  "Ramsar Convention": "拉姆萨尔湿地公约",
  "Minamata Convention": "水俣公约",
  "Barcelona Convention": "巴塞罗那公约",
  "OSPAR Convention": "OSPAR海洋保护公约",
  "Alpine Convention": "阿尔卑斯公约",
  "Amazon Cooperation Treaty": "亚马逊合作条约",
  "Antarctic Treaty": "南极条约",
  "HELCOM Convention": "赫尔辛基海洋保护公约",
  "Escazú Agreement": "埃斯卡苏协定",
  "Pacific Islands Forum": "太平洋岛国论坛",
};

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

const NDC_RATING_CONFIG = {
  "1.5C": { zh: "1.5°C 兼容", en: "1.5°C Compatible", color: "bg-green-600", textColor: "text-green-700", barColor: "bg-green-500" },
  "2C": { zh: "2°C 兼容", en: "2°C Compatible", color: "bg-lime-500", textColor: "text-lime-700", barColor: "bg-lime-400" },
  "almost_sufficient": { zh: "接近充分", en: "Almost Sufficient", color: "bg-yellow-500", textColor: "text-yellow-700", barColor: "bg-yellow-400" },
  "insufficient": { zh: "不足", en: "Insufficient", color: "bg-orange-500", textColor: "text-orange-700", barColor: "bg-orange-400" },
  "highly_insufficient": { zh: "严重不足", en: "Highly Insufficient", color: "bg-red-500", textColor: "text-red-700", barColor: "bg-red-400" },
  "critically_insufficient": { zh: "极度不足", en: "Critically Insufficient", color: "bg-red-700", textColor: "text-red-800", barColor: "bg-red-600" },
  "not_assessed": { zh: "未评估", en: "Not Assessed", color: "bg-gray-400", textColor: "text-gray-500", barColor: "bg-gray-300" },
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
    t("可再生能源(%)", "Renewable Energy(%)"),
    "PM2.5 (µg/m³)",
    t("人均CO₂(吨)", "CO₂/Capita(t)"),
    t("保护区面积(%)", "Protected Areas(%)"),
    t("人口", "Population"),
    t("GDP (USD)", "GDP (USD)"),
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
    c.wb?.renewableEnergy?.toFixed(1) ?? "",
    c.wb?.pm25?.toFixed(1) ?? "",
    c.wb?.co2PerCapita?.toFixed(2) ?? "",
    c.wb?.protectedAreas?.toFixed(1) ?? "",
    c.wb?.population ?? "",
    c.wb?.gdp ? Math.round(c.wb.gdp) : "",
    (c.keyLaws || []).map((l) => (language === "zh" ? l.nameZh : l.nameEn) + "(" + l.year + ")").join(" / "),
    c.treaties.map((tr) => language === "zh" ? (TREATY_LABELS[tr] || tr) : tr).join(" / "),
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
  const [wbMeta, setWbMeta] = useState(null);

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
                🌍 {t("全球环境治理观察", "Global Environmental Governance Tracker")}
              </h1>
              <p className="mt-2 text-green-100 text-lg">
                {t(
                  "各国环保机构 · 环境数据 · 公约履约追踪",
                  "Environmental Agencies · Data · Treaty Compliance Tracking"
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
            <p className="text-2xl font-bold text-emerald-600">
              {globalAvg.renewableEnergy ? `${globalAvg.renewableEnergy}%` : "—"}
            </p>
            <p className="text-sm text-gray-500">
              {t("平均可再生能源", "Avg. Renewable")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">
              <span className="text-base">World Bank</span>
            </p>
            <p className="text-sm text-gray-500">
              {t("数据来源", "Data Source")}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
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
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("可再生能源", "Renewable Energy")}
                      </td>
                      {compareList.map((c) => (
                        <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-emerald-600">
                          {c.wb?.renewableEnergy?.toFixed(1) ?? "—"}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        PM2.5 (µg/m³)
                      </td>
                      {compareList.map((c) => (
                        <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-amber-600">
                          {c.wb?.pm25?.toFixed(1) ?? "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("人均CO₂ (吨)", "CO₂/Capita (t)")}
                      </td>
                      {compareList.map((c) => (
                        <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-red-500">
                          {c.wb?.co2PerCapita?.toFixed(1) ?? "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("保护区面积", "Protected Areas")}
                      </td>
                      {compareList.map((c) => (
                        <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-teal-600">
                          {c.wb?.protectedAreas?.toFixed(1) ?? "—"}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("30×30 进度", "30×30 Progress")}
                      </td>
                      {compareList.map((c) => {
                        const pa = c.wb?.protectedAreas;
                        return (
                          <td key={c.countryEn} className="py-3 px-2 text-center">
                            {pa != null ? (
                              <div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                  <div
                                    className={`h-2 rounded-full ${pa >= 30 ? "bg-emerald-600" : "bg-emerald-400"}`}
                                    style={{ width: `${Math.min(100, (pa / 30) * 100)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${pa >= 30 ? "text-emerald-600" : "text-gray-600"}`}>
                                  {pa.toFixed(1)}% / 30%
                                </span>
                              </div>
                            ) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("NDC 评级", "NDC Rating")}
                      </td>
                      {compareList.map((c) => {
                        const cfg = NDC_RATING_CONFIG[c.parisAgreement?.ndcRating];
                        return (
                          <td key={c.countryEn} className="py-3 px-2 text-center">
                            {cfg ? (
                              <span className={`${cfg.color} text-white text-xs px-2 py-1 rounded-full`}>
                                {language === "zh" ? cfg.zh : cfg.en}
                              </span>
                            ) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("碳价", "Carbon Price")}
                      </td>
                      {compareList.map((c) => (
                        <td key={c.countryEn} className="py-3 px-2 text-center">
                          {c.carbonPricing?.priceUSD != null ? (
                            <span className="font-bold text-amber-700">${c.carbonPricing.priceUSD}/t</span>
                          ) : (
                            <span className="text-gray-400">{t("无", "None")}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        BTR {t("报告", "Report")}
                      </td>
                      {compareList.map((c) => (
                        <td key={c.countryEn} className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${c.reportingStatus?.btrSubmitted ? "bg-green-600" : "bg-red-500"}`}>
                            {c.reportingStatus?.btrSubmitted ? t("已提交", "Submitted") : t("待提交", "Pending")}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-500">
                        {t("NDC 承诺", "NDC Target")}
                      </td>
                      {compareList.map((c) => (
                        <td
                          key={c.countryEn}
                          className="py-3 px-2 text-center text-xs text-blue-800 leading-relaxed"
                        >
                          {language === "zh"
                            ? c.parisAgreement?.ndcTargetZh || "—"
                            : c.parisAgreement?.ndcTargetEn || "—"}
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
                                {language === "zh" ? (TREATY_LABELS[tr] || tr) : tr}
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

              {/* Treaty Compliance Dashboard - 5 rows */}
              {(() => {
                const pa = selectedCountry.parisAgreement;
                const mp = selectedCountry.montrealProtocol;
                const cbd = selectedCountry.cbd;
                const cp = selectedCountry.carbonPricing;
                const rp = selectedCountry.reportingStatus;
                const protArea = selectedCountry.wb?.protectedAreas;
                const ratingCfg = pa?.ndcRating ? NDC_RATING_CONFIG[pa.ndcRating] : null;
                const montrealOk = mp?.kigaliAmendment;
                const cbdPct = protArea != null ? Math.min(100, (protArea / 30) * 100) : 0;
                const hasPrice = cp?.priceUSD != null;
                const btrOk = rp?.btrSubmitted;

                return (
                  <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      {t("履约合规全景", "Compliance Overview")}
                    </h4>
                    <div className="space-y-2.5">
                      {/* Paris NDC */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{t("NDC 雄心", "NDC Ambition")}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${ratingCfg?.barColor || "bg-gray-300"}`}
                            style={{ width: pa?.ndcRating === "1.5C" ? "100%" : pa?.ndcRating === "2C" ? "80%" : pa?.ndcRating === "almost_sufficient" ? "65%" : pa?.ndcRating === "insufficient" ? "45%" : pa?.ndcRating === "highly_insufficient" ? "25%" : pa?.ndcRating === "critically_insufficient" ? "15%" : "5%" }} />
                        </div>
                        <span className={`text-xs font-medium w-24 text-right ${ratingCfg?.textColor || "text-gray-500"}`}>
                          {ratingCfg ? (language === "zh" ? ratingCfg.zh : ratingCfg.en) : "—"}
                        </span>
                      </div>
                      {/* Carbon Pricing */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{t("碳定价", "Carbon Price")}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${hasPrice ? (cp.priceUSD >= 50 ? "bg-green-500" : cp.priceUSD >= 20 ? "bg-lime-400" : "bg-yellow-400") : "bg-gray-300"}`}
                            style={{ width: hasPrice ? `${Math.min(100, cp.priceUSD / 1.3)}%` : "3%" }} />
                        </div>
                        <span className={`text-xs font-medium w-24 text-right ${hasPrice ? "text-green-700" : "text-gray-400"}`}>
                          {hasPrice ? `$${cp.priceUSD}/t` : t("无", "None")}
                        </span>
                      </div>
                      {/* Reporting */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{t("透明度", "Transparency")}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${btrOk ? "bg-green-500" : "bg-red-400"}`}
                            style={{ width: btrOk ? "100%" : "30%" }} />
                        </div>
                        <span className={`text-xs font-medium w-24 text-right ${btrOk ? "text-green-600" : "text-red-500"}`}>
                          {btrOk ? t("BTR 已提交", "BTR Submitted") : t("BTR 待提交", "BTR Pending")}
                        </span>
                      </div>
                      {/* Montreal */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{t("蒙特利尔", "Montreal")}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${montrealOk ? "bg-green-500" : "bg-yellow-400"}`}
                            style={{ width: montrealOk ? "100%" : "70%" }} />
                        </div>
                        <span className={`text-xs font-medium w-24 text-right ${montrealOk ? "text-green-600" : "text-yellow-600"}`}>
                          {montrealOk ? t("完全合规", "Fully Compliant") : t("基加利待批", "Kigali Pending")}
                        </span>
                      </div>
                      {/* CBD */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">CBD 30×30</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${cbdPct >= 100 ? "bg-green-500" : "bg-emerald-400"}`}
                            style={{ width: `${cbdPct}%` }} />
                        </div>
                        <span className={`text-xs font-medium w-24 text-right ${cbdPct >= 100 ? "text-green-600" : "text-gray-600"}`}>
                          {protArea != null ? `${protArea.toFixed(1)}% / 30%` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Paris Agreement NDC */}
              {selectedCountry.parisAgreement && (
                <div className="mb-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-blue-800">
                      {t("巴黎协定 · NDC", "Paris Agreement · NDC")}
                    </h4>
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {t("已批准", "Ratified")}
                    </span>
                    {(() => {
                      const cfg = NDC_RATING_CONFIG[selectedCountry.parisAgreement.ndcRating];
                      return cfg ? (
                        <span className={`${cfg.color} text-white text-xs px-2 py-0.5 rounded-full`}>
                          {language === "zh" ? cfg.zh : cfg.en}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  {selectedCountry.parisAgreement.ratifiedDate && (
                    <p className="text-xs text-blue-500 mb-2">
                      {t("批准日期", "Ratified")} {selectedCountry.parisAgreement.ratifiedDate}
                      {selectedCountry.netZeroTarget && (
                        <span className="ml-3">
                          {t("碳中和目标", "Net Zero")}: <strong>{selectedCountry.netZeroTarget}</strong>
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-sm text-blue-900 leading-relaxed mb-3">
                    {language === "zh"
                      ? selectedCountry.parisAgreement.ndcTargetZh
                      : selectedCountry.parisAgreement.ndcTargetEn}
                  </p>
                  {/* NDC Timeline */}
                  {selectedCountry.parisAgreement.ndcHistory && (
                    <div className="border-t border-blue-100 pt-2">
                      <p className="text-xs font-medium text-blue-600 mb-1.5">{t("NDC 提交时间线", "NDC Submission Timeline")}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {selectedCountry.parisAgreement.ndcHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                              {h.year} {h.version}
                            </span>
                            {i < selectedCountry.parisAgreement.ndcHistory.length - 1 && (
                              <span className="text-blue-300">→</span>
                            )}
                          </div>
                        ))}
                        {selectedCountry.parisAgreement.nextNdcDeadline && (
                          <>
                            <span className="text-blue-300">→</span>
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded animate-pulse">
                              {selectedCountry.parisAgreement.nextNdcDeadline} {t("下次更新", "Next Update")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Montreal Protocol */}
              {selectedCountry.montrealProtocol && (
                <div className="mb-4 bg-cyan-50 rounded-xl p-4 border border-cyan-100">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-cyan-800">
                      {t("蒙特利尔议定书 · 臭氧层保护", "Montreal Protocol · Ozone Protection")}
                    </h4>
                    <span className="bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {t("已批准", "Ratified")}
                    </span>
                    {selectedCountry.montrealProtocol.kigaliAmendment ? (
                      <span className="bg-cyan-100 text-cyan-700 text-xs px-2 py-0.5 rounded-full">
                        {t("基加利修正案 ✓", "Kigali ✓")}
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                        {t("基加利修正案 ✗", "Kigali ✗")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cyan-500 mb-2">
                    {t("批准日期", "Ratified")} {selectedCountry.montrealProtocol.ratifiedDate}
                  </p>
                  <p className="text-sm text-cyan-900 leading-relaxed">
                    {language === "zh"
                      ? selectedCountry.montrealProtocol.commitmentZh
                      : selectedCountry.montrealProtocol.commitmentEn}
                  </p>
                </div>
              )}

              {/* CBD 30x30 */}
              {selectedCountry.cbd && (
                <div className="mb-4 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-emerald-800">
                      {t("生物多样性公约 · 30×30 目标", "CBD · 30×30 Target")}
                    </h4>
                    <span className={`text-white text-xs px-2 py-0.5 rounded-full ${
                      selectedCountry.cbd.status === "ratified" ? "bg-emerald-600" : "bg-amber-500"
                    }`}>
                      {selectedCountry.cbd.status === "ratified" ? t("已批准", "Ratified") : t("已签署", "Signed")}
                    </span>
                  </div>
                  {selectedCountry.cbd.ratifiedDate && (
                    <p className="text-xs text-emerald-500 mb-2">
                      {t("批准日期", "Ratified")} {selectedCountry.cbd.ratifiedDate}
                    </p>
                  )}
                  {/* 30x30 progress bar */}
                  {selectedCountry.wb?.protectedAreas != null && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-emerald-700 mb-1">
                        <span>{t("当前保护区覆盖", "Current Protected Areas")}: {selectedCountry.wb.protectedAreas.toFixed(1)}%</span>
                        <span>{t("目标", "Target")}: 30%</span>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            selectedCountry.wb.protectedAreas >= 30 ? "bg-emerald-600" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, (selectedCountry.wb.protectedAreas / 30) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-emerald-600 mt-1 text-right">
                        {selectedCountry.wb.protectedAreas >= 30
                          ? t("✓ 已达标", "✓ Target met")
                          : `${t("还需", "Need")} ${(30 - selectedCountry.wb.protectedAreas).toFixed(1)}%`}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-emerald-900 leading-relaxed">
                    {language === "zh"
                      ? selectedCountry.cbd.commitmentZh
                      : selectedCountry.cbd.commitmentEn}
                  </p>
                </div>
              )}

              {/* Carbon Pricing + Reporting */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Carbon Pricing */}
                {selectedCountry.carbonPricing && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <h4 className="text-xs font-semibold text-amber-800 mb-2">{t("碳定价机制", "Carbon Pricing")}</h4>
                    <div className="flex gap-2 mb-2">
                      {selectedCountry.carbonPricing.hasETS && (
                        <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">ETS</span>
                      )}
                      {selectedCountry.carbonPricing.hasCarbonTax && (
                        <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{t("碳税", "Carbon Tax")}</span>
                      )}
                      {!selectedCountry.carbonPricing.hasETS && !selectedCountry.carbonPricing.hasCarbonTax && (
                        <span className="bg-gray-300 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t("无", "None")}</span>
                      )}
                    </div>
                    {selectedCountry.carbonPricing.priceUSD != null && (
                      <p className="text-2xl font-bold text-amber-700">${selectedCountry.carbonPricing.priceUSD}<span className="text-xs font-normal">/tCO₂</span></p>
                    )}
                    {selectedCountry.carbonPricing.coveragePercent > 0 && (
                      <p className="text-xs text-amber-600 mt-1">{t("覆盖", "Coverage")} {selectedCountry.carbonPricing.coveragePercent}% {t("排放", "emissions")}</p>
                    )}
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      {language === "zh" ? selectedCountry.carbonPricing.noteZh : selectedCountry.carbonPricing.noteEn}
                    </p>
                  </div>
                )}
                {/* Reporting Status */}
                {selectedCountry.reportingStatus && (
                  <div className={`rounded-xl p-3 border ${selectedCountry.reportingStatus.btrSubmitted ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                    <h4 className={`text-xs font-semibold mb-2 ${selectedCountry.reportingStatus.btrSubmitted ? "text-green-800" : "text-red-800"}`}>
                      {t("透明度报告", "Transparency Reporting")}
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${selectedCountry.reportingStatus.btrSubmitted ? "bg-green-600" : "bg-red-500"}`}>
                        BTR {selectedCountry.reportingStatus.btrSubmitted ? "✓" : "✗"}
                      </span>
                      {selectedCountry.reportingStatus.btrYear && (
                        <span className="text-xs text-green-600">{selectedCountry.reportingStatus.btrYear}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {t("国家信息通报", "National Communications")}: {selectedCountry.reportingStatus.nationalComm} {t("次", "submitted")}
                    </p>
                    <p className={`text-xs mt-1 font-medium ${selectedCountry.reportingStatus.btrSubmitted ? "text-green-700" : "text-red-600"}`}>
                      {language === "zh" ? selectedCountry.reportingStatus.statusZh : selectedCountry.reportingStatus.statusEn}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                  {t("其他国际公约", "Other International Treaties")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.treaties.map((tr) => (
                    <span
                      key={tr}
                      className="bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full"
                    >
                      {language === "zh" ? (TREATY_LABELS[tr] || tr) : tr}
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

              {/* 6-metric data cards with data year */}
              {(() => {
                const dy = selectedCountry.wb?.dataYear || {};
                return (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {selectedCountry.wb?.forestArea?.toFixed(1) ?? selectedCountry.data.forestCoverage}%
                      </p>
                      <p className="text-xs text-green-600 mt-1">{t("森林覆盖率", "Forest Area")}</p>
                      <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.forestCoverage}%</p>
                      {dy.forestArea && <p className="text-xs text-gray-300 mt-0.5">{dy.forestArea}</p>}
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-700">
                        {selectedCountry.wb?.renewableEnergy?.toFixed(1) ?? "—"}%
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">{t("可再生能源", "Renewable Energy")}</p>
                      <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.renewableEnergy}%</p>
                      {dy.renewableEnergy && <p className="text-xs text-gray-300 mt-0.5">{dy.renewableEnergy}</p>}
                    </div>
                    <div className="bg-teal-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-teal-700">
                        {selectedCountry.wb?.protectedAreas?.toFixed(1) ?? "—"}%
                      </p>
                      <p className="text-xs text-teal-600 mt-1">{t("自然保护区", "Protected Areas")}</p>
                      <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.protectedAreas}%</p>
                      {dy.protectedAreas && <p className="text-xs text-gray-300 mt-0.5">{dy.protectedAreas}</p>}
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">
                        {selectedCountry.wb?.pm25?.toFixed(1) ?? "—"}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">PM2.5 (µg/m³)</p>
                      <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.pm25}</p>
                      {dy.pm25 && <p className="text-xs text-gray-300 mt-0.5">{dy.pm25}</p>}
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {selectedCountry.wb?.co2PerCapita?.toFixed(1) ?? "—"}
                      </p>
                      <p className="text-xs text-red-500 mt-1">{t("人均CO₂ (吨)", "CO₂/Capita (t)")}</p>
                      <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.co2PerCapita}</p>
                      {dy.co2Mt && <p className="text-xs text-gray-300 mt-0.5">{dy.co2Mt}</p>}
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedCountry.epiScore}
                      </p>
                      <p className="text-xs text-orange-500 mt-1">EPI {t("评分", "Score")}</p>
                      <p className="text-xs text-gray-400">{t("满分 100", "Max 100")}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Radar chart */}
              {selectedCountry.wb && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">
                    {t("环境综合画像", "Environmental Profile")}
                  </h4>
                  <Radar
                    data={{
                      labels: [
                        t("森林覆盖", "Forest"),
                        t("可再生能源", "Renewable"),
                        t("保护区", "Protected"),
                        t("空气质量", "Air Quality"),
                        t("碳效率", "CO₂ Efficiency"),
                        "EPI",
                      ],
                      datasets: [
                        {
                          label: language === "zh" ? selectedCountry.countryZh : selectedCountry.countryEn,
                          data: [
                            Math.min(selectedCountry.wb.forestArea ?? 0, 100),
                            Math.min(selectedCountry.wb.renewableEnergy ?? 0, 100),
                            Math.min(selectedCountry.wb.protectedAreas ?? 0, 100),
                            Math.max(0, 100 - (selectedCountry.wb.pm25 ?? 100)),
                            Math.max(0, 100 - Math.min((selectedCountry.wb.co2PerCapita ?? 0) * 5, 100)),
                            selectedCountry.epiScore ?? 0,
                          ],
                          backgroundColor: "rgba(34, 197, 94, 0.2)",
                          borderColor: "#22c55e",
                          pointBackgroundColor: "#22c55e",
                          borderWidth: 2,
                        },
                        {
                          label: t("全球均值", "Global Average"),
                          data: [
                            globalAvg.forestCoverage ?? 0,
                            globalAvg.renewableEnergy ?? 0,
                            globalAvg.protectedAreas ?? 0,
                            Math.max(0, 100 - (globalAvg.pm25 ?? 100)),
                            Math.max(0, 100 - Math.min((globalAvg.co2PerCapita ?? 0) * 5, 100)),
                            50,
                          ],
                          backgroundColor: "rgba(156, 163, 175, 0.1)",
                          borderColor: "#9ca3af",
                          pointBackgroundColor: "#9ca3af",
                          borderWidth: 1,
                          borderDash: [4, 4],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { stepSize: 25, display: false },
                          pointLabels: { font: { size: 11 } },
                          grid: { color: "#e5e7eb" },
                        },
                      },
                      plugins: {
                        legend: { display: true, position: "bottom", labels: { boxWidth: 12, padding: 16 } },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
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
        </div>
      </footer>
    </div>
  );
}
