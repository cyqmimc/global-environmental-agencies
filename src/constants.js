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

/**
 * Provenance metadata for indicators that don't come from wb-latest.json (which
 * already carries its own per-country `dataYear`). Each entry was imported in
 * a single batch — see DATA-MAINTENANCE.md's "上次更新记录" table and
 * scripts/add-climate-equity.py's header comment — so year/source/retrievedAt
 * are the same for every country; only the value itself (read live off the
 * country object) varies. Consumed by <DataYearBadge>.
 *
 * @type {Object<string, import('./types').Provenance>}
 */
export const PROVENANCE = {
  epiScore: {
    unit: "score (0-100)",
    year: 2024,
    source: "Yale Environmental Performance Index (EPI)",
    sourceUrl: "https://epi.yale.edu/",
    method: { zh: "2024 版 EPI，手动录入", en: "2024 EPI edition, hand-entered" },
    retrievedAt: "2026-04-01",
  },
  climateEquityVulnerability: {
    unit: "index (0-1, higher = more vulnerable)",
    year: 2022,
    source: "ND-GAIN Country Index",
    sourceUrl: "https://gain.nd.edu/our-work/country-index/",
    method: { zh: "ND-GAIN 脆弱性子指数，2022 版", en: "ND-GAIN vulnerability sub-index, 2022 edition" },
    retrievedAt: "2026-04-02",
  },
  climateEquityCumulativeCO2: {
    unit: "Gt CO₂ (cumulative, 1850–2022)",
    year: 2022,
    source: "Global Carbon Project / Our World in Data",
    sourceUrl: "https://ourworldindata.org/co2-emissions",
    method: { zh: "累计 CO₂ 排放，1850–2022", en: "Cumulative CO₂ emissions, 1850–2022" },
    retrievedAt: "2026-04-02",
  },
  carbonPricingPriceUSD: {
    unit: "USD / tCO₂e",
    year: 2025,
    source: "World Bank Carbon Pricing Dashboard",
    sourceUrl: "https://carbonpricingdashboard.worldbank.org/",
    method: { zh: "各国/地区碳定价机制价格快照，参照 ICAP ETS Map 核对", en: "National/subnational carbon price snapshot, cross-checked against ICAP ETS Map" },
    retrievedAt: "2026-04-03",
  },
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
// Matches the prerendered SEO page paths: /country/xx/ (zh, default) and
// /en/country/xx/ (en) — see scripts/prerender.js. Trailing slash optional
// since both the prerendered files and client-side navigation may omit it.
const COUNTRY_PATH_RE = /^\/(en\/)?country\/([a-z]{2})\/?$/i;

export function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(COUNTRY_PATH_RE);
  const pathLang = pathMatch ? (pathMatch[1] ? "en" : "zh") : null;
  const pathCountry = pathMatch ? pathMatch[2].toLowerCase() : null;
  return {
    search: p.get("q") || "",
    region: p.get("region") || "",
    tag: p.get("tag") || "",
    compliance: p.get("comp") || "",
    sort: p.get("sort") || "none",
    page: parseInt(p.get("page"), 10) || 1,
    lang: pathLang || p.get("lang") || "zh",
    country: pathCountry || p.get("country") || "",
    favOnly: p.get("favOnly") === "1",
    view: p.get("view") || "cards",
    w: p.get("w") || "",
  };
}

export function setUrlParams(params) {
  const p = new URLSearchParams();
  if (params.search) p.set("q", params.search);
  if (params.region) p.set("region", params.region);
  if (params.tag) p.set("tag", params.tag);
  if (params.compliance) p.set("comp", params.compliance);
  if (params.sort && params.sort !== "none") p.set("sort", params.sort);
  if (params.page > 1) p.set("page", params.page);
  if (params.favOnly) p.set("favOnly", "1");
  if (params.view && params.view !== "cards") p.set("view", params.view);
  if (params.w) p.set("w", params.w);

  // A country is open: use the canonical /country/xx or /en/country/xx path
  // (matches the prerendered pages + sitemap) instead of a query param, and
  // fold language into the path rather than a separate ?lang=.
  // No country open: fall back to the existing / (+ ?lang=en) scheme.
  let pathname;
  if (params.country) {
    pathname = params.lang === "en" ? `/en/country/${params.country}/` : `/country/${params.country}/`;
  } else {
    pathname = "/";
    if (params.lang && params.lang !== "zh") p.set("lang", params.lang);
  }

  const qs = p.toString();
  const url = qs ? `${pathname}?${qs}` : pathname;
  window.history.replaceState(null, "", url);
}

/** Count of currently-applied user filters (search, region, tag, compliance, favOnly). */
export function activeFilterCount({ search, region, tag, compliance, favOnly }) {
  let n = 0;
  if (search) n++;
  if (region) n++;
  if (tag) n++;
  if (compliance) n++;
  if (favOnly) n++;
  return n;
}

/**
 * The <iframe> + resize-listener snippet for embedding a country's
 * read-only card (see src/components/EmbedCountryCard.jsx) on a third-party
 * page. The listener script is what makes the iframe auto-height: the embed
 * page posts { type: "gegt:embed-resize", iso, height } on every content
 * size change, and this snippet resizes the specific iframe it belongs to
 * (matched by id, so multiple embeds on one host page don't clobber
 * each other).
 */
export function embedCodeForCountry(isoCode, language, theme = "light") {
  const src = `${window.location.origin}/embed/country/${isoCode}?lang=${language}&theme=${theme}`;
  const id = `gegt-embed-${isoCode}`;
  return `<iframe src="${src}" id="${id}" title="Environmental data — ${isoCode.toUpperCase()}" style="width:100%;max-width:420px;border:0;display:block;" height="220" loading="lazy"></iframe>
<script>window.addEventListener("message",function(e){if(e.data&&e.data.type==="gegt:embed-resize"&&e.data.iso==="${isoCode}"){var el=document.getElementById("${id}");if(el)el.style.height=e.data.height+"px";}});</script>`;
}

