'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetSensitivityReport } from '@/types/api';

/**
 * Fleet portfolio sensitivity what-if analysis.
 *
 * Returns removal impacts and addition previews sorted by Sharpe delta.
 * Expensive computation — refetches every 5 minutes only.
 */
export function useFleetSensitivity() {
  return useQuery<FleetSensitivityReport>({
    queryKey: queryKeys.fleet.sensitivity,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/sensitivity');
      if (!res.ok) throw new Error('Failed to fetch fleet sensitivity analysis');
      return parseApiJson<FleetSensitivityReport>(res);
    },
    refetchInterval: pollingIntervals.slow,
    staleTime: pollingIntervals.slow,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('404')) return false;
      return failureCount < 2;
    },
  });
}
