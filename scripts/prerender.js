#!/usr/bin/env node
/**
 * Post-build static prerendering for SEO.
 *
 * The SPA serves every country from one shared URL (`?country=xx`), so
 * search engines have nothing distinct to index per country. This script
 * runs after `vite build` and writes a real static HTML file per country
 * per language:
 *   dist/country/<iso>/index.html      (Chinese, default)
 *   dist/en/country/<iso>/index.html   (English)
 *
 * Each page reuses the actual hashed asset tags from the real build output
 * (dist/index.html) so the same SPA bundle boots and takes over — this is
 * progressive enhancement (identical HTML for every visitor, bot or human),
 * not cloaking. The static body content is wrapped in <noscript> so it's
 * only ever shown to clients that don't run the JS that replaces #root.
 *
 * Run: node scripts/prerender.js   (after `vite build`, see package.json)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { NDC_RATING_CONFIG } from "../src/constants.js";
import { BASE_URL, SITE_NAME_ZH, SITE_NAME_EN } from "./site-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function ndcLabel(rating, lang) {
  if (!rating) return lang === "zh" ? "未评估" : "Not Assessed";
  const cfg = NDC_RATING_CONFIG[rating];
  return cfg ? cfg[lang] : rating;
}

function buildCountryPage(country, wbRow, lang, assetTags) {
  const isZh = lang === "zh";
  const iso = country.isoCode;
  const name = isZh ? country.countryZh : country.countryEn;
  const agency = isZh ? country.agencyZh : country.agencyEn;
  const description = (isZh ? country.descriptionZh : country.descriptionEn) || "";
  const epi = country.epiScore;
  const ndc = ndcLabel(country.parisAgreement?.ndcRating, lang);
  const carbonPrice = country.carbonPricing?.priceUSD;
  const btrSubmitted = country.reportingStatus?.btrSubmitted;
  const forestArea = wbRow?.forestArea;
  const renewableEnergy = wbRow?.renewableEnergy;

  const canonicalPath = isZh ? `/country/${iso}/` : `/en/country/${iso}/`;
  const url = `${BASE_URL}${canonicalPath}`;
  const ogImage = `${BASE_URL}/api/og?country=${iso}`;

  const title = isZh
    ? `${name}环境治理数据 | ${agency} - EPI ${epi ?? "—"} | ${SITE_NAME_ZH}`
    : `${name} Environmental Governance | ${agency} - EPI ${epi ?? "—"} | ${SITE_NAME_EN}`;

  const metaDescription = isZh
    ? `${name}（${agency}）环境数据一览：EPI 环境绩效评分 ${epi ?? "—"}，巴黎协定 NDC 评级「${ndc}」，碳价 ${carbonPrice != null ? `$${carbonPrice}/吨 CO₂` : "无碳定价机制"}，透明度报告（BTR）${btrSubmitted ? "已提交" : "待提交"}。数据来源：世界银行、耶鲁大学 EPI、Climate Action Tracker。`
    : `${name} (${agency}) environmental data at a glance: EPI score ${epi ?? "—"}, Paris Agreement NDC rating "${ndc}", carbon price ${carbonPrice != null ? `$${carbonPrice}/tCO₂` : "no carbon pricing mechanism"}, BTR transparency report ${btrSubmitted ? "submitted" : "pending"}. Sources: World Bank, Yale EPI, Climate Action Tracker.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": title,
    "description": metaDescription,
    "url": url,
    "inLanguage": isZh ? "zh-CN" : "en",
    "creator": {
      "@type": "Organization",
      "name": isZh ? SITE_NAME_ZH : SITE_NAME_EN,
    },
    "variableMeasured": [
      "EPI Score",
      "NDC Rating",
      "Carbon Price",
      "Forest Area (%)",
      "Renewable Energy Share (%)",
      "PM2.5",
      "Protected Areas (%)",
    ],
    "citation": [
      "World Bank Open Data — https://data.worldbank.org/",
      "Yale Environmental Performance Index (EPI) — https://epi.yale.edu/",
      "Climate Action Tracker — https://climateactiontracker.org/",
      "UNFCCC NDC Registry — https://unfccc.int/NDCREG",
    ],
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "about": {
      "@type": "Country",
      "name": country.countryEn,
    },
  };

  const noscriptFacts = `
      <h1>${escapeHtml(name)}${isZh ? "环境治理" : " Environmental Governance"}</h1>
      <p>${escapeHtml(agency)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      <ul>
        <li>EPI ${isZh ? "评分" : "Score"}: ${epi ?? "—"}</li>
        <li>NDC ${isZh ? "评级" : "Rating"}: ${escapeHtml(ndc)}</li>
        <li>${isZh ? "碳价" : "Carbon Price"}: ${carbonPrice != null ? `$${carbonPrice}/${isZh ? "吨" : "t"} CO₂` : (isZh ? "无" : "None")}</li>
        <li>BTR: ${btrSubmitted ? (isZh ? "已提交" : "Submitted") : (isZh ? "待提交" : "Pending")}</li>
        ${forestArea != null ? `<li>${isZh ? "森林覆盖率" : "Forest Area"}: ${forestArea.toFixed(1)}%</li>` : ""}
        ${renewableEnergy != null ? `<li>${isZh ? "可再生能源占比" : "Renewable Energy Share"}: ${renewableEnergy.toFixed(1)}%</li>` : ""}
      </ul>
      <p><a href="${escapeHtml(country.website || "")}">${isZh ? "官方网站" : "Official Website"}</a></p>`;

  return `<!DOCTYPE html>
<html lang="${isZh ? "zh-CN" : "en"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}" />
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hreflang="zh-CN" href="${BASE_URL}/country/${iso}/" />
    <link rel="alternate" hreflang="en" href="${BASE_URL}/en/country/${iso}/" />
    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/country/${iso}/" />

    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(metaDescription)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${isZh ? "zh_CN" : "en_US"}" />
    <meta property="og:locale:alternate" content="${isZh ? "en_US" : "zh_CN"}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
    <meta name="twitter:image" content="${ogImage}" />

    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#15803d" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

    ${assetTags}
  </head>
  <body>
    <div id="root"></div>
    <noscript>
      <div style="max-width:720px;margin:2rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;line-height:1.6;">${noscriptFacts}
      </div>
    </noscript>
  </body>
</html>
`;
}

function writeSitemap(countryEntries) {
  const homepageEntries = [
    {
      loc: `${BASE_URL}/`,
      alt: [
        { hreflang: "zh-CN", href: `${BASE_URL}/` },
        { hreflang: "x-default", href: `${BASE_URL}/` },
      ],
    },
  ];
  const all = [...homepageEntries, ...countryEntries];
  const urlXml = all
    .map(
      (e) => `  <url>
    <loc>${e.loc}</loc>
${e.alt.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`).join("\n")}
  </url>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlXml}
</urlset>
`;
  writeFileSync(join(DIST, "sitemap.xml"), xml, "utf8");
}

function writeRobots() {
  const txt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  writeFileSync(join(DIST, "robots.txt"), txt, "utf8");
}

/**
 * index.html can't contain bare href="/" <link> tags itself — Vite's build
 * treats <link href="..."> as a local asset reference and throws EISDIR
 * trying to read the project root as a file. So canonical/hreflang are
 * injected here, into the already-built dist/index.html, instead; og:url
 * and the JSON-LD "url" (safe in source since they're not href attributes)
 * are just patched from relative to absolute.
 */
