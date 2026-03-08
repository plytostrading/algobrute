'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetRiskSnapshot } from '@/types/api';

/**
 * Fleet risk snapshot — annualised volatility, VaR (95%/99%/CVaR), and
 * per-ticker Wilder ADX trend metrics.
 *
 * Refetches every 2 minutes: ADX data changes intraday but not tick-by-tick.
 * Returns undefined (not 404-error) when the user has no bots — the component
 * renders an appropriate empty state instead of an error UI.
 */
export function useFleetRiskSnapshot() {
  return useQuery<FleetRiskSnapshot | null>({
    queryKey: queryKeys.fleet.riskSnapshot,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/risk-snapshot');
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch fleet risk snapshot');
      return parseApiJson<FleetRiskSnapshot>(res);
    },
    staleTime: pollingIntervals.recommendation,
    refetchInterval: pollingIntervals.recommendation,
  });
}
