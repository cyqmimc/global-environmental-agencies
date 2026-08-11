/**
 * Small gray year marker for a data point, with hover/long-press tooltip
 * showing source, method, and unit. Optionally links to the source.
 */
export default function DataYearBadge({ meta, language, t, className = "" }) {
  if (!meta) return null;
  const { year, source, sourceUrl, method, unit, retrievedAt } = meta;
  if (year == null && !source) return null;

  const methodText = typeof method === "object" ? (language === "zh" ? method.zh : method.en) : method;
  const tooltipParts = [
    source,
    methodText,
    unit,
    retrievedAt && retrievedAt !== "unknown"
      ? `${t("获取于", "retrieved")} ${retrievedAt}`
      : null,
  ].filter(Boolean);
  const tooltip = tooltipParts.join(" · ");

  const label = year != null ? String(year) : t("年份未知", "year unknown");
  const content = (
    <>
      <span className="border-b border-dotted border-gray-400 dark:border-gray-500">{label}</span>
      <span className="ml-0.5">ⓘ</span>
    </>
  );

  const baseClass = `text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap cursor-help ${className}`;

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={tooltip}
        className={`${baseClass} hover:text-gray-600 dark:hover:text-gray-300`}
      >
        {content}
      </a>
    );
  }

  return (
    <span title={tooltip} className={baseClass}>
      {content}
    </span>
  );
}
