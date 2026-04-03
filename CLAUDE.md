# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally
- `npm run fetch-data` — fetch latest World Bank data + historical time series → `public/wb-data.json` (recommend quarterly; preserves IQAir PM2.5 overrides)
- `npm run split-data` — re-split `countries.json` → `countries-core.json` + `countries-detail.json` (must run after editing countries.json)
- `npm run update-all` — run fetch-data + split-data + check-updates in sequence (recommended for routine updates)
- `npm run check-updates` — scan all data sources, report what may need updating

No test runner or linter is configured. See `DATA-MAINTENANCE.md` for data update sources and procedures.

## Architecture

Single-page React app: 80 countries, environmental agencies, World Bank data, treaty compliance tracking. Built with Vite 8 + React 18 + Tailwind CSS v4. Zero external chart libraries — all charts are hand-drawn SVG components (`src/components/charts/`): BarChart, RadarChart, ScatterChart, TrendLineChart.

**Key design decisions:**
- All heavy components (DetailDialog, CompareDialog, ClimateEquityView, AboutPage, RankingsView) use `React.lazy` + `Suspense` for code splitting
- State logic is extracted into `src/hooks/useCountryData.js` (data fetching, merge, lazy detail loading) and `src/hooks/useFilters.js` (search with debounce, filters, sorting, pagination)
- `src/constants.js` contains shared label maps and helpers used across many components: `TREATY_LABELS`, `RESPONSIBILITY_LABELS`, `NDC_RATING_CONFIG`, URL state sync, CSV export

**Two-tier data loading:**
1. Initial load fetches `countries-core.json` (53KB, slim fields for cards/filters/map) + `wb-data.json` (~240KB, latest values + historical time series for 4 indicators) in parallel, merges by `isoCode` into `country.wb` namespace (including `wb.history`)
2. When a detail dialog opens, `countries-detail.json` (137KB, descriptions/treaties/laws/full treaty objects, keyed by isoCode) is fetched once and cached in memory
3. `countries.json` (228KB) is the source of truth — the split files are generated from it via `scripts/split-countries.js`
4. `wb-data.json` stores per-country `history` with yearly data for `forestArea`, `co2Mt`, `renewableEnergy`, `pm25` (2015-2023), used by TrendLineChart in DetailDialog

**WorldMap SVG coloring:** `src/WorldMap.jsx` injects `fill` colors into the raw SVG via regex matching `<path id="xx">` or `<g id="xx">` where `xx` is a 2-letter ISO code. 6 switchable map indicators: EPI Score, NDC Rating, Carbon Price, Renewable Energy, Air Quality (PM2.5), Protected Areas. **Critical:** if compressing `world-map.svg` with SVGO, you must disable `cleanupIds` or the map will render all black.

**URL deep linking:** `?country=xx` (2-letter ISO) opens the country detail dialog directly. All URL params (`q`, `region`, `tag`, `sort`, `page`, `lang`, `country`) are synced bidirectionally via `constants.js` helpers.

**Composite scoring** (in RankingsView, reused by Scorecard): EPI 25% + Renewable Energy 20% + Forest 15% + Protected Areas 15% + Air Quality 15% + CO₂ Efficiency 10%. Normalized 0-100, null values treated as 0. Scorecard grades (A+ to F) computed by percentile ranking within the 80-country dataset.

**i18n:** `t(zh, en)` helper throughout. Label maps: `TREATY_LABELS` (18), `RESPONSIBILITY_LABELS` (9), `NDC_RATING_CONFIG` (7 levels). All user-facing text must support both languages.

**View modes:** Cards (paginated grid, 12/page) | Rankings (sortable leaderboard) | Climate Equity (scatter plot). **Dual-row filters:** compliance status (NDC/carbon price/BTR/Kigali/30×30) + responsibility tags, stackable.
