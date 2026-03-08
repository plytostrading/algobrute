'use client';

/**
 * useFleetPanelInsight
 *
 * Fetches a live LLM-generated insight summary for a fleet command-centre panel
 * from GET /api/fleet/insight/{panelKey}.
 *
 * Unlike backtest section insights, fleet panel insights are NOT cached server-side
 * (fleet data changes continuously).  Client-side stale time is set to 5 minutes
 * so users don't see constant re-fetches as they interact with the page.
 *
 * Returns { data, isLoading, isError } — silently renders nothing on 404/503.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetPanelInsight } from '@/types/api';

/**
 * Valid panel keys accepted by GET /api/fleet/insight/{panelKey}.
 * These correspond to the three fleet command-centre panels that receive insights.
 */
export type FleetPanelKey = 'risk_snapshot' | 'fear_greed' | 'sensitivity';

/**
 * Fetch a live LLM insight for a fleet panel.
 * Pass null/undefined to disable.
 */
export function useFleetPanelInsight(panelKey: FleetPanelKey | null | undefined) {
  return useQuery<FleetPanelInsight>({
    queryKey: queryKeys.fleet.panelInsight(panelKey ?? ''),
    queryFn: async () => {
      const res = await apiFetch(`/api/fleet/insight/${panelKey!}`);
      if (!res.ok) {
        const detail = await parseApiError(res, 'Fleet panel insight unavailable');
        throw new Error(detail);
      }
      return parseApiJson<FleetPanelInsight>(res);
    },
    enabled: !!panelKey,
    // 5-minute client-side cache — fleet data changes but insight re-generation
    // is expensive (LLM call).  Matches the slow polling interval for fleet analytics.
    staleTime: pollingIntervals.slow,
    // Don't retry on 404 (LLM not configured / no data) or 503 (temporary LLM issue)
    retry: false,
  });
}
