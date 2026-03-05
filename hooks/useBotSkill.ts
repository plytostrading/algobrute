'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { SkillAssessment } from '@/types/api';

/**
 * Probabilistic Sharpe Ratio based skill assessment for a single bot.
 * Pass `undefined` or `null` to skip the fetch.
 *
 * Refetches every 5 minutes — skill assessment is updated after each new trade.
 */
export function useBotSkill(botId: string | undefined | null) {
  return useQuery<SkillAssessment>({
    queryKey: queryKeys.bots.skill(botId),
    queryFn: async () => {
      const res = await apiFetch(`/api/bots/${botId!}/skill`);
      if (!res.ok) throw new Error('Failed to fetch bot skill assessment');
      return parseApiJson<SkillAssessment>(res);
    },
    enabled: !!botId,
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
