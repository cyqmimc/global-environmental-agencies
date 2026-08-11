# Contributing

This project tracks environmental agencies, data and treaty compliance for 80
countries. Most contributions are either code (see `CLAUDE.md` for
architecture) or **data** — this file is mainly about the latter: how the
per-country data is organized, how to add or edit a country, and what's
required before a data PR gets merged.

## Data architecture: one file per country

`data/countries/<iso>.json` (80 files, e.g. `data/countries/us.json`) is the
**source of truth** for country data. `public/countries.json` — and
`public/countries-core.json` / `public/countries-detail.json` — are
**generated files**, built from `data/countries/*.json`:

```
data/countries/<iso>.json  (80 files, hand-edited)
    └── scripts/build-countries.js ──→ public/countries.json
                                          └── scripts/split-countries.js ──→ public/countries-core.json
                                                                          └─→ public/countries-detail.json
```

**Never hand-edit `public/countries.json`, `public/countries-core.json`, or
`public/countries-detail.json`.** Edit the per-country file in
`data/countries/` and rebuild. CI independently rebuilds everything from
`data/countries/*.json` and fails the build if the committed `public/*.json`
files don't match byte-for-byte (`npm run verify-data`,
`scripts/verify-generated-data.js`) — so a hand-edit to a generated file will
be caught, not silently merged.

Why one file per country instead of the old single 300KB
`countries.json`: two people editing different countries no longer conflict
in git, and a PR that changes one country's data has a diff you can actually
read, instead of a multi-hundred-KB blob.

`public/countries.json` itself is still a real, committed file — it's not
gitignored, because Vercel's static deployment serves it directly and there's
no build step in production that could generate it on the fly. What changed
is *how* it's produced, not whether it's checked in.

## Workflow: adding or editing a country

1. **Adding a new country**: create `data/countries/<iso>.json` (2-letter
   lowercase ISO 3166-1 alpha-2 code, matching `flagUrl`'s `flagcdn.com/<iso>.svg`
   convention) with the fields below. Easiest to start from an existing file
   with a similar profile and replace values field by field — don't leave
   fields copy-pasted from the template country.
2. **Editing an existing country**: edit `data/countries/<iso>.json` directly.
3. Run `npm run build-data` (= `build-countries.js` then `split-countries.js`)
   to regenerate `public/countries.json` + the core/detail split.
4. Run `npm run validate` to check the schema (required fields, valid enum
   values, date formats, source-URL requirements — see below).
5. Commit **both** the `data/countries/<iso>.json` change and the regenerated
   `public/*.json` files together, in the same commit.
6. **Before opening the PR** (see "Pre-commit checklist" below).

### Pre-commit checklist (no git hook installed — do this yourself)

This repo does not install a pre-commit hook (no husky, nothing runs
automatically). Before committing a data change, run:

```bash
npm run build-data   # regenerate public/*.json from data/countries/*.json
npm run validate     # schema check
npm run verify-data  # confirms public/*.json matches what build-data just produced
npm test              # unit tests
```

If you forget and only commit the `data/countries/<iso>.json` change, CI's
`npm run verify-data` step will fail the build with a diff — that's the
safety net, but it costs you a round trip. Running the four commands above
locally first is faster.

## Field reference

Top-level fields, in the canonical order `scripts/build-countries.js` writes
them in (you don't have to type them in this order — the build script
reorders on every run — but it keeps diffs smaller if you do):

