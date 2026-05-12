'use client';

/**
 * Screen3Card — LARGE light-backtest verdict card.
 *
 * Renders the class-conditional verdict (colour-coded), the 4 headline
 * metrics (Sharpe / Max DD / Win Rate / Total Return), trade count with
 * sample-size disclaimer, the expandable disclosures section (biases not
 * controlled + sample caveats + next step), and the "Accept Strategy"
 * CTA.
 *
 * F.1.C — Accept-Strategy CTA is now wired to the engine's E.1
 * `/api/origination/strategies/{light_passport_id}/promote-to-deep`
 * endpoint via `usePromoteToDeep()`.  The CTA enforces a confirmation
 * gate for borderline verdicts so the customer commits compute
 * intentionally rather than reflexively:
 *
 *   - LOOKS_PROMISING   → no confirmation; direct execute.
 *   - MIXED_SIGNALS     → light confirmation.
 *   - NOT_RECOMMENDED   → strong confirmation (commits real compute
 *                          against a strategy the light backtest
 *                          flagged — but the customer earns the
 *                          choice).
 *   - INCONCLUSIVE      → honest-disclosure confirmation; the deep
 *                          backtest may confirm there's no edge.
 *
 * On 202, the button transitions to a success state for ~2.5s and
 * then router-pushes to `/strategy/${passport_id}` (the F.2 lifecycle
 * view; routes-not-yet-merged are tolerated — landing in parallel).
 * On 409 ("already promoted") the button stays enabled and surfaces
 * a tooltip + "View Lifecycle" affordance using the EXISTING
 * `deep_job_id` from the 409 body.  All other errors surface inline
 * with a Try Again affordance.
 *
 * Engine source: `dialogue/state.py::Screen3Payload` (the
 * light-backtest-result variant, NOT the agent-side "final draft"
 * Screen3 — see types/originate.ts for the rationale).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlreadyPromotedError,
  usePromoteToDeep,
} from '@/hooks/usePromoteToDeep';
import type { LightBacktestVerdict, Screen3Payload } from '@/types/originate';
import { cn } from '@/lib/utils';

interface Screen3CardProps {
  payload: Screen3Payload;
}

interface VerdictStyle {
  label: string;
  description: string;
  Icon: typeof CheckCircle2;
  badgeClassName: string;
  borderClassName: string;
}

function verdictStyle(verdict: LightBacktestVerdict): VerdictStyle {
  switch (verdict) {
    case 'LOOKS_PROMISING':
      return {
        label: 'Looks promising',
        description:
          'The result clears the class-conditional quality bar.  Disclosures below.',
        Icon: CheckCircle2,
        badgeClassName:
          'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        borderClassName: 'border-l-emerald-500',
      };
    case 'MIXED_SIGNALS':
      return {
        label: 'Mixed signals',
        description:
          'Passes basic sanity, but has class-conditional concerns.  Weigh trade-offs below.',
        Icon: AlertTriangle,
        badgeClassName:
          'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
        borderClassName: 'border-l-amber-500',
      };
    case 'NOT_RECOMMENDED':
      return {
        label: 'Not recommended',
        description:
          'Fails the class-conditional quality bar in the tested window.',
        Icon: XCircle,
        badgeClassName:
          'bg-destructive/15 text-destructive border-destructive/30',
        borderClassName: 'border-l-destructive',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'Inconclusive',
        description:
          'Sample too small for an honest verdict.  See next step below.',
        Icon: HelpCircle,
        badgeClassName:
          'bg-muted text-muted-foreground border-border',
        borderClassName: 'border-l-muted-foreground/40',
      };
  }
}

interface ConfirmationCopy {
  title: string;
  body: string;
  confirmLabel: string;
}

/**
 * Confirmation-dialog copy per verdict.  Honest-not-flattering is the
 * design principle: the dialog tells the customer what the verdict
 * actually says, surfaces the cost being committed, and leaves the
 * decision with them.  LOOKS_PROMISING returns null because no
 * confirmation is required.
 */
