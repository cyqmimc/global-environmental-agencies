/** Shared simple page-number pagination. */
export default function Pagination({ page, pageCount, onChange, t }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
      >
        {t("上一页", "Prev")}
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            p === page
              ? "bg-green-600 text-white shadow-sm"
              : "border border-gray-200 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
      >
        {t("下一页", "Next")}
      </button>
    </div>
  );
}
