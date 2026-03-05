'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type {
  BacktestRequest,
  BacktestJobId,
  BacktestJobSummary,
  BacktestResult,
  JobStatus,
  BacktestExportReport,
  BacktestSectionInsight,
  TradeRecord,
  PassportPromotionResponse,
  WFLabelPoint,
} from '@/types/api';

/** Submit a new backtest job. Returns { job_id } on 202. */
export function useRunBacktest() {
  const queryClient = useQueryClient();
  return useMutation<BacktestJobId, Error, BacktestRequest>({
    mutationFn: async (req) => {
      const res = await apiFetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to submit backtest');
        throw new Error(detail);
      }
      return parseApiJson<BacktestJobId>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.backtest.list });
    },
  });
}

/**
 * Poll a backtest job. Automatically stops polling once status is
 * "complete" or "failed". Pass null/undefined to skip.
 */
export function useBacktestJob(jobId: string | null | undefined) {
  return useQuery<BacktestResult | JobStatus>({
    queryKey: queryKeys.backtest.job(jobId),
    queryFn: async () => {
      const res = await apiFetch(`/api/backtest/${jobId!}`);
      if (!res.ok) throw new Error('Failed to fetch backtest job');
      return parseApiJson<BacktestResult | JobStatus>(res);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as (BacktestResult | JobStatus) | undefined;
      if (!data) return pollingIntervals.backtestProgress;
      const status = (data as { status: string }).status;
      return status === 'complete' || status === 'failed'
        ? false
        : pollingIntervals.backtestProgress;
    },
  });
}

/**
 * Exhaustive export report for a completed backtest job.
 * Only fires when `isComplete` is true.
 * Results are cached indefinitely (immutable once complete).
 */
export function useBacktestExport(
  jobId: string | null | undefined,
  isComplete: boolean,
) {
  return useQuery<BacktestExportReport>({
    queryKey: queryKeys.backtest.export(jobId),
    queryFn: async () => {
      const res = await apiFetch(`/api/backtest/${jobId!}/export`);
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to fetch backtest report');
        throw new Error(detail);
      }
      return parseApiJson<BacktestExportReport>(res);
    },
    enabled: !!jobId && isComplete,
    staleTime: Infinity,
  });
}

/** Cancel a pending or running backtest job. */
export function useCancelBacktest() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previousList: BacktestJobSummary[] | undefined }>({
    mutationFn: async (jobId) => {
      const res = await apiFetch(`/api/backtest/${jobId}`, { method: 'DELETE' });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to cancel backtest');
        throw new Error(detail);
      }
    },
    onMutate: async (jobId) => {
      // Prevent in-flight refetches from overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.backtest.list });

      // Snapshot the current list so we can roll back on error
      const previousList = queryClient.getQueryData<BacktestJobSummary[]>(
        queryKeys.backtest.list,
      );

      // Optimistically mark the job as cancelled for instant visual removal
      queryClient.setQueryData<BacktestJobSummary[]>(
        queryKeys.backtest.list,
        (old) =>
          old?.map((j) =>
            j.job_id === jobId ? { ...j, status: 'cancelled' } : j,
          ) ?? [],
      );

      return { previousList };
    },
    onError: (_err, _jobId, context) => {
      // Restore the pre-optimistic snapshot if the DELETE request failed
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(queryKeys.backtest.list, context.previousList);
      }
    },
    onSettled: (_data, _err, jobId) => {
      // Re-sync with the server regardless of success or failure
      void queryClient.invalidateQueries({ queryKey: queryKeys.backtest.list });
      void queryClient.invalidateQueries({ queryKey: queryKeys.backtest.job(jobId) });
    },
  });
}

/** GET /api/backtest — list of all jobs (most recent first). */
export function useBacktestList() {
  return useQuery<import('@/types/api').BacktestJobSummary[]>({
    queryKey: queryKeys.backtest.list,
    queryFn: async () => {
      const res = await apiFetch('/api/backtest');
      if (!res.ok) throw new Error('Failed to fetch backtest list');
      return parseApiJson<import('@/types/api').BacktestJobSummary[]>(res);
    },
    // Poll frequently while any job is active (pending/running) so the queue
    // reflects live phase transitions; fall back to the slower interval once all
    // jobs are terminal.
    refetchInterval: (query) => {
      const data = query.state.data as import('@/types/api').BacktestJobSummary[] | undefined;
      const hasActive = data?.some(
        (j) => j.status === 'pending' || j.status === 'running',
      );
      return hasActive ? pollingIntervals.backtestProgress : pollingIntervals.backtestList;
    },
  });
}

