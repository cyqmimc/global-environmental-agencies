import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

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
    fetch('/countries.json')
      .then(response => response.json())
      .then(data => setCountries(data));
  }, []);

  const ITEMS_PER_PAGE = 9;

  const filteredCountries = countries
    .filter((item) =>
      (item.countryEn.toLowerCase().includes(search.toLowerCase()) ||
        item.countryZh.includes(search) ||
        item.agencyEn.toLowerCase().includes(search.toLowerCase()) ||
        item.agencyZh.includes(search)) &&
      (regionFilter ? item.region === regionFilter : true)
    )
    .sort((a, b) => {
      if (sortOrder === "forestAsc") return a.data.forestCoverage - b.data.forestCoverage;
      if (sortOrder === "forestDesc") return b.data.forestCoverage - a.data.forestCoverage;
      if (sortOrder === "carbonAsc") return a.data.carbonEmission - b.data.carbonEmission;
      if (sortOrder === "carbonDesc") return b.data.carbonEmission - a.data.carbonEmission;
      return 0;
    });

  const pageCount = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);
  const paginatedCountries = filteredCountries.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const t = (zh, en) => (language === "zh" ? zh : en);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row items-center mb-4 gap-4">
        <input
          type="text"
          placeholder={t("搜索国家或环境部门", "Search by country or agency")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border p-2 rounded w-full md:w-1/2"
        />
        <select
          value={regionFilter}
          onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
          className="border p-2 rounded"
        >
          <option value="">{t("全部地区", "All Regions")}</option>
          <option value="Asia">{t("亚洲", "Asia")}</option>
          <option value="North America">{t("北美洲", "North America")}</option>
          <option value="Europe">{t("欧洲", "Europe")}</option>
          <option value="Africa">{t("非洲", "Africa")}</option>
          <option value="Oceania">{t("大洋洲", "Oceania")}</option>
          <option value="South America">{t("南美洲", "South America")}</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="none">{t("默认排序", "Default Sorting")}</option>
          <option value="forestAsc">{t("森林覆盖率升序", "Forest Coverage ↑")}</option>
          <option value="forestDesc">{t("森林覆盖率降序", "Forest Coverage ↓")}</option>
          <option value="carbonAsc">{t("碳排放升序", "Carbon Emissions ↑")}</option>
          <option value="carbonDesc">{t("碳排放降序", "Carbon Emissions ↓")}</option>
        </select>
        <button
          onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {language === "zh" ? "切换到英文" : "Switch to Chinese"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCountries.map((item, idx) => (
          <div
            key={idx}
            className="border rounded-2xl p-4 flex flex-col items-center hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer"
            onClick={() => setOpenDialogIndex(idx)}
          >
            <img src={item.flagUrl} alt={item.countryEn} className="w-16 h-10 object-cover rounded-md mb-2" />
            <h2 className="text-lg font-semibold">{language === "zh" ? item.countryZh : item.countryEn}</h2>
            <p className="text-center text-sm my-1">{language === "zh" ? item.agencyZh : item.agencyEn}</p>
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block bg-green-500 text-white px-4 py-2 rounded"
            >
              {t("访问官网", "Visit Website")}
            </a>
          </div>
        ))}
      </div>

      {openDialogIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative">
            <button
              onClick={() => setOpenDialogIndex(null)}
              className="absolute top-2 right-2 text-gray-500"
            >
              ✖
            </button>
            <div className="flex flex-col items-center">
              <img src={paginatedCountries[openDialogIndex].flagUrl} alt="flag" className="w-20 h-14 object-cover rounded-md mb-2" />
              <h3 className="text-lg font-bold mb-2">{language === "zh" ? paginatedCountries[openDialogIndex].countryZh : paginatedCountries[openDialogIndex].countryEn}</h3>
              <p>{language === "zh" ? paginatedCountries[openDialogIndex].agencyZh : paginatedCountries[openDialogIndex].agencyEn}</p>
              <p className="text-sm my-2">{paginatedCountries[openDialogIndex].description}</p>
              {paginatedCountries[openDialogIndex].data && (
                <div className="mt-4 w-full">
                  <Bar
                    data={{
                      labels: [t('森林覆盖率 (%)', 'Forest Coverage (%)'), t('碳排放 (百万吨)', 'Carbon Emission (Mt)')],
                      datasets: [
                        {
                          label: language === "zh" ? paginatedCountries[openDialogIndex].countryZh : paginatedCountries[openDialogIndex].countryEn,
                          data: [
                            paginatedCountries[openDialogIndex].data.forestCoverage,
                            paginatedCountries[openDialogIndex].data.carbonEmission,
                          ],
                          backgroundColor: ['#4ade80', '#f87171'],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
