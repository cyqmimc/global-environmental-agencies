# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally

No test runner or linter is configured.

## Architecture

Single-page React app displaying global environmental agencies with country-level environmental data. Built with Vite + React 18 + Tailwind CSS v4 + Chart.js.

**Key files:**
- `src/App.jsx` — entire application in one component: search/filter/sort controls, card grid, pagination, detail dialog with bar chart
- `public/countries.json` — static data source for all countries (fetched at runtime via `fetch`)
- `src/index.css` — Tailwind v4 entry (`@import "tailwindcss"`)
- `vite.config.js` — Vite config with `@tailwindcss/vite` plugin

**Data shape** (countries.json): each entry has `countryEn`, `countryZh`, `agencyEn`, `agencyZh`, `descriptionEn`, `descriptionZh`, `website`, `flagUrl`, `region`, and `data: { forestCoverage, carbonEmission }`.

**i18n:** inline `t(zh, en)` helper toggled by a `language` state (`"zh"` | `"en"`). No i18n library.

**Styling:** Tailwind CSS v4 utility classes applied directly in JSX. No custom CSS, no component library.
