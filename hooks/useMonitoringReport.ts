'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { MonitoringBotReport } from '@/types/api';

/**
 * Unified SPRT + CUSUM + Bayesian monitoring report for a single bot.
 * Pass `undefined` or `null` to skip the fetch (e.g. when no bot is selected).
 *
 * Refetches every 60 seconds.
 */
export function useMonitoringReport(botId: string | undefined | null) {
  return useQuery<MonitoringBotReport>({
    queryKey: queryKeys.monitoring.report(botId),
    queryFn: async () => {
      const res = await apiFetch(`/api/monitoring/bots/${botId!}/report`);
      if (!res.ok) throw new Error('Failed to fetch monitoring report');
      return parseApiJson<MonitoringBotReport>(res);
    },
    enabled: !!botId,
    refetchInterval: pollingIntervals.nearLive,
  });
}
