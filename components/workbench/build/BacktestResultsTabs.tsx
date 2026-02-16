'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import TerminalLabel from '@/components/common/TerminalLabel';
import MetricGrid from '@/components/common/MetricGrid';
import WalkForwardTab from './WalkForwardTab';
import MonteCarloTab from './MonteCarloTab';
import { mockBacktestResult } from '@/mock/mockData';
import { formatCurrency } from '@/utils/formatters';
import type { BacktestMetric, RegimeType } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

// ---------- Equity Curve Tab ----------
function EquityCurveTab() {
  const bt = mockBacktestResult;

  // Transform equity curve data for Recharts
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
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
              stroke="var(--muted-foreground)"
              tickFormatter={(d: string) => {
                const dt = new Date(d);
                return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              tick={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
              stroke="var(--muted-foreground)"
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--card)',
              }}
              formatter={(v: number) => [formatCurrency(v), 'Equity']}
              labelFormatter={(l: string) => new Date(l).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
            <Area
              type="natural"
              dataKey="equity"
              stroke="#16A34A"
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary metrics alongside equity curve */}
      <div className="grid grid-cols-4 divide-x rounded-md border">
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">TOTAL RETURN</span>
          <span className="numeric-data text-sm font-bold text-success">+{bt.totalReturn}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">SHARPE</span>
          <span className="numeric-data text-sm font-bold">{bt.sharpe.toFixed(2)}</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">MAX DRAWDOWN</span>
          <span className="numeric-data text-sm font-bold text-destructive">{bt.maxDrawdown}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">WIN RATE</span>
          <span className="numeric-data text-sm font-bold">{bt.winRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Detailed Metrics Tab ----------
function DetailedMetricsTab() {
  const bt = mockBacktestResult;

  const performanceMetrics: BacktestMetric[] = [
    { label: 'TOTAL RETURN', value: bt.totalReturn, format: 'percent' },
    { label: 'TOTAL P&L', value: bt.totalReturnDollar, format: 'currency' },
    { label: 'SHARPE', value: bt.sharpe, format: 'ratio' },
    { label: 'SORTINO', value: bt.sortino, format: 'ratio' },
    { label: 'CALMAR', value: bt.calmar, format: 'ratio' },
  ];

  const riskMetrics: BacktestMetric[] = [
    { label: 'MAX DD', value: bt.maxDrawdown, format: 'percent' },
    { label: 'MAX DD ($)', value: bt.maxDrawdownDollar, format: 'currency' },
    { label: 'BEST TRADE', value: bt.bestTrade, format: 'currency' },
    { label: 'WORST TRADE', value: bt.worstTrade, format: 'currency' },
    { label: 'AVG HOLD', value: bt.avgHoldingPeriod, format: 'number' },
  ];

  const tradeMetrics: BacktestMetric[] = [
    { label: 'TOTAL TRADES', value: bt.totalTrades, format: 'number' },
    { label: 'WIN RATE', value: bt.winRate, format: 'percent' },
    { label: 'P. FACTOR', value: bt.profitFactor, format: 'ratio' },
    { label: 'AVG WIN', value: bt.avgWin, format: 'currency' },
    { label: 'AVG LOSS', value: bt.avgLoss, format: 'currency' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Performance */}
      <div className="rounded-md border p-3">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">PERFORMANCE</span>
        <MetricGrid metrics={performanceMetrics} columns={5} />
      </div>

      {/* Risk */}
      <div className="rounded-md border p-3">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">RISK</span>
        <MetricGrid metrics={riskMetrics} columns={5} />
      </div>

      {/* Trade Statistics */}
      <div className="rounded-md border p-3">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">TRADE STATISTICS</span>
        <MetricGrid metrics={tradeMetrics} columns={5} />
      </div>
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
