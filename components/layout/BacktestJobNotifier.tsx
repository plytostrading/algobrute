'use client';

/**
 * BacktestJobNotifier
 *
 * Invisible global component mounted in app/(app)/layout.tsx.
 *
 * Responsibilities
 * ----------------
 * 1. Watches the backtest job list for status transitions on jobs tracked in
 *    localStorage (via useBacktestBackground).
 * 2. Fires a sonner toast when any tracked job transitions to "complete" or
 *    "failed".  The success toast includes a "View results" action linking to
 *    /insights?job=<id>.
 * 3. Accelerates the refetch interval to 5 s when any background job is
 *    in-flight (falling back to 30 s when idle).  Because all consumers of
 *    queryKeys.backtest.list share the same React Query cache, the Insights
 *    page also benefits from the faster polling while jobs are running.
 * 4. Removes completed/failed jobs from localStorage after notifying, keeping
 *    the tracked list clean.
 *
 * Transition detection
 * --------------------
 * A ref stores the last-seen status per job.  A toast fires only when a job
 * moves from a non-terminal state to a terminal one:
 *   pending | running → complete  → success toast
 *   pending | running → failed    → error toast
 *
 * If the component mounts and finds a job already in a terminal state (e.g.
 * after a page refresh), it silently removes the stale localStorage entry
 * without toasting, since the user has already seen the result.
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

import { useBacktestBackground } from '@/hooks/useBacktestBackground';
import { apiFetch, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { BacktestJobSummary } from '@/types/api';

export default function BacktestJobNotifier() {
  const { jobs, removeJob } = useBacktestBackground();
  const router = useRouter();

  // Accelerate polling to 5 s when background jobs are in flight
  const hasActiveJobs = jobs.length > 0;

  const listQuery = useQuery<BacktestJobSummary[]>({
    queryKey: queryKeys.backtest.list,
    queryFn: async () => {
      const res = await apiFetch('/api/backtest');
      if (!res.ok) throw new Error('Failed to fetch backtest list');
      return parseApiJson<BacktestJobSummary[]>(res);
    },
    // React Query uses the minimum refetchInterval across all subscribers,
    // so 5 s here accelerates the Insights page too while jobs are running.
    refetchInterval: hasActiveJobs ? 5_000 : 30_000,
  });

  // Persist previous job statuses across renders so we can detect transitions
  const prevStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!listQuery.data) return;

    const trackedIds = new Set(jobs.map((j) => j.jobId));

    for (const summary of listQuery.data) {
      if (!trackedIds.has(summary.job_id)) continue;

      const prev = prevStatusRef.current[summary.job_id];
      const current = summary.status;

      if (prev === undefined) {
        // First time the notifier sees this job after mounting.
        // If it is already terminal, clean up localStorage silently (e.g.
        // page was refreshed after the job already completed).
        prevStatusRef.current[summary.job_id] = current;
        if (current === 'complete' || current === 'failed' || current === 'cancelled') {
          removeJob(summary.job_id);
        }
        continue;
      }

      if (prev === current) continue;

      // Status transition detected
      prevStatusRef.current[summary.job_id] = current;

      const bgJob = jobs.find((j) => j.jobId === summary.job_id);

      if (current === 'complete') {
        toast.success(
          `Backtest complete${bgJob?.ticker ? `: ${bgJob.ticker}` : ''}`,
          {
            description: bgJob?.strategyId
              ? `${bgJob.strategyId} finished successfully.`
              : `Job ${summary.job_id} finished successfully.`,
            action: {
              label: 'View results',
              onClick: () =>
                router.push(`/insights?job=${summary.job_id}`),
            },
            duration: 10_000,
          },
        );
        removeJob(summary.job_id);
      } else if (current === 'failed') {
        toast.error(
          `Backtest failed${bgJob?.ticker ? `: ${bgJob.ticker}` : ''}`,
          {
            description: bgJob?.strategyId
              ? `${bgJob.strategyId} did not complete successfully.`
              : `Job ${summary.job_id} failed.`,
            duration: 10_000,
          },
        );
        removeJob(summary.job_id);
      } else if (current === 'cancelled') {
        // Job was cancelled by the user — clean up localStorage silently.
        // No toast needed since the user initiated the cancellation.
        removeJob(summary.job_id);
      }
    }
  }, [listQuery.data, jobs, removeJob, router]);

  // This component renders nothing — it only triggers side-effects via useEffect
  return null;
}
