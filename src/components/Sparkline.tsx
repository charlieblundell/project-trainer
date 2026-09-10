/**
 * A small trend line over a handful of sessions. Real training data is lumpy:
 * one point, or five identical ones, are both normal, so both have to read as
 * something rather than collapsing into a broken line.
 */
export function Sparkline({
  values,
  color = "var(--accent)",
}: {
  values: number[];
  color?: string;
}) {
  const w = 280;
  const h = 56;
  const pad = 6;

  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // A flat series sits in the middle rather than pinned to the floor, which
  // would otherwise read as "nothing happening at zero".
  const yFor = (v: number) =>
    max === min ? h / 2 : h - pad - ((v - min) / range) * (h - pad * 2);
  const xFor = (i: number) =>
    values.length === 1 ? w / 2 : pad + (i / (values.length - 1)) * (w - pad * 2);

  const coords = values.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${pad},${h} ${line} ${w - pad},${h}`;
  const last = coords[coords.length - 1];
  const gradientId = `spark-${values.length}-${Math.round(min)}-${Math.round(max)}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      role="img"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {values.length > 1 && (
        <>
          <polygon points={area} fill={`url(#${gradientId})`} />
          <polyline
            points={line}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      <circle cx={last.x} cy={last.y} r="3.5" fill={color} />
    </svg>
  );
}
