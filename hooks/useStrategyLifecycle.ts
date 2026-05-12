'use client';

/**
 * useStrategyLifecycle — react-query hook for the per-strategy
 * unified lifecycle envelope used by the F.2 timeline view.
 *
 * Engine endpoint:
 *   GET /api/origination/strategies/{passport_id}/lifecycle  (E.3)
 *
 * Response shape: :type:`StrategyLifecycleView`.
 *
 * Polling
 * -------
 *
 * The lifecycle envelope is the single source of truth for the
 * timeline page.  Polling is enabled in two cases:
 *
 *   1. A deep-validation job is in flight (``deep_job_status === 'running'``
 *      or ``'pending'``) — phase + progress need to refresh as the
 *      backend pipeline advances.
 *   2. A bot has been deployed and has at least one closed trade so
 *      live P&L can refresh.
 *
 * When neither condition holds (un-promoted passport, completed-but-
 * not-yet-deployed, or completed-and-deployed-but-no-trades-yet) the
 * hook short-circuits to a single fetch with no refetch interval.
 *
 * 404 handling
 * ------------
 *
 * A 404 means the passport does not exist (or is owned by another
 * user that the engine refuses to disclose via 403 — both surface
 * uniformly to the caller).  In either case we return ``null`` rather
 * than throwing so the page can render a "Strategy not found" empty
 * state without try/catch boilerplate in the component.
 *
 * 403 is also treated as "not found from this user's perspective"
 * since the engine deliberately returns an opaque body — the
 * frontend cannot distinguish "does not exist" from "owned by another
 * user", and we should not pretend otherwise.  The page surface for
 * both is identical: an access-denied / not-found empty state.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch, HttpError, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { StrategyLifecycleView } from '@/types/api';

/**
 * Polling cadence for the active lifecycle.  5s matches the implicit
 * cadence the engine pipeline emits ``progress_phase`` updates at and
 * is fast enough for the live-P&L panel to feel responsive without
 * hammering the database.
 */
const LIFECYCLE_POLL_MS = 5_000;

/**
 * Decides whether the current envelope warrants polling.  Exported
 * so tests can exercise the rule without instantiating react-query.
 */
export function shouldPollLifecycle(view: StrategyLifecycleView | null): boolean {
  if (!view) return false;
  // A deep job in flight needs progress + phase updates.
  if (view.deep_job_status === 'running' || view.deep_job_status === 'pending') {
    return true;
  }
  // A deployed bot needs live-P&L refreshes once it starts closing
  // trades.  When `bot_id` is set but `live_closed_trade_count` is
  // still null/0 the bot is ramping and there's no meaningful change
  // to poll for — wait until trades start landing.
  if (view.bot_id !== null && (view.live_closed_trade_count ?? 0) > 0) {
    return true;
  }
  return false;
}

export interface UseStrategyLifecycleResult {
  data: StrategyLifecycleView | null;
  isLoading: boolean;
  isError: boolean;
  error: HttpError | Error | null;
  /** Underlying react-query result — exposed for callers that need finer-grained state. */
  query: UseQueryResult<StrategyLifecycleView | null, HttpError | Error>;
}

export function useStrategyLifecycle(
  passportId: string | null | undefined,
): UseStrategyLifecycleResult {
  const enabled = Boolean(passportId);
  const query = useQuery<StrategyLifecycleView | null, HttpError | Error>({
    queryKey: queryKeys.origination.lifecycle(passportId),
    enabled,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/origination/strategies/${passportId}/lifecycle`,
      );
      // 404 / 403 → caller-friendly null so the page can render an
      // empty / access-denied state without exception plumbing.
      if (res.status === 404 || res.status === 403) {
        return null;
      }
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to load strategy lifecycle.');
        throw new HttpError(res.status, detail);
      }
      return parseApiJson<StrategyLifecycleView>(res);
    },
    refetchInterval: (q) => {
      const view = q.state.data ?? null;
      return shouldPollLifecycle(view) ? LIFECYCLE_POLL_MS : false;
    },
    // Keep the data fresh-ish without aggressive over-refetching when
    // the user clicks back to the tab — the polling rule already
    // covers active states.
    staleTime: 1_000,
  });
  return {
    data: query.data ?? null,
    isLoading: query.isLoading && enabled,
    isError: query.isError,
    error: query.error ?? null,
    query,
  };
}
