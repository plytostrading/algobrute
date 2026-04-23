'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info, Shield, Shuffle, Pause, Target, RefreshCw, RotateCcw, Scale, Play, Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  EquityPercentilePoint,
  JourneyEquityPoint,
  JourneyIntervention,
  JourneyRegimeBand,
} from '@/hooks/useFleetJourney';

// Regime band colors — same palette as simulator; customer dashboard keeps
// parity so the visual language is shared.
const REGIME_BAND_FILL: Record<string, string> = {
  '1': 'rgba(59,130,246,0.08)', // NORMAL — calm blue
  '2': 'rgba(34,197,94,0.08)', // LOW_VOL — calm green
  '3': 'rgba(234,179,8,0.12)', // ELEVATED_VOL — amber
  '4': 'rgba(239,68,68,0.14)', // CRISIS — red
  default: 'rgba(156,163,175,0.08)',
};

const MECHANISM_COLOR: Record<string, string> = {
  fleet_exposure_gate: '#3b82f6',
  regime_rebalance_handler: '#8b5cf6',
  kelly_resize: '#14b8a6',
  stop_tighten: '#10b981',
  cooling_off_engaged: '#f59e0b',
  regime_adapt: '#0ea5e9',
  rollback_triggered: '#ef4444',
  auto_resume: '#22c55e',
  default: '#64748b',
};

const ICON_BY_MECHANISM: Record<string, React.ComponentType<{ className?: string }>> = {
  fleet_exposure_gate: Shield,
  regime_rebalance_handler: Shuffle,
  kelly_resize: Scale,
  stop_tighten: Target,
  cooling_off_engaged: Pause,
  regime_adapt: RefreshCw,
  rollback_triggered: RotateCcw,
  auto_resume: Play,
};

interface Props {
  live_equity: JourneyEquityPoint[];
  shadow_equity: JourneyEquityPoint[];
  regime_bands: JourneyRegimeBand[];
  interventions: JourneyIntervention[];
  equity_percentiles?: EquityPercentilePoint[];
}

interface ChartRow {
  date: string;
  live_pnl?: number;
  shadow_pnl?: number;
  live_dd?: number;
  shadow_dd?: number;
  p10?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  /** Span between p10 and p90 — renders as outer band. */
  p10_p90_span?: number;
  /** Span between p25 and p75 — renders as inner band. */
  p25_p75_span?: number;
}

