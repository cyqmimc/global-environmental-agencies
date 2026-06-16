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
 * @property {number=} population
 * @property {number=} gdp
 * @property {number=} co2PerCapita
 * @property {Object<string, number>=} dataYear
 * @property {Object<string, WorldBankHistoryPoint[]>=} history
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
 * @property {boolean=} hasETS
 * @property {boolean=} hasCarbonTax
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
 * @property {number=} epiScore
 * @property {string|number=} netZeroTarget
 * @property {{forestCoverage:number,carbonEmission:number}} data
 * @property {ParisAgreement|null=} parisAgreement
 * @property {{kigaliAmendment?: boolean}|null=} montrealProtocol
 * @property {CarbonPricing|null=} carbonPricing
 * @property {ReportingStatus|null=} reportingStatus
 * @property {KeyLaw[]=} keyLaws
 * @property {string[]=} treaties
 * @property {WorldBankData|null=} wb
 * @property {string=} descriptionZh
 * @property {string=} descriptionEn
 * @property {boolean=} _detail
 */

export {};
