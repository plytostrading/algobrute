'use client';

import { useMemo } from 'react';

export interface ViolinGroup {
  label: string;
  values: number[];
  color?: string;
}

interface ViolinPlotProps {
  groups: ViolinGroup[];
  yLabel?: string;
  height?: number;
  yDomain?: [number, number];
}

/**
 * Grouped violin + embedded box plot for cross-category distribution
 * comparison. KDE bandwidth via Silverman's rule. For each group:
 * - Violin: symmetric filled path showing density
 * - Box: rectangle showing IQR
 * - Median bar
 * - Whiskers: extend to P10/P90
 * - Outlier dots outside whiskers
 */
export function ViolinPlot({
  groups,
  yLabel,
  height = 320,
  yDomain,
}: ViolinPlotProps) {
  const computed = useMemo(
    () => groups.map((g) => computeViolinStats(g.values)),
    [groups],
  );

  const allValues = groups.flatMap((g) => g.values);
  const domain = yDomain ?? [
    Math.min(...allValues, 0) * 1.05,
    Math.max(...allValues, 0) * 1.05,
  ];
  const [yMin, yMax] = domain;

  const paddingL = 50;
  const paddingR = 10;
  const paddingT = 10;
  const paddingB = 40;

  const width = Math.max(360, 80 * groups.length + paddingL + paddingR);
  const plotH = height - paddingT - paddingB;
  const groupW = (width - paddingL - paddingR) / Math.max(groups.length, 1);
  const ySpan = yMax - yMin || 1;
  const toY = (v: number) => paddingT + (1 - (v - yMin) / ySpan) * plotH;

  if (groups.length === 0 || allValues.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No data for violin plot
      </div>
    );
  }

  // y-axis ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const v = yMin + (i / (tickCount - 1)) * ySpan;
    return { v, y: toY(v) };
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis ticks */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={paddingL - 4}
            x2={paddingL}
            y1={t.y}
            y2={t.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={0.5}
          />
          <text
            x={paddingL - 8}
            y={t.y + 3}
            textAnchor="end"
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
          >
            {t.v.toFixed(1)}
          </text>
        </g>
      ))}
      {/* Zero reference */}
      {yMin < 0 && yMax > 0 && (
        <line
          x1={paddingL}
          x2={width - paddingR}
          y1={toY(0)}
          y2={toY(0)}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="2 3"
          strokeWidth={0.5}
        />
      )}
      {yLabel && (
        <text
          x={-height / 2}
          y={14}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize={10}
          fill="hsl(var(--muted-foreground))"
        >
          {yLabel}
        </text>
      )}
      {/* Groups */}
      {groups.map((g, gi) => {
        const stats = computed[gi];
        const cx = paddingL + (gi + 0.5) * groupW;
        const color = g.color ?? '#3b82f6';
        const violinHalfW = groupW * 0.38;

        // Violin path (symmetric)
        let path = '';
        if (stats.kde.length > 0) {
          const maxDensity = Math.max(...stats.kde.map((p) => p.d));
          path =
            stats.kde
              .map((p, i) => {
                const x = cx + (p.d / (maxDensity || 1)) * violinHalfW;
                return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${toY(p.v).toFixed(1)}`;
              })
              .join(' ') +
            ' ' +
            [...stats.kde]
              .reverse()
              .map((p) => {
                const x = cx - (p.d / (maxDensity || 1)) * violinHalfW;
                return `L${x.toFixed(1)},${toY(p.v).toFixed(1)}`;
              })
              .join(' ') +
            ' Z';
        }

        // Box plot overlay
        const boxLeft = cx - 6;
        const boxRight = cx + 6;
        const boxTop = toY(stats.q75);
        const boxBottom = toY(stats.q25);
        const whiskerTop = toY(stats.p90);
        const whiskerBottom = toY(stats.p10);

        return (
          <g key={g.label}>
            {path && (
              <path
                d={path}
                fill={color}
                fillOpacity={0.3}
                stroke={color}
                strokeWidth={1}
              />
            )}
            {/* whiskers */}
            <line
              x1={cx}
              x2={cx}
              y1={whiskerTop}
              y2={whiskerBottom}
              stroke={color}
              strokeWidth={1}
            />
            {/* box */}
            <rect
              x={boxLeft}
              y={boxTop}
              width={boxRight - boxLeft}
              height={boxBottom - boxTop}
              fill={color}
              fillOpacity={0.6}
              stroke={color}
            />
            {/* median */}
            <line
              x1={boxLeft}
              x2={boxRight}
              y1={toY(stats.median)}
              y2={toY(stats.median)}
              stroke="#fff"
              strokeWidth={1.5}
            />
            {/* outliers */}
            {stats.outliers.map((o, i) => (
              <circle
                key={i}
                cx={cx}
                cy={toY(o)}
                r={1.5}
                fill={color}
                opacity={0.5}
              />
            ))}
            {/* group label */}
            <text
              x={cx}
              y={height - paddingB + 14}
              textAnchor="middle"
              fontSize={10}
              fontFamily="monospace"
              fill="hsl(var(--muted-foreground))"
            >
              {g.label}
            </text>
            <text
              x={cx}
              y={height - paddingB + 26}
              textAnchor="middle"
              fontSize={9}
              fill="hsl(var(--muted-foreground))"
            >
              n={g.values.length}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function computeViolinStats(values: number[]) {
  if (values.length === 0) {
    return {
      q25: 0,
      q75: 0,
      median: 0,
      p10: 0,
      p90: 0,
      outliers: [] as number[],
      kde: [] as { v: number; d: number }[],
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const pct = (p: number) => {
    const idx = p * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const frac = idx - lo;
    return sorted[lo] * (1 - frac) + sorted[hi] * frac;
  };
  const q25 = pct(0.25);
  const median = pct(0.5);
  const q75 = pct(0.75);
  const p10 = pct(0.1);
  const p90 = pct(0.9);
  const iqr = q75 - q25;
  const outlierLow = q25 - 1.5 * iqr;
  const outlierHigh = q75 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < outlierLow || v > outlierHigh);

  // KDE with Silverman's bandwidth
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const std =
    Math.sqrt(sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1)) || 1;
  const bw = 1.06 * std * Math.pow(n, -1 / 5);
  const gridN = 40;
  const gridMin = sorted[0];
  const gridMax = sorted[sorted.length - 1];
  const kde: { v: number; d: number }[] = [];
  for (let i = 0; i <= gridN; i++) {
    const v = gridMin + (i / gridN) * (gridMax - gridMin);
    let d = 0;
    for (const x of sorted) {
      const u = (v - x) / bw;
      d += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
    }
    kde.push({ v, d: d / (n * bw) });
  }
  return { q25, q75, median, p10, p90, outliers, kde };
}
