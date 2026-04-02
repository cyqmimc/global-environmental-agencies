import { useMemo } from "react";

/**
 * Lightweight SVG Radar chart — replaces chart.js Radar.
 * Props: labels, datasets (array of { label, data, color, dash? }), size
 */
export default function RadarChart({ labels, datasets, size = 280, legendPosition = "bottom" }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const maxVal = 100;
  const steps = [25, 50, 75, 100];
  const n = labels.length;

  const points = useMemo(() => {
    return labels.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return { cos: Math.cos(angle), sin: Math.sin(angle) };
    });
  }, [n, labels]);

  const polygon = (data) =>
    data
      .map((val, i) => {
        const ratio = Math.min(val, maxVal) / maxVal;
        const x = cx + points[i].cos * r * ratio;
        const y = cy + points[i].sin * r * ratio;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }}>
        {/* Grid rings */}
        {steps.map((s) => (
          <polygon
            key={s}
            points={points
              .map((p) => `${cx + p.cos * r * (s / maxVal)},${cy + p.sin * r * (s / maxVal)}`)
              .join(" ")}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + p.cos * r}
            y2={cy + p.sin * r}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {/* Data polygons */}
        {datasets.map((ds, di) => (
          <polygon
            key={di}
            points={polygon(ds.data)}
            fill={ds.color + "33"}
            stroke={ds.color}
            strokeWidth={ds.dash ? 1 : 2}
            strokeDasharray={ds.dash ? "4 4" : "none"}
          />
        ))}
        {/* Data points */}
        {datasets.map((ds, di) =>
          !ds.dash &&
          ds.data.map((val, i) => {
            const ratio = Math.min(val, maxVal) / maxVal;
            return (
              <circle
                key={`${di}-${i}`}
                cx={cx + points[i].cos * r * ratio}
                cy={cy + points[i].sin * r * ratio}
                r="3"
                fill={ds.color}
              />
            );
          })
        )}
        {/* Labels */}
        {labels.map((label, i) => {
          const labelR = r + 18;
          const x = cx + points[i].cos * labelR;
          const y = cy + points[i].sin * labelR;
          const anchor = points[i].cos < -0.1 ? "end" : points[i].cos > 0.1 ? "start" : "middle";
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              className="fill-gray-500"
              fontSize="11"
            >
              {label}
            </text>
          );
        })}
      </svg>
      {/* Legend */}
      {legendPosition === "bottom" && (
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
      )}
    </div>
  );
}
