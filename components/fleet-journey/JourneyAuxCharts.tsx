'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, BarChart2, Gauge, LineChart as LineChartIcon } from 'lucide-react';
import type {
  FleetMultiplierPoint,
  HistogramBin,
  InterventionBucket,
  SharpeBar,
  TrailingPrecisionPoint,
} from '@/hooks/useFleetJourney';

const MECHANISM_COLOR: Record<string, string> = {
  fleet_exposure_gate: '#3b82f6',
  regime_rebalance_handler: '#8b5cf6',
  kelly_resize: '#14b8a6',
  stop_tighten: '#10b981',
  cooling_off_engaged: '#f59e0b',
  regime_adapt: '#0ea5e9',
  rollback_triggered: '#ef4444',
  auto_resume: '#22c55e',
};

// ── Fleet multiplier over time ─────────────────────────────────────

export function FleetExposureChart({
  history,
}: {
  history: FleetMultiplierPoint[];
}) {
  // Decorate each date with multiplier + the driver mechanism that set it,
  // so the area fill can be colored by mechanism (visual attribution of
  // WHY exposure changed).
  const data = history.map((p) => ({
    date: p.date,
    multiplier_pct: p.multiplier * 100,
    driver: p.driver_mechanism ?? null,
    regime: p.regime,
  }));
  const driversSeen = useMemo(() => {
    const s = new Set<string>();
    history.forEach((p) => {
      if (p.driver_mechanism) s.add(p.driver_mechanism);
    });
    return Array.from(s);
  }, [history]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Fleet exposure over time
        </CardTitle>
        <CardDescription>
          When the platform dampened your exposure, you see it here. Troughs
          are protective actions; plateaus at 100% mean the platform was
          passive — which in calm regimes is the correct behaviour.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyAuxChart label="No exposure history in window" />
        ) : (
          <div className="h-52">
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
                  formatter={(v: unknown) => [
                    typeof v === 'number' ? `${v.toFixed(0)}%` : String(v),
                    'Fleet multiplier',
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="stepAfter"
                  dataKey="multiplier_pct"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.18}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {driversSeen.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-widest">
              Drivers
            </span>
            {driversSeen.map((d) => (
              <span key={d} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: MECHANISM_COLOR[d] ?? '#64748b' }}
                />
                {d.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Interventions over time (stacked bars) ─────────────────────────

export function InterventionsOverTimeChart({
  buckets,
  trailing_precision,
}: {
  buckets: InterventionBucket[];
  trailing_precision?: TrailingPrecisionPoint[];
}) {
  const mechanisms = useMemo(() => {
    const s = new Set<string>();
    buckets.forEach((b) => Object.keys(b.counts).forEach((k) => s.add(k)));
    return Array.from(s);
  }, [buckets]);

  // Join trailing-precision by matching (or nearest-earlier) date so the
  // precision trend line sits on the same chart.
  const precisionByDate = useMemo(() => {
    const m = new Map<string, number>();
    trailing_precision?.forEach((p) => {
      if (p.precision_pct !== null) m.set(p.date, p.precision_pct);
    });
    return m;
  }, [trailing_precision]);

  const data = buckets.map((b) => ({
    date: b.date,
    ...Object.fromEntries(mechanisms.map((m) => [m, b.counts[m] ?? 0])),
    precision_pct: precisionByDate.get(b.date) ?? null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Interventions over time
        </CardTitle>
        <CardDescription>
          Weekly stacked bars of interventions by mechanism. Tall bars are
          active-protection weeks; gaps are calm weeks. Read the colors to
          see which machinery did the work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyAuxChart label="No interventions in window" />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  yAxisId="count"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {mechanisms.map((m) => (
                  <Bar
                    key={m}
                    dataKey={m}
                    stackId="a"
                    yAxisId="count"
                    fill={MECHANISM_COLOR[m] ?? '#64748b'}
                    name={m.replace(/_/g, ' ')}
                  />
                ))}
                {trailing_precision && trailing_precision.length > 0 && (
                  <Line
                    type="monotone"
                    dataKey="precision_pct"
                    yAxisId="pct"
                    name="Precision %"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sharpe distribution (per-bot bar chart, sorted) ────────────────

export function SharpeDistributionChart({ bars }: { bars: SharpeBar[] }) {
  const data = bars.map((b) => ({
    name: b.ticker,
    sharpe: b.sharpe,
    n: b.n_trades,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Per-bot Sharpe
        </CardTitle>
        <CardDescription>
          One bar per bot, sorted best-to-worst. Wide spread = disparate
          strategies; tight cluster = uniform outcome.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyAuxChart label="No bot outcomes yet" />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 10, left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                  formatter={(v: unknown, name: string, props: { payload?: { n?: number } }) => [
                    `${Number(v).toFixed(2)} (n=${props.payload?.n ?? '?'})`,
                    'Sharpe',
                  ]}
                />
                <Bar dataKey="sharpe" radius={[0, 4, 4, 0]}>
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.sharpe > 1 ? '#10b981' : d.sharpe > 0 ? '#f59e0b' : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── DD distribution histogram (live vs shadow) ─────────────────────

export function DDDistributionChart({ bins }: { bins: HistogramBin[] }) {
  const data = bins.map((b) => ({
    range: `${b.lower_pct.toFixed(1)}-${b.upper_pct.toFixed(1)}%`,
    live: b.live_count,
    shadow: b.shadow_count,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Drawdown distribution
        </CardTitle>
        <CardDescription>
          Per-trade drawdown severity, live vs shadow. If the platform is
          protecting you, live bars should pile up on the left (small DDs)
          and shadow bars should extend further right (larger DDs).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyAuxChart label="Insufficient trade DD samples" />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="live" fill="#10b981" name="Live" />
                <Bar dataKey="shadow" fill="#8b5cf6" name="Shadow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── P&L distribution histogram (live vs shadow) ────────────────────

export function PnlDistributionChart({ bins }: { bins: HistogramBin[] }) {
  const data = bins.map((b) => ({
    range: `${b.lower_pct.toFixed(1)}%`,
    live: b.live_count,
    shadow: b.shadow_count,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="h-5 w-5" />
          P&amp;L distribution
        </CardTitle>
        <CardDescription>
          Per-trade realized P&amp;L, live vs shadow. Shows where each
          distribution&apos;s mass sits — a rightward live shift is return
          lift; a tighter live distribution is volatility reduction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyAuxChart label="Insufficient trade P&L samples" />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="live" fill="#10b981" name="Live" />
                <Bar dataKey="shadow" fill="#8b5cf6" name="Shadow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyAuxChart({ label }: { label: string }) {
  return (
    <div className="flex h-52 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-center">
      <Activity className="h-5 w-5 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
