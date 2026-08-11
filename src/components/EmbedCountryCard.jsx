import { useEffect, useRef, useState } from "react";
import { NDC_RATING_CONFIG } from "../constants";

const GRADE_CONFIG = {
  "A+": "bg-green-800 text-white",
  A: "bg-green-600 text-white",
  "B+": "bg-lime-500 text-white",
  B: "bg-yellow-500 text-white",
  C: "bg-orange-500 text-white",
  D: "bg-red-600 text-white",
  F: "bg-red-900 text-white",
};

function GradeBadge({ label, grade }) {
  const cls = grade ? GRADE_CONFIG[grade] || "bg-gray-400 text-white" : "bg-gray-300 text-gray-600";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${cls}`}>
        {grade || "—"}
      </div>
      <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

/**
 * Read-only, frameless embed card for <iframe src="/embed/country/<iso>?lang=&theme=">.
 * Fetches this project's own public API (/api/v1/country/<iso>.json) rather
 * than the app's internal data files — same data a third-party API consumer
 * would get, so the embed and the API can never silently drift apart, and it
 * keeps this route's own JS/data footprint small (one ~1KB fetch instead of
 * the full core+wb-latest bundle plus client-side score computation).
 *
 * Reports its rendered height to the parent frame via postMessage so the
 * embedding page can size the <iframe> to fit without internal scrolling —
 * see the snippet DetailDialog's "Embed" button copies for the parent-side
 * listener this pairs with.
 */
export default function EmbedCountryCard() {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang") === "en" ? "en" : "zh";
  const theme = params.get("theme") === "dark" ? "dark" : "light";
  const isZh = lang === "zh";
  const iso = window.location.pathname.match(/\/embed\/country\/([a-z]{2})/i)?.[1]?.toLowerCase();

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    document.documentElement.lang = isZh ? "zh-CN" : "en";
  }, [theme, isZh]);

  useEffect(() => {
    if (!iso) { setError(true); return; }
    let cancelled = false;
    fetch(`/api/v1/country/${iso}.json`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((json) => { if (!cancelled) setData(json.country); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [iso]);

  // Report height to the parent whenever the rendered content changes size —
  // fonts/images loading async can change it after the first paint.
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const report = () => {
      const height = containerRef.current?.offsetHeight;
      if (height) window.parent.postMessage({ type: "gegt:embed-resize", iso, height }, "*");
    };
    const ro = new ResizeObserver(report);
    ro.observe(containerRef.current);
    report();
    return () => ro.disconnect();
  }, [data, iso]);

  const t = (zh, en) => (isZh ? zh : en);

  if (error) {
    return (
      <div ref={containerRef} className="p-4 text-sm text-gray-500 dark:text-gray-400 font-sans">
        {t("无法加载国家数据。", "Could not load country data.")}
      </div>
    );
  }
  if (!data) {
    return <div ref={containerRef} className="p-4 text-sm text-gray-400 font-sans">{t("加载中…", "Loading…")}</div>;
  }

  const ndcCfg = data.ndcRating ? NDC_RATING_CONFIG[data.ndcRating] : null;
  const dataYears = [data.epiScoreYear, data.co2Year, data.forestAreaYear].filter(Boolean);
  const latestYear = dataYears.length ? Math.max(...dataYears) : null;

  return (
    <div
      ref={containerRef}
      className="font-sans bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-xl"
    >
      <div className="flex items-center gap-2.5">
        <img
          src={`https://flagcdn.com/${data.isoCode}.svg`}
          alt=""
          className="w-8 h-6 object-cover rounded shadow-sm shrink-0"
        />
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight truncate">{isZh ? data.countryZh : data.countryEn}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{isZh ? data.agencyZh : data.agencyEn}</p>
        </div>
      </div>

      <div className="flex items-center gap-5 mt-3">
        <GradeBadge label={t("状态", "State")} grade={data.stateGrade} />
        <GradeBadge label={t("治理", "Governance")} grade={data.governanceGrade} />
        <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300 min-w-0">
          <span>EPI {data.epiScore ?? "—"}</span>
          <span className="truncate">
            NDC: {ndcCfg ? ndcCfg[lang] : t("未评估", "Not Assessed")}
          </span>
          <span>
            {t("碳价", "Carbon price")}:{" "}
            {data.carbonPriceUsdPerTon != null ? `$${data.carbonPriceUsdPerTon}/t CO₂` : t("无", "None")}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-[10px] text-gray-400 dark:text-gray-500">
        <span className="truncate">
          {t("数据", "Data")}: World Bank · Yale EPI · Climate Action Tracker
          {latestYear ? ` (${latestYear})` : ""} ·{" "}
          {t("部分数据受限（非商业/需署名），详见来源页", "some fields are restricted — see source page")}
        </span>
      </div>
      <a
        href={`${window.location.origin}/${isZh ? "" : "en/"}country/${data.isoCode}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg py-1.5 transition-colors"
      >
        {t("查看完整数据 →", "View full data →")}
      </a>
    </div>
  );
}
