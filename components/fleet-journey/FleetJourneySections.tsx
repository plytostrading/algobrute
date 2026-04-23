'use client';

import { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from 'recharts';
import {
  Activity,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  RefreshCw,
  Pause,
  Shuffle,
  Scale,
  RotateCcw,
  Play,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useFleetJourney,
  type JourneyHero,
  type JourneyLift,
  type JourneyHonesty,
  type InterventionLedgerEntry,
  type RegimeEffectivenessRow,
  type JourneyBot,
  type JourneyQuery,
} from '@/hooks/useFleetJourney';
import { useLinkPaperPassports } from '@/hooks/useDashboard';
import { useBots } from '@/hooks/useBots';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { JourneyTimeline } from './JourneyTimeline';
import {
  DDDistributionChart,
  FleetExposureChart,
  InterventionsOverTimeChart,
  PnlDistributionChart,
  SharpeDistributionChart,
} from './JourneyAuxCharts';
import { JourneyWelcome } from './JourneyWelcome';
import {
  ShEventBreakdownChart,
  StrategyAllocationOverTimeChart,
  StrategyMixDonut,
  StrategyPnlOverTimeChart,
} from './StrategyBreakdownCharts';
import { ReferencePriceChart } from './ReferencePriceChart';
import { FleetRoster } from './FleetRoster';
import { StrategyRegimeHeatmap } from '@/components/dashboard/StrategyRegimeHeatmap';

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

const REGIME_CELL_COLOR: Record<string, string> = {
  NORMAL: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  LOW_VOL: 'bg-green-500/15 text-green-700 dark:text-green-300',
  ELEVATED_VOL: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  CRISIS: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

export function FleetJourneySections({
  params = {},
  onParamsChange,
}: {
  params?: JourneyQuery;
  onParamsChange?: (p: JourneyQuery) => void;
}) {
  const effective: JourneyQuery = {
    window_days: params.window_days ?? 365,
    precision_window_days: params.precision_window_days ?? 5,
    regime_scope: params.regime_scope ?? 'current',
  };
  const { data, isLoading, isError, error } = useFleetJourney(effective);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          {(error as Error)?.message ?? 'Failed to load Fleet Journey.'}
        </CardContent>
      </Card>
    );
  }

  // Consolidate all activity signals into one question: "has anything
  // actually happened on this fleet yet?" If no trades, no interventions,
  // and no bots-with-outcomes, render the welcome card alone instead of
  // 12 stacked empty-state skeletons.
  const hasLiveTrades = data.timeline.live_equity.length > 0;
  const hasInterventions = data.timeline.interventions.length > 0;
  const hasBotActivity = data.bots.some((b) => b.n_trades > 0);
  const hasActivity = hasLiveTrades || hasInterventions || hasBotActivity;

  if (!hasActivity) {
    return (
      <div className="space-y-6">
        <HeroRow hero={data.hero} lift={data.lift} params={effective} onParamsChange={onParamsChange} />
        <JourneyWelcome data={data} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroRow hero={data.hero} lift={data.lift} params={effective} onParamsChange={onParamsChange} />
      <SetupActions />
      <FleetRoster bots={data.bots} />
      <JourneyTimeline
        live_equity={data.timeline.live_equity}
        shadow_equity={data.timeline.shadow_equity}
        regime_bands={data.timeline.regime_bands}
        interventions={data.timeline.interventions}
      />

      <ReferencePriceChart
        data={data.reference_price}
        fleetTickers={data.fleet_tickers}
        windowDays={effective.window_days ?? 365}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <FleetExposureChart history={data.fleet_multiplier_history} />
        <InterventionsOverTimeChart buckets={data.intervention_buckets} />
      </div>

      <InterventionLedger ledger={data.ledger} />
      <RiskForwardLift lift={data.lift} />
      <RegimeEffectiveness rows={data.regime_effectiveness} />

      <div className="grid gap-4 xl:grid-cols-2">
        <DDDistributionChart bins={data.dd_histogram} />
        <PnlDistributionChart bins={data.pnl_histogram} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SharpeDistributionChart bars={data.sharpe_bars} />
        <PerBotScatter bots={data.bots} />
      </div>

      <StrategyPnlOverTimeChart series={data.strategy_pnl_series} />

      <StrategyAllocationOverTimeChart points={data.strategy_allocation_history} />

      <div className="grid gap-4 xl:grid-cols-2">
        <StrategyMixDonut mix={data.strategy_mix} />
        <ShEventBreakdownChart entries={data.sh_event_breakdown} />
      </div>

      <StrategyRegimeHeatmap />

      <PlatformHonesty honesty={data.honesty} precisionWindow={data.precision_window_days} />
    </div>
  );
}

// ── Hero row ────────────────────────────────────────────────────────

function HeroRow({
  hero,
  lift,
  params,
  onParamsChange,
}: {
  hero: JourneyHero;
  lift: JourneyLift;
  params: JourneyQuery;
  onParamsChange?: (p: JourneyQuery) => void;
}) {
  const regimeLabel = hero.current_regime
    ? labelForRegime(hero.current_regime)
    : '—';
  const ddProtectionSign = lift.dd_protection_pct >= 0 ? '+' : '';
  const multPct = Math.round(hero.fleet_multiplier * 100);

  return (
    <div className="space-y-5">
      {/* Big numbers row — confident typography, no card wrapper */}
      <div className="grid gap-6 md:grid-cols-4">
        <HeroStat
          label="Interventions"
          value={String(hero.n_interventions)}
          sub={
            hero.intervention_precision_pct !== null
              ? `${hero.intervention_precision_pct.toFixed(0)}% precision`
              : 'precision accumulating'
          }
        />
        <HeroStat
          label="Drawdown protection"
          value={`${ddProtectionSign}${lift.dd_protection_pct.toFixed(2)}%`}
          sub={`your ${lift.live_max_dd_pct.toFixed(1)}% · shadow ${lift.shadow_max_dd_pct.toFixed(1)}%`}
          tone={lift.dd_protection_pct > 0 ? 'good' : lift.dd_protection_pct < 0 ? 'bad' : 'neutral'}
        />
        <HeroStat
          label="Current regime"
          value={regimeLabel}
          sub={`fleet multiplier ${multPct}%`}
          badgeClass={REGIME_CELL_COLOR[regimeLabel]}
        />
        <HeroStat
          label="Platform honesty"
          value={
            hero.intervention_precision_pct !== null
              ? `${hero.intervention_precision_pct.toFixed(0)}%`
              : '—'
          }
          sub="of interventions were right"
          tone={
            hero.intervention_precision_pct !== null
              ? hero.intervention_precision_pct >= 75
                ? 'good'
                : hero.intervention_precision_pct >= 50
                  ? 'warn'
                  : 'neutral'
              : 'neutral'
          }
        />
      </div>

      {/* Control strip — minimal */}
      {onParamsChange && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>Viewing</span>
          <ParamSelect
            label="Window"
            value={`${params.window_days}d`}
            options={[
              { label: '30d', value: 30 },
              { label: '90d', value: 90 },
              { label: '1y', value: 365 },
              { label: '5y', value: 1825 },
            ]}
            onSelect={(v) => onParamsChange({ ...params, window_days: v as number })}
          />
          <span>·</span>
          <ParamSelect
            label="Precision window"
            value={`${params.precision_window_days}d`}
            options={[
              { label: '1d', value: 1 },
              { label: '3d', value: 3 },
              { label: '5d', value: 5 },
              { label: '10d', value: 10 },
              { label: '20d', value: 20 },
            ]}
            onSelect={(v) =>
              onParamsChange({ ...params, precision_window_days: v as number })
            }
          />
          <span>·</span>
          <ParamSelect
            label="Scope"
            value={params.regime_scope === 'all' ? 'All regimes' : 'Current regime'}
            options={[
              { label: 'Current regime', value: 'current' },
              { label: 'All regimes', value: 'all' },
            ]}
            onSelect={(v) =>
              onParamsChange({ ...params, regime_scope: v as 'current' | 'all' })
            }
          />
        </div>
      )}
    </div>
  );
}

