'use client';

import { useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  Settings2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCircuitBreakers, useUpdateCBThresholds } from '@/hooks/useCircuitBreakers';
import { REGIME_HEX } from '@/lib/colors';
import type { BotBreakerStatus, FleetBreakerStatus, FleetCBThresholds } from '@/types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REGIME_LABELS: Record<number, string> = {
  0: 'LOW VOL',
  1: 'NORMAL',
  2: 'ELEV. VOL',
  3: 'CRISIS',
};

/** Color based on utilization ratio */
function utilizationColor(u: number): string {
  if (u >= 1.0) return '#dc2626'; // red-600 — TRIPPED
  if (u >= 0.8) return '#f97316'; // orange-500 — AT RISK
  if (u >= 0.5) return '#f59e0b'; // amber-500 — ELEVATED
  return '#22c55e';               // green-500 — SAFE
}

/** Tailwind text class for utilization */
function utilizationTextClass(u: number): string {
  if (u >= 1.0) return 'text-destructive';
  if (u >= 0.8) return 'text-orange-500';
  if (u >= 0.5) return 'text-warning';
  return 'text-success';
}

/** Progress bar class based on utilization */
function progressClass(u: number): string {
  if (u >= 1.0) return '[&>[data-slot=progress-indicator]]:bg-destructive';
  if (u >= 0.8) return '[&>[data-slot=progress-indicator]]:bg-orange-500';
  if (u >= 0.5) return '[&>[data-slot=progress-indicator]]:bg-warning';
  return '[&>[data-slot=progress-indicator]]:bg-success';
}

// ---------------------------------------------------------------------------
// Half-circle RadialBar gauge
// ---------------------------------------------------------------------------

interface GaugeProps {
  utilization: number;
  label: string;
  currentValue: string;
  thresholdValue: string;
}

