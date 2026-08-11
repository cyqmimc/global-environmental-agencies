# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally
- `npm run fetch-data` — fetch latest World Bank data → `public/wb-latest.json` (current values + dataYear) and `public/wb-history.json` (2015+ time series for 4 trend-chart indicators) (recommend quarterly; preserves IQAir PM2.5 overrides)
- `npm run split-data` — re-split `countries.json` → `countries-core.json` + `countries-detail.json` (must run after editing countries.json)
- `npm run update-all` — run fetch-data + split-data + check-updates in sequence (recommended for routine updates)
- `npm run check-updates` — scan all data sources, report what may need updating
- `npm run audit-drift` — compare deprecated `legacyData` numbers against authoritative `wb-latest.json` values, exits non-zero if any country drifts beyond threshold

No test runner or linter is configured. See `DATA-MAINTENANCE.md` for data update sources and procedures.

## Architecture

Single-page React app: 80 countries, environmental agencies, World Bank data, treaty compliance tracking. Built with Vite 8 + React 18 + Tailwind CSS v4. Zero external chart libraries — all charts are hand-drawn SVG components (`src/components/charts/`): BarChart, RadarChart, ScatterChart, TrendLineChart.

**Key design decisions:**
- All heavy components (DetailDialog, CompareDialog, ClimateEquityView, AboutPage, RankingsView) use `React.lazy` + `Suspense` for code splitting
- State logic is extracted into `src/hooks/useCountryData.js` (data fetching, merge, lazy detail loading) and `src/hooks/useFilters.js` (search with debounce, filters, sorting, pagination)
- `src/constants.js` contains shared label maps and helpers used across many components: `TREATY_LABELS`, `RESPONSIBILITY_LABELS`, `NDC_RATING_CONFIG`, URL state sync, CSV export

**Two-tier data loading:**
1. Initial load fetches `countries-core.json` (slim fields for cards/filters/map) + `wb-latest.json` (current values + `dataYear` only, ~35KB — no time series) in parallel, merges by `isoCode` into `country.wb` namespace
2. On idle (`requestIdleCallback`, or immediately if a detail dialog opens first), `countries-detail.json` (descriptions/treaties/laws/full treaty objects) and `wb-history.json` (2015+ time series for `forestArea`, `co2Mt`, `renewableEnergy`, `pm25`) are fetched together and merged in — `wb-history.json` alone is ~190KB and is only used by TrendLineChart in DetailDialog and the CO₂ Sparkline on cards, so it never blocks first paint. `src/hooks/useCountryData.js` exposes `historyLoaded`; `CountryCard` shows a fixed-size skeleton in the Sparkline's place until then to avoid layout shift
3. `countries.json` is the source of truth — the split files are generated from it via `scripts/split-countries.js`
4. All first-screen and idle-prefetch fetches go through `src/utils/fetchWithRetry.js` (`fetchJson`/`fetchText`): an 8s `AbortController` timeout plus one retry, so a slow/hung response doesn't stall the app indefinitely

**Single source of truth for forest/carbon numbers:** all display, sorting (`forestAsc`/`forestDesc`/`carbonAsc`/`carbonDesc` in `useFilters.js`), CSV export, and averaging read `wb.forestArea` / `wb.co2Mt` (World Bank, authoritative). `countries.json` still carries a `legacyData: {forestCoverage, carbonEmission, _deprecated: true}` field per country — these were hand-typed placeholder numbers that drifted from the WB values by >5% for 71/80 countries and are kept only for historical reference and the `scripts/audit-data-drift.js` / `validate-schema.js` drift checks. Never read `legacyData` in UI code.

**`treaties[]` and `responsibilities[]` are non-exhaustive samples, not facts:** every country has exactly 2-4 hand-picked `treaties[]` entries and exactly 2 `responsibilities[]` tags — these are editor-picked examples (e.g. Montreal Protocol is near-universally ratified but only tagged on 8 countries), not a complete ratification record or full agency mandate. UI labels both "(节选)/(selected)" with an ⓘ tooltip explaining that absence ≠ non-membership; `AboutPage.jsx`'s methodology section has the full caveat. The structured replacement for treaty facts is `treatyRatification` (see `src/types.js`): a per-treaty `{status, date, source}` record seeded from `scripts/data/treaty-ratification.json` via `scripts/merge-treaty-ratification.js` (idempotent, run after editing that JSON). Only Paris Agreement / Montreal Protocol / CBD / UNCCD are backfilled so far (from existing structured blocks with real dates); everything else — including all of UNFCCC/CITES/Basel/Ramsar/Minamata and most of Kigali — is intentionally `"unknown"` pending manual research. `validate-schema.js` enforces `status ∈ {ratified, acceded, signed, not_party, unknown}` and requires `date` + `source` URL whenever `status` is `ratified`/`acceded`. Never fabricate a ratification date to satisfy this — leave it `"unknown"`.

**WorldMap SVG coloring:** `src/WorldMap.jsx` injects `fill` colors into the raw SVG via regex matching `<path id="xx">` or `<g id="xx">` where `xx` is a 2-letter ISO code. 6 switchable map indicators: EPI Score, NDC Rating, Carbon Price, Renewable Energy, Air Quality (PM2.5), Protected Areas. **Critical:** if compressing `world-map.svg` with SVGO, you must disable `cleanupIds` or the map will render all black.

**URL deep linking:** `?country=xx` (2-letter ISO) opens the country detail dialog directly. All URL params (`q`, `region`, `tag`, `sort`, `page`, `lang`, `country`) are synced bidirectionally via `constants.js` helpers.

**Scoring** (`src/utils/score.js`, reused by RankingsView/Scorecard/PDF exports): two independent 0-100 indices instead of one blended composite — **State** (endowment: forest, protected areas, air quality, EPI) and **Governance** (performance: NDC rating, carbon pricing×coverage, BTR, Kigali, NDC 3.0, LDN, renewable share, carbon intensity). Merging them back into one number would recreate the exact bias the split exists to avoid (forest-rich countries scoring high regardless of policy). Each dimension is normalized via winsorized (5th/95th pct) min-max scaling relative to the full 80-country set (never the currently-filtered subset); missing values exclude that dimension and renormalize remaining weights rather than scoring as 0; an index needs ≥4 valid dimensions or returns `null` ("insufficient data"). Weights are user-adjustable in RankingsView (12 sliders, auto-renormalized) and persisted to a shareable `?w=` URL param via `encodeWeights`/`decodeWeights`. Scorecard grades (A+ to F) are computed by percentile ranking within the 80-country dataset, independently per index.

**i18n:** `t(zh, en)` helper throughout. Label maps: `TREATY_LABELS` (18), `RESPONSIBILITY_LABELS` (9), `NDC_RATING_CONFIG` (7 levels). All user-facing text must support both languages.

**View modes:** Cards (paginated grid, 12/page) | Rankings (sortable leaderboard) | Climate Equity (scatter plot). **Dual-row filters:** compliance status (NDC/carbon price/BTR/Kigali/30×30) + responsibility tags, stackable.
