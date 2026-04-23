'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

interface QQPlotProps {
  values: number[];
  title?: string;
  height?: number;
  /** Compare against a Normal(mean, std) theoretical distribution. If
   *  omitted, uses the empirical sample's own mean+std (so deviations
   *  reflect shape, not location). */
  theoreticalMean?: number;
  theoreticalStd?: number;
}

/**
 * Quantile-Quantile plot against a theoretical Normal. X = theoretical
 * z-score quantile; Y = empirical sample quantile. Perfect normality =
 * points on the diagonal. S-curves = heavy tails or skew.
 *
 * Practitioner view; surfaced in Chapter 6 for trust-critical audiences.
 */
export function QQPlot({
  values,
  title,
  height = 280,
  theoreticalMean,
  theoreticalStd,
}: QQPlotProps) {
  const { points, diag } = useMemo(() => {
    const filtered = values.filter((v) => Number.isFinite(v));
    if (filtered.length < 3) {
      return { points: [] as { x: number; y: number }[], diag: [] as number[] };
    }
    const sorted = [...filtered].sort((a, b) => a - b);
    const n = sorted.length;
    const mean =
      theoreticalMean ?? sorted.reduce((s, v) => s + v, 0) / n;
    const stdFromSample =
      Math.sqrt(
        sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1),
      ) || 1;
    const std = theoreticalStd ?? stdFromSample;
    const pts = sorted.map((v, i) => {
      const p = (i + 0.5) / n;
      const z = normInvCDF(p);
      return { x: z, y: (v - mean) / std };
    });
    const minQ = Math.min(...pts.map((p) => Math.min(p.x, p.y)));
    const maxQ = Math.max(...pts.map((p) => Math.max(p.x, p.y)));
    return { points: pts, diag: [minQ, maxQ] };
  }, [values, theoreticalMean, theoreticalStd]);

  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title ? `${title}: need ≥3 samples` : 'Not enough data for QQ plot'}
      </div>
    );
  }

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
              dataKey="x"
              name="Theoretical quantile"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{
                value: 'Theoretical z',
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Empirical quantile"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{
                value: 'Empirical z',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <ZAxis range={[20, 20]} />
            <ReferenceLine
              segment={[
                { x: diag[0], y: diag[0] },
                { x: diag[1], y: diag[1] },
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
              formatter={(v: unknown) => (typeof v === 'number' ? v.toFixed(3) : '—')}
            />
            <Scatter
              data={points}
              fill="hsl(var(--primary))"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Beasley-Springer-Moro rational approximation to the standard-normal inverse CDF.
function normInvCDF(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      ((((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= pHigh) {
    q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}
