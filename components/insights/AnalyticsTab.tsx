'use client';

import { Card, CardContent } from '@/components/ui/card';
import TerminalLabel from '@/components/common/TerminalLabel';
import MetricGrid from '@/components/common/MetricGrid';
import ProgressBar from '@/components/common/ProgressBar';
import type { BacktestMetric } from '@/types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const perfMetrics: BacktestMetric[] = [
  { label: 'TOTAL RETURN', value: 12.45, format: 'percent' },
  { label: 'SHARPE', value: 1.82, format: 'ratio' },
  { label: 'SORTINO', value: 2.47, format: 'ratio' },
  { label: 'MAX DD', value: -8.3, format: 'percent' },
  { label: 'CALMAR', value: 1.50, format: 'ratio' },
];

const monthlyReturns = [
  { month: 'Jan', value: 1.2 }, { month: 'Feb', value: -0.8 }, { month: 'Mar', value: 2.1 },
  { month: 'Apr', value: 0.5 }, { month: 'May', value: -1.3 }, { month: 'Jun', value: 3.2 },
  { month: 'Jul', value: 1.8 }, { month: 'Aug', value: -0.4 }, { month: 'Sep', value: 2.5 },
  { month: 'Oct', value: 1.1 }, { month: 'Nov', value: -0.6 }, { month: 'Dec', value: 1.9 },
];

const cumulativeReturns = monthlyReturns.reduce<{ month: string; value: number }[]>((acc, r) => {
  const last = acc.length > 0 ? acc[acc.length - 1].value : 0;
  acc.push({ month: r.month, value: last + r.value });
  return acc;
}, []);

const behavioralMetrics = [
  { label: 'Plan Adherence', value: 87, color: 'success' as const },
  { label: 'Early Exit Rate', value: 23, color: 'warning' as const },
  { label: 'Revenge Trading', value: 8, color: 'success' as const },
  { label: 'Overtrading Score', value: 15, color: 'success' as const },
  { label: 'Position Sizing Accuracy', value: 92, color: 'success' as const },
];

export default function AnalyticsTab() {
  return (
    <div className="flex flex-col gap-3">
      {/* Perf Metrics */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="⊞" className="mb-3">PERFORMANCE_METRICS</TerminalLabel>
          <MetricGrid metrics={perfMetrics} columns={5} />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <TerminalLabel icon="▎" className="mb-3">MONTHLY_RETURNS</TerminalLabel>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, borderRadius: 6 }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {monthlyReturns.map((entry, i) => (
                      <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <TerminalLabel icon="∿" className="mb-3">CUMULATIVE_RETURNS</TerminalLabel>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, borderRadius: 6 }} />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Analysis */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="◉" className="mb-3">BEHAVIORAL_ANALYSIS</TerminalLabel>
          <div className="flex flex-col gap-3">
            {behavioralMetrics.map((m) => (
              <ProgressBar key={m.label} label={m.label} value={m.value} color={m.color} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
