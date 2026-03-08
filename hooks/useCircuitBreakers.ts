'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { CircuitBreakerStatusReport, FleetCBThresholds } from '@/types/api';

/**
 * Fleet circuit-breaker observability report — per-bot and fleet-level
 * utilization gauges computed on-the-fly from live trade data.
 *
 * Refetches every 60 seconds: utilization values change with each trade close.
 * Returns null (not error) when the user has no bots.
 */
export function useCircuitBreakers() {
  return useQuery<CircuitBreakerStatusReport | null>({
    queryKey: queryKeys.fleet.circuitBreakers,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/circuit-breakers');
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch circuit breaker status');
      return parseApiJson<CircuitBreakerStatusReport>(res);
    },
    staleTime: pollingIntervals.nearLive,
    refetchInterval: pollingIntervals.nearLive,
  });
}

/**
 * Persist user-configured fleet CB threshold values.
 *
 * PHASE 1: These values affect gauge display only — the live circuit breaker
 * still fires on hardcoded system defaults.
 *
 * On success, invalidates the circuitBreakers query so gauges re-render with
 * the updated thresholds reflected in `thresholds_source`.
 */
export function useUpdateCBThresholds() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, FleetCBThresholds>({
    mutationFn: async (thresholds) => {
      const res = await apiFetch('/api/settings/circuit-breakers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds),
      });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to update circuit breaker thresholds');
        throw new Error(detail);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fleet.circuitBreakers });
    },
  });
}