function HeroStat({
  label,
  value,
  sub,
  tone = 'neutral',
  badgeClass,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'good' | 'bad' | 'warn' | 'neutral';
  badgeClass?: string;
}) {
  const valueClass =
    tone === 'good'
      ? 'text-green-600'
      : tone === 'bad'
        ? 'text-destructive'
        : tone === 'warn'
          ? 'text-amber-600'
          : 'text-foreground';
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-3xl font-bold tabular-nums tracking-tight ${valueClass} ${
          badgeClass ? `inline-block rounded-md px-2 ${badgeClass}` : ''
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground truncate" title={sub}>
        {sub}
      </div>
    </div>
  );
}

function ParamSelect({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { label: string; value: string | number }[];
  onSelect: (v: string | number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-md border bg-background px-2 py-0.5 text-xs hover:bg-muted/50"
        onClick={() => setOpen((o) => !o)}
      >
        {label}: <span className="font-semibold">{value}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 rounded-md border bg-popover p-1 shadow-md">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className="block w-full rounded px-3 py-1 text-left text-xs hover:bg-muted"
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Intervention Ledger ─────────────────────────────────────────────

export function InterventionLedger({ ledger }: { ledger: InterventionLedgerEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk-management ledger
        </CardTitle>
        <CardDescription>
          What the platform did, how often, and whether it was right — the
          proof of value.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ledger.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">No interventions in this scope yet</div>
            <div className="max-w-sm text-xs text-muted-foreground">
              In calm regimes the platform should stay quiet. Widen the
              regime scope or wait for an adverse regime to see interventions
              accumulate.
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ledger.map((e) => (
              <LedgerCard key={e.mechanism} entry={e} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LedgerCard({ entry: e }: { entry: InterventionLedgerEntry }) {
  const Icon = ICON_BY_MECHANISM[e.mechanism] ?? Activity;
  const precisionTone =
    e.precision_pct === null
      ? 'text-muted-foreground'
      : e.precision_pct >= 75
        ? 'text-green-600'
        : e.precision_pct >= 50
          ? 'text-amber-600'
          : 'text-destructive';
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-semibold">{e.label}</div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {e.n_fired} fired
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Acted</div>
          <div className="font-mono font-semibold">{e.n_acted}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Recommended</div>
          <div className="font-mono font-semibold">{e.n_recommended}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Precision</div>
          <div className={`font-mono font-semibold ${precisionTone}`}>
            {e.precision_pct === null ? '—' : `${e.precision_pct.toFixed(0)}%`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Risk-forward lift ───────────────────────────────────────────────

export function RiskForwardLift({ lift }: { lift: JourneyLift }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Protection vs return
        </CardTitle>
        <CardDescription>
          Drawdown protection leads because that&apos;s the primary value of
          regime-aware risk management. Return lift is secondary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LiftTile
            label="Max drawdown"
            primary={`${lift.live_max_dd_pct.toFixed(2)}%`}
            baseline={`${lift.shadow_max_dd_pct.toFixed(2)}%`}
            delta={
              lift.dd_protection_pct >= 0
                ? `+${lift.dd_protection_pct.toFixed(2)}% protection`
                : `${lift.dd_protection_pct.toFixed(2)}% worse`
            }
            tone={lift.dd_protection_pct >= 0 ? 'good' : 'bad'}
            icon={<Shield className="h-4 w-4" />}
          />
          <LiftTile
            label="Volatility"
            primary={lift.live_vol_pct !== null ? `${lift.live_vol_pct.toFixed(2)}%` : '—'}
            baseline={
              lift.shadow_vol_pct !== null ? `${lift.shadow_vol_pct.toFixed(2)}%` : '—'
            }
            delta={
              lift.vol_reduction_pct !== null
                ? `${lift.vol_reduction_pct >= 0 ? '-' : '+'}${Math.abs(lift.vol_reduction_pct).toFixed(0)}% reduction`
                : '—'
            }
            tone={
              lift.vol_reduction_pct !== null && lift.vol_reduction_pct > 0
                ? 'good'
                : 'neutral'
            }
            icon={<Activity className="h-4 w-4" />}
          />
          <LiftTile
            label="Cumulative P&L"
            primary={`${lift.live_total_pnl_pct >= 0 ? '+' : ''}${lift.live_total_pnl_pct.toFixed(2)}%`}
            baseline={`${lift.shadow_total_pnl_pct >= 0 ? '+' : ''}${lift.shadow_total_pnl_pct.toFixed(2)}%`}
            delta={`${lift.pnl_lift_pct >= 0 ? '+' : ''}${lift.pnl_lift_pct.toFixed(2)}% lift`}
            tone={lift.pnl_lift_pct >= 0 ? 'good' : 'bad'}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <LiftTile
            label="Fleet multiplier"
            primary={''}
            baseline={''}
            delta={''}
            tone="neutral"
            icon={<Scale className="h-4 w-4" />}
            customBody={
              <div className="text-xs text-muted-foreground">
                The composed sizing multiplier from all active fleet
                controllers; visible in the Hero row above.
              </div>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LiftTile({
  label,
  primary,
  baseline,
  delta,
  tone,
  icon,
  customBody,
}: {
  label: string;
  primary: string;
  baseline: string;
  delta: string;
  tone: 'good' | 'bad' | 'neutral';
  icon: React.ReactNode;
  customBody?: React.ReactNode;
}) {
  const deltaClass =
    tone === 'good'
      ? 'text-green-600'
      : tone === 'bad'
        ? 'text-destructive'
        : 'text-muted-foreground';
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      {customBody ? (
        <div className="mt-2">{customBody}</div>
      ) : (
        <>
          <div className="mt-2 text-2xl font-semibold">{primary}</div>
          <div className="mt-1 text-xs text-muted-foreground">baseline {baseline}</div>
          <div className={`mt-1 text-xs font-semibold ${deltaClass}`}>{delta}</div>
        </>
      )}
    </div>
  );
}

// ── Regime Effectiveness ────────────────────────────────────────────

export function RegimeEffectiveness({ rows }: { rows: RegimeEffectivenessRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Where the platform worked
        </CardTitle>
        <CardDescription>
          Regime-by-regime breakdown. Platform should be quiet in calm
          regimes and active in adverse ones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No regime data in window.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Regime</th>
                <th className="px-3 py-2 text-right">Days</th>
                <th className="px-3 py-2 text-right">Interventions fired</th>
                <th className="px-3 py-2 text-right">Interv. density</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.regime} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={`text-[10px] ${REGIME_CELL_COLOR[r.regime_label] ?? ''}`}>
                      {r.regime_label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{r.days_in_regime}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{r.interventions_fired}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                    {r.days_in_regime > 0
                      ? `${(r.interventions_fired / r.days_in_regime).toFixed(2)}/day`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ── Per-bot scatter ─────────────────────────────────────────────────

export function PerBotScatter({ bots }: { bots: JourneyBot[] }) {
  const plottable = bots.filter((b) => b.sharpe !== null && b.max_dd_pct !== null);
  const data = plottable.map((b) => ({
    x: b.sharpe,
    y: -(b.max_dd_pct ?? 0),
    z: Math.max(b.n_trades, 4),
    ticker: b.ticker,
    strategy: b.strategy_id,
    n: b.n_trades,
    interventions: b.n_interventions,
    most: b.most_applied_intervention,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Bot-level outcomes
        </CardTitle>
        <CardDescription>
          One dot per bot. Sharpe on the x-axis, drawdown on the y. Dots
          upper-right are stars, lower-left are drags. Size = trade count.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {plottable.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
            <Activity className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">No bot outcomes yet</div>
            <div className="max-w-sm text-xs text-muted-foreground">
              {bots.length > 0
                ? `${bots.length} bot${bots.length === 1 ? ' is' : 's are'} deployed but haven't accumulated closed trades yet.`
                : 'Deploy paper bots from the Workbench to populate this view.'}
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Sharpe"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  label={{
                    value: 'Sharpe',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Drawdown"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  label={{
                    value: 'Max DD',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
                  }}
                />
                <ZAxis type="number" dataKey="z" range={[30, 180]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const p = payload[0].payload as (typeof data)[number];
                    return (
                      <div className="rounded-md border bg-popover p-2 text-xs">
                        <div className="font-mono font-semibold">{p.ticker}</div>
                        <div className="text-muted-foreground">{p.strategy}</div>
                        <div>Sharpe {p.x?.toFixed(2) ?? '—'}</div>
                        <div>Max DD {(-(p.y ?? 0)).toFixed(2)}%</div>
                        <div>{p.n} trades</div>
                        <div>{p.interventions} interventions{p.most ? ` · mostly ${p.most}` : ''}</div>
                      </div>
                    );
                  }}
                />
                <Scatter name="Bots" data={data} fill="#10b981">
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        (d.x ?? 0) > 1 && (d.y ?? 0) > -5
                          ? '#10b981'
                          : (d.x ?? 0) < 0
                            ? '#ef4444'
                            : '#f59e0b'
                      }
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Platform honesty ────────────────────────────────────────────────

export function PlatformHonesty({
  honesty,
  precisionWindow,
}: {
  honesty: JourneyHonesty;
  precisionWindow: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Platform honesty
        </CardTitle>
        <CardDescription>
          Every intervention is classified as correct or over-cautious by
          looking at shadow-fleet behaviour in the {precisionWindow}-day
          window following it. Over-caution is the insurance premium you
          pay — it&apos;s visible on purpose.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-4">
          <HonestyTile
            label="Correct"
            value={String(honesty.n_correct)}
            sub="followed by shadow loss"
            tone="good"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <HonestyTile
            label="Over-cautious"
            value={String(honesty.n_over_cautious)}
            sub="shadow did not lose"
            tone="warn"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <HonestyTile
            label="Pending window"
            value={String(honesty.n_pending_window)}
            sub="not enough time elapsed"
            tone="neutral"
            icon={<Minus className="h-4 w-4" />}
          />
          <HonestyTile
            label="Overall precision"
            value={
              honesty.overall_precision_pct === null
                ? '—'
                : `${honesty.overall_precision_pct.toFixed(0)}%`
            }
            sub="correct / (correct + over-cautious)"
            tone={
              honesty.overall_precision_pct !== null &&
              honesty.overall_precision_pct >= 75
                ? 'good'
                : honesty.overall_precision_pct !== null &&
                    honesty.overall_precision_pct >= 50
                  ? 'warn'
                  : 'neutral'
            }
            icon={<Info className="h-4 w-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HonestyTile({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'good' | 'warn' | 'neutral';
  icon: React.ReactNode;
}) {
  const valueClass =
    tone === 'good'
      ? 'text-green-600'
      : tone === 'warn'
        ? 'text-amber-600'
        : 'text-foreground';
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

// ── Setup actions (always visible, dev/demo affordances) ──────────

export function SetupActions() {
  const { data: bots } = useBots();
  const [confirming, setConfirming] = useState(false);
  const link = useLinkPaperPassports();

  const unlinkedCount = (bots ?? []).filter(
    (b) => b.strategy_id && b.ticker, // proxy — BotSnapshot doesn't expose passport_id
  ).length;
  // Note: BotSnapshot in types/api.ts doesn't expose passport_id, so we
  // show the action as long as any bots exist. The backend is
  // idempotent — bots already linked are skipped unless overwrite=true.
  const hasBots = (bots?.length ?? 0) > 0;
  if (!hasBots) return null;

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setConfirming(false);
    link.mutate(
      { overwrite: false, dry_run: false },
      {
        onSuccess: (data) => {
          toast.success(
            `Linked ${data.n_linked} paper bots to passports (skipped ${data.n_skipped}).`,
          );
        },
        onError: (err) => toast.error(err.message || 'Link failed'),
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-widest text-foreground/70">
          Setup
        </span>
        <span>·</span>
        <span>
          Link paper bots to passports to route real strategy signals (true-auto).
          Bypasses admission — paper-mode only.
        </span>
      </div>
      <div className="flex items-center gap-2">
        {link.data && (
          <span className="text-xs text-muted-foreground">
            last: {link.data.n_linked} linked
          </span>
        )}
        <Button
          size="sm"
          variant={confirming ? 'destructive' : 'outline'}
          className="gap-1 text-xs"
          onClick={handleClick}
          disabled={link.isPending}
        >
          {link.isPending
            ? 'Linking…'
            : confirming
              ? 'Click to confirm'
              : 'Enable true-auto'}
        </Button>
      </div>
    </div>
  );
}

function labelForRegime(regime: string): string {
  const m: Record<string, string> = {
    '1': 'NORMAL',
    '2': 'LOW_VOL',
    '3': 'ELEVATED_VOL',
    '4': 'CRISIS',
  };
  return m[regime] ?? regime;
}
