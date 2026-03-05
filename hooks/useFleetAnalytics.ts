'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetRiskAttribution } from '@/types/api';

/**
 * Fleet risk attribution — per-bot volatility contributions, regime, and
 * concentration alerts. Refetches every 5 minutes.
 */
export function useFleetAnalytics() {
  return useQuery<FleetRiskAttribution>({
    queryKey: queryKeys.fleet.analytics,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/risk');
      if (!res.ok) throw new Error('Failed to fetch fleet analytics');
      return parseApiJson<FleetRiskAttribution>(res);
    },
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
