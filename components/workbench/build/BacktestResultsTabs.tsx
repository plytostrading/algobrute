'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import WalkForwardTab from './WalkForwardTab';
import MonteCarloTab from './MonteCarloTab';
import { useBacktestChartData } from '@/hooks/useBacktestChartData';
import { REGIME_CHART_FILLS } from '@/lib/colors';
import { REGIME_LABELS } from '@/lib/regimeLabel';
import type { BacktestExportReport, CPCVChartData, Regime, TradeRecord } from '@/types/api';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, ComposedChart, Line, ReferenceArea,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types for the fan chart internal data model
// ---------------------------------------------------------------------------

interface TimePoint {
  ts: number;       // UTC ms timestamp for the time-scale XAxis
  date: string;     // "YYYY-MM-DD" for tooltip
  equity: number;   // equity value (1.0 = initial capital)
}

// ---------------------------------------------------------------------------
// CPCVEquityCurveTab — main component using real chart data from the API
// ---------------------------------------------------------------------------

interface CPCVEquityCurveTabProps {
  jobId: string;
  trades: TradeRecord[];
  initialCapital: number;
}

function CPCVEquityCurveTab({ jobId, trades, initialCapital }: CPCVEquityCurveTabProps) {
  const chartQuery = useBacktestChartData(jobId, true);
  const chartData: CPCVChartData | null | undefined = chartQuery.data;

  // Convert mean curve to time-scaled array for the ComposedChart base data.
  const meanPoints = useMemo<TimePoint[]>(() => {
    if (!chartData?.mean_curve) return [];
    return chartData.mean_curve.map((p) => ({
      ts: new Date(p.date).getTime(),
      date: p.date,
      equity: p.equity,
    }));
  }, [chartData]);

  // Convert each path's points to time-scaled arrays.
  const pathPoints = useMemo<TimePoint[][]>(() => {
    if (!chartData?.paths) return [];
    return chartData.paths.map((path) =>
      path.points.map((p) => ({
        ts: new Date(p.date).getTime(),
        date: p.date,
        equity: p.equity,
      }))
    );
  }, [chartData]);

  // Convert regime bands to timestamp-based x1/x2 pairs.
  const regimeBands = useMemo(() => {
    if (!chartData?.regime_bands) return [];
    return chartData.regime_bands.map((b) => ({
      x1: new Date(b.start_date).getTime(),
      x2: new Date(b.end_date + 'T23:59:59').getTime(),
      regime: b.regime,
    }));
  }, [chartData]);

  // Loading state
  if (chartQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        Loading CPCV chart…
      </div>
    );
  }

  // Fallback: if chart data is unavailable (legacy job or build failed),
  // render the simple aggregate equity curve from trade records.
  if (!chartData || meanPoints.length === 0) {
    return <FallbackEquityCurveTab trades={trades} initialCapital={initialCapital} />;
  }

  const tooltipStyle = {
    backgroundColor: 'var(--color-popover)',
    borderColor: 'var(--color-border)',
    borderRadius: '8px',
    fontSize: '12px',
  };

  const positiveReturn = chartData.mean_curve.length > 0
    ? chartData.mean_curve[chartData.mean_curve.length - 1].equity - 1.0
    : 0;
  const positivePaths = chartData.paths.filter((p) => {
    const last = p.points[p.points.length - 1];
    return last ? last.equity >= 1.0 : false;
  }).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Fan chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={meanPoints}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="cpcvMeanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.12} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />

            {/* Regime background bands */}
            {regimeBands.map((b, i) => (
              <ReferenceArea
                key={i}
                x1={b.x1}
                x2={b.x2}
                fill={REGIME_CHART_FILLS[b.regime]}
                fillOpacity={0.3}
                strokeOpacity={0}
              />
            ))}

            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(ms: number) =>
                new Date(ms).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }
              minTickGap={70}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${((v - 1) * 100).toFixed(0)}%`}
              domain={['auto', 'auto']}
              width={52}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [
                `${((v - 1) * 100).toFixed(2)}%`,
                'Mean return',
              ]}
              labelFormatter={(ms: number) =>
                new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              }
            />

            {/* CPCV path fan — each path is a faint independent line */}
            {pathPoints.map((pts, i) => (
              <Line
                key={i}
                data={pts}
                dataKey="equity"
                xAxisId={0}
                dot={false}
                activeDot={false}
                stroke="var(--color-chart-2)"
                strokeWidth={0.75}
                strokeOpacity={0.2}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}

            {/* Mean equity curve — bold foreground line */}
            <Area
              type="monotone"
              dataKey="equity"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
              fill="url(#cpcvMeanGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Regime legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {([0, 1, 2, 3] as Regime[]).map((r) => (
          <div key={r} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: REGIME_CHART_FILLS[r] }}
            />
            <span className="text-[10px] text-muted-foreground">{REGIME_LABELS[r]}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] italic text-muted-foreground/60">
          regime shading from walk-forward labels
        </span>
      </div>

      {/* CPCV stats row */}
      <div className="grid grid-cols-4 divide-x rounded-md border">
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Mean Sharpe</span>
          <span className={`font-mono-data text-sm font-bold ${
            chartData.mean_sharpe >= 1 ? 'text-success' : chartData.mean_sharpe >= 0 ? '' : 'text-destructive'
          }`}>{chartData.mean_sharpe.toFixed(2)}</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Path Consistency</span>
          <span className={`font-mono-data text-sm font-bold ${
            chartData.path_consistency >= 0.7 ? 'text-success' : chartData.path_consistency >= 0.5 ? 'text-warning' : 'text-destructive'
          }`}>{(chartData.path_consistency * 100).toFixed(0)}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Overfit Risk (PBO)</span>
          <span className={`font-mono-data text-sm font-bold ${
            chartData.pbo_probability < 0.3 ? 'text-success' : chartData.pbo_probability < 0.5 ? 'text-warning' : 'text-destructive'
          }`}>{(chartData.pbo_probability * 100).toFixed(0)}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Paths Profitable</span>
          <span className="font-mono-data text-sm font-bold">{positivePaths}/{chartData.n_paths}</span>
        </div>
      </div>

      {positiveReturn !== 0 && (
        <p className="px-1 text-[11px] italic text-muted-foreground">
          Mean return across {chartData.n_paths} CPCV paths:
          {' '}<span className={`font-mono-data font-semibold ${
            positiveReturn > 0 ? 'text-success' : 'text-destructive'
          }`}>{positiveReturn > 0 ? '+' : ''}{(positiveReturn * 100).toFixed(2)}%</span>
          {' '}· faint lines = individual paths, bold = mean
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FallbackEquityCurveTab — simple aggregate curve when chart data unavailable
// ---------------------------------------------------------------------------

function FallbackEquityCurveTab({ trades, initialCapital }: { trades: TradeRecord[]; initialCapital: number }) {
  const chartData = useMemo(() => {
    const sorted = [...trades]
      .filter((t) => t.exit_date !== null && t.realized_pnl !== null)
      .sort((a, b) => a.exit_date!.localeCompare(b.exit_date!));
    let equity = initialCapital;
    return sorted.map((t) => {
      equity += t.realized_pnl!;
      return { date: t.exit_date!, equity };
    });
  }, [trades, initialCapital]);

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="btEquityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d: string) => {
                const dt = new Date(d);
                return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelFormatter={(l: string) => new Date(l).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              fill="url(#btEquityGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {chartData.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No completed trades to display equity curve.</p>
      )}
    </div>
  );
}

// ---------- Detailed Metrics Tab ----------
type MetricRow = { label: string; value: string; positive?: boolean };

function MetricBlock({ title, rows }: { title: string; rows: MetricRow[] }) {
  return (
    <div className="rounded-md border p-3">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="grid grid-cols-5 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{r.label}</span>
            <span className={`font-mono-data text-base font-bold ${r.positive === true ? 'text-success' : r.positive === false ? 'text-destructive' : ''}` }>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailedMetricsTab({ report }: { report: BacktestExportReport }) {
  const s = report.executive_summary;
  const ta = report.trade_analytics;

  const perfRows: MetricRow[] = [
    { label: 'Total Return', value: s.total_return_pct != null ? `${s.total_return_pct >= 0 ? '+' : ''}${s.total_return_pct.toFixed(1)}%` : '\u2014', positive: s.total_return_pct != null ? s.total_return_pct >= 0 : undefined },
    { label: 'Sharpe', value: s.sharpe_ratio != null ? s.sharpe_ratio.toFixed(2) : '\u2014' },
    { label: 'Win Rate', value: s.win_rate != null ? `${(s.win_rate * 100).toFixed(1)}%` : '\u2014' },
    { label: 'P. Factor', value: s.profit_factor != null ? s.profit_factor.toFixed(2) : '\u2014' },
    { label: 'Payoff Ratio', value: s.payoff_ratio != null ? s.payoff_ratio.toFixed(2) : '\u2014' },
  ];

  const riskRows: MetricRow[] = [
    { label: 'Max DD', value: s.max_drawdown_pct != null ? `${s.max_drawdown_pct.toFixed(1)}%` : '\u2014', positive: false },
    { label: 'Trades', value: String(s.n_trades) },
    { label: 'Avg Return', value: s.avg_return_pct != null ? `${s.avg_return_pct.toFixed(2)}%` : '\u2014' },
    { label: 'Ret Std', value: s.return_std_pct != null ? `${s.return_std_pct.toFixed(2)}%` : '\u2014' },
    { label: 'Avg Hold', value: ta?.avg_holding_bars != null ? `${ta.avg_holding_bars.toFixed(0)} bars` : '\u2014' },
  ];

  const advRows: MetricRow[] = [
    { label: 'Reliability', value: s.reliability_score != null ? `${(s.reliability_score * 100).toFixed(0)}%` : '\u2014' },
    { label: 'PBO', value: s.pbo_probability != null ? `${(s.pbo_probability * 100).toFixed(0)}%` : '\u2014' },
    { label: 'Path Consist.', value: s.path_consistency != null ? `${(s.path_consistency * 100).toFixed(0)}%` : '\u2014' },
    { label: 'MC p-value', value: s.mc_overall_p_value != null ? s.mc_overall_p_value.toFixed(3) : '\u2014' },
    { label: 'Approved', value: s.deployment_approved === true ? '\u2713 Yes' : s.deployment_approved === false ? '\u2717 No' : '\u2014', positive: s.deployment_approved === true ? true : s.deployment_approved === false ? false : undefined },
  ];

  // Risk-adjusted ratios — populated from overall_performance (non-null for
  // jobs with report_json; null for legacy jobs pre-dating that column).
  const ratioRows: MetricRow[] = [
    { label: 'Sortino', value: s.sortino_ratio != null ? s.sortino_ratio.toFixed(2) : '\u2014', positive: s.sortino_ratio != null ? s.sortino_ratio >= 1 : undefined },
    { label: 'Calmar', value: s.calmar_ratio != null ? s.calmar_ratio.toFixed(2) : '\u2014', positive: s.calmar_ratio != null ? s.calmar_ratio >= 0.5 : undefined },
    { label: 'Omega', value: s.omega_ratio != null ? s.omega_ratio.toFixed(2) : '\u2014', positive: s.omega_ratio != null ? s.omega_ratio >= 1 : undefined },
    { label: 'CAGR', value: s.cagr_pct != null ? `${s.cagr_pct >= 0 ? '+' : ''}${s.cagr_pct.toFixed(1)}%` : '\u2014', positive: s.cagr_pct != null ? s.cagr_pct >= 0 : undefined },
    { label: 'Expectancy', value: s.expectancy_pct != null ? `${s.expectancy_pct >= 0 ? '+' : ''}${s.expectancy_pct.toFixed(3)}%` : '\u2014', positive: s.expectancy_pct != null ? s.expectancy_pct >= 0 : undefined },
  ];
  const dist = ta?.returns_distribution;
  const tailRows: MetricRow[] = [
    { label: 'VaR-95', value: s.var_95_pct != null ? `${s.var_95_pct.toFixed(2)}%` : (dist?.pct_5 != null ? `${dist.pct_5.toFixed(2)}%` : '\u2014'), positive: false },
    { label: 'CVaR-95', value: s.cvar_95_pct != null ? `${s.cvar_95_pct.toFixed(2)}%` : '\u2014', positive: false },
    { label: 'Skewness', value: dist?.skewness != null ? dist.skewness.toFixed(2) : '\u2014' },
    { label: 'Kurtosis', value: dist?.kurtosis != null ? dist.kurtosis.toFixed(2) : '\u2014' },
    { label: 'Max Streak\u2212', value: ta?.max_consecutive_losses != null ? String(ta.max_consecutive_losses) : '\u2014', positive: false },
  ];

  return (
    <div className="flex flex-col gap-3">
      <MetricBlock title="Performance" rows={perfRows} />
      <MetricBlock title="Risk" rows={riskRows} />
      <MetricBlock title="Risk-Adjusted Ratios" rows={ratioRows} />
      <MetricBlock title="Tail Risk" rows={tailRows} />
      <MetricBlock title="Advanced" rows={advRows} />
    </div>
  );
}

// ---------- Main Tabbed Container ----------
interface BacktestResultsTabsProps {
  jobId: string;
  report: BacktestExportReport;
  trades: TradeRecord[];
}

export default function BacktestResultsTabs({ jobId, report, trades }: BacktestResultsTabsProps) {
  const [activeTab, setActiveTab] = useState('equity');
  const initialCapital = report.metadata.initial_capital;

  return (
    <Card className="flex flex-col py-0 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
        <div className="border-b px-4 pt-3">
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto" variant="line">
            <TabsTrigger value="equity" className="text-xs">Equity Curve</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="walkforward" className="text-xs">CPCV Paths</TabsTrigger>
            <TabsTrigger value="montecarlo" className="text-xs">Monte Carlo</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="equity" className="mt-0">
            <CPCVEquityCurveTab jobId={jobId} trades={trades} initialCapital={initialCapital} />
          </TabsContent>
          <TabsContent value="metrics" className="mt-0">
            <DetailedMetricsTab report={report} />
          </TabsContent>
          <TabsContent value="walkforward" className="mt-0">
            <WalkForwardTab cpcv={report.cpcv_analysis} />
          </TabsContent>
          <TabsContent value="montecarlo" className="mt-0">
            <MonteCarloTab mc={report.monte_carlo_analysis} bootstrap={report.bootstrap_analysis} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
