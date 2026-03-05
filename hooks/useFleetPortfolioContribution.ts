'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetPortfolioContribution } from '@/types/api';

/**
 * Portfolio contribution breakdown by bot — capital allocation, realized P&L,
 * risk contribution, and per-regime P&L attribution.
 *
 * Returns undefined (404) when no bots are registered.
 * Refetches every 5 minutes — analytics recomputed hourly by the scheduler.
 */
export function useFleetPortfolioContribution() {
  return useQuery<FleetPortfolioContribution | null>({
    queryKey: queryKeys.fleet.portfolioContribution,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/portfolio-contribution');
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch portfolio contribution');
      return parseApiJson<FleetPortfolioContribution>(res);
    },
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
