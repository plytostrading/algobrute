'use client';

import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import SectionInsightCard from '@/components/insights/SectionInsightCard';
import { useMcFan } from '@/hooks/useMcFan';
import type { BacktestExportMonteCarlo, BacktestExportBootstrap, EquityFanPoint } from '@/types/api';

// ---------------------------------------------------------------------------
// Equity fan chart — data transformation
// ---------------------------------------------------------------------------

/**
 * Flat chart record for the MC fan.
 *
 * All values are in the same normalized units as the backend (1.0 = initial
 * capital).  We include all five percentile lines so the chart can render a
 * proper fan shape — no stacking tricks, just plain Line elements so Recharts
 * can compute a correct, tight Y-axis domain from the actual data range.
 */
interface FanChartPoint {
  idx: number;      // trade_idx
  p95: number;      // 95th percentile upper outer bound
  p75: number;      // 75th percentile upper inner bound
  median: number;   // 50th percentile (median expected path)
  p25: number;      // 25th percentile lower inner bound
  p5: number;       // 5th percentile lower outer bound
  observed: number; // actual cumulative equity
}

function buildFanChartData(pts: EquityFanPoint[]): FanChartPoint[] {
  return pts.map((pt) => ({
    idx: pt.trade_idx,
    p95: pt.p95,
    p75: pt.p75,
    median: pt.p50,
    p25: pt.p25,
    p5: pt.p5,
    observed: pt.observed,
  }));
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface FanTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; name: string }>;
  label?: number;
  initialCapital: number;
  formatY: (v: number) => string;
}

const TOOLTIP_KEY_LABELS: Record<string, string> = {
  observed: 'Observed',
  median:   'MC Median (p50)',
  p75:      'MC p75',
  p25:      'MC p25',
  p95:      'MC p95 (upper)',
  p5:       'MC p5 (lower)',
};

