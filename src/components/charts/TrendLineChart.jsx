/**
 * Lightweight SVG line chart for time-series trends.
 * Props:
 *   datasets: [{ label, data: [{ year, value }], color, dash? }]
 *   yLabel: string (optional y-axis label)
 *   yUnit: string (optional unit suffix, e.g. "%" or "t")
 */
export default function TrendLineChart({ datasets, yLabel, yUnit = "" }) {
  const chartW = 520;
  const chartH = 200;
  const padTop = 16;
  const padBot = 36;
  const padLeft = 50;
  const padRight = 16;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBot;

  // Collect all years and values across datasets
  const allPoints = datasets.flatMap((ds) => ds.data || []);
  if (!allPoints.length) return null;

  const years = [...new Set(allPoints.map((p) => p.year))].sort((a, b) => a - b);
  const allVals = allPoints.map((p) => p.value);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  const yMin = Math.max(0, minVal - range * 0.1);
  const yMax = maxVal + range * 0.1;

  const xScale = (year) => padLeft + ((year - years[0]) / (years[years.length - 1] - years[0] || 1)) * plotW;
  const yScale = (val) => padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  // Y grid
  const ySteps = 4;
  const yLines = Array.from({ length: ySteps + 1 }, (_, i) => yMin + ((yMax - yMin) / ySteps) * i);

  // Format y value
  const fmtY = (v) => {
    if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* Y grid + labels */}
        {yLines.map((val, i) => {
          const y = yScale(val);
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padLeft - 6} y={y} textAnchor="end" dominantBaseline="central" fontSize="9" className="fill-gray-400">
                {fmtY(val)}{yUnit}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        {yLabel && (
          <text
            x={12}
            y={padTop + plotH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            className="fill-gray-400"
            transform={`rotate(-90, 12, ${padTop + plotH / 2})`}
          >
            {yLabel}
          </text>
        )}

        {/* X axis year labels */}
        {years.map((year) => (
          <text
            key={year}
            x={xScale(year)}
            y={padTop + plotH + 16}
            textAnchor="middle"
            fontSize="9"
            className="fill-gray-400"
          >
            {year}
          </text>
        ))}

        {/* Lines + dots */}
        {datasets.map((ds, di) => {
          if (!ds.data?.length) return null;
          const sorted = [...ds.data].sort((a, b) => a.year - b.year);
          const pathD = sorted
            .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.year)} ${yScale(p.value)}`)
            .join(" ");
          return (
            <g key={di}>
              <path
                d={pathD}
                fill="none"
                stroke={ds.color}
                strokeWidth="2"
                strokeDasharray={ds.dash ? "6 3" : "none"}
              />
              {!ds.dash && sorted.map((p, i) => (
                <circle key={i} cx={xScale(p.year)} cy={yScale(p.value)} r="3" fill={ds.color} />
              ))}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      {datasets.length > 1 && (
        <div className="flex flex-wrap gap-4 justify-center mt-1">
          {datasets.map((ds, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: ds.color }}
              />
              {ds.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