function HalfGauge({ utilization, label, currentValue, thresholdValue }: GaugeProps) {
  const clampedPct = Math.min(utilization * 100, 100);
  const fill = utilizationColor(utilization);
  const textClass = utilizationTextClass(utilization);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 110, height: 66 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx={55}
            cy={62}
            innerRadius={36}
            outerRadius={52}
            startAngle={180}
            endAngle={0}
            barSize={14}
            data={[{ value: clampedPct, fill }]}
          >
            <RadialBar
              background={{ fill: 'var(--color-muted)' }}
              dataKey="value"
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center value overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className={`font-mono-data text-sm font-bold leading-none ${textClass}`}>
            {(utilization * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-center leading-tight">{label}</p>
      <p className="text-[10px] font-mono-data text-muted-foreground text-center">
        {currentValue} / {thresholdValue}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-bot utilization row
// ---------------------------------------------------------------------------

interface BotRowProps {
  bot: BotBreakerStatus;
}

function BotBreakerRow({ bot }: BotRowProps) {
  const metrics = [
    {
      label: 'Daily Loss',
      utilization: bot.daily_loss_utilization,
      current: `${bot.daily_loss_pct.toFixed(1)}%`,
      threshold: `${bot.daily_loss_threshold_pct.toFixed(1)}%`,
    },
    {
      label: 'Drawdown',
      utilization: bot.drawdown_utilization,
      current: `${bot.drawdown_pct.toFixed(1)}%`,
      threshold: `${bot.drawdown_threshold_pct.toFixed(1)}%`,
    },
    {
      label: 'Loss Streak',
      utilization: bot.consecutive_losses_utilization,
      current: `${bot.consecutive_losses}`,
      threshold: `${bot.consecutive_losses_threshold}`,
    },
  ];

  const worstUtil = Math.max(
    bot.daily_loss_utilization,
    bot.drawdown_utilization,
    bot.consecutive_losses_utilization,
  );

  return (
    <div className={`rounded-lg border p-3 ${bot.is_tripped ? 'border-destructive/50 bg-destructive/5' : bot.any_breaker_at_risk ? 'border-orange-500/30 bg-orange-500/5' : ''}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {bot.is_tripped ? (
            <Zap className="h-3.5 w-3.5 text-destructive shrink-0" />
          ) : bot.any_breaker_at_risk ? (
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
          )}
          <span className="text-xs font-semibold truncate max-w-[120px]">{bot.strategy_name}</span>
          {bot.ticker && (
            <Badge variant="outline" className="h-4 px-1 text-[9px] font-mono-data">
              {bot.ticker}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {bot.is_tripped && (
            <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">TRIPPED</Badge>
          )}
          {!bot.is_tripped && bot.any_breaker_at_risk && (
            <Badge className="h-4 px-1.5 text-[9px] bg-orange-500 hover:bg-orange-500">AT RISK</Badge>
          )}
          <span
            className={`font-mono-data text-[11px] font-bold ${utilizationTextClass(worstUtil)}`}
          >
            {(worstUtil * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{m.label}</span>
              <span className={`text-[9px] font-mono-data ${utilizationTextClass(m.utilization)}`}>
                {m.current}
              </span>
            </div>
            <Progress
              value={Math.min(m.utilization * 100, 100)}
              className={`h-1 ${progressClass(m.utilization)}`}
            />
            <span className="text-[9px] text-muted-foreground">lim {m.threshold}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Configure Thresholds Dialog
// ---------------------------------------------------------------------------

interface ConfigureDialogProps {
  fleet: FleetBreakerStatus;
}

function ConfigureThresholdsDialog({ fleet }: ConfigureDialogProps) {
  const [open, setOpen] = useState(false);
  const [dailyLoss, setDailyLoss] = useState(
    fleet.daily_loss_threshold_pct.toFixed(1),
  );
  const [drawdown, setDrawdown] = useState(
    fleet.drawdown_threshold_pct.toFixed(1),
  );
  const [correlation, setCorrelation] = useState(
    fleet.correlation_threshold.toFixed(2),
  );

  const { mutate, isPending } = useUpdateCBThresholds();

  function handleSave() {
    const payload: FleetCBThresholds = {
      cb_fleet_max_daily_loss_pct: parseFloat(dailyLoss),
      cb_fleet_max_drawdown_pct: parseFloat(drawdown),
      cb_fleet_max_avg_correlation: parseFloat(correlation),
    };
    mutate(payload, {
      onSuccess: () => {
        toast.success('Circuit breaker thresholds updated');
        setOpen(false);
      },
      onError: (err) => {
        toast.error('Failed to update thresholds', { description: err.message });
      },
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Configure
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Display Thresholds</SheetTitle>
          <SheetDescription className="text-xs">
            Set gauge reference lines for fleet circuit-breaker meters.
            These affect the display only (Phase 1).
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Max Daily Loss %{' '}
              <span className="text-muted-foreground">(1 – 20)</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={20}
              step={0.5}
              value={dailyLoss}
              onChange={(e) => setDailyLoss(e.target.value)}
              className="h-8 font-mono-data text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Max Drawdown %{' '}
              <span className="text-muted-foreground">(2 – 50)</span>
            </Label>
            <Input
              type="number"
              min={2}
              max={50}
              step={1}
              value={drawdown}
              onChange={(e) => setDrawdown(e.target.value)}
              className="h-8 font-mono-data text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Max Avg Correlation{' '}
              <span className="text-muted-foreground">(0.50 – 1.00)</span>
            </Label>
            <Input
              type="number"
              min={0.5}
              max={1.0}
              step={0.05}
              value={correlation}
              onChange={(e) => setCorrelation(e.target.value)}
              className="h-8 font-mono-data text-sm"
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CircuitBreakerMeters() {
  const { data, isLoading, isError } = useCircuitBreakers();
  const [botsExpanded, setBotsExpanded] = useState(false);

  // --------------------------------------------------------------------------
  // Loading
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Circuit Breakers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Error
  // --------------------------------------------------------------------------
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Circuit Breakers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load circuit breaker status.</p>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Empty — no bots
  // --------------------------------------------------------------------------
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Circuit Breakers
          </CardTitle>
          <CardDescription>Live utilization gauges</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No bots registered — deploy a bot to see circuit-breaker gauges.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { fleet_status: fleet, bot_statuses: bots, display_only_warning } = data;
  const regimeLabel = REGIME_LABELS[fleet.regime] ?? 'UNKNOWN';
  const regimeColor = REGIME_HEX[fleet.regime] ?? '#6b7280';
  const trippedBots = bots.filter((b) => b.is_tripped);
  const atRiskBots  = bots.filter((b) => !b.is_tripped && b.any_breaker_at_risk);

  // --------------------------------------------------------------------------
  // Main render
  // --------------------------------------------------------------------------
  return (
    <Card className={fleet.is_tripped ? 'border-destructive/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {fleet.is_tripped ? (
            <ShieldAlert className="h-4 w-4 text-destructive" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-success" />
          )}
          Circuit Breakers
          {fleet.is_tripped && (
            <Badge variant="destructive" className="ml-1 text-[10px]">FLEET TRIPPED</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Live utilization gauges — fleet &amp; per-bot risk limits
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] font-mono-data font-semibold"
            style={{ borderColor: regimeColor, color: regimeColor }}
          >
            {regimeLabel}
          </Badge>
          <ConfigureThresholdsDialog fleet={fleet} />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Phase 1 disclaimer ─────────────────────────────────────── */}
        <Alert className="border-amber-500/30 bg-amber-500/5 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <AlertDescription className="text-[11px] text-amber-700 dark:text-amber-400 ml-1">
            {display_only_warning}
          </AlertDescription>
        </Alert>

        {/* ── Fleet gauges ────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">Fleet</p>
          <div className="grid grid-cols-3 gap-2">
            <HalfGauge
              utilization={fleet.daily_loss_utilization}
              label="Daily Loss"
              currentValue={`${fleet.daily_loss_pct.toFixed(1)}%`}
              thresholdValue={`${fleet.daily_loss_threshold_pct.toFixed(1)}%`}
            />
            <HalfGauge
              utilization={fleet.drawdown_utilization}
              label="Drawdown"
              currentValue={`${fleet.drawdown_pct.toFixed(1)}%`}
              thresholdValue={`${fleet.drawdown_threshold_pct.toFixed(1)}%`}
            />
            <HalfGauge
              utilization={fleet.correlation_utilization}
              label="Avg Corr"
              currentValue={fleet.avg_correlation.toFixed(2)}
              thresholdValue={fleet.correlation_threshold.toFixed(2)}
            />
          </div>
          {fleet.thresholds_source === 'user_configured' && (
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Using user-configured thresholds
            </p>
          )}
        </div>

        {/* ── Per-bot section ──────────────────────────────────────────── */}
        {bots.length > 0 && (
          <div>
            <button
              onClick={() => setBotsExpanded((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span>
                Per-Bot Status
                {trippedBots.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-4 px-1.5 text-[9px]">
                    {trippedBots.length} tripped
                  </Badge>
                )}
                {atRiskBots.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1.5 text-[9px] bg-orange-500 hover:bg-orange-500">
                    {atRiskBots.length} at risk
                  </Badge>
                )}
              </span>
              {botsExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {botsExpanded && (
              <div className="mt-2 space-y-2">
                {/* Tripped bots first, then at-risk, then safe */}
                {[
                  ...bots.filter((b) => b.is_tripped),
                  ...bots.filter((b) => !b.is_tripped && b.any_breaker_at_risk),
                  ...bots.filter((b) => !b.is_tripped && !b.any_breaker_at_risk),
                ].map((bot) => (
                  <BotBreakerRow key={bot.bot_id} bot={bot} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
