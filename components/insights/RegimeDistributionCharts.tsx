'use client';

/**
 * RegimeDistributionCharts
 *
 * Four path-averaged distribution charts derived from raw CPCV trade records:
 *
 *   1. Intra-trade Drawdown Distribution by Regime (MAE proxy)
 *   2. Win Rate per CPCV Path by Regime (bar chart w/ mean ± 1σ bands)
 *   3. Trade Duration Distribution (holding_bars histogram, all regimes)
 *   4. Trade Return Distribution by Regime (realized_pnl_pct)
 *
 * Path-averaging rationale
 * ────────────────────────
 * The CPCV engine stores all_trade_records with one entry per (trade, path).
 * C(10,2)=45 paths means each physical trade appears ~8–9× in the array.
 * Naive histograms would inflate counts ~9×.  The correct approach mirrors
 * how total_return_pct is computed on the backend:
 *
 *   (a) Group trades by backtest_path_id.
 *   (b) Build a histogram (or per-path metric) independently per path.
 *   (c) Average the per-path histograms / metrics across all paths that
 *       had data for the relevant regime.
 *
 * This gives an unbiased, path-distribution-consistent visualisation.
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TradeRecord } from '@/types/api';
import { REGIME_HEX, REGIME_CHART_FILLS } from '@/lib/colors';
import { REGIME_LABELS } from '@/lib/regimeLabel';

// ---------------------------------------------------------------------------
// Histogram utilities
// ---------------------------------------------------------------------------

/**
 * Build shared bin edges from a flat list of numeric values.
 * Returns [binEdges] where binEdges.length === nBins + 1.
 */
function buildBinEdges(values: number[], nBins: number): number[] {
  if (values.length === 0) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (lo === hi) {
    // Degenerate — single-value range
    return Array.from({ length: nBins + 1 }, (_, i) => lo - 0.5 + i * (1 / nBins));
  }
  const step = (hi - lo) / nBins;
  return Array.from({ length: nBins + 1 }, (_, i) => lo + i * step);
}

/**
 * Given bin edges and a list of values, return per-bin counts.
 * The last bucket is closed on both ends [edge[n-1], edge[n]].
 */
function binValues(values: number[], edges: number[]): number[] {
  const n = edges.length - 1;
  const counts = new Array<number>(n).fill(0);
  for (const v of values) {
    let idx = edges.findIndex((e, i) => i < n && v >= e && v < edges[i + 1]);
    // Handle exact upper-bound hit on the last bin
    if (idx === -1 && v === edges[n]) idx = n - 1;
    if (idx >= 0) counts[idx]++;
  }
  return counts;
}

/**
 * Path-averaged histogram for a single regime subset.
 *
 * @param trades    All trade records for this regime.
 * @param getValue  Extractor for the numeric value of interest.
 * @param edges     Pre-computed bin edges (shared across regimes for alignment).
 * @returns         Per-bin average count across all paths that had ≥1 trade.
 */
function pathAvgHistogram(
  trades: TradeRecord[],
  getValue: (t: TradeRecord) => number | null,
  edges: number[],
): number[] {
  const nBins = edges.length - 1;
  if (nBins <= 0) return [];

  // Per-path values
  const pathValues = new Map<number, number[]>();
  for (const t of trades) {
    const v = getValue(t);
    if (v == null) continue;
    const pid = t.backtest_path_id ?? -1;
    if (!pathValues.has(pid)) pathValues.set(pid, []);
    pathValues.get(pid)!.push(v);
  }

  if (pathValues.size === 0) return new Array(nBins).fill(0);

  // Accumulate per-path histogram counts
  const total = new Array<number>(nBins).fill(0);
  for (const vals of pathValues.values()) {
    const counts = binValues(vals, edges);
    counts.forEach((c, i) => { total[i] += c; });
  }

  // Divide by number of paths to get the average
  const nPaths = pathValues.size;
  return total.map((c) => parseFloat((c / nPaths).toFixed(2)));
}

// ---------------------------------------------------------------------------
// Win-rate distribution utilities
// ---------------------------------------------------------------------------

type RegimeKey = 0 | 1 | 2 | 3;

/**
 * Compute per-path win rate for a given regime.
 * Returns { mean, std, min, max, values[] } across all paths that had trades.
 */
