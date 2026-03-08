'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useBacktestList, useCancelBacktest } from '@/hooks/useBacktestWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { getBacktestDisplayLabel } from '@/lib/backtestDisplay';
import type { BacktestJobSummary } from '@/types/api';

/**
 * Human-readable labels and approximate completion percentages for each
 * backtest pipeline phase (mirrors backtest_phases.py on the backend).
 */
const PHASE_LABELS: Record<string, string> = {
  loading_data: 'Loading market data',
  regime_labeling: 'Regime labeling',
  cpcv: 'CPCV path validation',
  monte_carlo: 'Monte Carlo simulation',
  bootstrap: 'Stationary bootstrap CI',
  sensitivity_analysis: 'Sensitivity analysis',
  risk_rules_and_stats: 'Statistical validation',
  assembling_passport: 'Assembling passport',
};

const PHASE_PROGRESS: Record<string, number> = {
  loading_data: 5,
  regime_labeling: 20,
  cpcv: 40,
  monte_carlo: 65,
  bootstrap: 75,
  sensitivity_analysis: 78,
  risk_rules_and_stats: 88,
  assembling_passport: 96,
};

/**
 * Renders a compact queue card for all pending and running backtest jobs.
 * Each row includes a cancel (×) button backed by DELETE /api/backtest/{job_id}.
 * Returns null when there are no active jobs, so it takes no space.
 *
 * Mounted in workbench/page.tsx above the main <Tabs> so it's visible
 * regardless of which workbench tab is active.
 *
 * Per-row loading state: each cancel button tracks its own in-flight state
 * independently, so clicking cancel on one job does not disable the others.
 */
export default function BacktestJobQueue() {
  const { data: jobs = [], isLoading } = useBacktestList();
  const cancelMutation = useCancelBacktest();

  // Track which job IDs have an in-flight cancel request so each button
  // shows its own loading state without blocking the rest of the queue.
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  const activeJobs = jobs.filter(
    (j: BacktestJobSummary) => j.status === 'pending' || j.status === 'running',
  );

  const handleCancel = useCallback(
    (jobId: string) => {
      setCancellingIds((prev) => new Set([...prev, jobId]));
      cancelMutation.mutate(jobId, {
        onSettled: () => {
          setCancellingIds((prev) => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });
        },
        onError: (err) => {
          toast.error('Failed to cancel backtest', {
            description: err.message,
            duration: 5_000,
          });
        },
      });
    },
    [cancelMutation],
  );

  if (isLoading || activeJobs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Backtest Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pb-4">
        {activeJobs.map((job: BacktestJobSummary) => {
          const isCancelling = cancellingIds.has(job.job_id);
          const phaseLabel =
            job.progress_phase ? (PHASE_LABELS[job.progress_phase] ?? job.progress_phase) : null;
          const progressPct =
            job.progress_phase ? (PHASE_PROGRESS[job.progress_phase] ?? null) : null;

          return (
            <div
              key={job.job_id}
              className="flex flex-col gap-1.5 rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-3">
                {job.status === 'running' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : isCancelling ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {getBacktestDisplayLabel(job)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {job.status === 'running' ? 'Active discovery/backtest run' : 'Queued backtest'}
                  </p>
                </div>
                <Badge variant={job.status === 'running' ? 'default' : 'outline'}>
                  {isCancelling ? 'cancelling…' : job.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  title="Cancel backtest"
                  disabled={isCancelling}
                  onClick={() => handleCancel(job.job_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {job.status === 'running' && phaseLabel && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{phaseLabel}</span>
                    {progressPct !== null && (
                      <span className="tabular-nums">{progressPct}%</span>
                    )}
                  </div>
                  {progressPct !== null && (
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
