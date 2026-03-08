'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FearGreedGauges } from '@/types/api';

/**
 * Dual portfolio + market fear/greed gauges.
 *
 * Portfolio gauge is derived from the fleet weather score.
 * Market gauge is a 4-component composite (Momentum, Volatility, Safe Haven, Credit).
 * Refetches every 5 minutes — macro components change slowly intraday.
 */
export function useFearGreed() {
  return useQuery<FearGreedGauges>({
    queryKey: queryKeys.fleet.fearGreed,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/fear-greed');
      if (!res.ok) throw new Error('Failed to fetch fear/greed gauges');
      return parseApiJson<FearGreedGauges>(res);
    },
    refetchInterval: pollingIntervals.slow,
    // Return stale data while refetching so gauge doesn't flash empty
    staleTime: pollingIntervals.slow,
    // Don't throw on 404 — user may not have a weather report yet
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('404')) return false;
      return failureCount < 2;
    },
  });
}
