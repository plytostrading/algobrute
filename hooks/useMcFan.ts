'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { EquityFanPoint } from '@/types/api';

/**
 * Fetch the Monte Carlo equity fan chart data for a completed backtest job.
 *
 * Returns the percentile band series (p1/p5/p25/p50/p75/p95/p99) plus the
 * observed equity at each trade step — all normalized (1.0 = initial capital).
 *
 * Returns null (not an error) when the endpoint 404s — this happens for jobs
 * run with the FAST profile (mc_fan_simulations=0) or jobs that predate the
 * equity fan feature.  Callers should degrade gracefully in that case.
 *
 * Results are cached indefinitely once loaded because completed job fan data
 * is immutable.
 */
export function useMcFan(jobId: string | null | undefined) {
  return useQuery<EquityFanPoint[] | null>({
    queryKey: queryKeys.backtest.mcFan(jobId),
    queryFn: async () => {
      const res = await apiFetch(`/api/backtest/${jobId!}/mc-fan`);
      // 404 means fan data not available for this job — degrade gracefully
      if (res.status === 404) return null;
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to fetch MC equity fan');
        throw new Error(detail);
      }
      return parseApiJson<EquityFanPoint[]>(res);
    },
    enabled: !!jobId,
    staleTime: Infinity,
    retry: false,
  });
}
