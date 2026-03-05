'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetVaR } from '@/types/api';

/**
 * Fleet Value-at-Risk and CVaR estimates from Monte Carlo simulation.
 * Refetches every 5 minutes — VaR changes slowly relative to positions.
 */
export function useFleetVar() {
  return useQuery<FleetVaR>({
    queryKey: queryKeys.fleet.var,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/var');
      if (!res.ok) throw new Error('Failed to fetch fleet VaR');
      return parseApiJson<FleetVaR>(res);
    },
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
