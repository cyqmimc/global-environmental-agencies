import { useState } from "react";
import { yearBreakdown } from "../utils/dataYearConsistency";

/**
 * ⚠ badge shown next to an indicator when its data year mixes across
 * countries (e.g. PM2.5: some 2020 World Bank, most 2024 IQAir). Click to
 * expand the affected-country breakdown per year.
 *
 * `countries` must be the full, unfiltered list — see dataYearConsistency.js.
 */
export default function YearInconsistencyWarning({ countries, field, language, t, className = "" }) {
  const [open, setOpen] = useState(false);
  const groups = yearBreakdown(countries, field);
  const years = Object.keys(groups).sort();
  if (years.length <= 1) return null;

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={t(
          "口径/年份不一致，谨慎横向对比 · 点击查看详情",
          "Mixed years/methodology — compare with caution · click for details"
        )}
        className="text-[10px] text-amber-600 dark:text-amber-400 font-normal normal-case tracking-normal cursor-pointer hover:text-amber-700 dark:hover:text-amber-300"
      >
        ⚠
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-left normal-case font-normal"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {t("口径/年份不一致", "Mixed years/methodology")}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer text-xs"
              aria-label={t("关闭", "Close")}
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {years.map((y) => (
              <div key={y}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {y} ({groups[y].length})
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {groups[y]
                    .map((c) => (language === "zh" ? c.countryZh : c.countryEn))
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}
