'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { BotState } from '@/types/api';

interface ResumeConfirmDialogProps {
  botId: string;
  /** The state the bot is currently in — determines which dialog variant to show. */
  fromState: BotState;
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
  error?: string | null;
}

export default function ResumeConfirmDialog({
  botId,
  fromState,
  open,
  onConfirm,
  onClose,
  isPending,
  error,
}: ResumeConfirmDialogProps) {
  const isCircuitBreaker = fromState === 'circuit_breaker';

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume {botId.slice(0, 8)}&hellip;?</AlertDialogTitle>
          <AlertDialogDescription>
            The bot will resume placing orders according to its strategy.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Circuit-breaker warning — amber block shown only for that variant */}
        {isCircuitBreaker && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 mx-1">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              ⚠ Risk Controls Were Active
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This bot triggered risk controls. Before resuming, review the monitoring report and
              recent trade history. Resuming without investigation may expose capital to additional
              risk.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-destructive px-1 -mt-2">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={onConfirm}
            className={
              isCircuitBreaker
                ? 'bg-amber-500 text-white hover:bg-amber-500/90'
                : 'bg-success text-white hover:bg-success/90'
            }
          >
            {isPending ? 'Resuming…' : 'Resume Bot'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
