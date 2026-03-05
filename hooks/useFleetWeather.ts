'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { FleetWeatherReport } from '@/types/api';

/**
 * Latest fleet weather report.
 * Refetches every 60 seconds — weather changes slowly.
 */
export function useFleetWeather() {
  return useQuery<FleetWeatherReport>({
    queryKey: queryKeys.fleet.weather,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/weather');
      if (!res.ok) throw new Error('Failed to fetch fleet weather');
      return parseApiJson<FleetWeatherReport>(res);
    },
    refetchInterval: pollingIntervals.nearLive,
  });
}

/**
 * Historical fleet weather reports — used to build an equity curve from
 * fleet_capital snapshots over time.
 *
 * Returns up to the last N weather reports in chronological order.
 */
export function useFleetWeatherHistory() {
  return useQuery<FleetWeatherReport[]>({
    queryKey: queryKeys.fleet.weatherHistory,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet/weather/history');
      if (!res.ok) throw new Error('Failed to fetch fleet weather history');
      return parseApiJson<FleetWeatherReport[]>(res);
    },
    // History is stable — only refetch once per session
    staleTime: pollingIntervals.slow,
    refetchInterval: pollingIntervals.slow,
  });
}
