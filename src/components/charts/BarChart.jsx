/**
 * Lightweight SVG Bar chart — replaces chart.js Bar.
 * Props: labels, datasets (array of { label, data, color })
 */
export default function BarChart({ labels, datasets }) {
  const barWidth = 24;
  const gap = 4;
  const groupGap = 20;
  const groupWidth = datasets.length * (barWidth + gap) - gap;
  const chartW = labels.length * (groupWidth + groupGap) - groupGap + 60;
  const chartH = 220;
  const padTop = 10;
  const padBot = 50;
  const padLeft = 45;
  const plotH = chartH - padTop - padBot;

  // Find max value
  const allVals = datasets.flatMap((ds) => ds.data);
  const maxVal = Math.max(...allVals, 1);
  const niceMax = Math.ceil(maxVal / 10) * 10 || 10;

  // Y grid lines
  const ySteps = 5;
  const yLines = Array.from({ length: ySteps + 1 }, (_, i) => (niceMax / ySteps) * i);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* Y grid + labels */}
        {yLines.map((val) => {
          const y = padTop + plotH - (val / niceMax) * plotH;
          return (
            <g key={val}>
              <line x1={padLeft} y1={y} x2={chartW} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padLeft - 6} y={y} textAnchor="end" dominantBaseline="central" fontSize="10" className="fill-gray-400">
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {labels.map((label, li) => {
          const groupX = padLeft + li * (groupWidth + groupGap) + groupGap / 2;
          return (
            <g key={li}>
              {datasets.map((ds, di) => {
                const val = ds.data[li] ?? 0;
                const barH = (val / niceMax) * plotH;
                const x = groupX + di * (barWidth + gap);
                const y = padTop + plotH - barH;
                return (
                  <g key={di}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barH, 0)}
                      rx="4"
                      fill={ds.color}
                    />
                    {val > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize="9"
                        className="fill-gray-500"
                      >
                        {val >= 100 ? Math.round(val) : val.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* X label */}
              <text
                x={groupX + groupWidth / 2}
                y={padTop + plotH + 14}
                textAnchor="middle"
                fontSize="10"
                className="fill-gray-500"
              >
                {label.length > 12 ? label.slice(0, 12) + "…" : label}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-2">
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
    </div>
  );
}
