'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
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
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Scale,
  Shield,
  TestTube2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  type AutonomyDecisionView,
  type AutonomyMode,
  type FleetAutonomyPolicyRequest,
  type PublishAck,
  type ShadowTradeView,
  useControllerHealth,
  useFleetControlBenchmarkDelta,
  useFleetControlKPIs,
  useFleetControlPolicy,
  useFleetControlRecommendations,
  useFleetDecisions,
  usePublishRegimeTransition,
  usePublishSignal,
  usePublishTradeClosed,
  useShadowTrades,
  useUpdateFleetControlPolicy,
} from '@/hooks/useFleetControl';
import type { UseMutationResult } from '@tanstack/react-query';
import { BacktestEvidencePanel } from '@/components/dashboard/BacktestEvidencePanel';
import { BotPerformancePanel } from '@/components/dashboard/BotPerformancePanel';
import { CalibrationPanel } from '@/components/dashboard/CalibrationPanel';
import { DashboardNarrative } from '@/components/dashboard/DashboardNarrative';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import { StrategyRegimeHeatmap } from '@/components/dashboard/StrategyRegimeHeatmap';

const MODE_LABELS: Record<AutonomyMode, string> = {
  advisory_only: 'Advisory Only — recommendations, no autonomous actions',
  auto_protect_only: 'Auto-Protect — defensive actions only',
  auto_protect_and_revalidate: 'Auto-Protect + Revalidate',
  auto_manage_with_bounds: 'Auto-Manage (bounded)',
  user_gated_deployment_autonomous_runtime: 'User-Gated Deployment · Autonomous Runtime',
  full_bounded_autonomy: 'Full Bounded Autonomy',
};

const OUTCOME_COLORS: Record<string, string> = {
  acted: '#10b981',
  recommended: '#f59e0b',
  blocked: '#ef4444',
  deduped: '#6b7280',
};

