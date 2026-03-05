'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { StrategyInfo, StrategyDetail } from '@/types/api';

/**
 * All available strategies. Rarely changes — stale for 10 minutes.
 */
export function useStrategies() {
  return useQuery<StrategyInfo[]>({
    queryKey: queryKeys.strategies.all,
    queryFn: async () => {
      const res = await apiFetch('/api/strategies');
      if (!res.ok) throw new Error('Failed to fetch strategies');
      return parseApiJson<StrategyInfo[]>(res);
    },
    staleTime: pollingIntervals.slow * 2,
  });
}

/**
 * Detailed parameters + regime qualifications for a single strategy.
 * Pass `undefined` or `null` to skip the fetch.
 */
export function useStrategyDetail(strategyId: string | null | undefined) {
  return useQuery<StrategyDetail>({
    queryKey: queryKeys.strategies.detail(strategyId),
    queryFn: async () => {
      const res = await apiFetch(`/api/strategies/${strategyId!}`);
      if (!res.ok) throw new Error('Failed to fetch strategy detail');
      return parseApiJson<StrategyDetail>(res);
    },
    enabled: !!strategyId,
    staleTime: pollingIntervals.slow * 2,
  });
}
