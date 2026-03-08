'use client';

import { useState } from 'react';
import { Pause, Play, Circle, ShieldAlert } from 'lucide-react';
import PauseConfirmDialog from '@/components/operations/PauseConfirmDialog';
import ResumeConfirmDialog from '@/components/operations/ResumeConfirmDialog';
import MonitoringStatusCard from '@/components/operations/MonitoringStatusCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useBots, usePauseBot, useResumeBot, useRetireBot } from '@/hooks/useBots';
import { useBotSkill } from '@/hooks/useBotSkill';
import { useMonitoringReport } from '@/hooks/useMonitoringReport';
import { getBotStateColors } from '@/lib/colors';
import { getBotStateLabel } from '@/lib/regimeLabel';
import { formatCurrency } from '@/utils/formatters';
import type { BotSnapshot, BotState, SkillLabel } from '@/types/api';

// ---------------------------------------------------------------------------
// Sort order — circuit_breaker bots surface to the top, stopped bots last
// ---------------------------------------------------------------------------

const BOT_STATE_SORT_ORDER: Record<string, number> = {
  circuit_breaker: 0,
  paused_monitoring: 1,
  paused_user: 2,
  paused_regime: 3,
  ramping: 4,
  active: 5,
  stopped: 6,
};

function sortBots(bots: BotSnapshot[]): BotSnapshot[] {
  return [...bots].sort(
    (a, b) =>
      (BOT_STATE_SORT_ORDER[a.state] ?? 99) - (BOT_STATE_SORT_ORDER[b.state] ?? 99),
  );
}

function skillBadgeVariant(label: SkillLabel): 'default' | 'secondary' | 'destructive' {
  if (label === 'strong_skill' || label === 'probable_skill') return 'default';
  if (label === 'likely_unskilled' || label === 'probable_luck') return 'destructive';
  return 'secondary'; // inconclusive, insufficient_data
}

function botNarrative(bot: BotSnapshot): string {
  if (bot.drift_detected) return '⚠ Performance drift detected — rediscovery may be recommended.';
  if (bot.rediscovery_recommended) return 'Rediscovery recommended based on recent trade patterns.';
  if (bot.state === 'circuit_breaker') return 'Circuit breaker triggered. Manual review required.';
  if (bot.state === 'paused_regime') return 'Bot auto-paused due to adverse regime conditions.';
  return 'Bot operating normally within expected parameters.';
}