| Field | Type | Required | Meaning |
|---|---|---|---|
| `isoCode` | string | ✓ | Lowercase 2-letter ISO 3166-1 alpha-2. Must match the filename. |
| `countryEn` / `countryZh` | string | ✓ | Country name, English / Chinese. |
| `agencyEn` / `agencyZh` | string | ✓ | Name of the national environmental agency/ministry. |
| `website` | string (URL) | ✓ | Agency's official homepage. Must start with `http(s)://`. |
| `flagUrl` | string (URL) | ✓ | `https://flagcdn.com/<iso>.svg` — keep the ISO code in sync with `isoCode`. |
| `descriptionZh` / `descriptionEn` | string | ✓ | 1-2 sentence agency description. |
| `region` | string | ✓ | One of: `Asia`, `North America`, `Europe`, `Africa`, `Oceania`, `South America` (must match `REGIONS` in `src/App.jsx` exactly, including capitalization). |
| `established` | number | ✓ | Year the agency was founded. |
| `responsibilities` | string[2] | ✓ | Exactly 2 tags from: `climate`, `water`, `biodiversity`, `forest`, `air`, `waste`, `energy`, `chemicals`, `nuclear`. **Editor-picked sample, not the agency's full mandate** — see below. |
| `contact` | `{email?: string}` | | Public contact email if published. |
| `treaties` | string[2-4] | ✓ | 2-4 treaty names from `TREATY_LABELS` in `src/constants.js`. **Editor-picked sample, not a complete ratification record** — see below. |
| `epiScore` | number | recommended | Yale Environmental Performance Index score. Source: https://epi.yale.edu/ |
| `netZeroTarget` | number \| string | recommended | Target year for net-zero, or a string if there's no firm year. Source: https://zerotracker.net/ |
| `keyLaws` | `{nameZh, nameEn, year}[]` | | Landmark environmental legislation. Source: https://climate-laws.org/ |
| `parisAgreement` | object | recommended | See below. |
| `montrealProtocol` | `{status, ratifiedDate, kigaliAmendment, commitmentZh, commitmentEn}` | | `kigaliAmendment` source: https://ozone.unep.org/treaties/montreal-protocol/amendments/kigali-amendment |
| `cbd` | `{status, ratifiedDate, target30x30, commitmentZh, commitmentEn}` | | CBD / 30×30 status. |
| `carbonPricing` | `{hasETS, hasCarbonTax, priceUSD, coveragePercent, noteZh, noteEn}` | | `priceUSD: null` is a real "no carbon price" value, not a missing value — never leave it out to mean the same thing. Source: https://carbonpricingdashboard.worldbank.org/ |
| `reportingStatus` | `{btrSubmitted, btrYear, nationalComm, statusZh, statusEn}` | | UNFCCC Biennial Transparency Report status. Source: https://unfccc.int/BR |
| `climateEquity` | `{vulnerabilityIndex?, cumulativeCO2Gt?}` | | Used by the Climate Equity scatter view. |
| `desertification` | object | | UNCCD/LDN status — see `scripts/merge-treaty-extensions.js` if editing via `scripts/data/desertification.json` instead of directly. |
| `treatyRatification` | object | | Structured per-treaty ratification record — see below. |
| `legacyData` | `{forestCoverage, carbonEmission, _deprecated: true}` | ✓ (schema) | **Deprecated, hand-typed placeholder numbers kept only for `scripts/audit-data-drift.js`.** Never read this in UI code and never update it to "fix" a drift warning — the warning means the authoritative `wb.forestArea`/`wb.co2Mt` (World Bank data) has moved on, which is expected. |

### `parisAgreement`

```jsonc
{
  "status": "ratified",              // TreatyStatus: ratified|acceded|signed|not_party|unknown
  "ratifiedDate": "2016-09-03",
  "ndcTargetZh": "...", "ndcTargetEn": "...",
  "ndcRating": "critically_insufficient", // one of: 1.5C, 2C, almost_sufficient, insufficient, highly_insufficient, critically_insufficient, not_assessed
  "ndcHistory": [{ "version": "NDC 2.0", "year": 2021 }],
  "nextNdcDeadline": 2030,
  "ndc3Submitted": true,             // NDC 3.0 (third-round NDC, 2025 cycle)
  "ndc3Date": "2024-12-19",          // required (YYYY-MM-DD) if ndc3Submitted=true
  "ndc3Target": "...",
  "ndc3Source": "https://unfccc.int/NDCREG" // required if ndc3Submitted=true
}
```

`ndcRating` source: https://climateactiontracker.org/countries/ (not published
for every country — use `"not_assessed"` rather than guessing).

### `treatyRatification`

