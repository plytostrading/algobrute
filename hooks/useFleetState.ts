'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetState } from '@/types/api';

/**
 * Fleet state — enriched BotSnapshots (with strategy_id + ticker) wrapped in
 * aggregate totals. Backs the Operations IA (Batch 7+) and any view that
 * needs human-readable bot identifiers.
 *
 * Invalidated automatically on any bot mutation (pause/resume/retire) because
 * `invalidateAfterBotMutation` targets `queryKeys.fleet.all = ['fleet']`, which
 * is a prefix of `queryKeys.fleet.state = ['fleet', 'state']`.
 */
export function useFleetState() {
  return useQuery<FleetState>({
    queryKey: queryKeys.fleet.state,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/state');
      if (!res.ok) throw new Error('Failed to fetch fleet state');
      return parseApiJson<FleetState>(res);
    },
    refetchInterval: pollingIntervals.live,
  });
}