export default function FleetManagement() {
  const { data: bots, isLoading: botsLoading, isError: botsError } = useBots();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pauseBot = usePauseBot();
  const resumeBot = useResumeBot();
  const retireBot = useRetireBot();

  // Dialog state — null means closed
  const [pendingPause, setPendingPause] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<{ id: string; state: BotState } | null>(null);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const selectedBot = bots?.find((b) => b.bot_id === selectedId);
  const { data: monitoringReport } = useMonitoringReport(selectedId);
  const { data: skill } = useBotSkill(selectedId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Bot List */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Deployments</CardTitle>
          <CardDescription>
            {botsLoading ? 'Loading…' : `${bots?.length ?? 0} bots configured`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {botsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          )}
          {botsError && (
            <p className="text-sm text-destructive">Failed to load bots. Please try again.</p>
          )}
          {!botsLoading && !botsError && (
            <div className="space-y-3">
              {sortBots(bots ?? []).map((bot) => {
                const stateColors = getBotStateColors(bot.state);
                const stateLabel = getBotStateLabel(bot.state);
                const isSelected = bot.bot_id === selectedId;
                const unrealizedPositive = bot.unrealized_pnl >= 0;
                const isPausing = pauseBot.isPending && pauseBot.variables === bot.bot_id;
                const isResuming = resumeBot.isPending && resumeBot.variables === bot.bot_id;

                return (
                  <div
                    key={bot.bot_id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedId(bot.bot_id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Circle className={`h-2 w-2 fill-current ${stateColors.dotColor}`} />
                        <span className="font-mono-data text-xs text-muted-foreground">
                          {bot.bot_id.substring(0, 8)}…
                        </span>
                        <Badge variant={stateColors.badgeVariant} className="text-[10px] h-5">
                          {stateLabel}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {bot.state === 'active' && (
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            disabled={isPausing}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingPause(bot.bot_id);
                            }}
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(bot.state === 'paused_user' || bot.state === 'paused_regime' || bot.state === 'paused_monitoring') && (
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            disabled={isResuming}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingResume({ id: bot.bot_id, state: bot.state });
                            }}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Capital</p>
                        <p className="font-mono-data text-sm font-medium">{formatCurrency(bot.current_capital)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unrealized P&L</p>
                        <p className={`font-mono-data text-sm font-medium ${unrealizedPositive ? 'text-success' : 'text-destructive'}`}>
                          {unrealizedPositive ? '+' : ''}{formatCurrency(bot.unrealized_pnl)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Open Trades</p>
                        <p className="font-mono-data text-sm font-medium">{bot.n_open_trades}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {bots?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No bots deployed yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot Detail */}
      <div className="flex flex-col gap-6">
        <MonitoringStatusCard selectedBotId={selectedId} />
        {!selectedBot ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Select a bot to view details</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Detail Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="font-mono-data text-sm">{selectedBot.bot_id.substring(0, 8)}…</span>
                  <Badge variant={getBotStateColors(selectedBot.state).badgeVariant} className="text-[10px]">
                    {getBotStateLabel(selectedBot.state)}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {selectedBot.n_closed_trades} closed trades · Sharpe: 
                  {isNaN(selectedBot.sharpe_realized) ? 'N/A' : selectedBot.sharpe_realized.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Capital</p>
                    <p className="font-mono-data text-lg font-bold">{formatCurrency(selectedBot.current_capital)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                    <p className={`font-mono-data text-lg font-bold ${
                      selectedBot.unrealized_pnl >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {selectedBot.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(selectedBot.unrealized_pnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open Positions</p>
                    <p className="font-mono-data text-lg font-bold">{selectedBot.n_open_trades}</p>
                  </div>
                </div>
                <div className="rounded-lg border-l-4 border-info bg-info/5 p-3">
                  <p className="text-xs font-semibold text-info mb-0.5">Status</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {botNarrative(selectedBot)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Decision Panel — powered by MonitoringBotReport */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Decision Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monitoringReport ? (
                  <>
                    <div className={`mb-4 rounded-lg px-4 py-2.5 text-center text-xs font-semibold ${
                      monitoringReport.alerts.length === 0
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      {monitoringReport.alerts.length === 0
                        ? '✓ No active alerts — bot within expected bounds'
                        : `⚠ ${monitoringReport.alerts.length} alert(s) detected`}
                    </div>

                    {/* Bayesian posteriors as progress bars */}
                    <div className="space-y-3 mb-4">
                      {[
                        {
                          label: 'Win Rate (posterior mean)',
                          current: Math.round(monitoringReport.win_rate_posterior_mean * 100),
                          limit: 100,
                          unit: '%',
                        },
                        {
                          label: 'CUSUM Status',
                          current: monitoringReport.cusum_status === 'alert' ? 80 : 20,
                          limit: 100,
                          unit: '',
                        },
                      ].map((meter) => {
                        const pct = Math.min((meter.current / meter.limit) * 100, 100);
                        const indicatorClass =
                          pct > 75
                            ? '[&>[data-slot=progress-indicator]]:bg-destructive'
                            : pct > 50
                              ? '[&>[data-slot=progress-indicator]]:bg-warning'
                              : '[&>[data-slot=progress-indicator]]:bg-success';
                        return (
                          <div key={meter.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium">{meter.label}</span>
                              <span className="font-mono-data text-xs text-muted-foreground">
                                {meter.current}{meter.unit} / {meter.limit}{meter.unit}
                              </span>
                            </div>
                            <Progress value={pct} className={`h-1.5 ${indicatorClass}`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Alert list */}
                    {monitoringReport.alerts.length > 0 && (
                      <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 mb-4">
                        <p className="text-xs font-semibold text-destructive mb-1">Active Alerts</p>
                        <ul className="space-y-1">
                          {monitoringReport.alerts.map((alert, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {alert}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading monitoring data…</p>
                )}

                {/* Skill Assessment */}
                {skill && (
                  <div className="mt-0 mb-4 rounded-lg border p-3">
                    <p className="text-xs font-semibold mb-2">Skill Assessment</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={skillBadgeVariant(skill.skill_label)}
                        className="text-[10px] capitalize"
                      >
                        {skill.skill_label.replace(/_/g, ' ')}
                      </Badge>
                      <span className="font-mono-data text-xs text-muted-foreground">
                        PSR {(skill.psr * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
                        <p className="font-mono-data text-xs font-medium">
                          {(skill.win_rate * 100).toFixed(1)}%{skill.win_rate_significant ? ' ✓' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Alpha Decay</p>
                        <p className="font-mono-data text-xs font-medium capitalize">
                          {skill.alpha_decay_status.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    {skill.trades_needed_for_95 !== null && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {skill.trades_needed_for_95} more trades needed for 95% confidence
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {selectedBot.state === 'active' && (
                    <Button size="sm" variant="outline"
                      disabled={pauseBot.isPending}
                      onClick={() => setPendingPause(selectedBot.bot_id)}
                    >
                      Pause Bot
                    </Button>
                  )}
                  {(selectedBot.state === 'paused_user' || selectedBot.state === 'paused_regime' || selectedBot.state === 'paused_monitoring') && (
                    <Button size="sm" variant="outline"
                      disabled={resumeBot.isPending}
                      onClick={() => setPendingResume({ id: selectedBot.bot_id, state: selectedBot.state })}
                    >
                      Resume Bot
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={retireBot.isPending}
                      >
                        {retireBot.isPending ? 'Retiring…' : 'Retire Bot'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Retire this bot?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently stop the bot from trading. Trade history and
                          performance data will be preserved, but this action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => retireBot.mutate(selectedBot.bot_id, {
                            onSuccess: () => {
                              toast.success('Bot retired');
                              setSelectedId(null);
                            },
                            onError: (err) => toast.error(`Failed to retire: ${err.message}`),
                          })}
                        >
                          Retire Bot
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ─── Confirm Dialogs ──────────────────────────────────────────────── */}
      <PauseConfirmDialog
        botId={pendingPause ?? ''}
        open={!!pendingPause}
        isPending={pauseBot.isPending}
        error={pauseError}
        onConfirm={() => {
          if (!pendingPause) return;
          setPauseError(null);
          pauseBot.mutate(pendingPause, {
            onSuccess: () => {
              toast.success('Bot paused');
              setPendingPause(null);
            },
            onError: (err) => {
              setPauseError(err.message);
              toast.error(`Failed to pause: ${err.message}`);
            },
          });
        }}
        onClose={() => {
          setPendingPause(null);
          setPauseError(null);
        }}
      />
      <ResumeConfirmDialog
        botId={pendingResume?.id ?? ''}
        fromState={pendingResume?.state ?? 'paused_user'}
        open={!!pendingResume}
        isPending={resumeBot.isPending}
        error={resumeError}
        onConfirm={() => {
          if (!pendingResume) return;
          setResumeError(null);
          resumeBot.mutate(pendingResume.id, {
            onSuccess: () => {
              toast.success('Bot resumed');
              setPendingResume(null);
            },
            onError: (err) => {
              setResumeError(err.message);
              toast.error(`Failed to resume: ${err.message}`);
            },
          });
        }}
        onClose={() => {
          setPendingResume(null);
          setResumeError(null);
        }}
      />
    </div>
  );
}
