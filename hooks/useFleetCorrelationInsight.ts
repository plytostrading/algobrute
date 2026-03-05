'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { CorrelationInsightResponse, Regime } from '@/types/api';

/**
 * Fetches LLM-generated per-pair correlation analysis for a given regime.
 *
 * Each pair in the response includes:
 * - `insight`: 1-2 sentences explaining WHY the two bots are correlated,
 *   referencing their strategy types, tickers, and market dynamics.
 * - `drivers`: 3-5 short factors that drove the EWMA correlation value
 *   (e.g. shared equity beta, EWMA half-life weighting, Ledoit-Wolf shrinkage,
 *   statistical reliability from n_days_used observations).
 *
 * Returns null on 404 (no data for regime or Anthropic not configured).
 * Refetches every 5 minutes — LLM analysis changes slowly with analytics runs.
 */
export function useFleetCorrelationInsight(regime: Regime | undefined) {
  return useQuery<CorrelationInsightResponse | null>({
    queryKey: queryKeys.fleet.correlationInsight(regime ?? 1),
    queryFn: async () => {
      const res = await apiFetch(`/api/fleet/correlation/${regime}/insight`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch correlation insight');
      return parseApiJson<CorrelationInsightResponse>(res);
    },
    enabled: regime !== undefined,
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
