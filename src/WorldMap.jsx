import { useState, useEffect, useRef, useMemo } from "react";
import { carbonIntensity, formatCarbonIntensity } from "./utils/derived";
import { PROVENANCE } from "./constants";
import DataYearBadge from "./components/DataYearBadge";
import YearInconsistencyWarning from "./components/YearInconsistencyWarning";
import { fetchText } from "./utils/fetchWithRetry";
import { getTierColors, getNoDataColor, getNoCountryColor } from "./utils/colorPalette";

// Text labels for the 5 tiers, independent of which color scheme is active —
// this is the redundant (non-color) encoding for the map's tooltip/legend.
const TIER_LABELS = [
  { zh: "优", en: "Good" },
  { zh: "良", en: "Fair" },
  { zh: "中", en: "Moderate" },
  { zh: "差", en: "Poor" },
  { zh: "劣", en: "Bad" },
];

function tierColorFor(tier, tierColors, noData) {
  return tier == null ? noData : tierColors[tier];
}

const epiTier = (v) => (v == null ? null : v >= 60 ? 0 : v >= 45 ? 1 : v >= 30 ? 2 : v >= 15 ? 3 : 4);
const ndcTier = (v) => (v >= 90 ? 0 : v >= 70 ? 1 : v >= 50 ? 2 : v >= 30 ? 3 : 4);
const carbonPriceTier = (v) => (v == null ? null : v >= 80 ? 0 : v >= 40 ? 1 : v >= 15 ? 2 : v >= 1 ? 3 : null);
const renewTier = (v) => (v == null ? null : v >= 40 ? 0 : v >= 25 ? 1 : v >= 15 ? 2 : v >= 5 ? 3 : 4);
const pm25Tier = (v) => (v == null ? null : v <= 10 ? 0 : v <= 15 ? 1 : v <= 25 ? 2 : v <= 35 ? 3 : 4);
const protectedTier = (v) => (v == null ? null : v >= 30 ? 0 : v >= 20 ? 1 : v >= 10 ? 2 : v >= 5 ? 3 : 4);
const ciTier = (v) => (v == null ? null : v <= 0.05 ? 0 : v <= 0.15 ? 1 : v <= 0.30 ? 2 : v <= 0.60 ? 3 : 4);

const METRIC_CONFIG = {
  epiScore: {
    zh: "EPI 评分",
    en: "EPI Score",
    getValue: (c) => c.epiScore,
    getTier: epiTier,
    getColor: (v, tierColors, noData) => tierColorFor(epiTier(v), tierColors, noData),
    format: (v) => v?.toFixed(0),
    provenance: "epiScore",
  },
  ndcRating: {
    zh: "NDC 评级",
    en: "NDC Rating",
    getValue: (c) => {
      const r = c.parisAgreement?.ndcRating;
      return r === "1.5C" ? 100 : r === "2C" ? 80 : r === "almost_sufficient" ? 60 : r === "insufficient" ? 40 : r === "highly_insufficient" ? 20 : r === "critically_insufficient" ? 10 : 0;
    },
    getTier: ndcTier,
    getColor: (v, tierColors, noData) => tierColorFor(ndcTier(v), tierColors, noData),
    format: (v, c) => {
      const labels = { "1.5C": "1.5°C", "2C": "2°C", almost_sufficient: "Almost", insufficient: "Insuff.", highly_insufficient: "Highly Insuff.", critically_insufficient: "Critical", not_assessed: "N/A" };
      return labels[c?.parisAgreement?.ndcRating] || "—";
    },
  },
  carbonPrice: {
    zh: "碳价 ($/t)",
    en: "Carbon Price ($/t)",
    getValue: (c) => c.carbonPricing?.priceUSD,
    getTier: carbonPriceTier,
    getColor: (v, tierColors, noData) => tierColorFor(carbonPriceTier(v), tierColors, noData),
    format: (v) => (v != null ? `$${v}` : "—"),
    provenance: "carbonPricingPriceUSD",
  },
  renewableEnergy: {
    zh: "可再生能源 %",
    en: "Renewable Energy %",
    getValue: (c) => c.wb?.renewableEnergy,
    getTier: renewTier,
    getColor: (v, tierColors, noData) => tierColorFor(renewTier(v), tierColors, noData),
    format: (v) => (v != null ? `${v.toFixed(0)}%` : "—"),
    wbYearField: "renewableEnergy",
  },
  pm25: {
    zh: "空气质量 PM2.5",
    en: "Air Quality PM2.5",
    getValue: (c) => c.wb?.pm25,
    getTier: pm25Tier,
    getColor: (v, tierColors, noData) => tierColorFor(pm25Tier(v), tierColors, noData),
    format: (v) => (v != null ? `${v.toFixed(1)} µg/m³` : "—"),
    wbYearField: "pm25",
  },
  protectedAreas: {
    zh: "自然保护区 %",
    en: "Protected Areas %",
    getValue: (c) => c.wb?.protectedAreas,
    getTier: protectedTier,
    getColor: (v, tierColors, noData) => tierColorFor(protectedTier(v), tierColors, noData),
    format: (v) => (v != null ? `${v.toFixed(1)}%` : "—"),
  },
  carbonIntensity: {
    zh: "碳强度 (CO₂/GDP)",
    en: "Carbon Intensity (CO₂/GDP)",
    getValue: (c) => carbonIntensity(c),
    // Lower is better. Thresholds in kg/USD.
    getTier: ciTier,
    getColor: (v, tierColors, noData) => tierColorFor(ciTier(v), tierColors, noData),
    format: (v) => formatCarbonIntensity(v),
  },
  ndc3: {
    zh: "NDC 3.0 提交",
    en: "NDC 3.0 Submission",
    getValue: (c) => c.parisAgreement?.ndc3Submitted == null
      ? null
      : c.parisAgreement.ndc3Submitted ? 1 : 0,
    // Binary categorical (submitted/not) — indigo vs. gray, not a
    // red/green-conflated pair, so it's left out of the tiered palette.
    getColor: (v, tierColors, noData) => (v == null ? noData : v === 1 ? "#4f46e5" : "#9ca3af"),
    format: (v) => (v == null ? "—" : v === 1 ? "✓" : "—"),
  },
  ldn: {
    zh: "UNCCD · LDN 目标",
    en: "UNCCD · LDN Target",
    getValue: (c) => {
      const d = c.desertification;
      if (!d) return null;
      if (d.ldnTargetSet) return 2;
      if (d.affectedParty) return 1;
      return 0;
    },
    getColor: (v, tierColors, noData) => (v == null ? noData : v === 2 ? tierColors[0] : v === 1 ? tierColors[2] : "#9ca3af"),
    format: (v) => {
      if (v == null) return "—";
      if (v === 2) return "LDN ✓";
      if (v === 1) return "Affected · LDN ✗";
      return "Non-affected";
    },
  },
};

