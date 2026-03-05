'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { AlpacaConnectionStatus } from '@/types/api';

/**
 * Current Alpaca brokerage connection status (connected, paper/live, account ID).
 * Refetches every 5 minutes.
 */
export function useAlpacaStatus() {
  return useQuery<AlpacaConnectionStatus>({
    queryKey: queryKeys.user.alpacaStatus,
    queryFn: async () => {
      const res = await apiFetch('/api/user/alpaca/status');
      if (!res.ok) throw new Error('Failed to fetch Alpaca status');
      return parseApiJson<AlpacaConnectionStatus>(res);
    },
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
