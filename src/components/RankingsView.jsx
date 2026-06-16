import { useState, useMemo } from "react";
import { NDC_RATING_CONFIG, exportCSV } from "../constants";
import { carbonIntensity, formatCarbonIntensity } from "../utils/derived";

export function computeCompositeScore(country) {
  const epi = (country.epiScore ?? 0) * 0.25;
  const renew = Math.min(country.wb?.renewableEnergy ?? 0, 100) * 0.20;
  const forest = Math.min(country.wb?.forestArea ?? 0, 100) * 0.15;
  const protect = Math.min(country.wb?.protectedAreas ?? 0, 100) * 0.15;
  const air = (100 - Math.min(country.wb?.pm25 ?? 100, 100)) * 0.15;
  const co2 = (100 - Math.min((country.wb?.co2PerCapita ?? 0) * 5, 100)) * 0.10;
  return +(epi + renew + forest + protect + air + co2).toFixed(1);
}

function scoreColor(score) {
  if (score >= 70) return "bg-green-500";
  if (score >= 55) return "bg-lime-500";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

function rankMedal(rank) {
  if (rank === 1) return <span className="text-yellow-500 font-bold">🥇</span>;
  if (rank === 2) return <span className="text-gray-400 font-bold">🥈</span>;
  if (rank === 3) return <span className="text-amber-700 font-bold">🥉</span>;
  return <span className="text-gray-500 font-medium">{rank}</span>;
}

const COLUMNS = [
  { key: "rank", zhLabel: "#", enLabel: "#", sortable: false, hideMobile: false },
  { key: "country", zhLabel: "国家", enLabel: "Country", sortable: false, hideMobile: false },
  { key: "composite", zhLabel: "综合评分", enLabel: "Composite", sortable: true, hideMobile: false },
  { key: "epi", zhLabel: "EPI", enLabel: "EPI", sortable: true, hideMobile: false },
  { key: "renewable", zhLabel: "可再生%", enLabel: "Renew%", sortable: true, hideMobile: true },
  { key: "pm25", zhLabel: "PM2.5", enLabel: "PM2.5", sortable: true, hideMobile: true },
  { key: "co2", zhLabel: "CO₂/人", enLabel: "CO₂/Cap", sortable: true, hideMobile: true },
  { key: "carbonPrice", zhLabel: "碳价", enLabel: "C.Price", sortable: true, hideMobile: true },
  { key: "intensity", zhLabel: "碳强度", enLabel: "C.Intensity", sortable: true, hideMobile: true },
  { key: "ndc", zhLabel: "NDC", enLabel: "NDC", sortable: false, hideMobile: false },
  { key: "btr", zhLabel: "BTR", enLabel: "BTR", sortable: false, hideMobile: true },
];

function getSortValue(country, key, compositeScores) {
  switch (key) {
    case "composite": return compositeScores.get(country) ?? 0;
    case "epi": return country.epiScore ?? 0;
    case "renewable": return country.wb?.renewableEnergy ?? -1;
    case "pm25": return country.wb?.pm25 ?? 999;
    case "co2": return country.wb?.co2PerCapita ?? 999;
    case "carbonPrice": return country.carbonPricing?.priceUSD ?? -1;
    case "intensity": return carbonIntensity(country) ?? Infinity; // null sinks
    default: return 0;
  }
}

const PAGE_SIZE = 25;

export default function RankingsView({ countries, language, t, onCountryClick }) {
  const [sortKey, setSortKey] = useState("composite");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const compositeScores = useMemo(() => {
    const map = new Map();
    countries.forEach((c) => map.set(c, computeCompositeScore(c)));
    return map;
  }, [countries]);

  const sorted = useMemo(() => {
    const arr = [...countries];
    arr.sort((a, b) => {
      let va = getSortValue(a, sortKey, compositeScores);
      let vb = getSortValue(b, sortKey, compositeScores);
      const diff = sortAsc ? va - vb : vb - va;
      return diff;
    });
    return arr;
  }, [countries, sortKey, sortAsc, compositeScores]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginated = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "co2" || key === "pm25" || key === "intensity");
    }
    setPage(1);
  };

  const handleExport = () => {
    exportCSV(sorted, language, `rankings-${sortKey}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t(`共 ${sorted.length} 国 · 第 ${currentPage} / ${totalPages} 页`, `${sorted.length} countries · Page ${currentPage} / ${totalPages}`)}
        </p>
        <button
          onClick={handleExport}
          disabled={sorted.length === 0}
          className="text-xs text-green-700 dark:text-green-400 hover:text-green-800 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
          title={t("按当前排序导出 CSV", "Export current ranking as CSV")}
        >
          <span>📥</span> {t("导出 CSV", "Export CSV")}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer hover:text-green-700 select-none" : ""
                  } ${col.hideMobile ? "hidden md:table-cell" : ""} ${
                    col.key === "rank" ? "w-12 text-center" : ""
                  }`}
                >
                  {language === "zh" ? col.zhLabel : col.enLabel}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginated.map((country, idx) => {
              const score = compositeScores.get(country) ?? 0;
              const ndcCfg = country.parisAgreement?.ndcRating
                ? NDC_RATING_CONFIG[country.parisAgreement.ndcRating]
                : null;
              const btrOk = country.reportingStatus?.btrSubmitted;
              const rank = pageStart + idx + 1;

              return (
                <tr
                  key={country.isoCode || rank}
                  onClick={() => onCountryClick(country)}
                  className="hover:bg-green-50/50 dark:hover:bg-green-900/20 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 text-center w-12">{rankMedal(rank)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={country.flagUrl}
                        alt={country.countryEn}
                        className="w-8 h-5 object-cover rounded shadow-sm shrink-0"
                      />
                      <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[140px]">
                        {language === "zh" ? country.countryZh : country.countryEn}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${scoreColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-8">{score}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-200 font-medium">
                    {country.epiScore ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    {country.wb?.renewableEnergy != null
                      ? `${country.wb.renewableEnergy.toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    {country.wb?.pm25 != null
                      ? <span className={country.wb.pm25 > 25 ? "text-red-500 font-medium" : country.wb.pm25 > 10 ? "text-amber-600" : "text-green-600"}>{country.wb.pm25.toFixed(1)}</span>
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    {country.wb?.co2PerCapita != null
                      ? country.wb.co2PerCapita.toFixed(1)
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    {country.carbonPricing?.priceUSD != null
                      ? `$${country.carbonPricing.priceUSD}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 hidden md:table-cell whitespace-nowrap">
                    {(() => {
                      const v = carbonIntensity(country);
                      if (v == null) return "—";
                      const cls = v <= 0.05 ? "text-green-600" : v <= 0.15 ? "text-lime-600" : v <= 0.30 ? "text-yellow-600" : v <= 0.60 ? "text-orange-500" : "text-red-500";
                      return <span className={cls}>{formatCarbonIntensity(v)}</span>;
                    })()}
                  </td>
                  <td className="px-3 py-2.5">
                    {ndcCfg ? (
                      <span className={`${ndcCfg.color} text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        {language === "zh" ? ndcCfg.zh : ndcCfg.en}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center hidden md:table-cell">
                    {btrOk ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-500 font-bold">✗</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {t("没有找到匹配的结果", "No results found")}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {t("上一页", "Prev")}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                p === currentPage
                  ? "bg-green-600 text-white shadow-sm"
                  : "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {t("下一页", "Next")}
          </button>
        </div>
      )}
    </div>
  );
}
