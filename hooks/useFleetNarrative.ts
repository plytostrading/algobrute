'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetNarrative } from '@/types/api';

/**
 * LLM-generated fleet narrative (headline, briefing, urgency, next_step).
 * Refetches every 5 minutes — LLM generation is expensive.
 */
export function useFleetNarrative() {
  return useQuery<FleetNarrative>({
    queryKey: queryKeys.fleet.narrative,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/narrative');
      if (!res.ok) throw new Error('Failed to fetch fleet narrative');
      return parseApiJson<FleetNarrative>(res);
    },
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
