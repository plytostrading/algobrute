'use client';

/**
 * DeepBacktestStageCard — third row of the F.2 timeline.
 *
 * Five mutually-exclusive states drive the layout:
 *
 *   1. Not yet promoted              (deep_promotion_job_id == null)
 *      → pending status, "Run Deep Validation" CTA (calls F.1.C usePromoteToDeep).
 *   2. Promoted, job running         (deep_job_status === 'running' | 'pending')
 *      → in_progress status, progress phase label + ETA hint + auto-refresh chip.
 *   3. Promoted, job failed          (deep_job_status === 'failed')
 *      → failed status, error message + retry CTA.
 *   4. Promoted, job complete + approved
 *      → complete status, deep metrics + "approved for paper deployment" copy.
 *   5. Promoted, job complete + NOT approved
 *      → failed status (visually amber via custom label), blocking_reasons list +
 *        suggestion text.
 *
 * The "Run Deep Validation" CTA delegates to the existing
 * usePromoteToDeep hook (F.1.C — already wired against
 * POST /api/origination/strategies/{passport_id}/promote-to-deep).
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Award, RefreshCw, AlertTriangle, ChevronRight, Microscope } from 'lucide-react';
import StageCard, { type StageStatus } from './StageCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePromoteToDeep, AlreadyPromotedError } from '@/hooks/usePromoteToDeep';
import { cn } from '@/lib/utils';
import type { StrategyLifecycleView } from '@/types/api';

interface DeepBacktestStageCardProps {
  view: StrategyLifecycleView;
}

interface DerivedState {
  status: StageStatus;
  statusLabel: string;
  variant:
    | 'not_promoted'
    | 'running'
    | 'failed'
    | 'approved'
    | 'blocked';
}

export function deriveDeepState(view: StrategyLifecycleView): DerivedState {
  if (view.deep_promotion_job_id === null) {
    return { status: 'pending', statusLabel: 'Not yet promoted', variant: 'not_promoted' };
  }
  if (view.deep_job_status === 'failed') {
    return { status: 'failed', statusLabel: 'Failed', variant: 'failed' };
  }
  if (view.deep_job_status === 'running' || view.deep_job_status === 'pending') {
    return { status: 'in_progress', statusLabel: 'Running', variant: 'running' };
  }
  if (view.deep_job_status === 'complete') {
    if (view.deep_passport_deployment_approved === true) {
      return { status: 'complete', statusLabel: 'Approved', variant: 'approved' };
    }
    if (view.deep_passport_deployment_approved === false) {
      // Visually distinct from a hard failure — treat as "failed" status
      // so the card renders amber/red.  The body content makes the
      // distinction clear ("didn't pass full validation", actionable
      // blocking_reasons).
      return { status: 'failed', statusLabel: 'Not approved', variant: 'blocked' };
    }
  }
  // Fallback for any unexpected status the engine adds later — render
  // as in_progress so the user is not misled into thinking it's done.
  return { status: 'in_progress', statusLabel: view.deep_job_status ?? 'Pending', variant: 'running' };
}

function formatMetric(value: number | null | undefined, format: 'percent' | 'ratio'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
  }
}

function metricTone(
  value: number | null | undefined,
  tone: 'positive_good' | 'negative_good',
): string {
  if (value === null || value === undefined) return '';
  if (tone === 'positive_good') {
    return value >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-destructive';
  }
  return value >= -0.1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
}

function DeepMetricChip({
  label,
  value,
  format,
  tone,
}: {
  label: string;
  value: number | null | undefined;
  format: 'percent' | 'ratio';
  tone: 'positive_good' | 'negative_good';
}) {
  return (
    <div
      className="rounded-md border bg-card p-3 flex flex-col gap-1"
      data-testid={`deep-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn('font-mono text-lg font-semibold', metricTone(value, tone))}>
        {formatMetric(value, format)}
      </span>
    </div>
  );
}

function humanisePhase(phase: string | null): string {
  if (!phase) return 'queued';
  return phase.replace(/_/g, ' ');
}

export default function DeepBacktestStageCard({ view }: DeepBacktestStageCardProps) {
  const router = useRouter();
  const promoteToDeep = usePromoteToDeep();
  const state = deriveDeepState(view);

  const handlePromote = () => {
    promoteToDeep.mutate(view.light_passport_id, {
      onSuccess: (resp) => {
        toast.success('Deep validation submitted', {
          description: `Job ${resp.deep_job_id.slice(0, 8)}… queued. Typical run-time 5–30 minutes.`,
        });
      },
      onError: (err) => {
        if (err instanceof AlreadyPromotedError && err.existingDeepJobId) {
          toast.info('Strategy already promoted', {
            description: `Existing job ${err.existingDeepJobId.slice(0, 8)}…`,
          });
          return;
        }
        // `err` is typed as HttpError on the hook so the status code is
        // always available; the message comes from FastAPI's `detail`
        // string via `parseApiError`.
        const msg = `Promotion failed (${err.status}): ${err.message}`;
        toast.error(msg);
      },
    });
  };

  const subtitle =
    state.variant === 'not_promoted'
      ? 'Full CPCV + Monte Carlo + bootstrap validation'
      : state.variant === 'running'
        ? 'Pipeline in flight — auto-refreshing'
        : state.variant === 'approved'
          ? 'Strategy approved for paper deployment'
          : state.variant === 'blocked'
            ? 'Strategy did not pass full validation'
            : 'Deep validation result';

  return (
    <StageCard
      stageNumber={3}
      title="Deep validation"
      subtitle={subtitle}
      status={state.status}
      statusLabel={state.statusLabel}
      testId="stage-deep-backtest"
    >
      {state.variant === 'not_promoted' && (
        <div
          className="space-y-3"
          data-testid="deep-state-not-promoted"
        >
          <p className="text-sm text-muted-foreground">
            <Microscope className="inline h-4 w-4 mr-1 align-text-bottom" />
            Run the full CPCV + Monte Carlo + bootstrap pipeline on the
            same trade-idea spec.  Typical run-time 5–30 minutes
            depending on data window and compute.
          </p>
          <Button
            onClick={handlePromote}
            disabled={promoteToDeep.isPending}
            size="sm"
            data-testid="deep-promote-cta"
          >
            <Microscope className="h-4 w-4" />
            {promoteToDeep.isPending ? 'Submitting…' : 'Run Deep Validation'}
          </Button>
          {promoteToDeep.isError && !(promoteToDeep.error instanceof AlreadyPromotedError) && (
            <p className="text-xs text-destructive" data-testid="deep-promote-error">
              ({promoteToDeep.error.status}) {promoteToDeep.error.message}
            </p>
          )}
        </div>
      )}

      {state.variant === 'running' && (
        <div className="space-y-3" data-testid="deep-state-running">
          <div className="flex items-center gap-2 text-sm">
            <Badge
              variant="outline"
              className="bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300 font-mono text-xs"
              data-testid="deep-progress-phase"
            >
              {humanisePhase(view.deep_job_progress_phase)}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              auto-refreshing every 5s
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            ETA depends on data window + compute.  Typically completes
            in 5–30 minutes.
          </p>
          <Skeleton className="h-2 w-full" />
        </div>
      )}

      {state.variant === 'approved' && (
        <div className="space-y-3" data-testid="deep-state-approved">
          <div
            className="grid grid-cols-3 gap-2"
            data-testid="deep-metrics-grid"
          >
            <DeepMetricChip
              label="Sharpe"
              value={view.deep_passport_sharpe}
              format="ratio"
              tone="positive_good"
            />
            <DeepMetricChip
              label="Max DD"
              value={view.deep_passport_max_drawdown}
              format="percent"
              tone="negative_good"
            />
            <DeepMetricChip
              label="Total Return"
              value={view.deep_passport_total_return}
              format="percent"
              tone="positive_good"
            />
          </div>
          <p className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <Award className="h-3.5 w-3.5" />
            Strategy approved for paper deployment.
          </p>
        </div>
      )}

      {state.variant === 'blocked' && (
        <div className="space-y-3" data-testid="deep-state-blocked">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Why this strategy didn&apos;t pass full validation
            </p>
            {(view.deep_passport_blocking_reasons ?? []).length > 0 ? (
              <ul
                className="mt-2 flex flex-col gap-1.5 text-xs"
                data-testid="deep-blocking-reasons"
              >
                {(view.deep_passport_blocking_reasons ?? []).map((reason) => (
                  <li key={reason} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                    <span className="leading-relaxed">{reason.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                No specific blocking reasons recorded.
              </p>
            )}
          </div>
          <div
            className="grid grid-cols-3 gap-2"
            data-testid="deep-metrics-grid-blocked"
          >
            <DeepMetricChip
              label="Sharpe"
              value={view.deep_passport_sharpe}
              format="ratio"
              tone="positive_good"
            />
            <DeepMetricChip
              label="Max DD"
              value={view.deep_passport_max_drawdown}
              format="percent"
              tone="negative_good"
            />
            <DeepMetricChip
              label="Total Return"
              value={view.deep_passport_total_return}
              format="percent"
              tone="positive_good"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Consider revising the strategy spec via{' '}
            <span
              className="underline cursor-pointer"
              onClick={() => router.push(`/originate?session=${view.session_id}`)}
            >
              the originating dialogue
            </span>
            {' '}or widening the validation window before re-submission.
          </p>
        </div>
      )}

      {state.variant === 'failed' && (
        <div className="space-y-3" data-testid="deep-state-failed">
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Deep validation job failed before producing a verdict.
          </p>
          <Button
            onClick={handlePromote}
            disabled={promoteToDeep.isPending}
            size="sm"
            variant="outline"
            data-testid="deep-retry-cta"
          >
            <RefreshCw className="h-4 w-4" />
            {promoteToDeep.isPending ? 'Resubmitting…' : 'Retry Deep Validation'}
          </Button>
          {promoteToDeep.isError && !(promoteToDeep.error instanceof AlreadyPromotedError) && (
            <p className="text-xs text-destructive">
              ({promoteToDeep.error.status}) {promoteToDeep.error.message}
            </p>
          )}
        </div>
      )}
    </StageCard>
  );
}