function perPathWinRates(
  trades: TradeRecord[],
  regime: RegimeKey,
): { mean: number; std: number; min: number; max: number; n: number } {
  const pathData = new Map<number, { wins: number; total: number }>();
  for (const t of trades) {
    if (t.entry_regime !== regime || t.realized_pnl_pct == null) continue;
    const pid = t.backtest_path_id ?? -1;
    if (!pathData.has(pid)) pathData.set(pid, { wins: 0, total: 0 });
    const d = pathData.get(pid)!;
    d.total++;
    if (t.realized_pnl_pct > 0) d.wins++;
  }

  const rates: number[] = [];
  for (const { wins, total } of pathData.values()) {
    if (total > 0) rates.push(wins / total);
  }

  if (rates.length === 0) return { mean: 0, std: 0, min: 0, max: 0, n: 0 };

  const mean = rates.reduce((s, v) => s + v, 0) / rates.length;
  const variance = rates.reduce((s, v) => s + (v - mean) ** 2, 0) / rates.length;
  return {
    mean: parseFloat((mean * 100).toFixed(1)),
    std: parseFloat((Math.sqrt(variance) * 100).toFixed(1)),
    min: parseFloat((Math.min(...rates) * 100).toFixed(1)),
    max: parseFloat((Math.max(...rates) * 100).toFixed(1)),
    n: rates.length,
  };
}

// ---------------------------------------------------------------------------
// Chart constants
// ---------------------------------------------------------------------------

const N_BINS = 20;
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-popover)',
  borderColor: 'var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
};
const REGIMES: RegimeKey[] = [0, 1, 2, 3];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RegimeDistributionChartsProps {
  trades: TradeRecord[];
}

