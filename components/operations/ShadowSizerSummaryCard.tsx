'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutonomyPolicy } from '@/hooks/useAutonomyPolicy';
import {
  useShadowSizerSummary,
  type CohortKey,
  type CohortSummary,
} from '@/hooks/useShadowSizerSummary';

// ---------------------------------------------------------------------------
// ShadowSizerSummaryCard
//
// Operator-facing rolling-window panel for the §9.3 G2-2 paired-sizer
// comparison.  Renders only when the authenticated user has opted into
// the posterior-aware sizer canary (per Decision 5).  Until then, the
// component returns null so the operations page stays compact.
// ---------------------------------------------------------------------------

const COHORT_LABEL: Record<CohortKey, string> = {
  all: 'All',
  canary_opt_in: 'Canary opt-in',
  canary_opt_out: 'Canary opt-out',
};

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedDelta(value: number): string {
  // Kelly-cap units; negative = posterior-aware is more defensive.
  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  return `${sign}${value.toFixed(4)}`;
}

function formatPValue(value: number | null): string {
  if (value === null) return '—';
  if (value < 0.0001) return '<0.0001';
  return value.toFixed(4);
}

function deltaIndicator(value: number): {
  label: string;
  className: string;
} {
  if (value > 0) {
    return {
      label: 'posterior-aware larger',
      className: 'text-warning',
    };
  }
  if (value < 0) {
    return {
      label: 'posterior-aware smaller',
      className: 'text-info',
    };
  }
  return {
    label: 'no median delta',
    className: 'text-muted-foreground',
  };
}

function VerdictBadge({
  pass,
  hasObservations,
}: {
  pass: boolean;
  hasObservations: boolean;
}) {
  if (!hasObservations) {
    return <Badge variant="secondary">INSUFFICIENT</Badge>;
  }
  if (pass) {
    return (
      <Badge className="bg-success text-success-foreground">PASS</Badge>
    );
  }
  return <Badge variant="destructive">FAIL</Badge>;
}

function CohortRow({
  cohortKey,
  summary,
}: {
  cohortKey: CohortKey;
  summary: CohortSummary;
}) {
  const indicator = deltaIndicator(summary.median_delta_kelly_cap);
  return (
    <div className="grid grid-cols-12 items-center gap-2 border-t border-border py-2 text-xs">
      <div className="col-span-3 font-medium text-foreground">
        {COHORT_LABEL[cohortKey]}
      </div>
      <div className="col-span-2 font-mono text-muted-foreground">
        n={summary.n_observations}
      </div>
      <div className="col-span-2 font-mono">
        {summary.n_observations === 0
          ? '—'
          : formatPercent(summary.universal_default_fraction)}
      </div>
      <div className={`col-span-3 font-mono ${indicator.className}`}>
        {summary.n_observations === 0
          ? '—'
          : `${formatSignedDelta(summary.median_delta_kelly_cap)} · ${indicator.label}`}
      </div>
      <div className="col-span-2 font-mono text-right text-muted-foreground">
        p={formatPValue(summary.wilcoxon_p_value)}
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-24" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-12 rounded" />
        <Skeleton className="h-12 rounded" />
        <Skeleton className="h-12 rounded" />
      </div>
      <Skeleton className="h-24 w-full rounded" />
    </div>
  );
}

export default function ShadowSizerSummaryCard() {
  // Visibility gate (Decision 5): only render once the user is opted
  // into the canary AND the policy fetch resolves.  Returning null
  // while loading keeps the operations page from briefly flashing the
  // card to non-canary users on first paint.
  const policyQuery = useAutonomyPolicy();
  const summaryQuery = useShadowSizerSummary({ windowDays: 30 });

  if (policyQuery.isLoading || policyQuery.isError) {
    return null;
  }
  if (!policyQuery.data?.posterior_aware_sizer_canary_opt_in) {
    return null;
  }

  const summary = summaryQuery.data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              Posterior-aware sizer
              {summary && (
                <VerdictBadge
                  pass={summary.g2_2_pass}
                  hasObservations={summary.n_observations > 0}
                />
              )}
            </CardTitle>
            <CardDescription>
              Rolling 30-day shadow comparison vs. the legacy argmax sizer
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {summaryQuery.isLoading ? (
          <SummarySkeleton />
        ) : summaryQuery.isError ? (
          <div className="space-y-3">
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                Failed to load shadow-sizer summary.
              </p>
              <p className="text-xs text-destructive/80">
                {(summaryQuery.error as Error).message}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void summaryQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 rounded-md border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Observations
                </p>
                <p className="font-mono text-base font-semibold text-foreground">
                  {summary.n_observations.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1 rounded-md border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Universal-default
                </p>
                <p className="font-mono text-base font-semibold text-foreground">
                  {formatPercent(summary.universal_default_fraction)}
                </p>
              </div>
              <div className="space-y-1 rounded-md border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Wilcoxon p
                </p>
                <p className="font-mono text-base font-semibold text-foreground">
                  {formatPValue(summary.wilcoxon_p_value)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  threshold p&lt;{summary.g2_2_threshold}
                </p>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-12 gap-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <div className="col-span-3">Cohort</div>
                <div className="col-span-2">Sample</div>
                <div className="col-span-2">Universal-default</div>
                <div className="col-span-3">Median Δ kelly cap</div>
                <div className="col-span-2 text-right">p-value</div>
              </div>
              {(['all', 'canary_opt_in', 'canary_opt_out'] as const).map(
                (cohortKey) => (
                  <CohortRow
                    key={cohortKey}
                    cohortKey={cohortKey}
                    summary={summary.by_cohort[cohortKey]}
                  />
                ),
              )}
            </div>

            <p className="text-[10px] text-muted-foreground">
              Window {summary.window_start} → {summary.window_end}.  Negative
              median delta means the posterior-aware sizer is more
              defensive than the legacy argmax sizer.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
