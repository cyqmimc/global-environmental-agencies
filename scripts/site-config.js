// Shared build-time constants — scripts/prerender.js and scripts/generate-api.js
// both need the production URL (canonical links, sitemap, JSON-LD, and the
// API's _meta.project.url all derive from it), so it lives in one place
// instead of two copies that could drift.
//
// TODO: replace with the real production domain before deploying — every
// canonical URL, hreflang tag, sitemap entry, JSON-LD id, and API _meta URL
// is built from this constant. Getting it wrong is worse than leaving it
// out, so it's deliberately an obvious placeholder rather than a guess.
export const BASE_URL = "https://REPLACE_WITH_PRODUCTION_DOMAIN.example";

export const SITE_NAME_ZH = "全球环境治理观察";
export const SITE_NAME_EN = "Global Environmental Governance Tracker";
