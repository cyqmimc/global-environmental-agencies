import { useMemo } from "react";
import { SDG_INDICATORS, formatSdgValue, sdgValue, sortSdgCountries } from "../utils/sdg";

export default function SdgDataView({ countries, allCountries, meta, language, t, onCountryClick, metric, descending, onMetricChange, onDirectionChange }) {
  const definition = meta?.indicators?.[metric] || SDG_INDICATORS.find((item) => item.key === metric);
  const sorted = useMemo(() => sortSdgCountries(countries, metric, descending), [countries, metric, descending]);
  const coverage = allCountries.filter((c) => sdgValue(c.sdg?.[metric]) !== null).length;
  const visibleCoverage = countries.filter((c) => sdgValue(c.sdg?.[metric]) !== null).length;

  return (
    <section className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
      <h2 className="text-lg font-bold">{t("SDG 数据浏览", "SDG Data Explorer")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {t("全国口径 · 同一指标使用共同年份 · 不计入综合评分", "National totals · common year within each indicator · excluded from composite scores")}
      </p>
      <div className="flex flex-wrap items-end gap-3 mt-4">
        <label className="flex flex-col gap-1 text-sm min-w-0" htmlFor="sdg-metric">
          <span>{t("选择指标", "Indicator")}</span>
          <select id="sdg-metric" aria-label={t("选择指标", "Indicator")} value={metric} onChange={(event) => {
            onMetricChange(event.target.value, SDG_INDICATORS.find((item) => item.key === event.target.value).direction === "higher");
          }} className="max-w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2">
            {SDG_INDICATORS.map((item) => (
              <option key={item.key} value={item.key}>SDG {item.indicator} · {language === "zh" ? item.labelZh : item.labelEn}</option>
            ))}
          </select>
        </label>
        <button onClick={onDirectionChange} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm cursor-pointer">
          {descending ? t("数值从高到低 ↓", "Highest first ↓") : t("数值从低到高 ↑", "Lowest first ↑")}
        </button>
      </div>
      <p role="status" className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {t("数据年份", "Data year")}: {definition.dataYear || "—"} · {t("总体覆盖", "Overall coverage")}: {coverage}/{allCountries.length} · {t("当前结果覆盖", "Filtered coverage")}: {visibleCoverage}/{countries.length}
      </p>
      {metric === "redListIndex" && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t("指数范围为 0–1，越高表示物种整体灭绝风险越低。", "The index ranges from 0 to 1; higher values mean lower aggregate species extinction risk.")}</p>}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <caption className="sr-only">{language === "zh" ? definition.labelZh : definition.labelEn}</caption>
          <thead><tr className="border-b border-gray-200 dark:border-gray-800">
            <th scope="col" className="text-left py-3">{t("国家", "Country")}</th>
            <th scope="col" className="text-right py-3" aria-sort={descending ? "descending" : "ascending"}>{t("数值", "Value")} ({definition.unit})</th>
            <th scope="col" className="text-right py-3">{t("年份", "Year")}</th>
            <th scope="col" className="text-right py-3">{t("数据状态", "Data status")}</th>
          </tr></thead>
          <tbody>{sorted.map((country) => {
            const observation = country.sdg?.[metric];
            return <tr key={country.isoCode} className="border-b border-gray-100 dark:border-gray-800">
              <th scope="row" className="text-left font-medium py-3 pr-3">
                <button onClick={() => onCountryClick(country)} className="text-green-700 dark:text-green-400 hover:underline cursor-pointer">{language === "zh" ? country.countryZh : country.countryEn}</button>
              </th>
              <td className="text-right tabular-nums px-2">{formatSdgValue(metric, observation)}</td>
              <td className="text-right tabular-nums px-2">{observation?.year || "—"}</td>
              <td className="text-right pl-2 text-gray-500 dark:text-gray-400">{sdgValue(observation) !== null ? t("可用", "Available") : observation?.status === "not_applicable" ? t("不适用", "Not applicable") : t("无可比数据", "No comparable data")}</td>
            </tr>;
          })}</tbody>
        </table>
        {countries.length === 0 && <p className="py-8 text-center text-gray-500">{t("没有符合筛选条件的国家", "No countries match these filters")}</p>}
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {t("缺失与不适用值始终排在末尾，不作为零值。使用页面上方 CSV 按钮导出当前筛选结果的全部指标。", "Missing and not-applicable values always sort last and are never treated as zero. Use the CSV button above to export all indicators for the filtered countries.")}
      </p>
      <a href={meta?.sourceUrl || "https://unstats.un.org/sdgs/dataportal/database"} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-sky-700 dark:text-sky-300 hover:underline">{t("联合国官方数据与方法 →", "Official UN data and methodology →")}</a>
      {definition.metadataUrl && <a href={definition.metadataUrl} target="_blank" rel="noopener noreferrer" className="inline-block ml-4 mt-3 text-xs text-sky-700 dark:text-sky-300 hover:underline">{t("该指标方法文档 →", "Indicator metadata →")}</a>}
    </section>
  );
}
