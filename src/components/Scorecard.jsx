import { useMemo } from "react";
import { computeCompositeScore } from "./RankingsView";

const GRADE_CONFIG = {
  "A+": { color: "bg-green-800 text-white", border: "border-green-800" },
  A:    { color: "bg-green-600 text-white", border: "border-green-600" },
  "B+": { color: "bg-lime-500 text-white",  border: "border-lime-500" },
  B:    { color: "bg-yellow-500 text-white", border: "border-yellow-500" },
  C:    { color: "bg-orange-500 text-white", border: "border-orange-500" },
  D:    { color: "bg-red-600 text-white",    border: "border-red-600" },
  F:    { color: "bg-red-900 text-white",    border: "border-red-900" },
};

function percentileToGrade(percentile) {
  if (percentile >= 95) return "A+";
  if (percentile >= 85) return "A";
  if (percentile >= 70) return "B+";
  if (percentile >= 50) return "B";
  if (percentile >= 30) return "C";
  if (percentile >= 15) return "D";
  return "F";
}

function computePercentile(value, allValues) {
  if (allValues.length === 0) return 50;
  const below = allValues.filter((v) => v < value).length;
  return (below / allValues.length) * 100;
}

function getDimensionValue(country, dim) {
  switch (dim) {
    case "forest": return Math.min(country.wb?.forestArea ?? 0, 100);
    case "renewable": return Math.min(country.wb?.renewableEnergy ?? 0, 100);
    case "protected": return Math.min(country.wb?.protectedAreas ?? 0, 100);
    case "air": return 100 - Math.min(country.wb?.pm25 ?? 100, 100);
    case "co2": return 100 - Math.min((country.wb?.co2PerCapita ?? 0) * 5, 100);
    case "epi": return country.epiScore ?? 0;
    default: return 0;
  }
}

function getRawDisplayValue(country, dim) {
  switch (dim) {
    case "forest": return country.wb?.forestArea != null ? `${country.wb.forestArea.toFixed(1)}%` : "—";
    case "renewable": return country.wb?.renewableEnergy != null ? `${country.wb.renewableEnergy.toFixed(1)}%` : "—";
    case "protected": return country.wb?.protectedAreas != null ? `${country.wb.protectedAreas.toFixed(1)}%` : "—";
    case "air": return country.wb?.pm25 != null ? `${country.wb.pm25.toFixed(1)} µg/m³` : "—";
    case "co2": return country.wb?.co2PerCapita != null ? `${country.wb.co2PerCapita.toFixed(1)} t` : "—";
    case "epi": return `${country.epiScore ?? 0}`;
    default: return "—";
  }
}

const DIMENSIONS = [
  { key: "epi", zhLabel: "EPI 评分", enLabel: "EPI Score" },
  { key: "renewable", zhLabel: "可再生能源", enLabel: "Renewable Energy" },
  { key: "forest", zhLabel: "森林覆盖", enLabel: "Forest Coverage" },
  { key: "protected", zhLabel: "保护区", enLabel: "Protected Areas" },
  { key: "air", zhLabel: "空气质量", enLabel: "Air Quality" },
  { key: "co2", zhLabel: "CO₂ 效率", enLabel: "CO₂ Efficiency" },
];

export default function Scorecard({ country, language, t, allCountries }) {
  const analysis = useMemo(() => {
    // Compute all scores
    const allComposite = allCountries.map((c) => computeCompositeScore(c));
    const myComposite = computeCompositeScore(country);
    const overallPercentile = computePercentile(myComposite, allComposite);
    const overallGrade = percentileToGrade(overallPercentile);

    // Dimension analysis
    const dims = DIMENSIONS.map((dim) => {
      const allVals = allCountries.map((c) => getDimensionValue(c, dim.key));
      const myVal = getDimensionValue(country, dim.key);
      const pct = computePercentile(myVal, allVals);
      return {
        ...dim,
        value: myVal,
        displayValue: getRawDisplayValue(country, dim.key),
        percentile: pct,
        grade: percentileToGrade(pct),
      };
    });

    return { composite: myComposite, overallPercentile, overallGrade, dims };
  }, [country, allCountries]);

  const gradeCfg = GRADE_CONFIG[analysis.overallGrade];

  return (
    <div className="mb-4 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-4 mb-3">
        {/* Overall grade circle */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0 ${gradeCfg.color}`}>
          {analysis.overallGrade}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-800">
            {t("环境成绩单", "Environmental Scorecard")}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("综合评分", "Composite Score")}: <span className="font-bold text-gray-700">{analysis.composite}</span>/100
            <span className="ml-2 text-gray-400">
              ({t("超过", "Top")} {Math.round(analysis.overallPercentile)}% {t("国家", "of countries")})
            </span>
          </p>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-1.5">
        {analysis.dims.map((dim) => {
          const cfg = GRADE_CONFIG[dim.grade];
          return (
            <div key={dim.key} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 truncate">
                {language === "zh" ? dim.zhLabel : dim.enLabel}
              </span>
              <span className={`text-xs font-bold w-7 text-center rounded px-1 py-0.5 ${cfg.color}`}>
                {dim.grade}
              </span>
              <span className="text-xs text-gray-600 w-20 text-right shrink-0">
                {dim.displayValue}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    dim.percentile >= 70 ? "bg-green-500" : dim.percentile >= 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.max(2, dim.percentile)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                {Math.round(dim.percentile)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