const escapeAttr = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function WorldMap({ countries, language, onCountryClick, colorScheme = "cvd", isDark = false }) {
  const [svgContent, setSvgContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("epiScore");
  const [tooltip, setTooltip] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef(null);
  const centersRef = useRef({});

  const t = (zh, en) => (language === "zh" ? zh : en);
  const cfg = METRIC_CONFIG[metric];
  const tierColors = getTierColors(colorScheme, isDark);
  const noDataColor = getNoDataColor(isDark);
  const noCountryColor = getNoCountryColor(isDark);

  useEffect(() => {
    fetchText("/world-map.svg")
      .then((text) => setSvgContent(text))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Memo the country lookup so repeated tooltip renders don't rebuild it.
  const countryMap = useMemo(() => {
    const m = {};
    countries.forEach((c) => {
      if (c.isoCode) m[c.isoCode] = c;
    });
    return m;
  }, [countries]);

  // Memo the colored SVG — the regex replace on ~200KB of SVG was the dominant
  // hot path on every tooltip mousemove before. Only re-run when the underlying
  // data, metric, color scheme or theme changes.
  const coloredSvg = useMemo(() => {
    if (!svgContent) return "";
    return svgContent.replace(
      /(<(?:path|g)\s+id="([a-z]{2})")/g,
      (match, tag, id) => {
        const country = countryMap[id];
        if (!country) return `${tag} fill="${noCountryColor}" opacity="0.5" aria-hidden="true"`;
        const val = cfg.getValue(country);
        const color = cfg.getColor(val, tierColors, noDataColor);
        const name = language === "zh" ? country.countryZh : country.countryEn;
        const metricLabel = language === "zh" ? cfg.zh : cfg.en;
        const valueLabel = cfg.format(val, country);
        const tier = cfg.getTier ? cfg.getTier(val) : null;
        const tierSuffix = tier != null ? ` (${language === "zh" ? TIER_LABELS[tier].zh : TIER_LABELS[tier].en})` : "";
        const ariaLabel = escapeAttr(`${name} ${metricLabel} ${valueLabel}${tierSuffix}`);
        return `${tag} fill="${color}" class="country-path" style="cursor:pointer" tabindex="0" role="button" aria-label="${ariaLabel}"`;
      }
    );
  }, [svgContent, countryMap, cfg, tierColors, noDataColor, noCountryColor, language]);

  // Recompute country path bounding-box centers (SVG user units) after every
  // re-render of the colored markup, for arrow-key nearest-neighbor nav.
  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll("path[id], g[id]");
    const centers = {};
    els.forEach((el) => {
      const id = el.id;
      if (!id || id.startsWith("_") || !countryMap[id]) return;
      try {
        const bbox = el.getBBox();
        centers[id] = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2, el };
      } catch {
        // Element not rendered/measurable — skip it for arrow-key nav.
      }
    });
    centersRef.current = centers;
  }, [coloredSvg, countryMap]);

  const handleMouseMove = (e) => {
    const el = e.target.closest("path[id], g[id]");
    if (!el) { setTooltip(null); return; }
    const id = el.id || el.getAttribute("id");
    if (!id || id.startsWith("_")) { setTooltip(null); return; }
    const country = countryMap[id];
    if (!country) { setTooltip(null); return; }

    const rect = containerRef.current.getBoundingClientRect();
    const val = cfg.getValue(country);
    const tier = cfg.getTier ? cfg.getTier(val) : null;
    const tierText = cfg.getTier
      ? (tier != null ? (language === "zh" ? TIER_LABELS[tier].zh : TIER_LABELS[tier].en) : t("无数据", "No data"))
      : null;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      name: language === "zh" ? country.countryZh : country.countryEn,
      value: cfg.format(val, country),
      tierText,
      metricLabel: language === "zh" ? cfg.zh : cfg.en,
    });
  };

  const openCountry = (id) => {
    const country = countryMap[id];
    if (country && onCountryClick) onCountryClick(country);
  };

  const handleClick = (e) => {
    const el = e.target.closest("path[id], g[id]");
    if (!el) return;
    const id = el.id || el.getAttribute("id");
    if (!id || id.startsWith("_")) return;
    openCountry(id);
  };

  const handleMouseLeave = () => setTooltip(null);

  const ARROW_DIRS = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };

  // Keyboard access for the SVG choropleth: Enter/Space opens the country
  // detail dialog (mirroring click); arrow keys move focus to the nearest
  // country in that general direction, by path bounding-box center — a
  // best-effort jump, not a perfect spatial graph.
  const handleKeyDown = (e) => {
    const el = e.target.closest("path[id], g[id]");
    if (!el) return;
    const id = el.id || el.getAttribute("id");
    if (!id || !countryMap[id]) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCountry(id);
      return;
    }

    const dir = ARROW_DIRS[e.key];
    if (!dir) return;
    e.preventDefault();
    const centers = centersRef.current;
    const cur = centers[id];
    if (!cur) return;
    let best = null;
    let bestScore = Infinity;
    for (const [otherId, c] of Object.entries(centers)) {
      if (otherId === id) continue;
      const dx = c.x - cur.x;
      const dy = c.y - cur.y;
      const dot = dx * dir[0] + dy * dir[1];
      if (dot <= 0) continue; // only consider candidates in the requested direction
      const dist = Math.sqrt(dx * dx + dy * dy);
      const perp = Math.abs(dx * dir[1] - dy * dir[0]);
      const score = dist + perp * 2;
      if (score < bestScore) { bestScore = score; best = c; }
    }
    if (best) best.el.focus();
  };

  // Skeleton while the 200KB SVG is in-flight — prevents layout shift.
  if (loading && !svgContent) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-3 mb-4 border border-transparent dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div
          className="w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg animate-pulse"
          style={{ aspectRatio: "2 / 1" }}
        />
      </div>
    );
  }

  if (!svgContent) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-3 mb-4 border border-transparent dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t("全球地图", "World Map")}
          </h3>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            aria-label={collapsed ? t("展开地图", "Expand map") : t("折叠地图", "Collapse map")}
          >
            {collapsed ? "▼" : "▲"}
          </button>
        </div>
        {!collapsed && (
          <div className="flex gap-1 overflow-x-auto">
            {Object.entries(METRIC_CONFIG).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  metric === key
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {language === "zh" ? c.zh : c.en}
              </button>
            ))}
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
          >
            <div
              className="w-full [&_svg]:w-full [&_svg]:h-auto [&_.country-path:hover]:opacity-75 [&_.country-path]:transition-opacity [&_.country-path]:duration-200 motion-reduce:[&_.country-path]:transition-none [&_.country-path:focus-visible]:outline [&_.country-path:focus-visible]:outline-2 [&_.country-path:focus-visible]:outline-offset-1 [&_.country-path:focus-visible]:outline-blue-600 dark:[&_.country-path:focus-visible]:outline-blue-400"
              dangerouslySetInnerHTML={{ __html: coloredSvg }}
            />

            {tooltip && (
              <div
                className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10"
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y - 40,
                  transform: tooltip.x > (containerRef.current?.clientWidth || 600) * 0.7 ? "translateX(-110%)" : "none",
                }}
              >
                <p className="font-bold">{tooltip.name}</p>
                <p className="text-gray-300">
                  {tooltip.metricLabel}: {tooltip.value}
                  {tooltip.tierText ? ` · ${tooltip.tierText}` : ""}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {tierColors.map((color, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{language === "zh" ? TIER_LABELS[i].zh : TIER_LABELS[i].en}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t("无数据", "No data")}</span>
            </div>
            {cfg.provenance && (
              <DataYearBadge meta={PROVENANCE[cfg.provenance]} language={language} t={t} />
            )}
            {cfg.wbYearField && (
              <YearInconsistencyWarning countries={countries} field={cfg.wbYearField} language={language} t={t} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