export default function FleetControlPage() {
  const kpisQ = useFleetControlKPIs();
  const policyQ = useFleetControlPolicy();
  const recQ = useFleetControlRecommendations();
  const deltaQ = useFleetControlBenchmarkDelta();
  const shadowQ = useShadowTrades(100);
  const decisionsQ = useFleetDecisions(100);
  const healthQ = useControllerHealth();

  const updatePolicy = useUpdateFleetControlPolicy();
  const publishRegime = usePublishRegimeTransition();
  const publishSignal = usePublishSignal();
  const publishTradeClosed = usePublishTradeClosed();

  const [mode, setMode] = useState<AutonomyMode>('advisory_only');
  const [allowReduce, setAllowReduce] = useState(false);
  const [allowRestore, setAllowRestore] = useState(false);
  const [allowRebalance, setAllowRebalance] = useState(false);

  useEffect(() => {
    if (!policyQ.data) return;
    setMode(policyQ.data.mode);
    setAllowReduce(policyQ.data.allowed_actions['reduce_fleet_exposure'] === 'allowed');
    setAllowRestore(policyQ.data.allowed_actions['restore_fleet_exposure'] === 'allowed');
    setAllowRebalance(policyQ.data.allowed_actions['trigger_fleet_rebalance'] === 'allowed');
  }, [policyQ.data]);

  async function handleSavePolicy() {
    const req: FleetAutonomyPolicyRequest = {
      mode,
      allow_reduce_fleet_exposure: allowReduce,
      allow_restore_fleet_exposure: allowRestore,
      allow_trigger_fleet_rebalance: allowRebalance,
    };
    await updatePolicy.mutateAsync(req);
  }

  const kpis = kpisQ.data;
  const shadowTrades = shadowQ.data ?? [];
  const decisions = decisionsQ.data ?? [];
  const health = healthQ.data;

  const cumulativeSeries = useMemo(
    () => buildCumulativeSeries(shadowTrades),
    [shadowTrades],
  );
  const outcomeMix = useMemo(() => buildOutcomeMix(kpis), [kpis]);
  const controllerBars = useMemo(
    () =>
      (health?.controllers ?? []).map((c) => ({
        name: prettyControllerKind(c.controller_kind),
        multiplier: c.current_multiplier ?? 1.0,
      })),
    [health],
  );
  const pendingCount = recQ.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fleet Control</h1>
          <p className="text-sm text-muted-foreground">
            Is the platform earning its keep? Live vs shadow benchmark, controller state, and
            every fleet-scope decision the arbiter has resolved.
          </p>
        </div>
        <ModeBadge mode={policyQ.data?.mode ?? 'advisory_only'} />
      </div>

      {/* ── 1. Right now ─────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Right now"
        title="Fleet at a glance"
        description="Platform summary, autonomy posture, and the KPI strip you'd check first each morning."
      />
      <DashboardNarrative section="fleet_overview" />
      <KpiStrip kpis={kpis} loading={kpisQ.isLoading} pendingCount={pendingCount} />

      {/* ── 2. Research ──────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Research log"
        title="Backtest evidence"
        description="Every backtest passport you've run — their deployment-gate scores, their sample sizes, and whether they're eligible for live capital."
      />
      <BacktestEvidencePanel />

      {/* ── 3. Your fleet ────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Your fleet"
        title="Live performance"
        description="Per-bot equity vs shadow counterfactual, and the platform's regime-conditional edge decomposition."
      />
      <BotPerformancePanel />
      <StrategyRegimeHeatmap />

      {/* ── 4. Trust ─────────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Trust signals"
        title="Calibration &amp; platform value"
        description="Predictions vs reality. If the gap widens, the platform's confidence should shrink."
      />
      <CalibrationPanel />

      {/* ── 5. Platform activity (lower-level diagnostics) ─────────── */}
      <SectionHeading
        eyebrow="Platform activity"
        title="Trajectory, controllers, and event stream"
        description="What the fleet controllers decided, what the shadow recorder captured, and the raw event log. The detail layer under the summaries above."
      />

      {/* Charts row 1: cumulative shadow P&L + outcome mix */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Shadow fleet P&amp;L trajectory
            </CardTitle>
            <CardDescription>
              Cumulative realized return of every hypothetical shadow trade, compounded. This is
              the counterfactual — what a no-platform execution would have earned on the same
              signals. The live line (coming soon) will overlay on the same axis; the gap is the
              platform&apos;s value.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shadowQ.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : cumulativeSeries.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                title="No closed shadow trades yet"
                body="Use the event playground below to close a synthetic trade, or wait for a live signal to fire."
              />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tickFormatter={(v) => `${v.toFixed(1)}%`}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(2)}%`, 'cumulative']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative_pct"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Shadow cumulative %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Decision outcomes
            </CardTitle>
            <CardDescription>
              Composition of every fleet-scope decision the arbiter has resolved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kpisQ.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : outcomeMix.every((o) => o.value === 0) ? (
              <EmptyState
                icon={<PieChartIcon className="h-5 w-5" />}
                title="No decisions yet"
                body="Fire a regime transition below to generate a decision."
              />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomeMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={84}
                      paddingAngle={2}
                    >
                      {outcomeMix.map((o) => (
                        <Cell key={o.name} fill={OUTCOME_COLORS[o.key] ?? '#a3a3a3'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconSize={10}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controller health + Weekly benchmark */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Controller health
            </CardTitle>
            <CardDescription>
              Per-controller sizing multiplier. Fleet multiplier is the{' '}
              <span className="font-mono">min()</span> across controllers — the lowest bar sets
              your effective fleet exposure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthQ.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : controllerBars.length === 0 ? (
              <EmptyState
                icon={<Gauge className="h-5 w-5" />}
                title="No controllers registered"
                body="The framework provisions controllers at first signed-in request."
              />
            ) : (
              <div className="space-y-4">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={controllerBars} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={140}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'multiplier']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          borderColor: 'hsl(var(--border))',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="multiplier" radius={[0, 4, 4, 0]}>
                        {controllerBars.map((b) => (
                          <Cell
                            key={b.name}
                            fill={b.multiplier < 0.5 ? '#ef4444' : b.multiplier < 1.0 ? '#f59e0b' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <FleetMultiplierLine value={health?.fleet_multiplier ?? 1.0} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weekly platform value
            </CardTitle>
            <CardDescription>
              Live minus shadow over the last 7 days. The weekly benchmark job publishes this
              every Monday 06:00 UTC.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deltaQ.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : deltaQ.data ? (
              <BenchmarkDeltaPanel delta={deltaQ.data} />
            ) : (
              <EmptyState
                icon={<Scale className="h-5 w-5" />}
                title="No weekly delta yet"
                body="Fresh account — the first run of the weekly benchmark job will populate this."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shadow trade stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Shadow trade stream
            <Badge variant="secondary" className="ml-1">
              {shadowTrades.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Every hypothetical fill the shadow fleet has recorded. Slippage is applied in the
            adverse direction — what the user would have actually paid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shadowQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : shadowTrades.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-5 w-5" />}
              title="No shadow trades yet"
              body="Fire a signal below to emit one."
            />
          ) : (
            <ShadowTradeTable trades={shadowTrades} />
          )}
        </CardContent>
      </Card>

      {/* Decisions timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Decisions timeline
            <Badge variant="secondary" className="ml-1">
              {decisions.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Audit log of every fleet-scope decision the arbiter has resolved, regardless of
            outcome. Regulator-grade: indefinite retention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decisionsQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : decisions.length === 0 ? (
            <EmptyState
              icon={<Zap className="h-5 w-5" />}
              title="No decisions yet"
              body="Fire a regime transition below to generate one."
            />
          ) : (
            <DecisionsTable decisions={decisions} />
          )}
        </CardContent>
      </Card>

      {/* Pending recommendations */}
      {pendingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pending recommendations
              <Badge variant="secondary" className="ml-1">
                {pendingCount}
              </Badge>
            </CardTitle>
            <CardDescription>
              Actions the platform downgraded to advisory. Flip the matching envelope opt-in to
              let the arbiter act next time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recQ.data ?? []).map((r) => (
                <RecommendationCard key={r.decision_id} rec={r} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 6. Controls ───────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Controls"
        title="Autonomy policy &amp; event playground"
        description="Raise or lower the autonomy envelope, and exercise the event chain manually against real market prices."
      />

      {/* Autonomy envelope controls (collapsed visually by position) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autonomy envelope
          </CardTitle>
          <CardDescription>
            How much the platform is allowed to act on your fleet autonomously. Fleet-scope
            actions default to blocked; enable individually as you build trust.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {policyQ.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : policyQ.isError ? (
            <p className="text-sm text-destructive">
              Fleet-control framework not enabled for this user.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as AutonomyMode)}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MODE_LABELS) as AutonomyMode[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {MODE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fleet-scope action opt-ins
                </p>
                <FleetActionRow
                  label="Reduce fleet exposure"
                  description="Cut fleet-wide sizing in adverse regimes (e.g. 25% of normal during CRISIS)"
                  checked={allowReduce}
                  onChange={setAllowReduce}
                />
                <FleetActionRow
                  label="Restore fleet exposure"
                  description="Unwind a prior reduction once regime stabilises"
                  checked={allowRestore}
                  onChange={setAllowRestore}
                />
                <FleetActionRow
                  label="Trigger fleet rebalance"
                  description="Auto-execute portfolio optimisation on qualifying regime shifts"
                  checked={allowRebalance}
                  onChange={setAllowRebalance}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-xs text-muted-foreground">
                  Policy ID:{' '}
                  <span className="font-mono">{policyQ.data?.policy_id.slice(0, 8)}…</span>
                </div>
                <Button onClick={handleSavePolicy} disabled={updatePolicy.isPending}>
                  {updatePolicy.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
              {updatePolicy.isError && (
                <p className="text-sm text-destructive">{updatePolicy.error.message}</p>
              )}
              {updatePolicy.isSuccess && !updatePolicy.isPending && (
                <p className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Saved.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Debug playground */}
      <EventPlayground
        publishRegime={publishRegime}
        publishSignal={publishSignal}
        publishTradeClosed={publishTradeClosed}
      />
    </div>
  );
}

// ── KPI strip ───────────────────────────────────────────────────────

function KpiStrip({
  kpis,
  loading,
  pendingCount,
}: {
  kpis: ReturnType<typeof useFleetControlKPIs>['data'];
  loading: boolean;
  pendingCount: number;
}) {
  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (!kpis) return null;

  const deltaPct = kpis.latest_benchmark_delta_pct;
  const deltaPositive = deltaPct === null ? null : deltaPct >= 0;
  const multiplier = kpis.fleet_multiplier;
  const multiplierColor =
    multiplier < 0.5
      ? 'text-destructive'
      : multiplier < 1.0
        ? 'text-amber-500'
        : 'text-green-600';

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <KpiTile
        label="Platform value (weekly)"
        value={
          deltaPct === null
            ? '—'
            : `${deltaPositive ? '+' : ''}${(deltaPct * 100).toFixed(2)}%`
        }
        sub={
          deltaPct === null
            ? 'awaiting first weekly job'
            : 'live P&L vs shadow-fleet counterfactual'
        }
        icon={
          deltaPct === null ? (
            <Scale className="h-4 w-4" />
          ) : deltaPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )
        }
        valueClass={
          deltaPct === null
            ? ''
            : deltaPositive
              ? 'text-green-600'
              : 'text-destructive'
        }
      />
      <KpiTile
        label="Fleet multiplier"
        value={`${(multiplier * 100).toFixed(0)}%`}
        sub={`composed across ${kpis.n_controllers} controller${kpis.n_controllers === 1 ? '' : 's'}`}
        icon={<Gauge className="h-4 w-4" />}
        valueClass={multiplierColor}
      />
      <KpiTile
        label="Shadow trades"
        value={`${kpis.n_shadow_trades_closed + kpis.n_shadow_trades_open}`}
        sub={
          kpis.n_shadow_trades_suppressed > 0
            ? `${kpis.n_shadow_trades_closed} closed · ${kpis.n_shadow_trades_suppressed} live-suppressed`
            : `${kpis.n_shadow_trades_closed} closed · ${kpis.n_shadow_trades_open} open`
        }
        icon={<Activity className="h-4 w-4" />}
      />
      <KpiTile
        label="Pending approvals"
        value={`${pendingCount}`}
        sub={
          kpis.n_decisions_acted > 0
            ? `${kpis.n_decisions_acted} acted · ${kpis.n_decisions_total} total`
            : `${kpis.n_decisions_total} decisions logged`
        }
        icon={<Zap className="h-4 w-4" />}
        valueClass={pendingCount > 0 ? 'text-amber-500' : ''}
      />
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${valueClass ?? ''}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

// ── Weekly benchmark panel ──────────────────────────────────────────

function BenchmarkDeltaPanel({
  delta,
}: {
  delta: NonNullable<ReturnType<typeof useFleetControlBenchmarkDelta>['data']>;
}) {
  const positive = delta.platform_delta >= 0;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Δ equity</span>
        <span
          className={`text-lg font-semibold ${positive ? 'text-green-600' : 'text-destructive'}`}
        >
          {positive ? '+' : ''}
          {(delta.platform_delta * 100).toFixed(2)}%
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Δ Sharpe</span>
        <span className="font-mono">{delta.sharpe_delta.toFixed(2)}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Suppressed</span>
        <span className="font-mono">{delta.n_suppressed_in_live}</span>
      </div>
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>live {delta.n_live_trades}</span>
        <span>shadow {delta.n_shadow_trades}</span>
      </div>
    </div>
  );
}

// ── Tables + helpers ────────────────────────────────────────────────

function ShadowTradeTable({ trades }: { trades: ShadowTradeView[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-2 text-left font-medium">Entered</th>
            <th className="px-2 py-2 text-left font-medium">Symbol</th>
            <th className="px-2 py-2 text-left font-medium">Side</th>
            <th className="px-2 py-2 text-right font-medium">Signal $</th>
            <th className="px-2 py-2 text-right font-medium">Fill $</th>
            <th className="px-2 py-2 text-right font-medium">Slip (bps)</th>
            <th className="px-2 py-2 text-right font-medium">Exit $</th>
            <th className="px-2 py-2 text-right font-medium">P&amp;L</th>
            <th className="px-2 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const pnlPos = (t.realized_pnl_pct ?? 0) >= 0;
            return (
              <tr key={t.shadow_trade_id} className="border-b last:border-b-0">
                <td className="px-2 py-2 text-xs text-muted-foreground">
                  {new Date(t.entered_at).toLocaleTimeString()}
                </td>
                <td className="px-2 py-2 font-mono">{t.symbol}</td>
                <td className="px-2 py-2">
                  <Badge variant={t.side === 'long' ? 'default' : 'secondary'} className="text-[10px]">
                    {t.side}
                  </Badge>
                </td>
                <td className="px-2 py-2 text-right font-mono text-xs">
                  {t.signal_price.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-xs">
                  {t.shadow_fill_price.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-xs text-muted-foreground">
                  {t.slippage_bps_applied.toFixed(1)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-xs">
                  {t.exit_price !== null ? t.exit_price.toFixed(2) : '—'}
                </td>
                <td
                  className={`px-2 py-2 text-right font-mono text-xs ${
                    t.realized_pnl_pct === null
                      ? 'text-muted-foreground'
                      : pnlPos
                        ? 'text-green-600'
                        : 'text-destructive'
                  }`}
                >
                  {t.realized_pnl_pct !== null
                    ? `${pnlPos ? '+' : ''}${t.realized_pnl_pct.toFixed(2)}%`
                    : 'open'}
                </td>
                <td className="px-2 py-2">
                  {t.was_suppressed_in_live ? (
                    <Badge variant="outline" className="border-amber-500 text-[10px] text-amber-600">
                      suppressed in live
                    </Badge>
                  ) : t.exited_at ? (
                    <Badge variant="outline" className="text-[10px]">
                      closed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      open
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DecisionsTable({ decisions }: { decisions: AutonomyDecisionView[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-2 text-left font-medium">Resolved</th>
            <th className="px-2 py-2 text-left font-medium">Controller</th>
            <th className="px-2 py-2 text-left font-medium">Action</th>
            <th className="px-2 py-2 text-left font-medium">Outcome</th>
            <th className="px-2 py-2 text-right font-medium">Target ×</th>
            <th className="px-2 py-2 text-right font-medium">Latency (ms)</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => (
            <tr key={d.decision_id} className="border-b last:border-b-0">
              <td className="px-2 py-2 text-xs text-muted-foreground">
                {new Date(d.resolved_at).toLocaleTimeString()}
              </td>
              <td className="px-2 py-2 font-mono text-xs">{d.controller_kind}</td>
              <td className="px-2 py-2 text-xs">{d.action.replace(/_/g, ' ')}</td>
              <td className="px-2 py-2">
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase"
                  style={{
                    borderColor: OUTCOME_COLORS[d.outcome] ?? '#a3a3a3',
                    color: OUTCOME_COLORS[d.outcome] ?? '#a3a3a3',
                  }}
                >
                  {d.outcome}
                </Badge>
              </td>
              <td className="px-2 py-2 text-right font-mono text-xs">
                {d.suggested_multiplier !== null
                  ? `${d.suggested_multiplier.toFixed(2)}×`
                  : '—'}
              </td>
              <td className="px-2 py-2 text-right font-mono text-xs text-muted-foreground">
                {d.latency_ms}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FleetMultiplierLine({ value }: { value: number }) {
  const pct = (value * 100).toFixed(0);
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        Composed fleet multiplier
      </span>
      <span className="font-mono text-base font-semibold">{pct}%</span>
    </div>
  );
}

function RecommendationCard({
  rec,
}: {
  rec: NonNullable<ReturnType<typeof useFleetControlRecommendations>['data']>[number];
}) {
  const resolvedAt = new Date(rec.resolved_at);
  const reason = typeof rec.evidence?.reason === 'string' ? rec.evidence.reason : null;
  const target =
    typeof rec.payload?.target_multiplier === 'number' ? rec.payload.target_multiplier : null;
  return (
    <div className="rounded-md border bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Badge variant="outline" className="uppercase">
              {rec.action.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">{rec.controller_kind}</span>
          </div>
          {reason && <p className="mt-2 text-sm text-foreground">{reason}</p>}
          {target !== null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Target sizing multiplier: <span className="font-mono">{target.toFixed(2)}×</span>
            </p>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {resolvedAt.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function FleetActionRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ModeBadge({ mode }: { mode: AutonomyMode }) {
  const tone: Record<AutonomyMode, string> = {
    advisory_only: 'bg-muted text-muted-foreground',
    auto_protect_only: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    auto_protect_and_revalidate: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    auto_manage_with_bounds: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    user_gated_deployment_autonomous_runtime: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    full_bounded_autonomy: 'bg-green-500/15 text-green-700 dark:text-green-400',
  };
  const label = MODE_LABELS[mode].split('—')[0].trim();
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${tone[mode]}`}
      title={MODE_LABELS[mode]}
    >
      {label}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="max-w-sm text-xs text-muted-foreground">{body}</div>
    </div>
  );
}

