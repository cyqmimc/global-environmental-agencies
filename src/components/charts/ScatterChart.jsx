import { useMemo, useState, useRef, useCallback } from "react";

/**
 * Lightweight SVG Scatter/Bubble chart — replaces chart.js Scatter.
 * Props: datasets, xLabel, yLabel, xMin, xMax, yMin, yMax, xLog, onClick, height
 */
export default function ScatterChart({
  datasets, xLabel, yLabel,
  xMin = 0.01, xMax, yMin = 20, yMax = 70,
  xLog = false, onClick, height = 400,
}) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const padLeft = 55;
  const padRight = 15;
  const padTop = 15;
  const padBot = 40;
  const chartW = 600;
  const plotW = chartW - padLeft - padRight;
  const plotH = height - padTop - padBot;

  // Compute data range
  const allPoints = datasets.flatMap((ds) => ds.data);
  const computedXMax = xMax || Math.max(...allPoints.map((p) => p.x), 1);
  const computedYMax = yMax;

  // Scale functions
  const scaleX = useCallback((val) => {
    if (xLog) {
      const logMin = Math.log10(Math.max(xMin, 0.001));
      const logMax = Math.log10(computedXMax);
      const logVal = Math.log10(Math.max(val, xMin));
      return padLeft + ((logVal - logMin) / (logMax - logMin)) * plotW;
    }
    return padLeft + ((val - xMin) / (computedXMax - xMin)) * plotW;
  }, [xMin, computedXMax, xLog, plotW]);

  const scaleY = useCallback((val) => {
    return padTop + plotH - ((val - yMin) / (computedYMax - yMin)) * plotH;
  }, [yMin, computedYMax, plotH]);

  // X ticks (log or linear)
  const xTicks = useMemo(() => {
    if (xLog) {
      const ticks = [];
      const logMin = Math.floor(Math.log10(Math.max(xMin, 0.001)));
      const logMax = Math.ceil(Math.log10(computedXMax));
      for (let exp = logMin; exp <= logMax; exp++) {
        ticks.push(Math.pow(10, exp));
      }
      return ticks;
    }
    const step = Math.pow(10, Math.floor(Math.log10(computedXMax / 5)));
    const ticks = [];
    for (let v = 0; v <= computedXMax; v += step) ticks.push(v);
    return ticks;
  }, [xMin, computedXMax, xLog]);

  // Y ticks
  const yTicks = useMemo(() => {
    const step = (computedYMax - yMin) / 5;
    return Array.from({ length: 6 }, (_, i) => yMin + step * i);
  }, [yMin, computedYMax]);

  const handleClick = (point) => {
    if (onClick && point.country) onClick(point.country);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartW} ${height}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {/* Grid */}
        {yTicks.map((val) => {
          const y = scaleY(val);
          return (
            <g key={`y-${val}`}>
              <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text x={padLeft - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize="10" className="fill-gray-400">
                {Math.round(val)}
              </text>
            </g>
          );
        })}
        {xTicks.map((val) => {
          const x = scaleX(val);
          if (x < padLeft || x > chartW - padRight) return null;
          return (
            <g key={`x-${val}`}>
              <line x1={x} y1={padTop} x2={x} y2={padTop + plotH} stroke="#f3f4f6" strokeWidth="1" />
              <text x={x} y={padTop + plotH + 14} textAnchor="middle" fontSize="10" className="fill-gray-400">
                {val >= 1 ? Math.round(val) : val}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        {xLabel && (
          <text x={padLeft + plotW / 2} y={height - 4} textAnchor="middle" fontSize="11" className="fill-gray-500">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text
            x={12}
            y={padTop + plotH / 2}
            textAnchor="middle"
            fontSize="11"
            className="fill-gray-500"
            transform={`rotate(-90 12 ${padTop + plotH / 2})`}
          >
            {yLabel}
          </text>
        )}

        {/* Data points */}
        {datasets.map((ds, di) =>
          ds.data.map((point, pi) => {
            const x = scaleX(point.x);
            const y = scaleY(point.y);
            const radius = typeof ds.pointRadius === "function"
              ? ds.pointRadius(point)
              : Array.isArray(ds.pointRadius)
                ? ds.pointRadius[pi]
                : ds.pointRadius || 6;
            return (
              <circle
                key={`${di}-${pi}`}
                cx={x}
                cy={y}
                r={radius}
                fill={ds.backgroundColor}
                stroke={ds.borderColor}
                strokeWidth="1.5"
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleClick(point)}
                onMouseEnter={() => setTooltip({ x, y, point, dataset: ds })}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-gray-800 text-white text-xs rounded-lg px-3 py-2 pointer-events-none z-10 shadow-lg whitespace-pre-line"
          style={{
            left: `${(tooltip.x / chartW) * 100}%`,
            top: `${(tooltip.y / height) * 100 - 10}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.point.tooltipLines
            ? tooltip.point.tooltipLines.join("\n")
            : tooltip.point.label || ""}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {datasets.map((ds, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: ds.borderColor }}
            />
            {ds.label}
          </div>
        ))}
      </div>
    </div>
  );
}
