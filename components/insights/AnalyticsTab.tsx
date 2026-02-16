'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const perfMetrics = [
  { label: 'Total Return', value: '12.45%' },
  { label: 'Sharpe Ratio', value: '1.82' },
  { label: 'Sortino Ratio', value: '2.47' },
  { label: 'Max Drawdown', value: '-8.3%' },
  { label: 'Calmar Ratio', value: '1.50' },
];

const monthlyReturns = [
  { month: 'Jan', value: 1.2 }, { month: 'Feb', value: -0.8 }, { month: 'Mar', value: 2.1 },
  { month: 'Apr', value: 0.5 }, { month: 'May', value: -1.3 }, { month: 'Jun', value: 3.2 },
  { month: 'Jul', value: 1.8 }, { month: 'Aug', value: -0.4 }, { month: 'Sep', value: 2.5 },
  { month: 'Oct', value: 1.1 }, { month: 'Nov', value: -0.6 }, { month: 'Dec', value: 1.9 },
];

const cumulativeReturns = monthlyReturns.reduce<{ month: string; value: number }[]>((acc, r) => {
  const last = acc.length > 0 ? acc[acc.length - 1].value : 0;
  acc.push({ month: r.month, value: Math.round((last + r.value) * 100) / 100 });
  return acc;
}, []);

const behavioralMetrics = [
  { label: 'Plan Adherence', value: 87 },
  { label: 'Early Exit Rate', value: 23 },
  { label: 'Revenge Trading', value: 8 },
  { label: 'Overtrading Score', value: 15 },
  { label: 'Position Sizing Accuracy', value: 92 },
];

export default function AnalyticsTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Perf Metrics */}
      <div className="grid gap-4 sm:grid-cols-5">
        {perfMetrics.map((m) => (
          <Card key={m.label} className="gap-1 py-3">
            <CardHeader className="pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="font-mono-data text-xl font-bold">{m.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Returns</CardTitle>
            <CardDescription>Profit and loss by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative Returns</CardTitle>
            <CardDescription>Running total performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Behavioral Analysis</CardTitle>
          <CardDescription>Trading discipline and psychology metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {behavioralMetrics.map((m) => {
              const indicatorClass = m.value > 70 ? '[&>[data-slot=progress-indicator]]:bg-success' : m.value > 40 ? '[&>[data-slot=progress-indicator]]:bg-warning' : '[&>[data-slot=progress-indicator]]:bg-destructive';
              return (
                <div key={m.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm">{m.label}</span>
                    <span className="font-mono-data text-sm font-semibold">{m.value}%</span>
                  </div>
                  <Progress value={m.value} className={`h-2 ${indicatorClass}`} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
