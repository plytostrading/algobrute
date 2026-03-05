'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CPCVChartData } from '@/types/api';

/**
 * Fetch the pre-computed CPCV equity fan chart data for a completed backtest job.
 *
 * Returns the CPCVChartData payload from GET /api/backtest/{job_id}/chart-data,
 * which contains per-path equity curves, mean equity curve, and regime bands.
 *
 * Only fires when `isComplete` is true to match the lifecycle of the other
 * backtest result hooks.  Results are cached indefinitely (immutable once the
 * job is complete).
 *
 * The query returns `undefined` (not an error) when the endpoint returns 404
 * — this happens for legacy jobs that predate the chart_data_json column.
 * Callers should fall back to the simpler trades-based equity curve in that case.
 */
export function useBacktestChartData(
  jobId: string | null | undefined,
  isComplete: boolean,
) {
  return useQuery<CPCVChartData | null>({
    queryKey: queryKeys.backtest.chartData(jobId),
    queryFn: async () => {
      const res = await apiFetch(`/api/backtest/${jobId!}/chart-data`);
      // 404 means chart data not available (legacy job or build failed) — return null
      // rather than throwing so the component can degrade gracefully.
      if (res.status === 404) return null;
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to fetch chart data');
        throw new Error(detail);
      }
      return parseApiJson<CPCVChartData>(res);
    },
    enabled: !!jobId && isComplete,
    staleTime: Infinity,
  });
}
