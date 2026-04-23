'use client';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fillArea?: boolean;
  showZeroLine?: boolean;
  strokeWidth?: number;
}

/**
 * Pure-SVG inline sparkline — no Recharts, no ResponsiveContainer.
 * Fast enough to render 30+ instances per page (e.g., per-row in a
 * table). Scales values to (min, max) of input; handles single-point
 * and empty arrays gracefully.
 */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  stroke = 'currentColor',
  fillArea = false,
  showZeroLine = false,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (values.length === 0) {
    return (
      <svg width={width} height={height} className="text-muted-foreground/30">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (values.length === 1) {
    return (
      <svg width={width} height={height}>
        <circle cx={width / 2} cy={height / 2} r={2} fill={stroke} />
      </svg>
    );
  }
  const min = Math.min(...values, showZeroLine ? 0 : Infinity);
  const max = Math.max(...values, showZeroLine ? 0 : -Infinity);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  const toXY = (v: number, i: number): [number, number] => [
    i * stepX,
    height - ((v - min) / span) * (height - 2) - 1,
  ];
  const points = values.map(toXY);
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const areaPath =
    fillArea
      ? `${path} L${width.toFixed(2)},${height} L0,${height} Z`
      : null;

  const zeroY = showZeroLine && min < 0 && max > 0
    ? height - ((0 - min) / span) * (height - 2) - 1
    : null;

  return (
    <svg width={width} height={height} role="img">
      {zeroY !== null && (
        <line
          x1={0}
          y1={zeroY}
          x2={width}
          y2={zeroY}
          stroke="currentColor"
          strokeDasharray="2 2"
          strokeWidth={0.5}
          className="text-muted-foreground"
        />
      )}
      {areaPath && (
        <path d={areaPath} fill={stroke} fillOpacity={0.12} />
      )}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
