'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { CorrelationAnalysis, Regime } from '@/types/api';

/**
 * Pairwise bot correlation analysis for a given regime.
 *
 * Pass `undefined` to skip the fetch (e.g. while the weather report is loading).
 * Refetches every 5 minutes — correlation matrices change slowly.
 */
export function useFleetCorrelation(regime: Regime | undefined) {
  return useQuery<CorrelationAnalysis>({
    queryKey: queryKeys.fleet.correlation(regime ?? 1),
    queryFn: async () => {
      const res = await apiFetch(`/api/fleet/correlation/${regime}`);
      if (!res.ok) throw new Error('Failed to fetch fleet correlation');
      return parseApiJson<CorrelationAnalysis>(res);
    },
    enabled: regime !== undefined,
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
