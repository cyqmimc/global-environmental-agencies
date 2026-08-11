import BarChart from "./charts/BarChart";
import { TREATY_LABELS, RESPONSIBILITY_LABELS, NDC_RATING_CONFIG } from "../constants";
import useDialogA11y from "../hooks/useDialogA11y";
import {
  carbonIntensity,
  gdpPerCapita,
  formatPopulation,
  formatGdp,
  formatGdpPerCapita,
  formatCarbonIntensity,
} from "../utils/derived";

const COMPARE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];

export default function CompareDialog({ compareList, language, t, globalAvg, onClose, onClear }) {
  const dialogRef = useDialogA11y(true, onClose);
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("国家对比", "Country Comparison")}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[90vh] h-full sm:h-auto overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 p-6 rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label={t("关闭", "Close")}
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("森林覆盖率", "Forest Coverage")}
                  </td>
                  {compareList.map((c) => (
                    <td
                      key={c.countryEn}
                      className="py-3 px-2 text-center font-bold text-green-700"
                    >
                      {c.wb?.forestArea?.toFixed(1) ?? "—"}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("碳排放", "Carbon Emission")}
                  </td>
                  {compareList.map((c) => (
                    <td
                      key={c.countryEn}
                      className="py-3 px-2 text-center font-bold text-red-600"
                    >
                      {c.wb?.co2Mt?.toFixed(1) ?? "—"} Mt
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("可再生能源", "Renewable Energy")}
                  </td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-emerald-600">
                      {c.wb?.renewableEnergy?.toFixed(1) ?? "—"}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    PM2.5 (µg/m³)
                  </td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-amber-600">
                      {c.wb?.pm25?.toFixed(1) ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("人均CO₂ (吨)", "CO₂/Capita (t)")}
                  </td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-red-500">
                      {c.wb?.co2PerCapita?.toFixed(1) ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("人口", "Population")}
                  </td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-200">
                      {formatPopulation(c.wb?.population)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">GDP</td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-200">
                      {formatGdp(c.wb?.gdp)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("人均 GDP", "GDP/Capita")}
                  </td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-200">
                      {formatGdpPerCapita(gdpPerCapita(c))}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td
                    className="py-3 px-2 text-gray-500 dark:text-gray-400"
                    title={t("每美元 GDP 排放 CO₂ 克数 · 越低越好", "g CO₂ per USD GDP · lower is better")}
                  >
                    {t("碳强度", "C. Intensity")}
                  </td>
                  {compareList.map((c) => {
                    const v = carbonIntensity(c);
                    const cls = v == null
                      ? "text-gray-400"
                      : v <= 0.05 ? "text-green-600"
                      : v <= 0.15 ? "text-lime-600"
                      : v <= 0.30 ? "text-yellow-600"
                      : v <= 0.60 ? "text-orange-500"
                      : "text-red-500";
                    return (
                      <td key={c.countryEn} className={`py-3 px-2 text-center font-bold ${cls}`}>
                        {formatCarbonIntensity(v)}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("保护区面积", "Protected Areas")}
                  </td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center font-bold text-teal-600">
                      {c.wb?.protectedAreas?.toFixed(1) ?? "—"}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    NDC 3.0
                  </td>
                  {compareList.map((c) => (
                    <td key={c.countryEn} className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${c.parisAgreement?.ndc3Submitted ? "bg-indigo-600" : "bg-rose-500"}`}>
                        {c.parisAgreement?.ndc3Submitted ? t("已交", "Filed") : t("未交", "Pending")}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {t("UNCCD · LDN", "UNCCD · LDN")}
                  </td>
                  {compareList.map((c) => {
                    const d = c.desertification;
                    if (!d) return <td key={c.countryEn} className="py-3 px-2 text-center text-gray-400">—</td>;
                    return (
                      <td key={c.countryEn} className="py-3 px-2 text-center">
                        {d.ldnTargetSet ? (
                          <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                            LDN ✓
                          </span>
                        ) : d.affectedParty ? (
                          <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {t("受影响", "Affected")}
                          </span>
                        ) : (
                          <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full">
                            {t("非受影响", "Non-affected")}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              {t("数据对比", "Data Comparison")}
            </h4>
            <BarChart
              labels={[
                t("森林覆盖率 (%)", "Forest (%)"),
                t("碳排放 (Mt)", "CO₂ (Mt)"),
                t("EPI 评分", "EPI Score"),
              ]}
              datasets={compareList.map((c, i) => ({
                label: language === "zh" ? c.countryZh : c.countryEn,
                data: [c.wb?.forestArea ?? 0, c.wb?.co2Mt ?? 0, c.epiScore],
                color: COMPARE_COLORS[i],
              }))}
            />
          </div>

          {/* Close + clear */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClear}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {t("清除对比", "Clear & Close")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {t("继续选择", "Continue Browsing")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
