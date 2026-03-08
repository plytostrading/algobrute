'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import WalkForwardTab from './WalkForwardTab';
import MonteCarloTab from './MonteCarloTab';
import SectionInsightCard from '@/components/insights/SectionInsightCard';
import { useBacktestChartData } from '@/hooks/useBacktestChartData';
import type { BacktestExportReport, CPCVChartData, TradeRecord } from '@/types/api';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';

// ---------------------------------------------------------------------------
// EquityCurveTab — area chart of actual cumulative equity from backtest trades
// ---------------------------------------------------------------------------

interface CPCVEquityCurveTabProps {
  jobId: string;
  trades: TradeRecord[];
  initialCapital: number;
}

function CPCVEquityCurveTab({ jobId, trades, initialCapital }: CPCVEquityCurveTabProps) {
  // CPCV summary stats — used only for the stats row, not the chart itself.
  const chartQuery = useBacktestChartData(jobId, true);
  const chartData: CPCVChartData | null | undefined = chartQuery.data;

  const chartData2 = useMemo(() => {
    const sorted = [...trades]
      .filter((t) => t.exit_date !== null && t.realized_pnl !== null)
      .sort((a, b) => a.exit_date!.localeCompare(b.exit_date!));
    let equity = initialCapital;
    return sorted.map((t) => {
      equity += t.realized_pnl!;
      return { date: t.exit_date!, equity };
    });
  }, [trades, initialCapital]);

  const positivePaths = chartData
    ? chartData.paths.filter((p) => {
        const last = p.points[p.points.length - 1];
        return last ? last.equity >= 1.0 : false;
      }).length
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData2} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
              tickFormatter={(d: string) =>
                new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }
              interval={Math.floor(chartData2.length / 8)}
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
              formatter={(v: number) => [`$${(v as number).toLocaleString()}`, 'Equity']}
              labelFormatter={(l: string) =>
                new Date(l).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }
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

      {chartData2.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No completed trades to display equity curve.</p>
      )}

      {chartData && (
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

function DetailedMetricsTab({ jobId, report }: { jobId: string; report: BacktestExportReport }) {
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
      <SectionInsightCard jobId={jobId} sectionKey="detailed_metrics" />
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
            <DetailedMetricsTab jobId={jobId} report={report} />
          </TabsContent>
          <TabsContent value="walkforward" className="mt-0">
            <WalkForwardTab cpcv={report.cpcv_analysis} />
          </TabsContent>
          <TabsContent value="montecarlo" className="mt-0">
            <MonteCarloTab
              jobId={jobId}
              mc={report.monte_carlo_analysis}
              bootstrap={report.bootstrap_analysis}
              initialCapital={initialCapital}
            />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
