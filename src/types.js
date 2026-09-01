/**
 * Shared JSDoc typedefs for the project. Import via:
 *   /** @type {import('./types').Country} *\/
 *
 * These power editor IntelliSense and `tsc --noEmit --allowJs --checkJs`
 * without forcing a TypeScript build pipeline.
 */

/**
 * @typedef {"climate"|"water"|"biodiversity"|"forest"|"air"|"waste"|"energy"|"chemicals"|"nuclear"} Responsibility
 */

/**
 * @typedef {"1.5C"|"2C"|"almost_sufficient"|"insufficient"|"highly_insufficient"|"critically_insufficient"|"not_assessed"} NdcRating
 */

/**
 * @typedef {Object} WorldBankHistoryPoint
 * @property {number} year
 * @property {number|null} value
 */

/**
 * @typedef {Object} WorldBankData
 * @property {number=} forestArea
 * @property {number=} co2Mt
 * @property {number=} renewableEnergy
 * @property {number=} pm25
 * @property {number=} protectedAreas
 * @property {number=} population   - Total population (WB SP.POP.TOTL)
 * @property {number=} gdp          - GDP in current USD (WB NY.GDP.MKTP.CD)
 * @property {number=} co2PerCapita - Derived: co2Mt × 1e6 / population
 * @property {Object<string, number>=} dataYear  - per-metric year of source value
 * @property {Object<string, WorldBankHistoryPoint[]>=} history  - 2015→ time series
 */

/**
 * @typedef {Object} ParisAgreement
 * @property {NdcRating=} ndcRating
 * @property {string=} ndcTargetZh
 * @property {string=} ndcTargetEn
 * @property {string=} ratifiedDate
 * @property {Array<{year:number,version:string}>=} ndcHistory
 */

/**
 * @typedef {Object} CarbonPricing
 * @property {number|null=} priceUSD
 * @property {number=} coveragePercent
 * @property {boolean=} hasETS
 * @property {boolean=} hasCarbonTax
 */

/**
 * @typedef {Object} SdgObservation
 * @property {"available"|"missing"|"not_applicable"} status
 * @property {number=} value
 * @property {number=} year
 * @property {string=} unit
 * @property {string=} nature
 * @property {string=} observationStatus
 */

/**
 * @typedef {Object} SdgSnapshot
 * @property {SdgObservation} waterStress
 * @property {SdgObservation} materialConsumptionGdp
 * @property {SdgObservation} marineKbaProtected
 * @property {SdgObservation} degradedLand
 */

/**
 * @typedef {Object} ReportingStatus
 * @property {boolean=} btrSubmitted
 */

/**
 * @typedef {Object} KeyLaw
 * @property {string} nameZh
 * @property {string} nameEn
 * @property {number=} year
 */

/**
 * @typedef {"ratified"|"acceded"|"signed"|"not_party"|"unknown"} TreatyStatus
 */

/**
 * @typedef {Object} TreatyRatificationEntry
 * @property {TreatyStatus} status
 * @property {string=} date    - YYYY-MM-DD, required when status is ratified/acceded
 * @property {string=} source  - Source URL, required when status is ratified/acceded
 * @property {string=} note
 */

/**
 * @typedef {Object} TreatyRatification
 *   - Structured per-treaty ratification record from
 *     scripts/data/treaty-ratification.json (merged via
 *     scripts/merge-treaty-ratification.js). Intended to eventually replace
 *     the flat `treaties[]` sample array as the UI's source of truth; most
 *     entries are still "unknown" pending manual research — never infer
 *     "not a party" from a missing/unknown entry.
 * @property {TreatyRatificationEntry} unfccc
 * @property {TreatyRatificationEntry} paris_agreement
 * @property {TreatyRatificationEntry} montreal_protocol
 * @property {TreatyRatificationEntry} kigali_amendment
 * @property {TreatyRatificationEntry} cbd
 * @property {TreatyRatificationEntry} unccd
 * @property {TreatyRatificationEntry} cites
 * @property {TreatyRatificationEntry} basel_convention
 * @property {TreatyRatificationEntry} ramsar_convention
 * @property {TreatyRatificationEntry} minamata_convention
 */

/**
 * @typedef {Object} Provenance
 *   - Traceability record for a single indicator value: where it came from,
 *     what year it reflects, and how it was computed. Static metadata lives
 *     in `PROVENANCE` in `src/constants.js` (one entry per indicator, since
 *     each was imported in a single batch and shares the same year/source
 *     across all 80 countries); `value` is filled in at render time from the
 *     live field on the country object rather than duplicated 80× in JSON.
 *     Rendered via `<DataYearBadge>`.
 * @property {number|string=} value
 * @property {string=} unit
 * @property {number|string} year  - Data vintage year, or "unknown" if unverified
 * @property {string} source       - Human-readable source name
 * @property {string=} sourceUrl
 * @property {string=} method
 * @property {string=} retrievedAt - YYYY-MM-DD when this repo last pulled the value, or "unknown"
 */

/**
 * @typedef {Object} Country
 * @property {string} countryEn
 * @property {string} countryZh
 * @property {string} agencyEn
 * @property {string} agencyZh
 * @property {string} website
 * @property {string} flagUrl
 * @property {string} region
 * @property {string|number} established
 * @property {string} isoCode
 * @property {Responsibility[]} responsibilities
 *   - Editor-picked sample of focus areas (every country currently has
 *     exactly 2), NOT the agency's complete mandate. UI labels this
 *     "Focus Areas (selected) / 主要职能（节选）".
 * @property {number=} epiScore
 * @property {string|number=} netZeroTarget
 * @property {{forestCoverage:number,carbonEmission:number,_deprecated:true}=} legacyData
 *   - Hand-written display data, superseded by `wb.forestArea` / `wb.co2Mt`. Not used
 *     for rendering, sorting, or scoring — kept only for historical reference and the
 *     validate-schema.js drift check. Do not read from this in UI code.
 * @property {ParisAgreement|null=} parisAgreement
 * @property {{kigaliAmendment?: boolean}|null=} montrealProtocol
 * @property {CarbonPricing|null=} carbonPricing
 * @property {ReportingStatus|null=} reportingStatus
 * @property {KeyLaw[]=} keyLaws
 * @property {string[]=} treaties
 *   - Editor-picked sample of treaty names, NOT a complete ratification list.
 *     UI labels this "Selected Treaties (节选)". Prefer `treatyRatification`
 *     once a given treaty's entry there is no longer "unknown".
 * @property {TreatyRatification=} treatyRatification
 * @property {{vulnerabilityIndex?:number, cumulativeCO2Gt?:number}|null=} climateEquity
 * @property {WorldBankData|null=} wb
 * @property {SdgSnapshot|null=} sdg
 * @property {string=} descriptionZh
 * @property {string=} descriptionEn
 * @property {boolean=} _detail
 */

export {};
