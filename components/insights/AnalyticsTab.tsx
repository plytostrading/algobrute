'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useBacktestExport, useBacktestTrades, useBacktestRegimeLabels } from '@/hooks/useBacktestWorkflow';
import { Skeleton } from '@/components/ui/skeleton';
import RegimeTimelineChart from '@/components/portfolio/RegimeTimelineChart';
import RegimeBreakdown from '@/components/portfolio/RegimeBreakdown';
import SectionInsightCard from '@/components/insights/SectionInsightCard';

interface AnalyticsTabProps {
  jobId: string | null;
}

export default function AnalyticsTab({ jobId }: AnalyticsTabProps) {
  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
    error: reportErrorObj,
  } = useBacktestExport(jobId, !!jobId);
  const {
    data: trades = [],
    isLoading: tradesLoading,
    isError: tradesError,
    error: tradesErrorObj,
  } = useBacktestTrades(jobId, !!jobId);
  // Regime labels carry per-date conviction scores; 404 (feature not available)
  // is handled gracefully inside the hook (retry: false) so we only use data when present.
  const { data: regimeLabels } = useBacktestRegimeLabels(jobId, !!jobId);

  // Monthly returns computed as the CPCV path-averaged monthly P&L.
  // Raw all_trade_records contains each trade replicated once per CPCV path
  // (e.g. C(10,2)=45 paths means each trade appears ~9 times). Naive summation
  // would inflate returns ~9x. Correct approach: group by backtest_path_id,
  // sum pct per month per path, then average across paths that have data in
  // that month. This is consistent with how the backend reports total_return_pct.
  const monthlyReturns = useMemo(() => {
    // Build per-path monthly return maps.
    const pathMaps = new Map<number, Map<string, number>>();
    for (const t of trades) {
      if (!t.exit_date || t.realized_pnl_pct == null) continue;
      const pid = t.backtest_path_id ?? -1;
      if (!pathMaps.has(pid)) pathMaps.set(pid, new Map());
      const monthMap = pathMaps.get(pid)!;
      const key = t.exit_date.slice(0, 7);
      monthMap.set(key, (monthMap.get(key) ?? 0) + t.realized_pnl_pct);
    }
    if (pathMaps.size === 0) return [];

    // Collect all months across paths.
    const allMonths = new Set<string>();
    for (const monthMap of pathMaps.values()) {
      for (const k of monthMap.keys()) allMonths.add(k);
    }

    // For each month: average return across paths that had trades in that month.
    return Array.from(allMonths)
      .sort()
      .map((month) => {
        const vals: number[] = [];
        for (const monthMap of pathMaps.values()) {
          const v = monthMap.get(month);
          if (v != null) vals.push(v);
        }
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        return { month: month.slice(5), value: parseFloat(avg.toFixed(2)) };
      });
  }, [trades]);

  const cumulativeReturns = useMemo(() => {
    let acc = 0;
    return monthlyReturns.map((r) => {
      acc += r.value;
      return { month: r.month, value: parseFloat(acc.toFixed(2)) };
    });
  }, [monthlyReturns]);

  if (!jobId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-sm text-muted-foreground">Select a completed backtest above to view analytics.</p>
          <Link href="/workbench" className="text-xs text-primary underline-offset-4 hover:underline">
            Run a backtest in the Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (reportError || tradesError) {
    const detail = reportErrorObj?.message ?? tradesErrorObj?.message ?? 'Failed to load analytics.';
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">{detail}</p>
          <p className="text-xs text-muted-foreground">
            Select another completed backtest from the selector, or rerun this backtest.
          </p>
          <Link href="/workbench" className="text-xs text-primary underline-offset-4 hover:underline">
            Open Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const s = report?.executive_summary;
  const ta = report?.trade_analytics;
  const dist = ta?.returns_distribution;
  const loading = reportLoading || tradesLoading;

  // Performance KPI row: 3 core + 4 ratio metrics
  const perfRow1 = [
    { label: 'Total Return', value: s?.total_return_pct != null ? `${s.total_return_pct >= 0 ? '+' : ''}${s.total_return_pct.toFixed(1)}%` : '\u2014', color: s?.total_return_pct != null ? (s.total_return_pct >= 0 ? 'text-success' : 'text-destructive') : '' },
    { label: 'CAGR', value: s?.cagr_pct != null ? `${s.cagr_pct >= 0 ? '+' : ''}${s.cagr_pct.toFixed(1)}%` : '\u2014', color: s?.cagr_pct != null ? (s.cagr_pct >= 0 ? 'text-success' : 'text-destructive') : '' },
    { label: 'Max Drawdown', value: s?.max_drawdown_pct != null ? `${s.max_drawdown_pct.toFixed(1)}%` : '\u2014', color: 'text-destructive' },
    { label: 'Win Rate', value: ta?.win_rate != null ? `${(ta.win_rate * 100).toFixed(1)}%` : '\u2014', color: ta?.win_rate != null ? (ta.win_rate >= 0.5 ? 'text-success' : 'text-destructive') : '' },
    { label: 'P. Factor', value: ta?.profit_factor != null ? ta.profit_factor.toFixed(2) : '\u2014', color: ta?.profit_factor != null ? (ta.profit_factor >= 1 ? 'text-success' : 'text-destructive') : '' },
  ];
  // Risk-adjusted ratios row
  const perfRow2 = [
    { label: 'Sharpe', value: s?.sharpe_ratio != null ? s.sharpe_ratio.toFixed(2) : '\u2014', color: s?.sharpe_ratio != null ? (s.sharpe_ratio >= 1 ? 'text-success' : s.sharpe_ratio >= 0 ? '' : 'text-destructive') : '' },
    { label: 'Sortino', value: s?.sortino_ratio != null ? s.sortino_ratio.toFixed(2) : '\u2014', color: s?.sortino_ratio != null ? (s.sortino_ratio >= 1 ? 'text-success' : s.sortino_ratio >= 0 ? '' : 'text-destructive') : '' },
    { label: 'Calmar', value: s?.calmar_ratio != null ? s.calmar_ratio.toFixed(2) : '\u2014', color: s?.calmar_ratio != null ? (s.calmar_ratio >= 0.5 ? 'text-success' : s.calmar_ratio >= 0 ? '' : 'text-destructive') : '' },
    { label: 'Omega', value: s?.omega_ratio != null ? s.omega_ratio.toFixed(2) : '\u2014', color: s?.omega_ratio != null ? (s.omega_ratio >= 1 ? 'text-success' : 'text-destructive') : '' },
    { label: 'Expectancy', value: s?.expectancy_pct != null ? `${s.expectancy_pct >= 0 ? '+' : ''}${s.expectancy_pct.toFixed(3)}%` : '\u2014', color: s?.expectancy_pct != null ? (s.expectancy_pct >= 0 ? 'text-success' : 'text-destructive') : '' },
  ];

  // Return distribution metrics
  const iqr = dist != null ? (dist.pct_75 - dist.pct_25) : null;
  const tailRatio = dist != null && dist.pct_5 < 0 ? (dist.pct_95 / Math.abs(dist.pct_5)) : null;
  const distMetrics = [
    { label: 'Expectancy / Trade', value: s?.expectancy_pct != null ? `${s.expectancy_pct >= 0 ? '+' : ''}${s.expectancy_pct.toFixed(3)}%` : (ta?.avg_return_pct != null ? `${ta.avg_return_pct >= 0 ? '+' : ''}${ta.avg_return_pct.toFixed(3)}%` : '\u2014') },
    { label: 'VaR-95 (5th pct)', value: dist?.pct_5 != null ? `${dist.pct_5.toFixed(2)}%` : (s?.var_95_pct != null ? `${s.var_95_pct.toFixed(2)}%` : '\u2014') },
    { label: 'CVaR-95', value: s?.cvar_95_pct != null ? `${s.cvar_95_pct.toFixed(2)}%` : '\u2014' },
    { label: 'P95 Return', value: dist?.pct_95 != null ? `${dist.pct_95 >= 0 ? '+' : ''}${dist.pct_95.toFixed(2)}%` : '\u2014' },
    { label: 'IQR', value: iqr != null ? `${iqr.toFixed(2)}%` : '\u2014' },
    { label: 'Tail Ratio', value: tailRatio != null ? tailRatio.toFixed(2) : '\u2014' },
    { label: 'Skewness', value: dist?.skewness != null ? dist.skewness.toFixed(2) : '\u2014' },
    { label: 'Kurtosis (excess)', value: dist?.kurtosis != null ? dist.kurtosis.toFixed(2) : '\u2014' },
    { label: 'MFE (avg)', value: ta?.avg_mfe_pct != null ? `${ta.avg_mfe_pct.toFixed(2)}%` : '\u2014' },
    { label: 'MAE (avg)', value: ta?.avg_mae_pct != null ? `${ta.avg_mae_pct.toFixed(2)}%` : '\u2014' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI overview insight — verdict before the numbers */}
      <SectionInsightCard jobId={jobId} sectionKey="kpi_overview" />

      {/* KPI Row 1: Core performance metrics */}
      <div className="grid gap-4 sm:grid-cols-5">
        {perfRow1.map((m) => (
          <Card key={m.label} className="gap-1 py-3">
            <CardHeader className="pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-7 w-20" /> : <span className={`font-mono-data text-xl font-bold ${m.color}`}>{m.value}</span>}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* KPI Row 2: Risk-adjusted ratio metrics */}
      <div className="grid gap-4 sm:grid-cols-5">
        {perfRow2.map((m) => (
          <Card key={m.label} className="gap-1 py-3">
            <CardHeader className="pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-7 w-20" /> : <span className={`font-mono-data text-xl font-bold ${m.color}`}>{m.value}</span>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Returns</CardTitle>
            <CardDescription>P&L % grouped by exit month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {monthlyReturns.length === 0 ? (
                <div className="text-center pt-10">
                  <p className="text-xs text-muted-foreground">No closed trades found for this backtest yet.</p>
                  <Link href="/workbench" className="text-[11px] text-primary underline-offset-4 hover:underline">
                    Rerun backtest with a wider date range →
                  </Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}%`, 'Return']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {monthlyReturns.map((entry, i) => (
                        <Cell key={i} fill={entry.value >= 0 ? 'var(--color-success)' : 'var(--color-destructive)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative Returns</CardTitle>
            <CardDescription>Running total P&L %</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {cumulativeReturns.length === 0 ? (
                <div className="text-center pt-10">
                  <p className="text-xs text-muted-foreground">No cumulative series available yet.</p>
                  <Link href="/workbench" className="text-[11px] text-primary underline-offset-4 hover:underline">
                    Run or rerun backtest →
                  </Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeReturns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(v: number) => [`${v}%`, 'Cumulative']}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {trades.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Regime Timeline</CardTitle>
            <CardDescription>Regime at trade entry — continuous view across the backtest</CardDescription>
          </CardHeader>
          <CardContent>
            <RegimeTimelineChart trades={trades} regimeLabels={regimeLabels} />
            <RegimeBreakdown trades={trades} regimeLabels={regimeLabels} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Return Distribution</CardTitle>
          <CardDescription>
            Full distribution profile: edge, tail risk, and dispersion.
            Tail Ratio = P95 / |P5| (&gt;1 → right-skewed wins outpace left-tail losses).
            Kurtosis &gt;0 indicates fat tails vs. normal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionInsightCard jobId={jobId} sectionKey="return_distribution" className="mb-4" />
          <div className="grid grid-cols-5 gap-4">
            {distMetrics.map((m) => (
              <div key={m.label}>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</span>
                {loading ? <Skeleton className="h-6 w-16 mt-1" /> : <span className="font-mono-data text-base font-bold">{m.value}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
