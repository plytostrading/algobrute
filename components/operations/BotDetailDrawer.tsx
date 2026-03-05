'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import MonitoringPanel from '@/components/operations/MonitoringPanel';
import PauseConfirmDialog from '@/components/operations/PauseConfirmDialog';
import ResumeConfirmDialog from '@/components/operations/ResumeConfirmDialog';
import { useMonitoringReport } from '@/hooks/useMonitoringReport';
import { usePauseBot, useResumeBot, useRetireBot } from '@/hooks/useBots';
import { getBotStateColors } from '@/lib/colors';
import { getBotStateLabel } from '@/lib/regimeLabel';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import BotActivityMonitor from '@/components/operations/BotActivityMonitor';
import StrategyDNA from '@/components/portfolio/StrategyDNA';
import { useBacktestList } from '@/hooks/useBacktestWorkflow';
import type { BotSnapshot, BotState, BacktestJobSummary } from '@/types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the most recent completed backtest job with a passport for the given
 * strategy_id + ticker combination. Returns null when no match exists.
 */
function findDnaJobId(
  jobs: BacktestJobSummary[],
  strategyId: string | undefined,
  ticker: string | undefined,
): string | null {
  if (!strategyId || !ticker) return null;
  const matches = jobs
    .filter(
      (j) =>
        j.strategy_id === strategyId &&
        j.ticker === ticker &&
        j.status === 'completed' &&
        j.passport_id != null,
    )
    .sort((a, b) => {
      const at = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bt = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bt - at;
    });
  return matches[0]?.job_id ?? null;
}

function getBotIdentifier(bot: BotSnapshot): string {
  if (bot.strategy_id && bot.ticker) return `${bot.strategy_id} / ${bot.ticker}`;
  return `${bot.bot_id.slice(0, 8)}\u2026`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BotDetailDrawerProps {
  /** ID of the bot to show. Pass null to close the drawer. */
  botId: string | null;
  bots: BotSnapshot[];
  onClose: () => void;
}

/**
 * Right-side detail drawer for a single bot.
 *
 * - Does NOT close on backdrop click (onInteractOutside is cancelled).
 * - Closes on ×, Escape, or after a successful Retire mutation.
 * - Sections: Snapshot grid, Monitoring Indicators, Actions.
 */
export default function BotDetailDrawer({ botId, bots, onClose }: BotDetailDrawerProps) {
  const bot = bots.find((b) => b.bot_id === botId) ?? null;

  const { data: report, isLoading: reportLoading } = useMonitoringReport(botId);
  const { data: backtestJobs = [] } = useBacktestList();
  const dnaJobId = findDnaJobId(backtestJobs, bot?.strategy_id, bot?.ticker);
  const pauseBot = usePauseBot();
  const resumeBot = useResumeBot();
  const retireBot = useRetireBot();

  const [pendingPause, setPendingPause] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<{
    id: string;
    state: BotState;
  } | null>(null);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const canPause = bot?.state === 'active' || bot?.state === 'ramping';
  const canResume =
    bot?.state === 'paused_user' ||
    bot?.state === 'paused_regime' ||
    bot?.state === 'paused_monitoring' ||
    bot?.state === 'circuit_breaker';
  const canRetire = !!bot && bot.state !== 'stopped';
  const pnlPositive = (bot?.unrealized_pnl ?? 0) >= 0;

  return (
    <>
      <Sheet open={!!botId} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-[480px] max-w-[100vw] sm:max-w-[480px] p-0 gap-0 flex flex-col"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Custom header — flex row with identifier + state badge + close button */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {bot ? (
                <>
                  <span className="text-sm font-semibold truncate">
                    {getBotIdentifier(bot)}
                  </span>
                  <Badge
                    variant={getBotStateColors(bot.state).badgeVariant}
                    className="text-[10px] h-5 shrink-0"
                  >
                    {getBotStateLabel(bot.state)}
                  </Badge>
                </>
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">Bot Detail</span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {!bot ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Bot not found.</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="px-5 py-4 space-y-6">
                {/* ── Snapshot grid ── */}
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Capital
                      </p>
                      <p className="font-mono-data text-sm font-semibold mt-1">
                        {formatCurrency(bot.current_capital)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Unrealized P&amp;L
                      </p>
                      <p
                        className={`font-mono-data text-sm font-semibold mt-1 ${
                          pnlPositive ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                        }`}
                      >
                        {pnlPositive ? '+' : ''}
                        {formatCurrency(bot.unrealized_pnl)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Open Trades
                      </p>
                      <p className="font-mono-data text-sm font-semibold mt-1">
                        {bot.n_open_trades}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Closed Trades
                      </p>
                      <p className="font-mono-data text-sm font-semibold mt-1">
                        {bot.n_closed_trades}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Sharpe (Realized)
                      </p>
                      <p className="font-mono-data text-sm font-semibold mt-1">
                        {bot.sharpe_realized.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Bot ID
                      </p>
                      <p className="font-mono-data text-[10px] text-muted-foreground mt-1 break-all">
                        {bot.bot_id}
                      </p>
                    </div>
                  </div>
                </section>

                {/* ── Decision engine activity ── */}
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Decision Engine
                  </h3>
                  <BotActivityMonitor
                    botId={bot.bot_id}
                    isActive={bot.state === 'active' || bot.state === 'ramping'}
                    showLegend
                  />
                </section>

                {/* ── Strategy DNA ── */}
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Strategy DNA
                  </h3>
                  <StrategyDNA jobId={dnaJobId} compact />
                </section>

                {/* ── Monitoring indicators ── */}
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Monitoring Indicators
                  </h3>
                  <MonitoringPanel report={report} isLoading={reportLoading} />
                </section>

                {/* ── Actions ── */}
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {canPause && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-600 dark:hover:bg-amber-950"
                        onClick={() => setPendingPause(bot.bot_id)}
                      >
                        Pause Bot
                      </Button>
                    )}

                    {canResume && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-950"
                        onClick={() =>
                          setPendingResume({ id: bot.bot_id, state: bot.state })
                        }
                      >
                        Resume Bot
                      </Button>
                    )}

                    {canRetire && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            Retire Bot
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retire this bot?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The bot will be stopped permanently. Open positions will be closed.
                              This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => {
                                retireBot.mutate(bot.bot_id, {
                                  onSuccess: onClose,
                                  onError: (e) =>
                                    toast.error(`Retire failed: ${e.message}`),
                                });
                              }}
                            >
                              Retire Bot
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm dialogs rendered outside Sheet to avoid portal nesting issues */}
      {pendingPause && (
        <PauseConfirmDialog
          botId={pendingPause}
          open
          onConfirm={() => {
            setPauseError(null);
            pauseBot.mutate(pendingPause, {
              onSuccess: () => setPendingPause(null),
              onError: (e) => setPauseError(e.message),
            });
          }}
          onClose={() => {
            setPendingPause(null);
            setPauseError(null);
          }}
          isPending={pauseBot.isPending}
          error={pauseError}
        />
      )}

      {pendingResume && (
        <ResumeConfirmDialog
          botId={pendingResume.id}
          fromState={pendingResume.state}
          open
          onConfirm={() => {
            setResumeError(null);
            resumeBot.mutate(pendingResume.id, {
              onSuccess: () => setPendingResume(null),
              onError: (e) => setResumeError(e.message),
            });
          }}
          onClose={() => {
            setPendingResume(null);
            setResumeError(null);
          }}
          isPending={resumeBot.isPending}
          error={resumeError}
        />
      )}
    </>
  );
}
