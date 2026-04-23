'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ECDFSeries {
  label: string;
  values: number[];
  color?: string;
  dashed?: boolean;
}

interface ECDFPlotProps {
  series: ECDFSeries[];
  xLabel?: string;
  title?: string;
  height?: number;
}

/**
 * Empirical cumulative distribution function. For each series, sort the
 * values and emit step points (x, cumulative_fraction). Non-parametric,
 * exact — no smoothing/bandwidth choice. Ideal for comparing two empirical
 * distributions (live vs shadow) without hiding sample size.
 *
 * Visual: stochastic dominance is visible when one curve lies entirely
 * above another — it dominates at every quantile.
 */
export function ECDFPlot({
  series,
  xLabel,
  title,
  height = 280,
}: ECDFPlotProps) {
  const rows = mergeEcdfSeries(series);
  if (rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title ? `${title}: no data` : 'No data'}
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
          <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={
                xLabel
                  ? {
                      value: xLabel,
                      position: 'insideBottomRight',
                      offset: -2,
                      style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
                    }
                  : undefined
              }
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                fontSize: 12,
              }}
              formatter={(v: unknown) => (typeof v === 'number' ? v.toFixed(3) : '—')}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((s) => (
              <Line
                key={s.label}
                type="stepAfter"
                dataKey={s.label}
                stroke={s.color ?? 'hsl(var(--primary))'}
                strokeDasharray={s.dashed ? '4 4' : undefined}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function mergeEcdfSeries(series: ECDFSeries[]): Record<string, number>[] {
  const allX = new Set<number>();
  const perSeriesSorted: Record<string, number[]> = {};
  series.forEach((s) => {
    const sorted = [...s.values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    perSeriesSorted[s.label] = sorted;
    sorted.forEach((v) => allX.add(v));
  });
  const xs = Array.from(allX).sort((a, b) => a - b);
  return xs.map((x) => {
    const row: Record<string, number> = { x };
    series.forEach((s) => {
      const sorted = perSeriesSorted[s.label];
      if (sorted.length === 0) {
        row[s.label] = 0;
        return;
      }
      // fraction <= x
      let lo = 0;
      let hi = sorted.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (sorted[mid] <= x) lo = mid + 1;
        else hi = mid;
      }
      row[s.label] = lo / sorted.length;
    });
    return row;
  });
}
