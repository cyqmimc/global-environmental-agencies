import { useState, useEffect } from "react";
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

export default function GlobalEnvironmentalAgencies() {
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [regionFilter, setRegionFilter] = useState("");
  const [language, setLanguage] = useState("zh");
  const [sortOrder, setSortOrder] = useState("none");
  const [openDialogIndex, setOpenDialogIndex] = useState(null);

  useEffect(() => {
    fetch("/countries.json")
      .then((response) => response.json())
      .then((data) => setCountries(data));
  }, []);

  const ITEMS_PER_PAGE = 12;

  const filteredCountries = countries
    .filter(
      (item) =>
        (item.countryEn.toLowerCase().includes(search.toLowerCase()) ||
          item.countryZh.includes(search) ||
          item.agencyEn.toLowerCase().includes(search.toLowerCase()) ||
          item.agencyZh.includes(search)) &&
        (regionFilter ? item.region === regionFilter : true)
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
      return 0;
    });

  const pageCount = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);
  const paginatedCountries = filteredCountries.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const t = (zh, en) => (language === "zh" ? zh : en);

  const regions = [
    { value: "", labelZh: "全部地区", labelEn: "All Regions" },
    { value: "Asia", labelZh: "亚洲", labelEn: "Asia" },
    { value: "North America", labelZh: "北美洲", labelEn: "North America" },
    { value: "Europe", labelZh: "欧洲", labelEn: "Europe" },
    { value: "Africa", labelZh: "非洲", labelEn: "Africa" },
    { value: "Oceania", labelZh: "大洋洲", labelEn: "Oceania" },
    { value: "South America", labelZh: "南美洲", labelEn: "South America" },
  ];

  const regionCounts = {};
  countries.forEach((c) => {
    regionCounts[c.region] = (regionCounts[c.region] || 0) + 1;
  });

  const selectedCountry =
    openDialogIndex !== null ? paginatedCountries[openDialogIndex] : null;

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
            <p className="text-sm text-gray-500">{t("国家/地区", "Countries")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">
              {Object.keys(regionCounts).length}
            </p>
            <p className="text-sm text-gray-500">{t("大洲", "Regions")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {countries.length > 0
                ? (
                    countries.reduce(
                      (sum, c) => sum + c.data.forestCoverage,
                      0
                    ) / countries.length
                  ).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-sm text-gray-500">
              {t("平均森林覆盖率", "Avg. Forest Coverage")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {countries.length > 0
                ? (
                    countries.reduce(
                      (sum, c) => sum + c.data.carbonEmission,
                      0
                    ) / 1000
                  ).toFixed(1)
                : 0}
            </p>
            <p className="text-sm text-gray-500">
              {t("总碳排放 (十亿吨)", "Total Carbon (Gt)")}
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
                  setPage(1);
                }}
                className="w-full border border-gray-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setPage(1);
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
              <option value="none">
                {t("默认排序", "Default Sorting")}
              </option>
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
            </select>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            {t(
              `共 ${filteredCountries.length} 个结果`,
              `${filteredCountries.length} results found`
            )}
          </p>
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
                className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                onClick={() => setOpenDialogIndex(idx)}
              >
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
                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span>
                    🌲 {item.data.forestCoverage}%
                  </span>
                  <span>
                    💨 {item.data.carbonEmission} Mt
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

      {/* Detail Dialog */}
      {selectedCountry && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setOpenDialogIndex(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 rounded-t-2xl text-white relative">
              <button
                onClick={() => setOpenDialogIndex(null)}
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

            {/* Dialog Body */}
            <div className="p-6">
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  {selectedCountry.region}
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

              <p className="text-gray-600 leading-relaxed mb-6">
                {language === "zh"
                  ? selectedCountry.descriptionZh || selectedCountry.description
                  : selectedCountry.descriptionEn || selectedCountry.description}
              </p>

              {/* Data Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">
                    {selectedCountry.data.forestCoverage}%
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {t("森林覆盖率", "Forest Coverage")}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {selectedCountry.data.carbonEmission}
                  </p>
                  <p className="text-sm text-red-500 mt-1">
                    {t("碳排放 (百万吨)", "Carbon Emission (Mt)")}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">
                  {t("环境数据概览", "Environmental Data Overview")}
                </h4>
                <Bar
                  data={{
                    labels: [
                      t("森林覆盖率 (%)", "Forest Coverage (%)"),
                      t("碳排放 (百万吨)", "Carbon Emission (Mt)"),
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
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: "#e5e7eb" },
                      },
                      x: {
                        grid: { display: false },
                      },
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
              "© 2026 全球环境保护机构数据库 — 数据仅供参考",
              "© 2026 Global Environmental Agencies Database — Data for reference only"
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
