export const TREATY_LABELS = {
  "Paris Agreement": "巴黎协定",
  "CBD": "生物多样性公约",
  "CITES": "濒危物种贸易公约",
  "UNFCCC": "联合国气候变化框架公约",
  "UNCCD": "联合国防治荒漠化公约",
  "Montreal Protocol": "蒙特利尔议定书",
  "Basel Convention": "巴塞尔公约",
  "Ramsar Convention": "拉姆萨尔湿地公约",
  "Minamata Convention": "水俣公约",
  "Barcelona Convention": "巴塞罗那公约",
  "OSPAR Convention": "OSPAR海洋保护公约",
  "Alpine Convention": "阿尔卑斯公约",
  "Amazon Cooperation Treaty": "亚马逊合作条约",
  "Antarctic Treaty": "南极条约",
  "HELCOM Convention": "赫尔辛基海洋保护公约",
  "Escazú Agreement": "埃斯卡苏协定",
  "Pacific Islands Forum": "太平洋岛国论坛",
};

export const RESPONSIBILITY_LABELS = {
  climate: { zh: "气候", en: "Climate" },
  water: { zh: "水资源", en: "Water" },
  biodiversity: { zh: "生物多样性", en: "Biodiversity" },
  forest: { zh: "森林", en: "Forest" },
  air: { zh: "空气", en: "Air" },
  waste: { zh: "废弃物", en: "Waste" },
  energy: { zh: "能源", en: "Energy" },
  chemicals: { zh: "化学品", en: "Chemicals" },
  nuclear: { zh: "核安全", en: "Nuclear" },
};

export const NDC_RATING_CONFIG = {
  "1.5C": { zh: "1.5°C 兼容", en: "1.5°C Compatible", color: "bg-green-600", textColor: "text-green-700", barColor: "bg-green-500" },
  "2C": { zh: "2°C 兼容", en: "2°C Compatible", color: "bg-lime-500", textColor: "text-lime-700", barColor: "bg-lime-400" },
  "almost_sufficient": { zh: "接近充分", en: "Almost Sufficient", color: "bg-yellow-500", textColor: "text-yellow-700", barColor: "bg-yellow-400" },
  "insufficient": { zh: "不足", en: "Insufficient", color: "bg-orange-500", textColor: "text-orange-700", barColor: "bg-orange-400" },
  "highly_insufficient": { zh: "严重不足", en: "Highly Insufficient", color: "bg-red-500", textColor: "text-red-700", barColor: "bg-red-400" },
  "critically_insufficient": { zh: "极度不足", en: "Critically Insufficient", color: "bg-red-700", textColor: "text-red-800", barColor: "bg-red-600" },
  "not_assessed": { zh: "未评估", en: "Not Assessed", color: "bg-gray-400", textColor: "text-gray-500", barColor: "bg-gray-300" },
};

// --- URL state helpers ---
export function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    search: p.get("q") || "",
    region: p.get("region") || "",
    tag: p.get("tag") || "",
    sort: p.get("sort") || "none",
    page: parseInt(p.get("page"), 10) || 1,
    lang: p.get("lang") || "zh",
  };
}

export function setUrlParams(params) {
  const p = new URLSearchParams();
  if (params.search) p.set("q", params.search);
  if (params.region) p.set("region", params.region);
  if (params.tag) p.set("tag", params.tag);
  if (params.sort && params.sort !== "none") p.set("sort", params.sort);
  if (params.page > 1) p.set("page", params.page);
  if (params.lang !== "zh") p.set("lang", params.lang);
  const qs = p.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

// --- CSV export ---
export function exportCSV(items, language) {
  const t = (zh, en) => (language === "zh" ? zh : en);
  const header = [
    t("国家", "Country"),
    t("机构名称", "Agency"),
    t("地区", "Region"),
    t("特色领域", "Focus Areas"),
    t("成立年份", "Established"),
    t("森林覆盖率(%)", "Forest Coverage(%)"),
    t("碳排放(Mt)", "Carbon Emission(Mt)"),
    "EPI",
    t("碳中和目标年", "Net Zero Target"),
    t("可再生能源(%)", "Renewable Energy(%)"),
    "PM2.5 (µg/m³)",
    t("人均CO₂(吨)", "CO₂/Capita(t)"),
    t("保护区面积(%)", "Protected Areas(%)"),
    t("人口", "Population"),
    t("GDP (USD)", "GDP (USD)"),
    t("核心法律", "Key Laws"),
    t("国际公约", "Treaties"),
    t("官网", "Website"),
  ];
  const rows = items.map((c) => [
    language === "zh" ? c.countryZh : c.countryEn,
    language === "zh" ? c.agencyZh : c.agencyEn,
    c.region,
    c.responsibilities
      .map((r) => (RESPONSIBILITY_LABELS[r] ? RESPONSIBILITY_LABELS[r][language] : r))
      .join(" / "),
    c.established,
    c.data.forestCoverage,
    c.data.carbonEmission,
    c.epiScore,
    c.netZeroTarget,
    c.wb?.renewableEnergy?.toFixed(1) ?? "",
    c.wb?.pm25?.toFixed(1) ?? "",
    c.wb?.co2PerCapita?.toFixed(2) ?? "",
    c.wb?.protectedAreas?.toFixed(1) ?? "",
    c.wb?.population ?? "",
    c.wb?.gdp ? Math.round(c.wb.gdp) : "",
    (c.keyLaws || []).map((l) => (language === "zh" ? l.nameZh : l.nameEn) + "(" + l.year + ")").join(" / "),
    c.treaties.map((tr) => language === "zh" ? (TREATY_LABELS[tr] || tr) : tr).join(" / "),
    c.website,
  ]);
  const BOM = "\uFEFF";
  const csv =
    BOM +
    [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `environmental-agencies-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