/** Copy the embed <iframe> snippet to the clipboard. Returns a Promise<boolean>. */
export function copyEmbedCode(isoCode, language, theme = "light") {
  const code = embedCodeForCountry(isoCode, language, theme);
  if (!navigator.clipboard?.writeText) return Promise.resolve(false);
  return navigator.clipboard
    .writeText(code)
    .then(() => true)
    .catch(() => false);
}

/** Copy a deep link to the clipboard. Returns a Promise<boolean>. */
export function shareCountryLink(isoCode, language) {
  const url = new URL(window.location.origin);
  // Canonical path form — matches the prerendered SEO page for this country,
  // so a shared link resolves to the same URL search engines index.
  url.pathname = isoCode
    ? language === "en" ? `/en/country/${isoCode}/` : `/country/${isoCode}/`
    : "/";
  // navigator.clipboard is undefined in insecure contexts (http://, some iframes).
  // Guard explicitly — without this, accessing .writeText throws synchronously
  // before any .catch() can run.
  if (!navigator.clipboard?.writeText) return Promise.resolve(false);
  return navigator.clipboard
    .writeText(url.toString())
    .then(() => true)
    .catch(() => false);
}

/** CSV-safe quoting that doubles internal quotes. */
export function csvQuote(v) {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// --- CSV export ---
export function exportCSV(items, language, filename) {
  const t = (zh, en) => (language === "zh" ? zh : en);
  const header = [
    t("国家", "Country"),
    t("机构名称", "Agency"),
    t("地区", "Region"),
    t("主要职能(节选)", "Focus Areas (selected)"),
    t("成立年份", "Established"),
    t("森林覆盖率(%)", "Forest Coverage(%)"),
    t("森林数据年份", "Forest Data Year"),
    t("碳排放(Mt)", "Carbon Emission(Mt)"),
    t("碳排放数据年份", "Carbon Data Year"),
    "EPI",
    t("EPI数据年份", "EPI Data Year"),
    t("碳中和目标年", "Net Zero Target"),
    t("可再生能源(%)", "Renewable Energy(%)"),
    t("可再生能源数据年份", "Renewable Energy Data Year"),
    "PM2.5 (µg/m³)",
    t("PM2.5数据年份", "PM2.5 Data Year"),
    t("人均CO₂(吨)", "CO₂/Capita(t)"),
    t("CO₂数据年份", "CO₂ Data Year"),
    t("保护区面积(%)", "Protected Areas(%)"),
    t("保护区数据年份", "Protected Areas Data Year"),
    t("人口", "Population"),
    "GDP (USD)",
    t("人均GDP(USD)", "GDP/Capita(USD)"),
    t("碳强度(kg/USD)", "C.Intensity(kg/USD)"),
    t("NDC评级", "NDC Rating"),
    t("碳价(USD/t)", "Carbon Price(USD/t)"),
    t("碳价数据年份", "Carbon Price Data Year"),
    t("核心法律", "Key Laws"),
    t("重点公约(节选)", "Selected Treaties"),
    t("官网", "Website"),
  ];
  const rows = items.map((c) => {
    const pop = c.wb?.population;
    const gdp = c.wb?.gdp;
    const gdpPerCap = pop > 0 && gdp != null ? gdp / pop : null;
    const intensity = c.wb?.co2Mt != null && gdp > 0 ? (c.wb.co2Mt * 1e9) / gdp : null;
    return [
      language === "zh" ? c.countryZh : c.countryEn,
      language === "zh" ? c.agencyZh : c.agencyEn,
      c.region,
      c.responsibilities
        .map((r) => (RESPONSIBILITY_LABELS[r] ? RESPONSIBILITY_LABELS[r][language] : r))
        .join(" / "),
      c.established,
      c.wb?.forestArea?.toFixed(1) ?? "",
      c.wb?.dataYear?.forestArea ?? "",
      c.wb?.co2Mt?.toFixed(1) ?? "",
      c.wb?.dataYear?.co2Mt ?? "",
      c.epiScore,
      c.epiScore != null ? PROVENANCE.epiScore.year : "",
      c.netZeroTarget,
      c.wb?.renewableEnergy?.toFixed(1) ?? "",
      c.wb?.dataYear?.renewableEnergy ?? "",
      c.wb?.pm25?.toFixed(1) ?? "",
      c.wb?.dataYear?.pm25 ?? "",
      c.wb?.co2PerCapita?.toFixed(2) ?? "",
      c.wb?.dataYear?.co2Mt ?? "",
      c.wb?.protectedAreas?.toFixed(1) ?? "",
      c.wb?.dataYear?.protectedAreas ?? "",
      pop ?? "",
      gdp != null ? gdp.toFixed(0) : "",
      gdpPerCap != null ? gdpPerCap.toFixed(0) : "",
      intensity != null ? intensity.toFixed(4) : "",
      c.parisAgreement?.ndcRating ?? "",
      c.carbonPricing?.priceUSD ?? "",
      c.carbonPricing?.priceUSD != null ? PROVENANCE.carbonPricingPriceUSD.year : "",
      (c.keyLaws || []).map((l) => (language === "zh" ? l.nameZh : l.nameEn) + "(" + l.year + ")").join(" / "),
      c.treaties ? c.treaties.map((tr) => language === "zh" ? (TREATY_LABELS[tr] || tr) : tr).join(" / ") : "",
      c.website,
    ];
  });
  const BOM = "﻿";
  const csv =
    BOM +
    [header, ...rows].map((r) => r.map(csvQuote).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename || `environmental-agencies-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
