'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { Recommendation } from '@/types/api';

/**
 * Prioritised fleet recommendations from the analytics pipeline.
 * Refetches every 2 minutes.
 */
export function useFleetRecommendations() {
  return useQuery<Recommendation[]>({
    queryKey: queryKeys.fleet.recommendations,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/recommendations');
      if (!res.ok) throw new Error('Failed to fetch fleet recommendations');
      return parseApiJson<Recommendation[]>(res);
    },
    refetchInterval: pollingIntervals.recommendation,
  });
}
