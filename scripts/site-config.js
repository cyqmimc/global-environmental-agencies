// Shared build-time constants — scripts/prerender.js and scripts/generate-api.js
// both need the production URL (canonical links, sitemap, JSON-LD, and the
// API's _meta.project.url all derive from it), so it lives in one place
// instead of two copies that could drift.
//
export const BASE_URL = "https://global-env-tracker.vercel.app";

export const SITE_NAME_ZH = "全球环境治理观察";
export const SITE_NAME_EN = "Global Environmental Governance Tracker";