function FanTooltip({ active, payload, label, formatY }: FanTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Show only the meaningful lines; order: observed first, then percentiles
  const order = ['observed', 'median', 'p75', 'p25', 'p95', 'p5'];
  const rows = order
    .map((key) => payload.find((p) => p.dataKey === key))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (rows.length === 0) return null;

  const obs = payload.find((p) => p.dataKey === 'observed');
  const p95 = payload.find((p) => p.dataKey === 'p95');
  const p5  = payload.find((p) => p.dataKey === 'p5');
  const isOutside = obs && p95 && p5
    ? obs.value > p95.value || obs.value < p5.value
    : false;

  return (
    <div
      className="rounded-md border bg-popover p-2 text-[11px] shadow-md"
      style={{ minWidth: 170 }}
    >
      <p className="mb-1.5 font-semibold text-foreground">Trade #{label}</p>
      {rows.map((p) => (
        <p
          key={p.dataKey}
          className={`flex justify-between gap-3 ${
            p.dataKey === 'observed'
              ? isOutside ? 'text-warning font-medium' : 'text-foreground font-medium'
              : 'text-muted-foreground'
          }`}
        >
          <span>{TOOLTIP_KEY_LABELS[p.dataKey] ?? p.dataKey}</span>
          <span className="font-mono-data">{formatY(p.value)}</span>
        </p>
      ))}
      {isOutside && (
        <p className="mt-1 text-[10px] text-warning">Outside expected range</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equity Fan Chart component
// ---------------------------------------------------------------------------

interface EquityFanChartProps {
  jobId: string;
  initialCapital: number;
}

function EquityFanChart({ jobId, initialCapital }: EquityFanChartProps) {
  const fanQuery = useMcFan(jobId);
  const fanPoints = fanQuery.data ?? null;

  const chartData = useMemo(
    () => (fanPoints ? buildFanChartData(fanPoints) : []),
    [fanPoints],
  );

  // Y-axis formatter: convert normalized multiplier → dollar label
  const formatY = useMemo(
    () =>
      (v: number): string => {
        const d = v * initialCapital;
        if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
        if (d >= 1_000)     return `$${(d / 1_000).toFixed(0)}k`;
        return `$${d.toFixed(0)}`;
      },
    [initialCapital],
  );

  if (fanQuery.isLoading) {
    return (
      <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">
        Loading simulation paths…
      </div>
    );
  }

  if (!fanPoints || chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-md border bg-muted/30 text-xs italic text-muted-foreground">
        Equity fan data unavailable — job may have used the FAST profile or predates this feature.
      </div>
    );
  }

  const lastPt = fanPoints[fanPoints.length - 1];
  const obsReturn = (lastPt.observed - 1) * 100;
  const medReturn = (lastPt.p50    - 1) * 100;
  const isOutside = lastPt.observed > lastPt.p95 || lastPt.observed < lastPt.p5;

  return (
    <div className="flex flex-col gap-2">
      {/* Main fan chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/*
           * ComposedChart with pure Line elements.
           *
           * Why no Area fill?
           * Recharts Area fills anchor at y=0 (or baseValue=0) by default.
           * When combined with an explicit YAxis domain that excludes 0, the
           * fill bleeds outside the chart or the domain is overridden to
           * include 0, compressing the visible range by orders of magnitude.
           *
           * Pure Lines let Recharts compute the Y-axis domain directly from
           * the data values (min p5 → max p95) — giving a tight, correct
           * scale.  The fan shape is conveyed by the five percentile lines.
           */}
          <ComposedChart data={chartData} margin={{ top: 6, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
              strokeOpacity={0.5}
            />

            <XAxis
              dataKey="idx"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Trade #',
                position: 'insideBottomRight',
                offset: -6,
                fontSize: 9,
                fill: 'var(--color-muted-foreground)',
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatY}
              domain={['auto', 'auto']}
              width={58}
            />

            <Tooltip
              content={
                <FanTooltip
                  initialCapital={initialCapital}
                  formatY={formatY}
                />
              }
            />

            {/* Break-even reference */}
            <ReferenceLine
              y={1.0}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 3"
              strokeOpacity={0.4}
            />

            {/* Outer CI bounds (p5, p95) — faint dashed */}
            <Line
              type="monotone" dataKey="p95"
              stroke="var(--color-chart-1)" strokeWidth={1}
              strokeOpacity={0.45} strokeDasharray="4 3"
              dot={false} activeDot={false} isAnimationActive={false}
              name="p95"
            />
            <Line
              type="monotone" dataKey="p5"
              stroke="var(--color-chart-1)" strokeWidth={1}
              strokeOpacity={0.45} strokeDasharray="4 3"
              dot={false} activeDot={false} isAnimationActive={false}
              name="p5"
            />

            {/* Inner CI bounds (p25, p75) — slightly more prominent */}
            <Line
              type="monotone" dataKey="p75"
              stroke="var(--color-chart-1)" strokeWidth={1}
              strokeOpacity={0.7} strokeDasharray="3 2"
              dot={false} activeDot={false} isAnimationActive={false}
              name="p75"
            />
            <Line
              type="monotone" dataKey="p25"
              stroke="var(--color-chart-1)" strokeWidth={1}
              strokeOpacity={0.7} strokeDasharray="3 2"
              dot={false} activeDot={false} isAnimationActive={false}
              name="p25"
            />

            {/* MC median — solid, thicker */}
            <Line
              type="monotone" dataKey="median"
              stroke="var(--color-chart-1)" strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false} activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
              name="median"
            />

            {/* Observed equity — solid, most prominent */}
            <Line
              type="monotone" dataKey="observed"
              stroke="var(--color-chart-3)" strokeWidth={2.5}
              dot={false} activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
              name="observed"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg width="28" height="10" className="shrink-0">
            <line x1="0" y1="5" x2="28" y2="5"
              stroke="var(--color-chart-1)" strokeWidth="1"
              strokeOpacity="0.55" strokeDasharray="4,3" />
          </svg>
          Expected range (p5–p95)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="28" height="10" className="shrink-0">
            <line x1="0" y1="5" x2="28" y2="5"
              stroke="var(--color-chart-1)" strokeWidth="1.5" strokeDasharray="5,3" />
          </svg>
          MC median (p50)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="28" height="10" className="shrink-0">
            <line x1="0" y1="5" x2="28" y2="5"
              stroke="var(--color-chart-3)" strokeWidth="2.5" />
          </svg>
          <span className={isOutside ? 'text-warning font-medium' : ''}>
            Actual equity{isOutside ? ' — outside expected range' : ''}
          </span>
        </span>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 divide-x rounded-md border text-xs">
        <div className="px-3 py-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Observed Return
          </span>
          <span
            className={`font-mono-data text-sm font-bold ${
              obsReturn >= 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {obsReturn >= 0 ? '+' : ''}{obsReturn.toFixed(1)}%
          </span>
        </div>
        <div className="px-3 py-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            MC Median Return
          </span>
          <span className="font-mono-data text-sm font-bold">
            {medReturn >= 0 ? '+' : ''}{medReturn.toFixed(1)}%
          </span>
        </div>
        <div className="px-3 py-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Fan Points
          </span>
          <span className="font-mono-data text-sm font-bold">{fanPoints.length}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MonteCarloTabProps {
  jobId: string | null | undefined;
  mc: BacktestExportMonteCarlo | null;
  bootstrap: BacktestExportBootstrap | null;
  initialCapital: number;
}

export default function MonteCarloTab({ jobId, mc, bootstrap, initialCapital }: MonteCarloTabProps) {
  if (!mc && !bootstrap) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        Monte Carlo analysis not available for this backtest.
      </p>
    );
  }

  const variants = mc ? Object.values(mc.variants) : [];

  return (
    <div className="flex flex-col gap-3">
      {/* AI Insight */}
      <SectionInsightCard jobId={jobId} sectionKey="monte_carlo" />

      {/* Equity fan chart */}
      {jobId && (
        <div className="rounded-md border p-3">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Monte Carlo Equity Paths — Bootstrap Simulation Fan
          </p>
          <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
            Bootstrap resampling of the strategy&apos;s trade return sequence generates a fan of
            possible cumulative equity paths.  The outer dashed lines show the p5–p95 expected
            range; inner lines show p25–p75; the thicker dashed line is the median (p50).
            The solid line is the actual observed equity.
          </p>
          <EquityFanChart jobId={jobId} initialCapital={initialCapital} />
        </div>
      )}

      {mc && (
        <>
          {/* Permutation test summary */}
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
            <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-foreground">
              Permutation test with {mc.n_simulations.toLocaleString()} simulations.
              Overall p-value:{' '}
              <span className="font-mono-data font-semibold">{mc.overall_p_value.toFixed(3)}</span>{' — '}
              {mc.significant_at_95pct
                ? 'significant at 95% confidence (strategy shows real edge).'
                : 'not significant at 95% confidence (possible overfitting).'}
            </p>
          </div>

          {/* Variant significance table */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Variant</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Real Sharpe</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Null Mean</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Null Std</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">p-value</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sig. 95%</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.variant_code} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 text-xs">{v.variant_name}</td>
                    <td className="px-3 py-2 text-right font-mono-data text-xs font-semibold">{v.real_sharpe.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono-data text-xs text-muted-foreground">{v.null_sharpe_mean.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono-data text-xs text-muted-foreground">{v.null_sharpe_std.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono-data text-xs">{v.p_value.toFixed(3)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={v.significant_at_95pct ? 'default' : 'secondary'} className="text-[10px]">
                        {v.significant_at_95pct ? '\u2713 Yes' : '\u2717 No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Bootstrap CI */}
      {bootstrap && (
        <div className="rounded-md border p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Stationary Bootstrap Sharpe CI ({(bootstrap.confidence_level * 100).toFixed(0)}%,{' '}
            {bootstrap.n_replicates.toLocaleString()} replicates)
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Observed Sharpe</span>
              <span className="font-mono-data font-bold text-sm">{bootstrap.observed_sharpe.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">CI Range</span>
              <span className="font-mono-data font-bold text-sm">
                [{bootstrap.ci_lower.toFixed(3)}, {bootstrap.ci_upper.toFixed(3)}]
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Excludes Zero</span>
              <span
                className={`font-mono-data font-bold text-sm ${
                  bootstrap.ci_excludes_zero ? 'text-success' : 'text-warning'
                }`}
              >
                {bootstrap.ci_excludes_zero ? '\u2713 Yes' : '\u2717 No'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
