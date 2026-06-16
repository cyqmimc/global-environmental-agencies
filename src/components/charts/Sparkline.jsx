/**
 * Tiny sparkline (no axes, no labels).
 * @param {{ data: Array<{year:number,value:number}>, width?: number, height?: number, color?: string, fill?: string }} props
 */
export default function Sparkline({
  data,
  width = 56,
  height = 16,
  color = "#16a34a",
  fill = "rgba(22, 163, 74, 0.15)",
}) {
  if (!data || data.length < 2) return null;
  const vals = data.map((d) => d.value).filter((v) => v != null);
  if (vals.length < 2) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const n = data.length;
  const points = data.map((d, i) => {
    const x = (i / (n - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 2) - 1;
    return [x, y];
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}
