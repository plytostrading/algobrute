'use client';

import { useState, useMemo } from 'react';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatters';
import type { BacktestResult, RegimeType } from '@/types';

const regimeColors: Record<RegimeType, string> = {
  LOW_VOL: '#dbeafe',
  NORMAL: '#dcfce7',
  HIGH_VOL: '#fef3c7',
  CRISIS: '#fee2e2',
};

interface PortfolioChartProps {
  equityCurve: BacktestResult['equityCurve'];
}

type TimeRange = '90D' | '1Y' | '3Y' | 'ALL';

export default function PortfolioChart({ equityCurve }: PortfolioChartProps) {
  const [range, setRange] = useState<TimeRange>('ALL');

  const chartData = useMemo(() => {
    const data = equityCurve.map((p) => ({
      date: p.time instanceof Date ? p.time.toISOString().slice(0, 10) : String(p.time).slice(0, 10),
      equity: Math.round(p.value * 100) / 100,
      regime: p.regime,
    }));

    if (range === 'ALL') return data;
    const daysMap: Record<string, number> = { '90D': 90, '1Y': 365, '3Y': 1095 };
    return data.slice(-daysMap[range]);
  }, [equityCurve, range]);

  // Build regime bands for background coloring
  const regimeBands = useMemo(() => {
    const bands: { x1: string; x2: string; regime: RegimeType }[] = [];
    let currentRegime = chartData[0]?.regime;
    let bandStart = chartData[0]?.date;

    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].regime !== currentRegime) {
        bands.push({ x1: bandStart, x2: chartData[i - 1].date, regime: currentRegime });
        currentRegime = chartData[i].regime;
        bandStart = chartData[i].date;
      }
    }
    if (chartData.length > 0) {
      bands.push({ x1: bandStart, x2: chartData[chartData.length - 1].date, regime: currentRegime });
    }
    return bands;
  }, [chartData]);

  const startValue = chartData[0]?.equity || 0;
  const endValue = chartData[chartData.length - 1]?.equity || 0;
  const totalReturn = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Equity</CardTitle>
        <CardDescription>
          <span className={`font-mono-data font-semibold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
          </span>
          {' '}total return
        </CardDescription>
        <CardAction>
          <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
            <TabsList className="h-8">
              <TabsTrigger value="90D" className="text-xs px-2.5">90D</TabsTrigger>
              <TabsTrigger value="1Y" className="text-xs px-2.5">1Y</TabsTrigger>
              <TabsTrigger value="3Y" className="text-xs px-2.5">3Y</TabsTrigger>
              <TabsTrigger value="ALL" className="text-xs px-2.5">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
              {regimeBands.map((band, i) => (
                <ReferenceArea
                  key={i}
                  x1={band.x1}
                  x2={band.x2}
                  fill={regimeColors[band.regime]}
                  fillOpacity={0.3}
                />
              ))}
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => {
                  const date = new Date(d);
                  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                minTickGap={60}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Equity']}
                labelFormatter={(label: string) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#equityGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