function patchHomepage(shellPath, shellHtml) {
  const seoLinks = `    <link rel="canonical" href="${BASE_URL}/" />
    <link rel="alternate" hreflang="zh-CN" href="${BASE_URL}/" />
    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />
  </head>`;
  const patched = shellHtml
    .replace("</head>", seoLinks)
    .replace('<meta property="og:url" content="/" />', `<meta property="og:url" content="${BASE_URL}/" />`)
    .replace('<meta property="og:image" content="/api/og" />', `<meta property="og:image" content="${BASE_URL}/api/og" />`)
    .replace('"url": "/"', `"url": "${BASE_URL}/"`);
  writeFileSync(shellPath, patched, "utf8");
}

function main() {
  const shellPath = join(DIST, "index.html");
  if (!existsSync(shellPath)) {
    console.error("✗ dist/index.html not found — run `npm run build` first.");
    process.exit(1);
  }
  const shellHtml = readFileSync(shellPath, "utf8");

  // Pull out the actual hashed <script type="module">, <link rel="modulepreload">,
  // and <link rel="stylesheet"> tags Vite injected into the real build. These
  // hashes change every build, so they must come from the build output itself,
  // never be hand-written here.
  const assetMatch = shellHtml.match(/<script type="module"[\s\S]*?(?=<\/head>)/);
  if (!assetMatch) {
    console.error("✗ Could not find asset <script> tags in dist/index.html.");
    process.exit(1);
  }
  const assetTags = assetMatch[0].trim();

  const countries = readJson(join(ROOT, "public", "countries.json"));
  const wb = readJson(join(ROOT, "public", "wb-latest.json"));

  let written = 0;
  const sitemapEntries = [];

  for (const country of countries) {
    const iso = country.isoCode;
    if (!iso) continue;
    for (const lang of ["zh", "en"]) {
      const html = buildCountryPage(country, wb.countries?.[iso], lang, assetTags);
      const outDir = lang === "zh"
        ? join(DIST, "country", iso)
        : join(DIST, "en", "country", iso);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "index.html"), html, "utf8");
      written++;
    }
    sitemapEntries.push({
      loc: `${BASE_URL}/country/${iso}/`,
      alt: [
        { hreflang: "zh-CN", href: `${BASE_URL}/country/${iso}/` },
        { hreflang: "en", href: `${BASE_URL}/en/country/${iso}/` },
        { hreflang: "x-default", href: `${BASE_URL}/country/${iso}/` },
      ],
    });
  }

  patchHomepage(shellPath, shellHtml);
  writeSitemap(sitemapEntries);
  writeRobots();

  console.log(`✓ Prerendered ${written} country pages (${countries.length} countries × 2 languages) to dist/`);
  console.log(`✓ Wrote dist/sitemap.xml (${sitemapEntries.length + 1} URLs) and dist/robots.txt`);
  if (BASE_URL.includes("REPLACE_WITH_PRODUCTION_DOMAIN")) {
    console.warn(`\n⚠ BASE_URL in scripts/prerender.js is still a placeholder (${BASE_URL}).`);
    console.warn(`  Canonical URLs, hreflang tags, sitemap.xml, and JSON-LD all reference it —`);
    console.warn(`  update the constant before deploying to production.`);
  }
}

main();