function confirmationCopy(verdict: LightBacktestVerdict): ConfirmationCopy | null {
  switch (verdict) {
    case 'LOOKS_PROMISING':
      return null;
    case 'NOT_RECOMMENDED':
      return {
        title: 'Run deep validation on a flagged strategy?',
        body:
          'The light backtest found significant concerns with this strategy. ' +
          'The deep validation will commit real compute and may confirm the ' +
          'concerns — but it can also catch cases where the light sample ' +
          'mis-classified an edge.  Are you sure you want to proceed?',
        confirmLabel: 'Run deep validation anyway',
      };
    case 'INCONCLUSIVE':
      return {
        title: 'Run deep validation on an inconclusive result?',
        body:
          "The light backtest sample wasn't large enough for a confident " +
          'read. The deep validation will tell us more — but it may also ' +
          "confirm the strategy doesn't have a real edge. Proceed?",
        confirmLabel: 'Run deep validation',
      };
    case 'MIXED_SIGNALS':
    default:
      return {
        title: 'Run deep validation on a mixed result?',
        body:
          'Some metrics look good, some don’t. The deep validation will ' +
          'resolve which signal matters more in a much larger sample — ' +
          'and may confirm or contradict the light verdict. Proceed?',
        confirmLabel: 'Run deep validation',
      };
  }
}

interface MetricChipProps {
  label: string;
  value: number | null | undefined;
  format: 'percent' | 'ratio' | 'count';
  tone?: 'positive_good' | 'negative_good' | 'neutral';
}

function formatMetric(value: number | null | undefined, format: MetricChipProps['format']): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'count':
      return value.toFixed(0);
  }
}

function metricTone(
  value: number | null | undefined,
  tone: MetricChipProps['tone'],
): string {
  if (value === null || value === undefined || tone === 'neutral' || !tone) {
    return 'text-foreground';
  }
  const isPositive = value >= 0;
  if (tone === 'positive_good') {
    return isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-destructive';
  }
  // negative_good (e.g., max drawdown — closer to 0 is better)
  return value >= -0.1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
}

