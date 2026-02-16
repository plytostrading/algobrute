'use client';

import { Lightbulb } from 'lucide-react';
import { mockBacktestResult, mockUserProfile } from '@/mock/mockData';
import { formatCurrency } from '@/utils/formatters';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

export default function MonteCarloTab() {
  const mc = mockBacktestResult.monteCarlo;
  const capital = mockUserProfile.capitalBase;
  const savingsComparison = capital * 0.05;

  const narrative = `Based on ${mc.simulationsCount.toLocaleString()} simulations of randomized trade sequences, there's an ${mc.probOfProfit}% chance this strategy is profitable over the next year. The median outcome adds ${formatCurrency(mc.medianReturnDollar)} to your ${formatCurrency(capital)} capital. In the worst 5% of scenarios, you could lose up to ${formatCurrency(Math.abs(mc.percentile5Dollar))}. Risk of ruin is extremely low at ${mc.riskOfRuin}%.`;

  return (
    <div className="flex flex-col gap-3">
      {/* Narrative */}
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed text-foreground">{narrative}</p>
      </div>

      {/* Fan Chart */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mc.distribution} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Weeks',
                position: 'insideBottom',
                offset: -2,
                style: { fontSize: 10, fill: 'var(--color-muted-foreground)' },
              }}
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
              labelFormatter={(l: number) => `Week ${l}`}
              formatter={(v: number, name: string) => {
                const labels: Record<string, string> = {
                  p95: 'Best case (95th)',
                  p75: '75th percentile',
                  median: 'Median',
                  p25: '25th percentile',
                  p5: 'Worst case (5th)',
                };
                return [formatCurrency(v), labels[name] || name];
              }}
            />
            {/* Outer band: p5 to p95 */}
            <Area type="natural" dataKey="p95" stroke="none" fill="var(--color-chart-2)" fillOpacity={0.06} />
            <Area type="natural" dataKey="p5" stroke="none" fill="transparent" fillOpacity={0} />
            {/* Inner band: p25 to p75 */}
            <Area type="natural" dataKey="p75" stroke="none" fill="var(--color-chart-2)" fillOpacity={0.12} />
            <Area type="natural" dataKey="p25" stroke="none" fill="transparent" fillOpacity={0} />
            {/* Median line */}
            <Line type="natural" dataKey="median" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={false} />
            {/* Worst case dashed */}
            <Line type="natural" dataKey="p5" stroke="var(--color-chart-4)" strokeWidth={1} strokeDasharray="4 2" dot={false} />
            {/* Best case dashed */}
            <Line type="natural" dataKey="p95" stroke="var(--color-chart-2)" strokeWidth={1} strokeDasharray="4 2" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart legend */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t-2 border-dashed border-success" />
          <span className="text-[10px] text-muted-foreground">Best case (P95)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-[3px] w-4 rounded-sm bg-success" />
          <span className="text-[10px] text-muted-foreground">Median</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t-2 border-dashed border-destructive" />
          <span className="text-[10px] text-muted-foreground">Worst case (P5)</span>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-4 divide-x rounded-md border">
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Prob of Profit</span>
          <span className="font-mono-data text-sm font-bold">{mc.probOfProfit}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Median Gain</span>
          <span className="font-mono-data text-sm font-bold text-success">+{formatCurrency(mc.medianReturnDollar)}</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Worst Case (5th)</span>
          <span className="font-mono-data text-sm font-bold text-destructive">{formatCurrency(mc.percentile5Dollar)}</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Risk of Ruin</span>
          <span className="font-mono-data text-sm font-bold">&lt;{mc.riskOfRuin}%</span>
        </div>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-3 divide-x rounded-md border">
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Median Max DD</span>
          <span className="font-mono-data text-sm font-bold text-destructive">-{mc.maxDrawdownMedian}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Best Case (95th)</span>
          <span className="font-mono-data text-sm font-bold text-success">+{mc.percentile95}% (+{formatCurrency(mc.percentile95Dollar)})</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Simulations</span>
          <span className="font-mono-data text-sm font-bold">{mc.simulationsCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Contextual comparison */}
      <p className="px-1 text-[11px] italic leading-relaxed text-muted-foreground">
        For context: a high-yield savings account would earn ~{formatCurrency(savingsComparison)}/yr on {formatCurrency(capital)}.
        This strategy&apos;s median outcome is{' '}
        <span className="font-mono-data font-semibold">{(mc.medianReturnDollar / savingsComparison).toFixed(1)}×</span>{' '}
        that return — but with meaningful risk of drawdown. The {mc.probOfProfit}% probability of profit means roughly{' '}
        <span className="font-mono-data font-semibold">{Math.round(100 - mc.probOfProfit)}%</span> of the time you could end the year with less than you started.
      </p>
    </div>
  );
}
