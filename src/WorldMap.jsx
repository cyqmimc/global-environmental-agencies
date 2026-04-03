import { useState, useEffect, useRef } from "react";

const METRIC_CONFIG = {
  epiScore: {
    zh: "EPI 评分",
    en: "EPI Score",
    getValue: (c) => c.epiScore,
    getColor: (v) =>
      v >= 60 ? "#16a34a" : v >= 45 ? "#65a30d" : v >= 30 ? "#eab308" : v >= 15 ? "#f97316" : "#dc2626",
    format: (v) => v?.toFixed(0),
  },
  ndcRating: {
    zh: "NDC 评级",
    en: "NDC Rating",
    getValue: (c) => {
      const r = c.parisAgreement?.ndcRating;
      return r === "1.5C" ? 100 : r === "2C" ? 80 : r === "almost_sufficient" ? 60 : r === "insufficient" ? 40 : r === "highly_insufficient" ? 20 : r === "critically_insufficient" ? 10 : 0;
    },
    getColor: (v) =>
      v >= 90 ? "#16a34a" : v >= 70 ? "#65a30d" : v >= 50 ? "#eab308" : v >= 30 ? "#f97316" : v >= 15 ? "#dc2626" : "#991b1b",
    format: (v, c) => {
      const labels = { "1.5C": "1.5°C", "2C": "2°C", almost_sufficient: "Almost", insufficient: "Insuff.", highly_insufficient: "Highly Insuff.", critically_insufficient: "Critical", not_assessed: "N/A" };
      return labels[c?.parisAgreement?.ndcRating] || "—";
    },
  },
  carbonPrice: {
    zh: "碳价 ($/t)",
    en: "Carbon Price ($/t)",
    getValue: (c) => c.carbonPricing?.priceUSD,
    getColor: (v) =>
      v == null ? "#d1d5db" : v >= 80 ? "#16a34a" : v >= 40 ? "#65a30d" : v >= 15 ? "#eab308" : v >= 1 ? "#f97316" : "#d1d5db",
    format: (v) => (v != null ? `$${v}` : "—"),
  },
  renewableEnergy: {
    zh: "可再生能源 %",
    en: "Renewable Energy %",
    getValue: (c) => c.wb?.renewableEnergy,
    getColor: (v) =>
      v == null ? "#d1d5db" : v >= 40 ? "#16a34a" : v >= 25 ? "#65a30d" : v >= 15 ? "#eab308" : v >= 5 ? "#f97316" : "#dc2626",
    format: (v) => (v != null ? `${v.toFixed(0)}%` : "—"),
  },
  pm25: {
    zh: "空气质量 PM2.5",
    en: "Air Quality PM2.5",
    getValue: (c) => c.wb?.pm25,
    getColor: (v) =>
      v == null ? "#d1d5db" : v <= 10 ? "#16a34a" : v <= 15 ? "#65a30d" : v <= 25 ? "#eab308" : v <= 35 ? "#f97316" : "#dc2626",
    format: (v) => (v != null ? `${v.toFixed(1)} µg/m³` : "—"),
  },
  protectedAreas: {
    zh: "自然保护区 %",
    en: "Protected Areas %",
    getValue: (c) => c.wb?.protectedAreas,
    getColor: (v) =>
      v == null ? "#d1d5db" : v >= 30 ? "#16a34a" : v >= 20 ? "#65a30d" : v >= 10 ? "#eab308" : v >= 5 ? "#f97316" : "#dc2626",
    format: (v) => (v != null ? `${v.toFixed(1)}%` : "—"),
  },
};

const LEGEND_STOPS = [
  { color: "#16a34a", label: { zh: "优", en: "Good" } },
  { color: "#65a30d", label: { zh: "良", en: "Fair" } },
  { color: "#eab308", label: { zh: "中", en: "Moderate" } },
  { color: "#f97316", label: { zh: "差", en: "Poor" } },
  { color: "#dc2626", label: { zh: "劣", en: "Bad" } },
];

export default function WorldMap({ countries, language, onCountryClick }) {
  const [svgContent, setSvgContent] = useState("");
  const [metric, setMetric] = useState("epiScore");
  const [tooltip, setTooltip] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef(null);

  const t = (zh, en) => (language === "zh" ? zh : en);
  const cfg = METRIC_CONFIG[metric];

  useEffect(() => {
    fetch("/world-map.svg")
      .then((r) => r.text())
      .then((text) => setSvgContent(text))
      .catch(() => {});
  }, []);

  // Build country lookup by isoCode
  const countryMap = {};
  countries.forEach((c) => {
    if (c.isoCode) countryMap[c.isoCode] = c;
  });

  const handleMouseMove = (e) => {
    const el = e.target.closest("path[id], g[id]");
    if (!el) { setTooltip(null); return; }
    const id = el.id || el.getAttribute("id");
    if (!id || id.startsWith("_")) { setTooltip(null); return; }
    const country = countryMap[id];
    if (!country) { setTooltip(null); return; }

    const rect = containerRef.current.getBoundingClientRect();
    const val = cfg.getValue(country);
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      name: language === "zh" ? country.countryZh : country.countryEn,
      value: cfg.format(val, country),
      metricLabel: language === "zh" ? cfg.zh : cfg.en,
    });
  };

  const handleClick = (e) => {
    const el = e.target.closest("path[id], g[id]");
    if (!el) return;
    const id = el.id || el.getAttribute("id");
    if (!id || id.startsWith("_")) return;
    const country = countryMap[id];
    if (country && onCountryClick) onCountryClick(country);
  };

  const handleMouseLeave = () => setTooltip(null);

  // Inject colors into SVG
  const coloredSvg = svgContent.replace(
    /(<(?:path|g)\s+id="([a-z]{2})")/g,
    (match, tag, id) => {
      const country = countryMap[id];
      if (!country) return `${tag} fill="#e5e7eb" opacity="0.5"`;
      const val = cfg.getValue(country);
      const color = cfg.getColor(val);
      return `${tag} fill="${color}" class="country-path" style="cursor:pointer;transition:opacity 0.2s"`;
    }
  );

  if (!svgContent) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
      {/* Header with metric selector + collapse toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            {t("全球地图", "World Map")}
          </h3>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
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
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {language === "zh" ? c.zh : c.en}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map - collapsible, max height limited */}
      {!collapsed && (
        <>
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="w-full [&_svg]:w-full [&_svg]:h-auto [&_.country-path:hover]:opacity-75"
              dangerouslySetInnerHTML={{ __html: coloredSvg }}
            />

        {/* Tooltip */}
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
            <p className="text-gray-300">{tooltip.metricLabel}: {tooltip.value}</p>
          </div>
        )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {LEGEND_STOPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-500">{language === "zh" ? s.label.zh : s.label.en}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-200" />
              <span className="text-xs text-gray-500">{t("无数据", "No data")}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
