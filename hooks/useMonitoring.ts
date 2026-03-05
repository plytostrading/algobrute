'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { MonitoringRegimeStatus, HarnessStatus } from '@/types/api';

/**
 * Current regime detection status for monitoring.
 * Refetches every 30 seconds.
 */
export function useMonitoringRegime() {
  return useQuery<MonitoringRegimeStatus>({
    queryKey: queryKeys.monitoring.regime,
    queryFn: async () => {
      const res = await apiFetch('/api/monitoring/regime');
      if (!res.ok) throw new Error('Failed to fetch monitoring regime status');
      return parseApiJson<MonitoringRegimeStatus>(res);
    },
    refetchInterval: pollingIntervals.live,
  });
}

/**
 * Monitoring harness status for a single bot.
 * Pass null/undefined to skip.
 */
export function useHarnessStatus(botId: string | null | undefined) {
  return useQuery<HarnessStatus>({
    queryKey: queryKeys.monitoring.harness(botId),
    queryFn: async () => {
      const res = await apiFetch(`/api/monitoring/harness/${botId!}`);
      if (!res.ok) throw new Error('Failed to fetch harness status');
      return parseApiJson<HarnessStatus>(res);
    },
    enabled: !!botId,
    refetchInterval: pollingIntervals.live,
  });
}