export function JourneyTimeline({
  live_equity,
  shadow_equity,
  regime_bands,
  interventions,
  equity_percentiles,
}: Props) {
  const [selected, setSelected] = useState<JourneyIntervention | null>(null);

  const data = useMemo(
    () => mergeSeries(live_equity, shadow_equity, equity_percentiles),
    [live_equity, shadow_equity, equity_percentiles],
  );

  if (data.length === 0 && interventions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Journey timeline
          </CardTitle>
          <CardDescription>
            Your fleet&apos;s path through regimes, overlaid with every risk
            management action the platform has taken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Fleet cumulative return — journey timeline
        </CardTitle>
        <CardDescription>
          Your live fleet&apos;s cumulative P&amp;L vs the shadow-fleet
          counterfactual (what your bots would have done without platform
          risk management). Regime-colored background shows the market
          environment you were trading through; pins mark every risk-
          management intervention. Click a pin for detail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 rounded-md border bg-background p-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                minTickGap={30}
              />
              <YAxis
                yAxisId="pnl"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                label={{
                  value: 'P&L %',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
                }}
              />
              <YAxis
                yAxisId="dd"
                orientation="right"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `-${Number(v).toFixed(1)}%`}
                label={{
                  value: 'Drawdown %',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
                }}
              />

              {/* Regime bands */}
              {regime_bands.map((b, i) => (
                <ReferenceArea
                  key={`band-${i}`}
                  x1={b.start}
                  x2={b.end}
                  yAxisId="pnl"
                  fill={REGIME_BAND_FILL[b.regime] ?? REGIME_BAND_FILL.default}
                  fillOpacity={1}
                  stroke="none"
                />
              ))}

              <ReferenceLine y={0} yAxisId="pnl" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />

              {/* Percentile dispersion bands (p10-p90 outer, p25-p75 inner).
                  Rendered using stacked Areas: the "base" is invisible so
                  only the "span" fill shows. Layered behind equity lines. */}
              <Area
                dataKey="p10"
                yAxisId="pnl"
                name="Worst 10%"
                stackId="pct10"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
                legendType="none"
              />
              <Area
                dataKey="p10_p90_span"
                yAxisId="pnl"
                name="P10–P90 band"
                stackId="pct10"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.08}
                isAnimationActive={false}
                legendType="none"
              />
              <Area
                dataKey="p25"
                yAxisId="pnl"
                name="Worst 25%"
                stackId="pct25"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
                legendType="none"
              />
              <Area
                dataKey="p25_p75_span"
                yAxisId="pnl"
                name="P25–P75 band (IQR)"
                stackId="pct25"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.14}
                isAnimationActive={false}
                legendType="none"
              />

              {/* DD envelopes (filled areas below the equity lines). We plot
                  them as negative values on the DD axis for visual clarity —
                  tooltip still shows raw max_dd_pct. */}
              <Area
                dataKey="live_dd"
                yAxisId="dd"
                name="Live DD"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.08}
                isAnimationActive={false}
              />
              <Area
                dataKey="shadow_dd"
                yAxisId="dd"
                name="Shadow DD"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.08}
                isAnimationActive={false}
              />

              {/* Equity lines */}
              <Line
                type="monotone"
                dataKey="live_pnl"
                yAxisId="pnl"
                name="Live P&L"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="shadow_pnl"
                yAxisId="pnl"
                name="Shadow P&L"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />

              {/* Intervention pins */}
              {interventions.map((iv) => (
                <ReferenceLine
                  key={iv.id}
                  x={iv.timestamp.slice(0, 10)}
                  yAxisId="pnl"
                  stroke={MECHANISM_COLOR[iv.mechanism] ?? MECHANISM_COLOR.default}
                  strokeDasharray="2 3"
                  strokeWidth={1.5}
                  onClick={() => setSelected(iv)}
                  style={{ cursor: 'pointer' }}
                />
              ))}

              <Tooltip
                formatter={(v: unknown, name: string) => [
                  typeof v === 'number' ? `${v.toFixed(2)}%` : String(v),
                  name,
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Intervention legend strip */}
        {interventions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Interventions:</span>
            {uniqueMechanisms(interventions).map((m) => {
              const Icon = ICON_BY_MECHANISM[m] ?? Activity;
              const color = MECHANISM_COLOR[m] ?? MECHANISM_COLOR.default;
              return (
                <span key={m} className="flex items-center gap-1" style={{ color }}>
                  <Icon className="h-3 w-3" />
                  <span className="text-foreground">
                    {interventions.find((iv) => iv.mechanism === m)?.label ?? m}
                  </span>
                  <span className="text-muted-foreground">
                    ({interventions.filter((iv) => iv.mechanism === m).length})
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* Drawer for selected intervention */}
        {selected && (
          <InterventionDrawer intervention={selected} onClose={() => setSelected(null)} />
        )}
      </CardContent>
    </Card>
  );
}

function mergeSeries(
  live: JourneyEquityPoint[],
  shadow: JourneyEquityPoint[],
  percentiles?: EquityPercentilePoint[],
): ChartRow[] {
  const byDate = new Map<string, ChartRow>();
  const upsert = (d: string): ChartRow => {
    let row = byDate.get(d);
    if (!row) {
      row = { date: d };
      byDate.set(d, row);
    }
    return row;
  };
  live.forEach((p) => {
    const r = upsert(p.date);
    r.live_pnl = p.cum_pnl_pct;
    r.live_dd = p.max_dd_pct;
  });
  shadow.forEach((p) => {
    const r = upsert(p.date);
    r.shadow_pnl = p.cum_pnl_pct;
    r.shadow_dd = p.max_dd_pct;
  });
  percentiles?.forEach((p) => {
    const r = upsert(p.date);
    r.p10 = p.p10;
    r.p25 = p.p25;
    r.p50 = p.p50;
    r.p75 = p.p75;
    r.p90 = p.p90;
    r.p10_p90_span = p.p90 - p.p10;
    r.p25_p75_span = p.p75 - p.p25;
  });
  const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  // Forward-fill so sparse dates don't create visual gaps
  let lastLivePnl: number | undefined;
  let lastShadowPnl: number | undefined;
  let lastLiveDd: number | undefined;
  let lastShadowDd: number | undefined;
  rows.forEach((r) => {
    if (r.live_pnl !== undefined) lastLivePnl = r.live_pnl;
    else if (lastLivePnl !== undefined) r.live_pnl = lastLivePnl;
    if (r.shadow_pnl !== undefined) lastShadowPnl = r.shadow_pnl;
    else if (lastShadowPnl !== undefined) r.shadow_pnl = lastShadowPnl;
    if (r.live_dd !== undefined) lastLiveDd = r.live_dd;
    else if (lastLiveDd !== undefined) r.live_dd = lastLiveDd;
    if (r.shadow_dd !== undefined) lastShadowDd = r.shadow_dd;
    else if (lastShadowDd !== undefined) r.shadow_dd = lastShadowDd;
  });
  return rows;
}

function uniqueMechanisms(ivs: JourneyIntervention[]): string[] {
  return Array.from(new Set(ivs.map((iv) => iv.mechanism)));
}

function InterventionDrawer({
  intervention: iv,
  onClose,
}: {
  intervention: JourneyIntervention;
  onClose: () => void;
}) {
  const correctBadge =
    iv.was_correct === true
      ? { label: '✓ Correct', cls: 'text-green-600 border-green-500/50' }
      : iv.was_correct === false
        ? { label: '⚠ Over-cautious', cls: 'text-amber-600 border-amber-500/60' }
        : { label: '⏳ Pending window', cls: 'text-muted-foreground border-muted-foreground/40' };
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {iv.label}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${correctBadge.cls}`}
          >
            {correctBadge.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          close
        </button>
      </div>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        <div>
          <div className="text-muted-foreground">When</div>
          <div className="font-mono">{new Date(iv.timestamp).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Reason</div>
          <div>{iv.reason || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Action</div>
          <div>{iv.action_summary}</div>
        </div>
        <div>
          <div className="text-muted-foreground flex items-center gap-1">
            Shadow P&amp;L in next window
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Compounded shadow-fleet P&amp;L over the precision window
                following this intervention. Negative = platform correctly
                reduced risk before adverse behaviour.
              </TooltipContent>
            </UITooltip>
          </div>
          <div
            className={`font-mono ${
              iv.shadow_pnl_pct_next_window === null
                ? 'text-muted-foreground'
                : iv.shadow_pnl_pct_next_window < 0
                  ? 'text-green-600'
                  : 'text-amber-600'
            }`}
          >
            {iv.shadow_pnl_pct_next_window === null
              ? 'pending'
              : `${iv.shadow_pnl_pct_next_window >= 0 ? '+' : ''}${iv.shadow_pnl_pct_next_window.toFixed(2)}%`}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-center">
      <Activity className="h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium">Journey hasn&apos;t started yet</div>
      <div className="max-w-md text-xs text-muted-foreground">
        Once your bots close trades and the platform begins firing risk-
        management actions, this timeline will show your fleet&apos;s path
        through regimes alongside every intervention the platform took to
        protect you.
      </div>
    </div>
  );
}