// ── Derived-data helpers ────────────────────────────────────────────

interface CumulativePoint {
  label: string;
  cumulative_pct: number;
}

function buildCumulativeSeries(trades: ShadowTradeView[]): CumulativePoint[] {
  const closed = trades
    .filter((t) => t.realized_pnl_pct !== null && t.exited_at !== null)
    .sort((a, b) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime());

  let equity = 1;
  const points: CumulativePoint[] = [];
  closed.forEach((t, idx) => {
    equity *= 1 + (t.realized_pnl_pct ?? 0) / 100;
    points.push({
      label: `#${idx + 1} ${new Date(t.entered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      cumulative_pct: (equity - 1) * 100,
    });
  });
  return points;
}

function buildOutcomeMix(kpis: ReturnType<typeof useFleetControlKPIs>['data']) {
  if (!kpis) return [];
  return [
    { key: 'acted', name: 'Acted', value: kpis.n_decisions_acted },
    { key: 'recommended', name: 'Recommended', value: kpis.n_decisions_recommended_pending },
    { key: 'blocked', name: 'Blocked', value: kpis.n_decisions_blocked },
    { key: 'deduped', name: 'Deduped', value: kpis.n_decisions_deduped },
  ];
}

function prettyControllerKind(kind: string): string {
  return kind
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// ── Event playground ────────────────────────────────────────────────

type PublishMutation<TVars> = UseMutationResult<PublishAck, Error, TVars>;

type RegimeTransitionVars = {
  previous_regime: number;
  new_regime: number;
  conviction: 'low' | 'moderate' | 'high';
};

function EventPlayground({
  publishRegime,
  publishSignal,
  publishTradeClosed,
}: {
  publishRegime: PublishMutation<RegimeTransitionVars>;
  publishSignal: PublishMutation<{ ticker: string; entry_target?: number }>;
  publishTradeClosed: PublishMutation<{
    ticker: string;
    exit_price?: number;
    realized_pnl_pct?: number;
  }>;
}) {
  const [ticker, setTicker] = useState('AAPL');

  const lastAck =
    publishSignal.data ?? publishTradeClosed.data ?? publishRegime.data ?? null;
  const lastSide = publishSignal.data
    ? 'signal'
    : publishTradeClosed.data
      ? 'trade close'
      : publishRegime.data
        ? 'regime transition'
        : null;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube2 className="h-5 w-5" />
          Event playground
        </CardTitle>
        <CardDescription>
          Exercises the Tier 11 chain against real market data. Signal /
          trade-close lookups hit the live market-data DB for the ticker
          below. Disabled in production builds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="playground-ticker" className="text-xs uppercase tracking-wide text-muted-foreground">
              Ticker
            </Label>
            <Input
              id="playground-ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().trim())}
              className="h-9 w-32 font-mono"
              placeholder="AAPL"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              publishRegime.mutate({
                previous_regime: 1,
                new_regime: 3,
                conviction: 'high',
              })
            }
            disabled={publishRegime.isPending}
          >
            Fire NORMAL → CRISIS
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              publishRegime.mutate({
                previous_regime: 3,
                new_regime: 1,
                conviction: 'high',
              })
            }
            disabled={publishRegime.isPending}
          >
            Fire CRISIS → NORMAL
          </Button>
          <Button
            variant="default"
            onClick={() => publishSignal.mutate({ ticker })}
            disabled={publishSignal.isPending || !ticker}
          >
            Publish signal @ last close
          </Button>
          <Button
            variant="default"
            onClick={() => publishTradeClosed.mutate({ ticker })}
            disabled={publishTradeClosed.isPending || !ticker}
          >
            Close trade @ last close
          </Button>
        </div>

        {lastAck && lastSide && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="uppercase">{lastSide}</Badge>
              <span className="text-muted-foreground">published</span>
              <span className="font-mono">{new Date(lastAck.published_at).toLocaleTimeString()}</span>
              {lastAck.resolved_price != null && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span>
                    price{' '}
                    <span className="font-mono font-semibold">
                      ${lastAck.resolved_price.toFixed(2)}
                    </span>
                  </span>
                </>
              )}
              {lastAck.price_source && (
                <Badge
                  variant="outline"
                  className={
                    lastAck.price_source === 'market_data_db'
                      ? 'border-green-500/50 text-green-600'
                      : lastAck.price_source === 'override'
                        ? 'border-amber-500/50 text-amber-600'
                        : 'border-muted-foreground/40 text-muted-foreground'
                  }
                >
                  {lastAck.price_source.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
        )}

        {(publishRegime.isError || publishSignal.isError || publishTradeClosed.isError) && (
          <p className="flex items-center gap-1 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {publishSignal.error?.message ??
              publishTradeClosed.error?.message ??
              publishRegime.error?.message ??
              'Publish failed. The ticker may not be ingested in the market-data DB, or debug endpoints are off.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
