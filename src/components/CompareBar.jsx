/**
 * Floating bottom bar shown when the user has 1+ countries pinned for comparison.
 */
export default function CompareBar({
  compareList,
  language,
  t,
  onRemove,
  onOpen,
}) {
  if (compareList.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 px-5 py-3 flex flex-col sm:flex-row items-center gap-4 z-40 w-[calc(100%-2rem)] sm:w-auto">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {compareList.map((c, i) => (
          <div key={c.countryEn} className="flex items-center gap-1">
            <img
              src={c.flagUrl}
              alt={c.countryEn}
              className="w-8 h-5 object-cover rounded"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {language === "zh" ? c.countryZh : c.countryEn}
            </span>
            <button
              onClick={() => onRemove(c)}
              className="text-gray-500 dark:text-gray-400 hover:text-red-500 text-xs cursor-pointer ml-0.5"
              aria-label={t("移除", "Remove")}
            >
              ✕
            </button>
            {i < compareList.length - 1 && (
              <span className="text-gray-500 dark:text-gray-300 mx-1">vs</span>
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{compareList.length}/3</span>
      <button
        onClick={onOpen}
        disabled={compareList.length < 2}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
      >
        {t("开始对比", "Compare")}
      </button>
    </div>
  );
}
