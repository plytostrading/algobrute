'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface LorenzCurveProps {
  /** Per-bot (or per-entity) contribution to a total — typically P&L. */
  contributions: number[];
  title?: string;
  height?: number;
  entityLabel?: string; // "bots", "strategies", ...
}

/**
 * Lorenz curve: cumulative share of contribution (Y) against cumulative
 * share of contributors (X), sorted by descending contribution. Diagonal
 * = perfectly even. Higher bow = more concentration (Gini ∝ area between
 * diagonal and curve).
 *
 * Answers "is one bot carrying everything?" — a hidden risk invisible in
 * fleet-level aggregates but visible here.
 */
export function LorenzCurve({
  contributions,
  title,
  height = 260,
  entityLabel = 'bots',
}: LorenzCurveProps) {
  const { points, gini } = useMemo(() => {
    // Shift all values positive for fairness metric — Lorenz assumes
    // non-negative contributions. Losing bots get clipped to 0 for this
    // view only; negative contributions are shown separately via n_negative.
    const positive = contributions.filter((c) => c > 0).sort((a, b) => b - a);
    if (positive.length === 0) {
      return { points: [] as { x: number; y: number }[], gini: 0 };
    }
    const total = positive.reduce((s, v) => s + v, 0) || 1;
    const n = positive.length;
    const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    let cum = 0;
    positive.forEach((v, i) => {
      cum += v;
      pts.push({
        x: ((i + 1) / n) * 100,
        y: (cum / total) * 100,
      });
    });
    // Gini from discrete formula: 1 - 2 * area under Lorenz curve
    let area = 0;
    for (let i = 1; i < pts.length; i++) {
      const xDelta = (pts[i].x - pts[i - 1].x) / 100;
      area += ((pts[i].y + pts[i - 1].y) / 2 / 100) * xDelta;
    }
    const gini = 1 - 2 * area;
    return { points: pts, gini };
  }, [contributions]);

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title ? `${title}: no positive contributions` : 'No data'}
      </div>
    );
  }

  const negativeCount = contributions.filter((c) => c < 0).length;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        {title && (
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </div>
        )}
        <div className="text-[11px] text-muted-foreground">
          Gini ={' '}
          <span className="font-mono font-semibold text-foreground">
            {gini.toFixed(2)}
          </span>{' '}
          · {contributions.length} {entityLabel} ({negativeCount} negative excluded)
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${Math.round(v)}%`}
              label={{
                value: `Cumulative ${entityLabel} (top → bottom)`,
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <YAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${Math.round(v)}%`}
              label={{
                value: 'Cumulative P&L',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: 100, y: 100 },
              ]}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                fontSize: 12,
              }}
              formatter={(v: unknown) =>
                typeof v === 'number' ? `${v.toFixed(1)}%` : '—'
              }
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
