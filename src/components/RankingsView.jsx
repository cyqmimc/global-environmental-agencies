import { useState, useMemo } from "react";
import { NDC_RATING_CONFIG } from "../constants";

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
    default: return 0;
  }
}

export default function RankingsView({ countries, language, t, onCountryClick }) {
  const [sortKey, setSortKey] = useState("composite");
  const [sortAsc, setSortAsc] = useState(false);

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
      // For CO2, lower is better — but we still sort by numeric value
      const diff = sortAsc ? va - vb : vb - va;
      return diff;
    });
    return arr;
  }, [countries, sortKey, sortAsc, compositeScores]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "co2" || key === "pm25"); // CO2 & PM2.5: ascending by default (lower = better)
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
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
          <tbody className="divide-y divide-gray-100">
            {sorted.map((country, idx) => {
              const score = compositeScores.get(country) ?? 0;
              const ndcCfg = country.parisAgreement?.ndcRating
                ? NDC_RATING_CONFIG[country.parisAgreement.ndcRating]
                : null;
              const btrOk = country.reportingStatus?.btrSubmitted;

              return (
                <tr
                  key={country.isoCode || idx}
                  onClick={() => onCountryClick(country)}
                  className="hover:bg-green-50/50 cursor-pointer transition-colors"
                >
                  {/* Rank */}
                  <td className="px-3 py-2.5 text-center w-12">
                    {rankMedal(idx + 1)}
                  </td>
                  {/* Country */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={country.flagUrl}
                        alt={country.countryEn}
                        className="w-8 h-5 object-cover rounded shadow-sm shrink-0"
                      />
                      <span className="font-medium text-gray-800 truncate max-w-[140px]">
                        {language === "zh" ? country.countryZh : country.countryEn}
                      </span>
                    </div>
                  </td>
                  {/* Composite Score */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${scoreColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-8">{score}</span>
                    </div>
                  </td>
                  {/* EPI */}
                  <td className="px-3 py-2.5 text-gray-700 font-medium">
                    {country.epiScore ?? "—"}
                  </td>
                  {/* Renewable */}
                  <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">
                    {country.wb?.renewableEnergy != null
                      ? `${country.wb.renewableEnergy.toFixed(0)}%`
                      : "—"}
                  </td>
                  {/* PM2.5 */}
                  <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">
                    {country.wb?.pm25 != null
                      ? <span className={country.wb.pm25 > 25 ? "text-red-500 font-medium" : country.wb.pm25 > 10 ? "text-amber-600" : "text-green-600"}>{country.wb.pm25.toFixed(1)}</span>
                      : "—"}
                  </td>
                  {/* CO2/Capita */}
                  <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">
                    {country.wb?.co2PerCapita != null
                      ? country.wb.co2PerCapita.toFixed(1)
                      : "—"}
                  </td>
                  {/* Carbon Price */}
                  <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">
                    {country.carbonPricing?.priceUSD != null
                      ? `$${country.carbonPricing.priceUSD}`
                      : "—"}
                  </td>
                  {/* NDC */}
                  <td className="px-3 py-2.5">
                    {ndcCfg ? (
                      <span className={`${ndcCfg.color} text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        {language === "zh" ? ndcCfg.zh : ndcCfg.en}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  {/* BTR */}
                  <td className="px-3 py-2.5 text-center hidden md:table-cell">
                    {btrOk ? (
                      <span className="text-green-600 font-bold">&#10003;</span>
                    ) : (
                      <span className="text-red-500 font-bold">&#10007;</span>
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
    </div>
  );
}
