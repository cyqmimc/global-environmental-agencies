import { useState, useMemo } from "react";
import { NDC_RATING_CONFIG, PROVENANCE, exportCSV } from "../constants";
import { carbonIntensity, formatCarbonIntensity } from "../utils/derived";
import {
  computeStateIndices,
  computeGovernanceIndices,
  STATE_DIMENSIONS,
  GOVERNANCE_DIMENSIONS,
  DEFAULT_STATE_WEIGHTS,
  DEFAULT_GOVERNANCE_WEIGHTS,
  isDefaultWeights,
} from "../utils/score";
import DataYearBadge from "./DataYearBadge";
import YearInconsistencyWarning from "./YearInconsistencyWarning";

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
  { key: "state", zhLabel: "状态指数", enLabel: "State", sortable: true, hideMobile: false },
  { key: "governance", zhLabel: "治理指数", enLabel: "Governance", sortable: true, hideMobile: false },
  { key: "epi", zhLabel: "EPI", enLabel: "EPI", sortable: true, hideMobile: true, provenance: "epiScore" },
  { key: "renewable", zhLabel: "可再生%", enLabel: "Renew%", sortable: true, hideMobile: true, wbYearField: "renewableEnergy" },
  { key: "pm25", zhLabel: "PM2.5", enLabel: "PM2.5", sortable: true, hideMobile: true, wbYearField: "pm25" },
  { key: "co2", zhLabel: "CO₂/人", enLabel: "CO₂/Cap", sortable: true, hideMobile: true },
  { key: "carbonPrice", zhLabel: "碳价", enLabel: "C.Price", sortable: true, hideMobile: true, provenance: "carbonPricingPriceUSD" },
  { key: "intensity", zhLabel: "碳强度", enLabel: "C.Intensity", sortable: true, hideMobile: true },
  { key: "ndc", zhLabel: "NDC", enLabel: "NDC", sortable: false, hideMobile: false },
  { key: "btr", zhLabel: "BTR", enLabel: "BTR", sortable: false, hideMobile: true },
];

/** Null (insufficient-data) scores always sink to the bottom regardless of sort direction. */
function cmpNullsLast(va, vb, asc) {
  const aNull = va == null;
  const bNull = vb == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  return asc ? va - vb : vb - va;
}

function getSortValue(country, key, stateIndices, governanceIndices) {
  switch (key) {
    case "state": return stateIndices.get(country)?.score ?? null;
    case "governance": return governanceIndices.get(country)?.score ?? null;
    case "epi": return country.epiScore ?? null;
    case "renewable": return country.wb?.renewableEnergy ?? null;
    case "pm25": return country.wb?.pm25 ?? null;
    case "co2": return country.wb?.co2PerCapita ?? null;
    case "carbonPrice": return country.carbonPricing?.priceUSD ?? null;
    case "intensity": return carbonIntensity(country);
    default: return null;
  }
}

function WeightSlider({ dim, value, onChange, language }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-32 shrink-0 truncate" title={language === "zh" ? dim.zh : dim.en}>
        {language === "zh" ? dim.zh : dim.en}
      </span>
      <input
        type="range"
        min="0"
        max="40"
        value={value}
        onChange={(e) => onChange(dim.key, Number(e.target.value))}
        className="flex-1 accent-green-600 cursor-pointer"
      />
      <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-9 text-right shrink-0">{value}</span>
    </div>
  );
}

const PAGE_SIZE = 25;