The structured record intended to eventually replace the `treaties[]` sample
array. Keys are fixed: `unfccc`, `paris_agreement`, `montreal_protocol`,
`kigali_amendment`, `cbd`, `unccd`, `cites`, `basel_convention`,
`ramsar_convention`, `minamata_convention`.

```jsonc
{
  "paris_agreement": {
    "status": "ratified",   // ratified|acceded|signed|not_party|unknown
    "date": "2016-09-03",   // required (YYYY-MM-DD) when status is ratified/acceded
    "source": "https://unfccc.int/process/the-paris-agreement/status-of-ratification" // required when status is ratified/acceded
  },
  "cites": { "status": "unknown" }  // no date/source needed for unknown/not_party/signed
}
```

Most entries across most countries are intentionally `"unknown"` — that's
correct if nobody has verified it yet, not a bug to fix by guessing.

## `responsibilities[]` and `treaties[]` are samples, not facts

Every country has exactly 2 `responsibilities[]` tags and 2-4 `treaties[]`
entries. These are **editor-picked examples**, not the agency's complete
mandate or a complete ratification record — e.g. Montreal Protocol is
near-universally ratified but only tagged on a handful of countries. The UI
labels both "(节选)/(selected)" with a tooltip explaining this. Don't try to
make these lists "complete" — that's what `treatyRatification` is for
(structured, per-treaty, sourced), not `treaties[]`.

## Data source requirements

**Every data point that isn't computed from another field must have a
verifiable source and a retrieval date. No "from memory" / best-guess
values, ever** — not even ones that "seem obviously right." If you don't have
a source, leave the field as `"unknown"` / `null` / `"not_assessed"` (whichever
the field's schema uses for "not yet verified") rather than filling in a
plausible-looking number or date.

- **`treatyRatification.*`**: `date` + `source` (a URL) are schema-enforced
  whenever `status` is `ratified`/`acceded` — `npm run validate` will reject
  a ratified/acceded entry missing either. `source` should point to the
  treaty's own registry (see `treatyRegistries` in
  `scripts/data/treaty-ratification.json` for the canonical URL per treaty),
  not a secondary summary.
- **`parisAgreement.ndc3*`**: `ndc3Source` is schema-enforced when
  `ndc3Submitted: true`.
- **`desertification.sources`**: required (`npm run validate` checks
  `sources.ldn` at minimum).
- **Everything else** (`epiScore`, `keyLaws`, `carbonPricing`,
  `reportingStatus`, `montrealProtocol.kigaliAmendment`, etc.) doesn't have a
  JSON field to hold a citation — cite the source and the date you looked it
  up **in your PR description**. Reviewers should be able to click through
  and verify the number themselves. See the field table above for the
  standing source per field; if you're pulling from somewhere not listed
  there, add it to `DATA-MAINTENANCE.md`'s source tables in the same PR.

This mirrors the existing rule for `treatyRatification` (`CLAUDE.md`: "Never
fabricate a ratification date to satisfy this — leave it unknown") — it's not
a new, stricter standard, just written down in one place for every field
instead of only the ones the schema happens to check.

## What CI checks on a data PR

`.github/workflows/ci.yml` runs on every push/PR:

1. `npm run validate` — schema (required fields, enum values, date formats,
   `treatyRatification`/`ndc3` source-URL requirements).
2. `npm run verify-data` — rebuilds `public/countries.json` +
   `countries-core.json`/`countries-detail.json` from `data/countries/*.json`
   in memory and fails if they don't byte-match what's committed. This is
   what catches a hand-edited generated file, or a forgotten
   `npm run build-data` before commit.
3. Tests + a production build.

`.github/workflows/link-check.yml` runs monthly and separately checks that
`website` URLs (and a few standing data-source URLs) are still reachable —
see the caveat in `scripts/check-links.js` about false positives from
government WAFs before treating a flagged URL as confirmed-dead.

Neither workflow currently runs `npm run lint` as a required gate (see
`eslint.config.js`'s comment on why the linter is deliberately started
minimal) — a data PR failing lint isn't expected, but isn't blocking either
if it happens for an unrelated pre-existing reason.
