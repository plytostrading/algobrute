'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { BotSnapshot, BotConfig, BotCreateRequest } from '@/types/api';

type BotUpdatePayload = {
  botId: string;
  updates: Partial<
    Pick<BotConfig, 'capital_allocation_pct' | 'ticker' | 'strategy_id'>
  >;
};

function invalidateAfterBotMutation(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.fleet.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.all });
}

/**
 * All bot snapshots for the authenticated user.
 * Refetches every 30 seconds to keep live state fresh.
 */
export function useBots() {
  return useQuery<BotSnapshot[]>({
    queryKey: queryKeys.bots.all,
    queryFn: async () => {
      const res = await apiFetch('/api/bots');
      if (!res.ok) throw new Error('Failed to fetch bots');
      return parseApiJson<BotSnapshot[]>(res);
    },
    refetchInterval: pollingIntervals.live,
  });
}

/**
 * Update editable bot config fields (capital_allocation_pct, ticker, strategy_id).
 */
export function useUpdateBot() {
  const queryClient = useQueryClient();
  return useMutation<BotConfig, Error, BotUpdatePayload>({
    mutationFn: async ({ botId, updates }) => {
      const res = await apiFetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const detail = await parseApiError(
          res,
          `Failed to update bot (${res.status})`,
        );
        throw new Error(detail);
      }
      return parseApiJson<BotConfig>(res);
    },
    onSuccess: () => {
      invalidateAfterBotMutation(queryClient);
    },
  });
}

/**
 * Pause a bot by ID.
 * Invalidates fleet/monitoring queries on success for cross-page consistency.
 */
export function usePauseBot() {
  const queryClient = useQueryClient();
  return useMutation<BotConfig, Error, string>({
    mutationFn: async (botId: string) => {
      const res = await apiFetch(`/api/bots/${botId}/pause`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to pause bot');
      return parseApiJson<BotConfig>(res);
    },
    onSuccess: () => {
      invalidateAfterBotMutation(queryClient);
    },
  });
}

/**
 * Resume a paused bot by ID.
 */
export function useResumeBot() {
  const queryClient = useQueryClient();
  return useMutation<BotConfig, Error, string>({
    mutationFn: async (botId: string) => {
      const res = await apiFetch(`/api/bots/${botId}/resume`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to resume bot');
      return parseApiJson<BotConfig>(res);
    },
    onSuccess: () => {
      invalidateAfterBotMutation(queryClient);
    },
  });
}

/**
 * Retire (soft-stop) a bot by ID.
 */
export function useRetireBot() {
  const queryClient = useQueryClient();
  return useMutation<BotConfig, Error, string>({
    mutationFn: async (botId: string) => {
      const res = await apiFetch(`/api/bots/${botId}/retire`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to retire bot');
      return parseApiJson<BotConfig>(res);
    },
    onSuccess: () => {
      invalidateAfterBotMutation(queryClient);
    },
  });
}

/**
 * Create a new trading bot from a strategy + capital configuration.
 */
export function useCreateBot() {
  const queryClient = useQueryClient();
  return useMutation<BotConfig, Error, BotCreateRequest>({
    mutationFn: async (req) => {
      const res = await apiFetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to create bot');
        throw new Error(detail);
      }
      return parseApiJson<BotConfig>(res);
    },
    onSuccess: () => {
      invalidateAfterBotMutation(queryClient);
    },
  });
}