/**
 * Promote a completed backtest job to a StrategyPassport.
 * Sets the result in the query cache so usePassportForJob can read it
 * even after the component re-mounts (tab switching).
 */
export function usePromoteToPassport() {
  const queryClient = useQueryClient();
  return useMutation<PassportPromotionResponse, Error, string>({
    mutationFn: async (jobId) => {
      const res = await apiFetch(`/api/backtest/${jobId}/promote-to-passport`, {
        method: 'POST',
      });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to promote to passport');
        throw new Error(detail);
      }
      return parseApiJson<PassportPromotionResponse>(res);
    },
    onSuccess: (data, jobId) => {
      // Persist in cache so the tab can read it after re-mount
      queryClient.setQueryData(queryKeys.backtest.passport(jobId), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.backtest.list });
    },
  });
}

/**
 * Read a cached StrategyPassport for a completed backtest job.
 * Data is populated by usePromoteToPassport via setQueryData.
 * Never auto-fetches; enabled: false means it only reads from cache.
 * If somehow triggered via refetch(), it calls the (idempotent) promote endpoint.
 */
export function usePassportForJob(jobId: string | null | undefined) {
  return useQuery<PassportPromotionResponse>({
    queryKey: queryKeys.backtest.passport(jobId),
    queryFn: async () => {
      if (!jobId) throw new Error('No job ID');
      const res = await apiFetch(`/api/backtest/${jobId}/promote-to-passport`, {
        method: 'POST',
      });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to fetch passport');
        throw new Error(detail);
      }
      return parseApiJson<PassportPromotionResponse>(res);
    },
    enabled: false,
    staleTime: Infinity,
  });
}

/**
 * Walk-forward regime label series for a completed backtest job.
 * Each point has the label date and a slim RegimeSignal with conviction
 * scores and per-regime probabilities.
 * Only fires when `isComplete` is true.
 * Results are cached indefinitely (immutable once complete).
 */
export function useBacktestRegimeLabels(
  jobId: string | null | undefined,
  isComplete: boolean,
) {
  return useQuery<WFLabelPoint[]>({
    queryKey: queryKeys.backtest.regimeLabels(jobId),
    queryFn: async () => {
      const res = await apiFetch(`/api/backtest/${jobId!}/regime-labels`);
      if (!res.ok) throw new Error('Regime labels not available for this backtest');
      return parseApiJson<WFLabelPoint[]>(res);
    },
    enabled: !!jobId && isComplete,
    staleTime: Infinity,
    // 404 (job predates feature / labeler skipped) is expected — treat as empty
    retry: false,
  });
}

/**
 * LLM-generated section insight for a specific Insights page dashboard section.
 * Summaries are cached permanently server-side (backtest results are immutable).
 * Silently returns no data on 404/503 (card hides itself gracefully).
 */
export function useBacktestInsight(
  jobId: string | null | undefined,
  sectionKey: string,
) {
  return useQuery<BacktestSectionInsight>({
    queryKey: queryKeys.backtest.insight(jobId, sectionKey),
    queryFn: async () => {
      const res = await apiFetch(`/api/backtest/${jobId!}/insight/${sectionKey}`);
      if (!res.ok) {
        const detail = await parseApiError(res, 'Insight not available');
        throw new Error(detail);
      }
      return parseApiJson<BacktestSectionInsight>(res);
    },
    enabled: !!jobId,
    staleTime: Infinity, // cached permanently in DB; never needs refetching
    retry: false,        // don't retry 503 (LLM unavailable) or 404
  });
}

/**
 * Individual trade records for a completed backtest job.
 * Only fires when `isComplete` is true.
 * Results are cached indefinitely (immutable once complete).
 */
export function useBacktestTrades(
  jobId: string | null | undefined,
  isComplete: boolean,
) {
  return useQuery<TradeRecord[]>({
    queryKey: queryKeys.backtest.trades(jobId),
    queryFn: async () => {
      const res = await apiFetch(`/api/backtest/${jobId!}/trades`);
      if (!res.ok) throw new Error('Failed to fetch backtest trades');
      return parseApiJson<TradeRecord[]>(res);
    },
    enabled: !!jobId && isComplete,
    staleTime: Infinity,
  });
}
