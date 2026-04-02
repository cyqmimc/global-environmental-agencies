import { useMemo } from "react";
import "../chartSetup";
import { Scatter } from "react-chartjs-2";

const REGION_COLORS = {
  Asia: { bg: "rgba(249, 115, 22, 0.6)", border: "#f97316" },
  Europe: { bg: "rgba(59, 130, 246, 0.6)", border: "#3b82f6" },
  Africa: { bg: "rgba(234, 179, 8, 0.6)", border: "#eab308" },
  "North America": { bg: "rgba(34, 197, 94, 0.6)", border: "#22c55e" },
  "South America": { bg: "rgba(168, 85, 247, 0.6)", border: "#a855f7" },
  Oceania: { bg: "rgba(20, 184, 166, 0.6)", border: "#14b8a6" },
};

export default function ClimateEquityView({ countries, language, t, onCountryClick }) {
  const chartData = useMemo(() => {
    const byRegion = {};
    countries.forEach((c) => {
      if (!c.climateEquity) return;
      const region = c.region;
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push({
        x: c.climateEquity.cumulativeCO2Gt,
        y: c.climateEquity.vulnerabilityIndex * 100,
        country: c,
        label: language === "zh" ? c.countryZh : c.countryEn,
      });
    });

    return {
      datasets: Object.entries(byRegion).map(([region, points]) => ({
        label: region,
        data: points,
        backgroundColor: REGION_COLORS[region]?.bg || "rgba(156,163,175,0.5)",
        borderColor: REGION_COLORS[region]?.border || "#9ca3af",
        borderWidth: 1.5,
        pointRadius: points.map((p) => Math.max(5, Math.min(18, Math.sqrt(p.x) * 2.5))),
        pointHoverRadius: points.map((p) => Math.max(8, Math.min(22, Math.sqrt(p.x) * 2.5 + 3))),
      })),
    };
  }, [countries, language]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "logarithmic",
        title: {
          display: true,
          text: language === "zh" ? "历史累计 CO₂ 排放 (Gt, 1850-2022)" : "Cumulative CO₂ Emissions (Gt, 1850-2022)",
          font: { size: 12 },
        },
        min: 0.01,
        grid: { color: "#f3f4f6" },
      },
      y: {
        title: {
          display: true,
          text: language === "zh" ? "气候脆弱性指数 (ND-GAIN, 0-100)" : "Climate Vulnerability Index (ND-GAIN, 0-100)",
          font: { size: 12 },
        },
        min: 20,
        max: 70,
        grid: { color: "#f3f4f6" },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const p = ctx.raw;
            return [
              p.label,
              `${language === "zh" ? "累计排放" : "Cumulative CO₂"}: ${p.country.climateEquity.cumulativeCO2Gt} Gt`,
              `${language === "zh" ? "脆弱性" : "Vulnerability"}: ${(p.country.climateEquity.vulnerabilityIndex * 100).toFixed(0)}`,
              `${language === "zh" ? "NDC 评级" : "NDC Rating"}: ${p.country.parisAgreement?.ndcRating || "N/A"}`,
            ];
          },
        },
      },
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, padding: 15, font: { size: 11 } },
      },
    },
    onClick: (evt, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        const datasetIdx = elements[0].datasetIndex;
        const point = chartData.datasets[datasetIdx].data[idx];
        if (point?.country && onCountryClick) {
          onCountryClick(point.country);
        }
      }
    },
  };

  // Quadrant labels
  const quadrants = [
    { pos: "top-left", zh: "低排放 · 高脆弱\n（最不公平）", en: "Low Emissions · High Vulnerability\n(Most Unfair)", color: "text-red-500" },
    { pos: "top-right", zh: "高排放 · 高脆弱", en: "High Emissions · High Vulnerability", color: "text-orange-500" },
    { pos: "bottom-left", zh: "低排放 · 低脆弱", en: "Low Emissions · Low Vulnerability", color: "text-green-600" },
    { pos: "bottom-right", zh: "高排放 · 低脆弱\n（最大责任）", en: "High Emissions · Low Vulnerability\n(Greatest Responsibility)", color: "text-blue-600" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">
            {t("气候公平矩阵", "Climate Equity Matrix")}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(
              "气泡大小 = 累计排放量 · 点击气泡查看国家详情",
              "Bubble size = cumulative emissions · Click to view country details"
            )}
          </p>
        </div>
      </div>

      {/* Quadrant labels */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {quadrants.map((q) => (
          <div
            key={q.pos}
            className={`text-center text-xs ${q.color} whitespace-pre-line leading-tight py-1`}
          >
            {language === "zh" ? q.zh : q.en}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: "400px" }}>
        <Scatter data={chartData} options={options} />
      </div>

      {/* Data source */}
      <p className="text-xs text-gray-400 mt-2 text-center">
        {t(
          "数据来源：ND-GAIN 气候脆弱性指数 (2022) · Global Carbon Project 累计排放 (1850-2022)",
          "Sources: ND-GAIN Climate Vulnerability Index (2022) · Global Carbon Project Cumulative Emissions (1850-2022)"
        )}
      </p>
    </div>
  );
}
