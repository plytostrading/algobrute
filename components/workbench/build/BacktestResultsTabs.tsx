'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import WalkForwardTab from './WalkForwardTab';
import MonteCarloTab from './MonteCarloTab';
import { mockBacktestResult } from '@/mock/mockData';
import { formatCurrency, formatMetric } from '@/utils/formatters';
import type { BacktestMetric } from '@/types';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

// ---------- Equity Curve Tab ----------
function EquityCurveTab() {
  const bt = mockBacktestResult;

  const chartData = bt.equityCurve.map((d) => ({
    date: d.time.toISOString().slice(0, 10),
    equity: d.value,
    regime: d.regime,
  }));

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
              formatter={(v: number) => [formatCurrency(v), 'Equity']}
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

      {/* Summary metrics */}
      <div className="grid grid-cols-4 divide-x rounded-md border">
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total Return</span>
          <span className="font-mono-data text-sm font-bold text-success">+{bt.totalReturn}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sharpe</span>
          <span className="font-mono-data text-sm font-bold">{bt.sharpe.toFixed(2)}</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Max Drawdown</span>
          <span className="font-mono-data text-sm font-bold text-destructive">{bt.maxDrawdown}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Win Rate</span>
          <span className="font-mono-data text-sm font-bold">{bt.winRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Detailed Metrics Tab ----------
function MetricBlock({ title, metrics }: { title: string; metrics: BacktestMetric[] }) {
  return (
    <div className="rounded-md border p-3">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="grid grid-cols-5 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {m.label}
            </span>
            <span className="font-mono-data text-base font-bold">
              {formatMetric(m.value, m.format)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailedMetricsTab() {
  const bt = mockBacktestResult;

  const performanceMetrics: BacktestMetric[] = [
    { label: 'Total Return', value: bt.totalReturn, format: 'percent' },
    { label: 'Total P&L', value: bt.totalReturnDollar, format: 'currency' },
    { label: 'Sharpe', value: bt.sharpe, format: 'ratio' },
    { label: 'Sortino', value: bt.sortino, format: 'ratio' },
    { label: 'Calmar', value: bt.calmar, format: 'ratio' },
  ];

  const riskMetrics: BacktestMetric[] = [
    { label: 'Max DD', value: bt.maxDrawdown, format: 'percent' },
    { label: 'Max DD ($)', value: bt.maxDrawdownDollar, format: 'currency' },
    { label: 'Best Trade', value: bt.bestTrade, format: 'currency' },
    { label: 'Worst Trade', value: bt.worstTrade, format: 'currency' },
    { label: 'Avg Hold', value: bt.avgHoldingPeriod, format: 'number' },
  ];

  const tradeMetrics: BacktestMetric[] = [
    { label: 'Total Trades', value: bt.totalTrades, format: 'number' },
    { label: 'Win Rate', value: bt.winRate, format: 'percent' },
    { label: 'P. Factor', value: bt.profitFactor, format: 'ratio' },
    { label: 'Avg Win', value: bt.avgWin, format: 'currency' },
    { label: 'Avg Loss', value: bt.avgLoss, format: 'currency' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <MetricBlock title="Performance" metrics={performanceMetrics} />
      <MetricBlock title="Risk" metrics={riskMetrics} />
      <MetricBlock title="Trade Statistics" metrics={tradeMetrics} />
    </div>
  );
}

// ---------- Main Tabbed Container ----------
export default function BacktestResultsTabs() {
  const [activeTab, setActiveTab] = useState('equity');

  return (
    <Card className="flex flex-col py-0 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
        <div className="border-b px-4 pt-3">
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto" variant="line">
            <TabsTrigger value="equity" className="text-xs">Equity Curve</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="walkforward" className="text-xs">Walk Forward</TabsTrigger>
            <TabsTrigger value="montecarlo" className="text-xs">Monte Carlo</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="equity" className="mt-0">
            <EquityCurveTab />
          </TabsContent>
          <TabsContent value="metrics" className="mt-0">
            <DetailedMetricsTab />
          </TabsContent>
          <TabsContent value="walkforward" className="mt-0">
            <WalkForwardTab />
          </TabsContent>
          <TabsContent value="montecarlo" className="mt-0">
            <MonteCarloTab />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
