import { useMemo } from "react";
import {
  computeStateIndices,
  computeGovernanceIndices,
  computePercentile,
  percentileToGrade,
  STATE_DIMENSIONS,
  GOVERNANCE_DIMENSIONS,
} from "../utils/score";
import { formatCarbonIntensity } from "../utils/derived";

const GRADE_CONFIG = {
  "A+": { color: "bg-green-800 text-white", border: "border-green-800" },
  A:    { color: "bg-green-600 text-white", border: "border-green-600" },
  "B+": { color: "bg-lime-500 text-white",  border: "border-lime-500" },
  B:    { color: "bg-yellow-500 text-white", border: "border-yellow-500" },
  C:    { color: "bg-orange-500 text-white", border: "border-orange-500" },
  D:    { color: "bg-red-600 text-white",    border: "border-red-600" },
  F:    { color: "bg-red-900 text-white",    border: "border-red-900" },
};
const INSUFFICIENT_CONFIG = { color: "bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-300" };

function formatStateRaw(key, value) {
  if (value == null) return "—";
  switch (key) {
    case "forest":
    case "protected":
      return `${value.toFixed(1)}%`;
    case "air":
      return `${value.toFixed(1)} µg/m³`;
    case "epi":
      return `${value}`;
    default:
      return `${value}`;
  }
}

function formatGovernanceRaw(key, country) {
  switch (key) {
    case "ndcRating":
      return country.parisAgreement?.ndcRating ?? "—";
    case "carbonPricing":
      return country.carbonPricing?.priceUSD != null
        ? `$${country.carbonPricing.priceUSD}×${country.carbonPricing.coveragePercent ?? 0}%`
        : "—";
    case "btr":
      return country.reportingStatus?.btrSubmitted == null ? "—" : country.reportingStatus.btrSubmitted ? "✓" : "✗";
    case "kigali":
      return country.montrealProtocol?.kigaliAmendment == null ? "—" : country.montrealProtocol.kigaliAmendment ? "✓" : "✗";
    case "ndc3":
      return country.parisAgreement?.ndc3Submitted == null ? "—" : country.parisAgreement.ndc3Submitted ? "✓" : "✗";
    case "ldn":
      return country.desertification?.ldnTargetSet == null ? "—" : country.desertification.ldnTargetSet ? "✓" : "✗";
    case "renewable":
      return country.wb?.renewableEnergy != null ? `${country.wb.renewableEnergy.toFixed(1)}%` : "—";
    case "carbonIntensity": {
      const v = GOVERNANCE_DIMENSIONS.find((d) => d.key === "carbonIntensity").getRaw(country);
      return formatCarbonIntensity(v);
    }
    default:
      return "—";
  }
}

function IndexBlock({ title, grade, score, percentile, validCount, totalDims, dims, t }) {
  const cfg = grade ? GRADE_CONFIG[grade] : INSUFFICIENT_CONFIG;
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0 ${cfg.color}`}>
          {grade ?? "—"}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{title}</p>
          {score != null ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {score}/100
              {percentile != null && (
                <span className="ml-1 text-gray-500 dark:text-gray-400">
                  ({t("超过", "Top")} {Math.round(percentile)}%)
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400" title={t(`有效维度 ${validCount}/${totalDims}，不足 4 个`, `${validCount}/${totalDims} valid dimensions — fewer than 4`)}>
              {t("数据不足", "Insufficient data")}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {dims.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 w-24 shrink-0 truncate">{d.label}</span>
            <span className="text-[11px] text-gray-600 dark:text-gray-300 w-16 text-right shrink-0">{d.display}</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              {d.dimScore != null && (
                <div
                  className={`h-1.5 rounded-full ${
                    d.dimScore >= 70 ? "bg-green-500" : d.dimScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.max(2, d.dimScore)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Scorecard({ country, language, t, allCountries, stateWeights, governanceWeights }) {
  const analysis = useMemo(() => {
    const stateResults = computeStateIndices(allCountries, stateWeights);
    const govResults = computeGovernanceIndices(allCountries, governanceWeights);
    const myState = stateResults.get(country);
    const myGov = govResults.get(country);

    const stateScores = allCountries.map((c) => stateResults.get(c)?.score).filter((v) => v != null);
    const govScores = allCountries.map((c) => govResults.get(c)?.score).filter((v) => v != null);

    const statePct = myState?.score != null ? computePercentile(myState.score, stateScores) : null;
    const govPct = myGov?.score != null ? computePercentile(myGov.score, govScores) : null;

    const stateDims = STATE_DIMENSIONS.map((d) => ({
      key: d.key,
      label: language === "zh" ? d.zh : d.en,
      display: formatStateRaw(d.key, d.getRaw(country)),
      dimScore: myState?.dimScores?.[d.key] ?? null,
    }));
    const govDims = GOVERNANCE_DIMENSIONS.map((d) => ({
      key: d.key,
      label: language === "zh" ? d.zh : d.en,
      display: formatGovernanceRaw(d.key, country),
      dimScore: myGov?.dimScores?.[d.key] ?? null,
    }));

    return {
      state: { ...myState, percentile: statePct, grade: percentileToGrade(statePct), dims: stateDims },
      governance: { ...myGov, percentile: govPct, grade: percentileToGrade(govPct), dims: govDims },
    };
  }, [country, allCountries, stateWeights, governanceWeights, language]);

  return (
    <div className="mb-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">
        {t("环境成绩单", "Environmental Scorecard")}
      </h4>
      <div className="flex flex-col sm:flex-row gap-5">
        <IndexBlock
          title={t("状态指数（禀赋）", "State Index (Endowment)")}
          grade={analysis.state.grade}
          score={analysis.state.score}
          percentile={analysis.state.percentile}
          validCount={analysis.state.validCount}
          totalDims={analysis.state.totalDims}
          dims={analysis.state.dims}
          t={t}
        />
        <IndexBlock
          title={t("治理指数（绩效）", "Governance Index (Performance)")}
          grade={analysis.governance.grade}
          score={analysis.governance.score}
          percentile={analysis.governance.percentile}
          validCount={analysis.governance.validCount}
          totalDims={analysis.governance.totalDims}
          dims={analysis.governance.dims}
          t={t}
        />
      </div>
    </div>
  );
}