export default function RegimeDistributionCharts({ trades }: RegimeDistributionChartsProps) {
  // ── 1. Intra-trade drawdown (MAE) distribution by regime ────────────────
  // mae_pct is Maximum Adverse Excursion (≤0, negative = drawdown in trade).
  const drawdownChartData = useMemo(() => {
    const allMae = trades
      .map((t) => t.mae_pct)
      .filter((v): v is number => v != null);
    if (allMae.length === 0) return null;

    const edges = buildBinEdges(allMae, N_BINS);
    const nBins = edges.length - 1;

    const rows = Array.from({ length: nBins }, (_, i) => {
      const binLabel = `${edges[i].toFixed(1)}%`;
      const row: Record<string, string | number> = { bin: binLabel };
      for (const r of REGIMES) {
        const regimeTrades = trades.filter((t) => t.entry_regime === r);
        if (regimeTrades.length === 0) continue;
        const counts = pathAvgHistogram(
          regimeTrades,
          (t) => t.mae_pct,
          edges,
        );
        if (counts[i] > 0) row[REGIME_LABELS[r]] = counts[i];
      }
      return row;
    });

    const activeRegimes = REGIMES.filter((r) =>
      trades.some((t) => t.entry_regime === r && t.mae_pct != null),
    );
    return { rows, activeRegimes };
  }, [trades]);

  // ── 2. Win rate per path by regime (mean ± std bar + range) ─────────────
  const winRateData = useMemo(() => {
    return REGIMES.map((r) => {
      const stats = perPathWinRates(trades, r);
      if (stats.n === 0) return null;
      return {
        regime: REGIME_LABELS[r],
        mean: stats.mean,
        std: stats.std,
        min: stats.min,
        max: stats.max,
        n: stats.n,
        fill: REGIME_HEX[r],
        // upper/lower error bars as (mean±std) pairs for annotation
        upperBand: Math.min(100, parseFloat((stats.mean + stats.std).toFixed(1))),
        lowerBand: Math.max(0, parseFloat((stats.mean - stats.std).toFixed(1))),
      };
    }).filter(Boolean) as NonNullable<ReturnType<typeof perPathWinRates> & {
      regime: string; mean: number; std: number; fill: string; n: number;
      min: number; max: number; upperBand: number; lowerBand: number;
    }>[];
  }, [trades]);

  // ── 3. Trade duration distribution (holding_bars) ────────────────────────
  const durationChartData = useMemo(() => {
    const allBars = trades
      .map((t) => t.holding_bars)
      .filter((v): v is number => v != null);
    if (allBars.length === 0) return null;

    const edges = buildBinEdges(allBars, Math.min(N_BINS, 30));
    const nBins = edges.length - 1;

    // Path-averaged counts across all regimes
    const counts = pathAvgHistogram(trades, (t) => t.holding_bars, edges);

    return Array.from({ length: nBins }, (_, i) => ({
      bin: `${Math.round(edges[i])}b`,
      count: counts[i],
    })).filter((d) => d.count > 0);
  }, [trades]);

  // ── 4. Returns by regime (realized_pnl_pct) ─────────────────────────────
  const returnsChartData = useMemo(() => {
    const allRets = trades
      .map((t) => t.realized_pnl_pct)
      .filter((v): v is number => v != null);
    if (allRets.length === 0) return null;

    const edges = buildBinEdges(allRets, N_BINS);
    const nBins = edges.length - 1;

    const rows = Array.from({ length: nBins }, (_, i) => {
      const binLabel = `${edges[i].toFixed(1)}%`;
      const row: Record<string, string | number> = { bin: binLabel };
      for (const r of REGIMES) {
        const regimeTrades = trades.filter((t) => t.entry_regime === r);
        if (regimeTrades.length === 0) continue;
        const counts = pathAvgHistogram(
          regimeTrades,
          (t) => t.realized_pnl_pct,
          edges,
        );
        if (counts[i] > 0) row[REGIME_LABELS[r]] = counts[i];
      }
      return row;
    });

    const activeRegimes = REGIMES.filter((r) =>
      trades.some((t) => t.entry_regime === r && t.realized_pnl_pct != null),
    );
    return { rows, activeRegimes };
  }, [trades]);

  if (trades.length < 2) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chart 1: Drawdown distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Intra-Trade Drawdown by Regime</CardTitle>
            <CardDescription className="text-xs">
              Path-averaged MAE (Maximum Adverse Excursion) distribution. More negative = deeper
              intra-trade drawdown. Each bar is the avg count per CPCV path.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drawdownChartData ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={drawdownChartData.rows}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="bin"
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.floor(N_BINS / 5)}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, name: string) => [v.toFixed(2), name]}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    {drawdownChartData.activeRegimes.map((r) => (
                      <Bar
                        key={r}
                        dataKey={REGIME_LABELS[r]}
                        fill={REGIME_CHART_FILLS[r]}
                        stroke={REGIME_HEX[r]}
                        strokeWidth={1}
                        radius={[2, 2, 0, 0]}
                        stackId="dd"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-8 text-center">MAE data not available for this backtest.</p>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Win rate per path by regime */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Win Rate by Regime (Across CPCV Paths)</CardTitle>
            <CardDescription className="text-xs">
              Mean win rate per regime (bar) ± 1σ across CPCV paths. Variability reveals
              how regime-conditioned edge changes with walk-forward splits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {winRateData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={winRateData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="regime"
                      tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                      domain={[0, 100]}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, name: string) => {
                        if (name === 'mean') return [`${v}%`, 'Mean Win Rate'];
                        return [v, name];
                      }}
                      labelFormatter={(label: string) => {
                        const d = winRateData.find((r) => r.regime === label);
                        return d ? `${label} (n=${d.n} paths, range ${d.min}%–${d.max}%)` : label;
                      }}
                    />
                    <Bar dataKey="mean" name="mean" radius={[4, 4, 0, 0]}>
                      {winRateData.map((d, i) => (
                        <Cell key={i} fill={d.fill} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* ±1σ summary table */}
                <div className="mt-2 grid gap-x-4 gap-y-0.5 text-[10px]" style={{ gridTemplateColumns: `repeat(${winRateData.length}, 1fr)` }}>
                  {winRateData.map((d) => (
                    <div key={d.regime} className="text-center">
                      <span className="font-mono-data font-bold">{d.mean}%</span>
                      <span className="text-muted-foreground ml-1">±{d.std}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-8 text-center">No regime-labelled trades found.</p>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Trade duration distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Duration Distribution</CardTitle>
            <CardDescription className="text-xs">
              Path-averaged holding bars per trade. Long-tailed distributions suggest
              a mix of quick scalps and longer trend-following holds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {durationChartData && durationChartData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={durationChartData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="bin"
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.floor((durationChartData.length - 1) / 6)}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [v.toFixed(2), 'Avg trades/path']}
                      labelFormatter={(l: string) => `Duration: ${l}`}
                    />
                    <Bar dataKey="count" name="count" radius={[2, 2, 0, 0]}>
                      {durationChartData.map((_, i) => (
                        <Cell key={i} fill="var(--color-chart-3)" fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-8 text-center">Holding bar data not available.</p>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Returns distribution by regime */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Returns by Regime</CardTitle>
            <CardDescription className="text-xs">
              Path-averaged return distribution per market regime.
              Fat left tails in crisis vs. normal can reveal regime-sensitive tail risk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {returnsChartData ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={returnsChartData.rows}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="bin"
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.floor(N_BINS / 5)}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, name: string) => [v.toFixed(2), name]}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    {returnsChartData.activeRegimes.map((r) => (
                      <Bar
                        key={r}
                        dataKey={REGIME_LABELS[r]}
                        fill={REGIME_CHART_FILLS[r]}
                        stroke={REGIME_HEX[r]}
                        strokeWidth={1}
                        radius={[2, 2, 0, 0]}
                        stackId="ret"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-8 text-center">Return data not available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
