'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { BenchmarkComparison } from '@/types/api';

/**
 * Fleet vs SPY benchmark comparison.
 * Returns alpha, beta, and information ratio computed by the backend.
 * Refetches every 5 minutes — benchmark stats change slowly.
 *
 * Returns undefined while loading or if the backend has insufficient data.
 * Callers must guard against undefined and skip rendering when not present.
 */
export function useFleetBenchmark(ticker = 'SPY') {
  return useQuery<BenchmarkComparison>({
    queryKey: queryKeys.fleet.benchmark(ticker),
    queryFn: async () => {
      const res = await apiFetch(`/api/fleet/benchmark/${ticker}`);
      if (!res.ok) throw new Error('Benchmark comparison not available');
      return parseApiJson<BenchmarkComparison>(res);
    },
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
    // Do not retry on 404 — backend returns 404 when no trade data exists yet
    retry: false,
  });
}
