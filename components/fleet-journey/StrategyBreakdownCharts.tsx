'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Layers,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  ShEventBreakdownEntry,
  StrategyAllocationPoint,
  StrategyMixEntry,
  StrategyPnlSeries,
} from '@/hooks/useFleetJourney';

const STRATEGY_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#0ea5e9',
  '#84cc16',
];

// ── Strategy P&L over time ─────────────────────────────────────────

export function StrategyPnlOverTimeChart({
  series,
}: {
  series: StrategyPnlSeries[];
}) {
  // Normalize all strategies onto the same date axis
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.series.map((p) => p.date))),
  ).sort();
  const rows = allDates.map((d) => {
    const row: Record<string, string | number> = { date: d };
    series.forEach((s, idx) => {
      const point = s.series.find((p) => p.date === d);
      if (point) row[s.strategy_id] = point.cum_pnl_pct;
      else {
        // Forward-fill
        const prior = s.series.filter((p) => p.date < d);
        if (prior.length > 0) row[s.strategy_id] = prior[prior.length - 1].cum_pnl_pct;
      }
    });
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="h-5 w-5" />
          Strategy P&amp;L over time
        </CardTitle>
        <CardDescription>
          One line per strategy, compounded from closed trades. Divergence
          reveals which strategies carried the fleet in each regime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {series.length === 0 ? (
          <EmptyChart label="No strategy P&L data yet" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => [
                    typeof v === 'number' ? `${v.toFixed(2)}%` : '—',
                    'Cumulative',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {series.map((s, i) => (
                  <Line
                    key={s.strategy_id}
                    type="monotone"
                    dataKey={s.strategy_id}
                    name={prettyStrategy(s.strategy_id)}
                    stroke={STRATEGY_COLORS[i % STRATEGY_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Strategy mix donut ─────────────────────────────────────────────

export function StrategyMixDonut({ mix }: { mix: StrategyMixEntry[] }) {
  const total = mix.reduce((s, m) => s + m.capital_allocation_pct, 0);
  const data = mix.map((m) => ({
    name: prettyStrategy(m.strategy_id),
    raw: m.strategy_id,
    value: m.capital_allocation_pct,
    pct: total > 0 ? (m.capital_allocation_pct / total) * 100 : 0,
    n: m.n_bots,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Strategy mix (current)
        </CardTitle>
        <CardDescription>
          Capital allocation across strategies at this moment. The donut
          shape makes dominance versus diversification visible at a glance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart label="No deployed bots" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={STRATEGY_COLORS[i % STRATEGY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                  formatter={(v: unknown, _name: string, props: { payload?: { n?: number; pct?: number } }) => [
                    `${(props.payload?.pct ?? 0).toFixed(1)}% (${props.payload?.n ?? 0} bots)`,
                    'Allocation',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  verticalAlign="bottom"
                  height={24}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── SH event breakdown (horizontal bars) ───────────────────────────

export function ShEventBreakdownChart({
  entries,
}: {
  entries: ShEventBreakdownEntry[];
}) {
  const data = entries.map((e) => ({
    label: prettyEventType(e.event_type),
    count: e.count,
    raw: e.event_type,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Self-healing event breakdown
        </CardTitle>
        <CardDescription>
          Which self-healing mechanisms fired most often. Tells you which
          protections your fleet relied on most.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart label="No self-healing events in window" />
        ) : (
          <ul className="space-y-2">
            {data.map((d, i) => {
              const max = Math.max(...data.map((x) => x.count));
              const pct = (d.count / max) * 100;
              return (
                <li key={d.raw} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{d.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {d.count}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STRATEGY_COLORS[i % STRATEGY_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Strategy allocation over time (stacked area) ───────────────────

export function StrategyAllocationOverTimeChart({
  points,
}: {
  points: StrategyAllocationPoint[];
}) {
  const strategies = Array.from(
    new Set(points.flatMap((p) => Object.keys(p.allocations))),
  );
  const data = points.map((p) => {
    const row: Record<string, string | number> = { date: p.date };
    strategies.forEach((s) => {
      row[s] = (p.allocations[s] ?? 0) * 100; // percent of fleet
    });
    return row;
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Strategy allocation over time
        </CardTitle>
        <CardDescription>
          Stacked area of per-strategy capital allocation across the
          window. Abrupt shifts are regime-triggered rebalance events;
          steady bands mean the platform left the mix alone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart label="No allocation history" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => [
                    typeof v === 'number' ? `${v.toFixed(1)}%` : '—',
                    'Allocation',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {strategies.map((s, i) => (
                  <Area
                    key={s}
                    type="monotone"
                    dataKey={s}
                    name={prettyStrategy(s)}
                    stackId="1"
                    stroke={STRATEGY_COLORS[i % STRATEGY_COLORS.length]}
                    fill={STRATEGY_COLORS[i % STRATEGY_COLORS.length]}
                    fillOpacity={0.65}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function prettyStrategy(id: string): string {
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function prettyEventType(type: string): string {
  return type
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