function MetricChip({ label, value, format, tone = 'neutral' }: MetricChipProps) {
  const formatted = formatMetric(value, format);
  const toneClass = metricTone(value, tone);
  return (
    <div
      className="rounded-md border bg-card p-3 flex flex-col gap-1"
      data-testid={`screen3-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn('font-mono text-lg font-semibold', toneClass)}>
        {formatted}
      </span>
    </div>
  );
}

function classLabel(cls: string): string {
  return cls
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * CTA state machine — explicit rather than inferring from the
 * mutation's `isPending/isError/isSuccess` triplet because the
 * "already_promoted" branch needs a sticky reference to the existing
 * deep_job_id which the mutation's hook state doesn't carry forwards
 * after the error is consumed.
 */
type CtaState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; deepJobId: string }
  | { kind: 'already_promoted'; existingDeepJobId: string; message: string }
  | { kind: 'error'; message: string; status: number };

const SUCCESS_NAVIGATION_DELAY_MS = 2500;

export default function Screen3Card({ payload }: Screen3CardProps) {
  const router = useRouter();
  const [disclosuresOpen, setDisclosuresOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ctaState, setCtaState] = useState<CtaState>({ kind: 'idle' });
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const promote = usePromoteToDeep();
  const style = verdictStyle(payload.verdict);
  const { Icon } = style;
  const hasPassport = payload.passport_id !== null;
  const confirmCopy = confirmationCopy(payload.verdict);

  // Clear any pending navigation timer if the component unmounts before
  // the timer fires (e.g., user navigated elsewhere via a different
  // affordance), so we don't push a route on an unmounted component.
  useEffect(() => {
    return () => {
      if (navigationTimerRef.current !== null) {
        clearTimeout(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
    };
  }, []);

  /** Actually fire the mutation — invoked either directly (no
   *  confirmation needed) or from the AlertDialog's confirm action. */
  const executePromotion = useCallback(() => {
    if (!payload.passport_id) {
      // Guard: should not be reachable because the CTA is disabled
      // when there is no passport_id, but surface a clear error if
      // somehow invoked.
      setCtaState({
        kind: 'error',
        status: 0,
        message: 'No passport id on this result — cannot promote.',
      });
      return;
    }
    const passportId = payload.passport_id;
    setCtaState({ kind: 'submitting' });
    promote.mutate(passportId, {
      onSuccess: (data) => {
        setCtaState({ kind: 'success', deepJobId: data.deep_job_id });
        // Auto-navigate after a brief moment so the customer sees the
        // success state confirm-then-redirect.
        navigationTimerRef.current = setTimeout(() => {
          router.push(`/strategy/${passportId}`);
        }, SUCCESS_NAVIGATION_DELAY_MS);
      },
      onError: (err) => {
        if (err instanceof AlreadyPromotedError) {
          setCtaState({
            kind: 'already_promoted',
            existingDeepJobId: err.existingDeepJobId,
            message: err.message,
          });
          return;
        }
        // 403 / 404 / 422 / 5xx — and network failures wrapped in
        // HttpError(status=0) by the hook — all land here with a
        // usable status + message.  The mutation's TError generic is
        // HttpError so `err` is narrowed to HttpError after the
        // AlreadyPromotedError check (which extends HttpError).
        setCtaState({ kind: 'error', status: err.status, message: err.message });
      },
    });
  }, [payload.passport_id, promote, router]);

  /** Top-level click handler — either fires the mutation directly
   *  (LOOKS_PROMISING) or opens the confirmation dialog (every other
   *  reachable verdict).  Disabled-state guards earlier-out via the
   *  Button's `disabled` prop. */
  const handleAcceptClick = useCallback(() => {
    if (confirmCopy === null) {
      executePromotion();
    } else {
      setConfirmOpen(true);
    }
  }, [confirmCopy, executePromotion]);

  /** Click handler for the AlertDialog's confirm action. */
  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    executePromotion();
  }, [executePromotion]);

  /** Click handler for the "Try again" affordance on error states. */
  const handleRetry = useCallback(() => {
    setCtaState({ kind: 'idle' });
  }, []);

  /** Navigate to the lifecycle view immediately (used by both the
   *  success state's optional "View now" and the already-promoted
   *  state's "View Lifecycle" affordance). */
  const handleViewLifecycle = useCallback(() => {
    if (!payload.passport_id) return;
    // Cancel any pending auto-navigation so we don't fire a double push.
    if (navigationTimerRef.current !== null) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    router.push(`/strategy/${payload.passport_id}`);
  }, [payload.passport_id, router]);

  const isSmallSample = payload.trade_count < 30;

  // The CTA is disabled when:
  //   - there is no passport_id (the engine never minted one for this
  //     verdict — only LOOKS_PROMISING + MIXED_SIGNALS reliably do);
  //   - the mutation is in flight;
  //   - the mutation already succeeded (we're about to navigate);
  //   - the verdict's confirmation cannot earn a passport (no passport
  //     id means we can't POST to the endpoint).
  //
  // The button stays ENABLED on `already_promoted` so the customer can
  // either retry from a clean state OR (more useful) hit the
  // "View Lifecycle" link beside it.
  const ctaDisabled =
    !hasPassport ||
    ctaState.kind === 'submitting' ||
    ctaState.kind === 'success';

  const ctaLabel = (() => {
    switch (ctaState.kind) {
      case 'submitting':
        return 'Promoting…';
      case 'success':
        return 'Deep validation queued';
      case 'already_promoted':
        return 'Accept & Run Deep Validation';
      case 'idle':
      case 'error':
      default:
        return 'Accept & Run Deep Validation';
    }
  })();

  return (
    <Card
      data-testid="payload-screen3"
      data-kind="screen3"
      data-verdict={payload.verdict}
      data-cta-state={ctaState.kind}
      className={cn('border-l-4', style.borderClassName)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <CardTitle className="text-base">Light-backtest verdict</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {classLabel(payload.strategy_class)} on{' '}
                <span className="font-mono">{payload.ticker}</span> &middot;{' '}
                {payload.window_description}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn('shrink-0', style.badgeClassName)}
            data-testid="screen3-verdict-badge"
          >
            {style.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {style.description}
        </p>

        {/* 4 headline metrics — grid of chips. */}
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          data-testid="screen3-metrics-grid"
        >
          <MetricChip
            label="Sharpe"
            value={payload.metrics.sharpe}
            format="ratio"
            tone="positive_good"
          />
          <MetricChip
            label="Max DD"
            value={payload.metrics.max_drawdown}
            format="percent"
            tone="negative_good"
          />
          <MetricChip
            label="Win Rate"
            value={payload.metrics.win_rate}
            format="percent"
            tone="neutral"
          />
          <MetricChip
            label="Total Return"
            value={payload.metrics.total_return}
            format="percent"
            tone="positive_good"
          />
        </div>

        {/* Trade count + sample-size disclaimer. */}
        <div
          className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs"
          data-testid="screen3-trade-count"
        >
          <span className="text-muted-foreground">
            Computed across{' '}
            <span className="font-mono font-semibold text-foreground">
              {payload.trade_count}
            </span>{' '}
            trades
          </span>
          {isSmallSample && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Small sample — interpret with caution
            </span>
          )}
        </div>

        {/* Expandable disclosures section. */}
        <div
          className="rounded-lg border bg-card"
          data-testid="screen3-disclosures"
        >
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/40 transition-colors rounded-lg"
            onClick={() => setDisclosuresOpen((open) => !open)}
            aria-expanded={disclosuresOpen}
            data-testid="screen3-disclosures-toggle"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Disclosures &amp; caveats
            </span>
            {disclosuresOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {disclosuresOpen && (
            <div className="border-t px-3 py-3 space-y-3 text-xs">
              {payload.disclosures.biases_not_controlled.length > 0 && (
                <div data-testid="screen3-biases">
                  <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Biases not controlled
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {payload.disclosures.biases_not_controlled.map((bias) => (
                      <li key={bias}>
                        <Badge variant="outline" className="text-[10px]">
                          {bias.replace(/_/g, ' ')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {payload.disclosures.sample_caveats.length > 0 && (
                <div data-testid="screen3-sample-caveats">
                  <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Sample caveats
                  </div>
                  <ul className="flex flex-col gap-1">
                    {payload.disclosures.sample_caveats.map((caveat, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-muted-foreground">&bull;</span>
                        <span className="leading-relaxed">{caveat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {payload.disclosures.next_step && (
                <div data-testid="screen3-next-step">
                  <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Next step
                  </div>
                  <p className="leading-relaxed">
                    {payload.disclosures.next_step}
                  </p>
                </div>
              )}

              {payload.disclosures.biases_not_controlled.length === 0 &&
                payload.disclosures.sample_caveats.length === 0 &&
                !payload.disclosures.next_step && (
                  <p className="italic text-muted-foreground">
                    No disclosures recorded for this result.
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Inline error message — visible only on the error state.
         *  Surfaces for 403/404/422/network failure (i.e. anything
         *  that isn't 409 — those land in their own affordance below). */}
        {ctaState.kind === 'error' && (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs flex items-start justify-between gap-2"
            data-testid="screen3-cta-error"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <span className="leading-relaxed text-destructive">
                {ctaState.message}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              data-testid="screen3-cta-retry"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Already-promoted affordance — surfaces the 409 path.  The
         *  customer doesn't need to retry; they need to see the
         *  existing deep job's lifecycle.  The Tooltip explains why
         *  the button didn't fire a new submission, and the
         *  View-Lifecycle action navigates to the F.2 view.  */}
        {ctaState.kind === 'already_promoted' && (
          <div
            className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs flex items-start justify-between gap-2"
            data-testid="screen3-cta-already-promoted"
            role="status"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="leading-relaxed">
                This strategy already has a deep validation in progress — view its
                status instead of resubmitting.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleViewLifecycle}
              data-testid="screen3-view-lifecycle"
            >
              View Lifecycle
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Accept-Strategy CTA — full state machine wired in F.1.C. */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-muted-foreground" data-testid="screen3-cta-caption">
            {hasPassport
              ? ctaState.kind === 'success'
                ? `Queued — deep job ${ctaState.deepJobId.slice(0, 8)}…  Redirecting to the lifecycle view.`
                : 'Promotion sends the strategy through a deeper backtest pipeline.'
              : 'No passport on this verdict.'}
          </span>
          {hasPassport ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Wrapping div keeps the Tooltip trigger usable even when
                 *  the inner Button is disabled (Radix Tooltip requires a
                 *  hoverable trigger). */}
                <span className="inline-flex">
                  <Button
                    type="button"
                    onClick={handleAcceptClick}
                    disabled={ctaDisabled}
                    data-testid="screen3-accept-cta"
                    size="sm"
                  >
                    {ctaState.kind === 'submitting' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : ctaState.kind === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                    {ctaLabel}
                  </Button>
                </span>
              </TooltipTrigger>
              {ctaState.kind === 'already_promoted' && (
                <TooltipContent
                  data-testid="screen3-already-promoted-tooltip"
                  side="top"
                >
                  This strategy already has a deep validation in progress — view its
                  status instead.
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            <Button
              type="button"
              disabled
              data-testid="screen3-accept-cta"
              size="sm"
            >
              <Award className="h-4 w-4" />
              {ctaLabel}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Verdict-conditional confirmation gate.  LOOKS_PROMISING never
       *  surfaces this; every other reachable verdict (MIXED_SIGNALS,
       *  NOT_RECOMMENDED, INCONCLUSIVE) earns a verdict-specific copy
       *  that explains what the customer is committing to.  */}
      {confirmCopy !== null && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent data-testid="screen3-confirm-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="screen3-confirm-title">
                {confirmCopy.title}
              </AlertDialogTitle>
              <AlertDialogDescription data-testid="screen3-confirm-body">
                {confirmCopy.body}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="screen3-confirm-cancel">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                data-testid="screen3-confirm-action"
              >
                {confirmCopy.confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
