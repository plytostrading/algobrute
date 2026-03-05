'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import PauseConfirmDialog from '@/components/operations/PauseConfirmDialog';
import ResumeConfirmDialog from '@/components/operations/ResumeConfirmDialog';
import { usePauseBot, useResumeBot, useRetireBot } from '@/hooks/useBots';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import BotActivityMonitor from '@/components/operations/BotActivityMonitor';
import type { BotSnapshot, BotState, Recommendation } from '@/types/api';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BotAccordionBodyProps {
  bot: BotSnapshot;
  recommendations: Recommendation[];
  onOpenDrawer: () => void;
}

export default function BotAccordionBody({
  bot,
  recommendations,
  onOpenDrawer,
}: BotAccordionBodyProps) {
  const pauseBot = usePauseBot();
  const resumeBot = useResumeBot();
  const retireBot = useRetireBot();

  const [pendingPause, setPendingPause] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<{
    id: string;
    state: BotState;
  } | null>(null);

  // Recommendations matching this bot (max 2)
  const botRecs = recommendations
    .filter((r) => r.bot_id === bot.bot_id)
    .slice(0, 2);

  const unrealizedPositive = bot.unrealized_pnl >= 0;

  const canPause = bot.state === 'active' || bot.state === 'ramping';
  const canResume =
    bot.state === 'paused_user' ||
    bot.state === 'paused_regime' ||
    bot.state === 'paused_monitoring' ||
    bot.state === 'circuit_breaker';
  const canRetire = bot.state !== 'stopped';

  return (
    <div className="border-t px-4 pb-4 pt-3 space-y-4">
      {/* Trade summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capital</p>
          <p className="font-mono-data text-sm font-medium">{formatCurrency(bot.current_capital)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Unrealized P&amp;L</p>
          <p
            className={`font-mono-data text-sm font-medium ${
              unrealizedPositive ? 'text-green-600 dark:text-green-400' : 'text-destructive'
            }`}
          >
            {unrealizedPositive ? '+' : ''}
            {formatCurrency(bot.unrealized_pnl)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open Trades</p>
          <p className="font-mono-data text-sm font-medium">{bot.n_open_trades}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Closed Trades</p>
          <p className="font-mono-data text-sm font-medium">{bot.n_closed_trades}</p>
        </div>
      </div>

      {/* Decision engine activity */}
      <BotActivityMonitor
        botId={bot.bot_id}
        isActive={bot.state === 'active' || bot.state === 'ramping'}
      />

      {/* Matching recommendations — at most 2 */}
      {botRecs.length > 0 && (
        <div className="space-y-2">
          {botRecs.map((rec, i) => (
            <div
              key={i}
              className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400">
                  {rec.recommendation_type}
                </span>
                <span className="text-[10px] text-muted-foreground">· {rec.priority}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{rec.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {canPause && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-600 dark:hover:bg-amber-950"
            onClick={() => setPendingPause(bot.bot_id)}
          >
            Pause
          </Button>
        )}

        {canResume && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-950"
            onClick={() => setPendingResume({ id: bot.bot_id, state: bot.state })}
          >
            Resume
          </Button>
        )}

        {canRetire && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                Retire
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retire bot?</AlertDialogTitle>
                <AlertDialogDescription>
                  The bot will be stopped permanently and all open positions closed. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    retireBot.mutate(bot.bot_id, {
                      onSuccess: () =>
                        toast.success('Bot retired', {
                          description: 'All positions closed. Bot is permanently stopped.',
                        }),
                      onError: (e) => toast.error(`Retire failed: ${e.message}`),
                    });
                  }}
                >
                  Retire Bot
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* View Full Detail → opens the drawer */}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-7 text-xs gap-1 text-primary hover:text-primary/80"
          onClick={onOpenDrawer}
        >
          <ExternalLink className="h-3 w-3" />
          View Full Detail
        </Button>
      </div>

      {/* Confirm dialogs — rendered after action buttons to avoid nesting issues */}
      {pendingPause && (
        <PauseConfirmDialog
          botId={pendingPause}
          open
          onConfirm={() => {
            pauseBot.mutate(pendingPause, {
              onSuccess: () => {
                setPendingPause(null);
                toast.success('Bot paused', {
                  description: 'New orders halted. Open positions remain intact.',
                });
              },
              onError: (e) => {
                setPendingPause(null);
                toast.error(`Pause failed: ${e.message}`);
              },
            });
          }}
          onClose={() => setPendingPause(null)}
          isPending={pauseBot.isPending}
        />
      )}

      {pendingResume && (
        <ResumeConfirmDialog
          botId={pendingResume.id}
          fromState={pendingResume.state}
          open
          onConfirm={() => {
            resumeBot.mutate(pendingResume.id, {
              onSuccess: () => {
                setPendingResume(null);
                toast.success('Bot resumed', {
                  description: 'Bot is now active and placing orders.',
                });
              },
              onError: (e) => {
                setPendingResume(null);
                toast.error(`Resume failed: ${e.message}`);
              },
            });
          }}
          onClose={() => setPendingResume(null)}
          isPending={resumeBot.isPending}
        />
      )}
    </div>
  );
}