export default function RankingsView({
  countries,
  allCountries,
  language,
  t,
  onCountryClick,
  stateWeights = DEFAULT_STATE_WEIGHTS,
  governanceWeights = DEFAULT_GOVERNANCE_WEIGHTS,
  onWeightsChange,
}) {
  const [sortKey, setSortKey] = useState("governance");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [showWeights, setShowWeights] = useState(false);

  const fullList = allCountries || countries;

  // Normalization must be relative to the full, unfiltered dataset so scores
  // stay stable as the user applies region/tag/compliance filters — only the
  // set of *rows shown* should change, not what "100" means.
  const stateIndices = useMemo(
    () => computeStateIndices(fullList, stateWeights),
    [fullList, stateWeights]
  );
  const governanceIndices = useMemo(
    () => computeGovernanceIndices(fullList, governanceWeights),
    [fullList, governanceWeights]
  );

  const sorted = useMemo(() => {
    const arr = [...countries];
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey, stateIndices, governanceIndices);
      const vb = getSortValue(b, sortKey, stateIndices, governanceIndices);
      return cmpNullsLast(va, vb, sortAsc);
    });
    return arr;
  }, [countries, sortKey, sortAsc, stateIndices, governanceIndices]);

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

  const updateStateWeight = (key, val) => {
    onWeightsChange?.({ ...stateWeights, [key]: val }, governanceWeights);
  };
  const updateGovernanceWeight = (key, val) => {
    onWeightsChange?.(stateWeights, { ...governanceWeights, [key]: val });
  };
  const resetWeights = () => {
    onWeightsChange?.(DEFAULT_STATE_WEIGHTS, DEFAULT_GOVERNANCE_WEIGHTS);
  };
  const weightsAreDefault = isDefaultWeights(stateWeights, governanceWeights);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60 flex-wrap gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t(`共 ${sorted.length} 国 · 第 ${currentPage} / ${totalPages} 页`, `${sorted.length} countries · Page ${currentPage} / ${totalPages}`)}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWeights((v) => !v)}
            className="text-xs text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>⚙️</span> {t("调整权重", "Adjust Weights")}
            {!weightsAreDefault && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            <span className="text-gray-400">{showWeights ? "▲" : "▼"}</span>
          </button>
          <button
            onClick={handleExport}
            disabled={sorted.length === 0}
            className="text-xs text-green-700 dark:text-green-400 hover:text-green-800 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
            title={t("按当前排序导出 CSV", "Export current ranking as CSV")}
          >
            <span>📥</span> {t("导出 CSV", "Export CSV")}
          </button>
        </div>
      </div>

      {showWeights && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t(
                "拖动调整各维度相对权重（无需总和为 100，系统自动按比例归一化）；调整会影响下方两列的排序与分值，并写入分享链接。",
                "Drag to adjust each dimension's relative weight (they don't need to sum to 100 — normalized automatically); changes affect the sort/scores below and are saved to the share link."
              )}
            </p>
            <button
              onClick={resetWeights}
              disabled={weightsAreDefault}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 font-medium shrink-0 ml-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("恢复默认", "Reset to Default")}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                {t("状态指数（禀赋）", "State Index (Endowment)")}
              </p>
              <div className="space-y-1.5">
                {STATE_DIMENSIONS.map((dim) => (
                  <WeightSlider key={dim.key} dim={dim} value={stateWeights[dim.key]} onChange={updateStateWeight} language={language} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                {t("治理指数（绩效）", "Governance Index (Performance)")}
              </p>
              <div className="space-y-1.5">
                {GOVERNANCE_DIMENSIONS.map((dim) => (
                  <WeightSlider key={dim.key} dim={dim} value={governanceWeights[dim.key]} onChange={updateGovernanceWeight} language={language} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  {col.provenance && (
                    <DataYearBadge
                      meta={PROVENANCE[col.provenance]}
                      language={language}
                      t={t}
                      className="ml-1 normal-case tracking-normal font-normal"
                    />
                  )}
                  {col.wbYearField && (
                    <YearInconsistencyWarning
                      countries={fullList}
                      field={col.wbYearField}
                      language={language}
                      t={t}
                      className="ml-1"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginated.map((country, idx) => {
              const stateResult = stateIndices.get(country);
              const govResult = governanceIndices.get(country);
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
                    <IndexCell result={stateResult} t={t} />
                  </td>
                  <td className="px-3 py-2.5">
                    <IndexCell result={govResult} t={t} />
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-200 font-medium hidden md:table-cell">
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

function IndexCell({ result, t }) {
  if (!result || result.score == null) {
    return (
      <span
        className="text-xs text-gray-400 dark:text-gray-500 italic"
        title={t("有效维度不足 4 个，暂不给出综合分", "Fewer than 4 valid dimensions — no score given")}
      >
        {t("数据不足", "Insufficient data")}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${scoreColor(result.score)}`}
          style={{ width: `${result.score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-8">{result.score}</span>
    </div>
  );
}
