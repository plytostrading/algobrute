'use client';

/**
 * DeployBotModal — paper-deploy modal for the F.2 timeline view.
 *
 * Triggered by the "Deploy as Paper Bot" CTA inside
 * DeploymentStageCard.  Collects:
 *
 *   - ticker (read-only, pre-filled from the lifecycle view's
 *     ``view.ticker``; the engine refuses any mismatch via 400).
 *   - capital_allocation_pct (default 5%; clamped to [0.1, 100]).
 *   - initial_capital (default $10,000; minimum $100).
 *
 * Pre-condition: the user must have a paper Alpaca credential row
 * stored (``alpacaStatus.paper_connected``).  When missing, the
 * modal shows a notice and disables the deploy button — the engine
 * would otherwise return 412 via the credential gate.
 *
 * On submit:
 *   - We need the deep passport's ``strategy_id`` (UUID) to satisfy
 *     the engine's deploy-bot contract; the lifecycle envelope only
 *     surfaces ``strategy_class`` (the human label).  We fetch the
 *     backtest export for the deep promotion job to retrieve the
 *     ``passport.strategy_id``.
 *   - POST /api/bots/deploy with the resolved payload.
 *   - On success: toast + invalidate the lifecycle query so the
 *     timeline picks up ``bot_id`` immediately.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Rocket, ShieldAlert } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAlpacaStatus } from '@/hooks/useAlpacaStatus';
import { useBacktestExport } from '@/hooks/useBacktestWorkflow';
import { useDeployBot } from '@/hooks/useBots';
import { queryKeys } from '@/lib/queryKeys';
import type { StrategyLifecycleView } from '@/types/api';

interface DeployBotModalProps {
  view: StrategyLifecycleView;
  open: boolean;
  onClose: () => void;
}

const DEFAULT_ALLOCATION_PCT = 5;
const DEFAULT_INITIAL_CAPITAL = 10_000;
const MIN_INITIAL_CAPITAL = 100;
const MIN_ALLOCATION_PCT = 0.1;
const MAX_ALLOCATION_PCT = 100;

export default function DeployBotModal({ view, open, onClose }: DeployBotModalProps) {
  const queryClient = useQueryClient();
  const alpacaQ = useAlpacaStatus();
  const deployBot = useDeployBot();
  // Fetch the deep passport (via the backtest export) so we can pull
  // the `strategy_id` UUID that the engine's deploy endpoint requires
  // (the lifecycle envelope only carries strategy_class).
  const deepJobId = view.deep_promotion_job_id;
  const isDeepComplete = view.deep_job_status === 'complete';
  const exportQ = useBacktestExport(deepJobId, isDeepComplete && open);

  const [allocationPct, setAllocationPct] = useState(DEFAULT_ALLOCATION_PCT);
  const [initialCapital, setInitialCapital] = useState(DEFAULT_INITIAL_CAPITAL);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset the form when the modal re-opens.
  useEffect(() => {
    if (open) {
      setAllocationPct(DEFAULT_ALLOCATION_PCT);
      setInitialCapital(DEFAULT_INITIAL_CAPITAL);
      setValidationError(null);
    }
  }, [open]);

  const paperConnected =
    alpacaQ.data?.paper_connected ?? alpacaQ.data?.connected ?? false;

  const passportFromExport = exportQ.data?.passport;
  const resolvedStrategyId = passportFromExport?.strategy_id ?? null;
  const resolvedPassportId = passportFromExport?.passport_id ?? view.deep_passport_id ?? null;

  const canDeploy =
    paperConnected &&
    !!resolvedStrategyId &&
    !!resolvedPassportId &&
    !deployBot.isPending;

  function handleSubmit() {
    setValidationError(null);
    if (allocationPct < MIN_ALLOCATION_PCT || allocationPct > MAX_ALLOCATION_PCT) {
      setValidationError(
        `Capital allocation must be between ${MIN_ALLOCATION_PCT}% and ${MAX_ALLOCATION_PCT}%.`,
      );
      return;
    }
    if (initialCapital < MIN_INITIAL_CAPITAL) {
      setValidationError(`Initial capital must be at least $${MIN_INITIAL_CAPITAL}.`);
      return;
    }
    if (!resolvedStrategyId || !resolvedPassportId) {
      setValidationError(
        'Deep passport metadata is still loading.  Please try again in a moment.',
      );
      return;
    }
    deployBot.mutate(
      {
        strategy_id: resolvedStrategyId,
        ticker: view.ticker,
        capital_allocation_pct: allocationPct / 100,
        initial_capital: initialCapital,
        passport_id: resolvedPassportId,
      },
      {
        onSuccess: (cfg) => {
          toast.success('Bot deployed', {
            description: `Bot ${cfg.bot_id.slice(0, 8)}… is ramping on ${view.ticker}.`,
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.origination.lifecycle(view.light_passport_id),
          });
          onClose();
        },
        onError: (err) => {
          // Surface the engine's typed detail (e.g., credential gate,
          // passport mismatch) inline rather than via toast so the user
          // can fix the form and retry.
          setValidationError(err.message);
        },
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent data-testid="deploy-bot-modal">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deploy as Paper Bot
          </AlertDialogTitle>
          <AlertDialogDescription>
            Spin up a paper-trading bot on{' '}
            <span className="font-mono font-semibold">{view.ticker}</span> backed
            by this deep-validated passport.  Paper trading is risk-free; you
            can promote to live capital later via the Operations page.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Alpaca-paper precondition */}
        {!paperConnected && (
          <div
            className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"
            data-testid="deploy-paper-required-notice"
          >
            <p className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              Paper Alpaca account required
            </p>
            <p className="mt-1 leading-relaxed">
              Connect your Alpaca paper account in{' '}
              <span className="underline">Settings → Brokerage</span> before
              deploying.  Live keys are not enough — paper bots use the
              paper-only credential row.
            </p>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="deploy-ticker" className="text-xs uppercase tracking-wide">
              Ticker
            </Label>
            <Input
              id="deploy-ticker"
              value={view.ticker}
              readOnly
              className="font-mono"
              data-testid="deploy-ticker-input"
            />
            <p className="text-xs text-muted-foreground">
              Pre-filled from the passport; the engine refuses mismatched tickers.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deploy-allocation" className="text-xs uppercase tracking-wide">
              Capital allocation
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="deploy-allocation"
                type="number"
                step="0.1"
                min={MIN_ALLOCATION_PCT}
                max={MAX_ALLOCATION_PCT}
                value={allocationPct}
                onChange={(e) => setAllocationPct(Number(e.target.value))}
                className="font-mono w-32"
                data-testid="deploy-allocation-input"
              />
              <span className="text-sm text-muted-foreground">% of fleet</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deploy-initial-capital" className="text-xs uppercase tracking-wide">
              Initial capital (USD)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="deploy-initial-capital"
                type="number"
                step="100"
                min={MIN_INITIAL_CAPITAL}
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="font-mono"
                data-testid="deploy-initial-capital-input"
              />
            </div>
          </div>

          {exportQ.isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Resolving passport metadata…
            </div>
          )}

          {validationError && (
            <p
              className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
              data-testid="deploy-validation-error"
            >
              {validationError}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" data-testid="deploy-cancel">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={handleSubmit}
              disabled={!canDeploy}
              data-testid="deploy-submit"
            >
              {deployBot.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Deploy Paper Bot
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
