'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

export interface FrontierPoint {
  label: string;
  mean: number;   // per-trade mean P&L or annualized return
  std: number;    // per-trade std or annualized vol
  color?: string;
}

interface EfficientFrontierScatterProps {
  points: FrontierPoint[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  height?: number;
  /** Sharpe isolines (default [0, 1, 2]) drawn for reference. */
  sharpeIsolines?: number[];
  riskFreeRate?: number;
}

/**
 * Mean-variance (risk-return) scatter. One point per strategy (or bot, or
 * any asset). Sharpe isolines rendered as diagonal reference lines:
 *   mean = sharpe × std + rf.
 * The Pareto-optimal frontier runs through points with the highest Sharpe
 * for each std bucket. Classic quant visualization since Markowitz (1952).
 */
export function EfficientFrontierScatter({
  points,
  xLabel = 'Volatility (std)',
  yLabel = 'Return (mean)',
  title,
  height = 320,
  sharpeIsolines = [0, 1, 2],
  riskFreeRate = 0,
}: EfficientFrontierScatterProps) {
  const data = useMemo(
    () => points.map((p) => ({ ...p })),
    [points],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title ? `${title}: no data` : 'No strategies to plot'}
      </div>
    );
  }

  const maxStd = Math.max(0.0001, ...data.map((p) => p.std)) * 1.1;

  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="std"
              name={xLabel}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{
                value: xLabel,
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <YAxis
              type="number"
              dataKey="mean"
              name={yLabel}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <ZAxis range={[60, 60]} />
            {sharpeIsolines.map((s) => (
              <ReferenceLine
                key={s}
                segment={[
                  { x: 0, y: riskFreeRate },
                  { x: maxStd, y: s * maxStd + riskFreeRate },
                ]}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 3"
                label={{
                  value: `Sharpe ${s}`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'hsl(var(--muted-foreground))',
                }}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                fontSize: 12,
              }}
              formatter={(v: unknown) => (typeof v === 'number' ? v.toFixed(3) : '—')}
              labelFormatter={(_value, payload) => {
                const p = payload?.[0]?.payload as FrontierPoint | undefined;
                return p?.label ?? '';
              }}
            />
            <Scatter data={data} fill="hsl(var(--primary))" isAnimationActive={false}>
              <LabelList
                dataKey="label"
                position="top"
                style={{ fontSize: 9, fill: 'hsl(var(--foreground))' }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
