'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

// ---------------------------------------------------------------------------
// Types — mirror algobrute.api.routers.fleet_control.AutonomyEnvelopeSummary
// and FleetAutonomyPolicyRequest.  See:
//   src/algobrute/api/routers/fleet_control.py:75 (AutonomyEnvelopeSummary)
//   src/algobrute/api/routers/fleet_control.py:113 (FleetAutonomyPolicyRequest)
// ---------------------------------------------------------------------------

export type AutonomyMode = 'manual' | 'supervised' | 'autonomous';

/** GET /api/fleet-control/policy response shape. */
export interface AutonomyEnvelopeSummary {
  policy_id: string;
  mode: string;
  /** Action -> 'allowed' | 'blocked' projection of the in-memory envelope. */
  allowed_actions: Record<string, string>;
  /**
   * Posterior-aware sizer canary opt-in.  Defaults to false (legacy
   * argmax sizer).  Persisted on the user row, not the in-memory
   * envelope; threaded through the API summary so the UI can render
   * the toggle alongside the autonomy mode.
   */
  posterior_aware_sizer_canary_opt_in: boolean;
}

/**
 * POST /api/fleet-control/autonomy/policy request body.
 *
 * Omit-on-inherit semantic: omit a field (or set ``undefined``) to
 * inherit the prior persisted value; an explicit ``true``/``false``
 * overrides.
 */
export interface FleetAutonomyPolicyRequest {
  mode: AutonomyMode;
  allow_reduce_fleet_exposure?: boolean | null;
  allow_restore_fleet_exposure?: boolean | null;
  allow_trigger_fleet_rebalance?: boolean | null;
  posterior_aware_sizer_canary_opt_in?: boolean | null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Read the authenticated user's autonomy policy envelope summary
 * (autonomy mode + fleet-action overrides + posterior-aware sizer
 * canary opt-in flag).  Backed by ``GET /api/fleet-control/policy``.
 */
export function useAutonomyPolicy(): UseQueryResult<AutonomyEnvelopeSummary> {
  return useQuery<AutonomyEnvelopeSummary>({
    queryKey: queryKeys.user.autonomyPolicy,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet-control/policy');
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to load autonomy policy');
        throw new Error(detail);
      }
      return parseApiJson<AutonomyEnvelopeSummary>(res);
    },
    staleTime: 30_000,
  });
}

/**
 * Update the authenticated user's autonomy policy envelope.  POSTs to
 * ``/api/fleet-control/autonomy/policy`` and invalidates the policy
 * query on success.  Implements optimistic updates: the cache is
 * updated to reflect the new request body before the mutation
 * resolves; on error the prior value is rolled back.
 *
 * Inherit-on-omit semantic is preserved on the wire — fields left
 * ``undefined`` on the request body are omitted entirely from the JSON
 * payload so the backend can fall back to the prior persisted value.
 */
export function useUpdateAutonomyPolicy(): UseMutationResult<
  AutonomyEnvelopeSummary,
  Error,
  FleetAutonomyPolicyRequest,
  { previous: AutonomyEnvelopeSummary | undefined }
> {
  const queryClient = useQueryClient();

  return useMutation<
    AutonomyEnvelopeSummary,
    Error,
    FleetAutonomyPolicyRequest,
    { previous: AutonomyEnvelopeSummary | undefined }
  >({
    mutationFn: async (request) => {
      // Strip undefined fields to preserve omit-on-inherit semantics —
      // an undefined field should NOT be serialized as ``null`` because
      // ``null`` is treated by the backend the same as ``false`` for
      // booleans on POST; ``undefined`` must be entirely absent.
      const body: Record<string, unknown> = { mode: request.mode };
      if (request.allow_reduce_fleet_exposure !== undefined) {
        body.allow_reduce_fleet_exposure = request.allow_reduce_fleet_exposure;
      }
      if (request.allow_restore_fleet_exposure !== undefined) {
        body.allow_restore_fleet_exposure = request.allow_restore_fleet_exposure;
      }
      if (request.allow_trigger_fleet_rebalance !== undefined) {
        body.allow_trigger_fleet_rebalance = request.allow_trigger_fleet_rebalance;
      }
      if (request.posterior_aware_sizer_canary_opt_in !== undefined) {
        body.posterior_aware_sizer_canary_opt_in =
          request.posterior_aware_sizer_canary_opt_in;
      }

      const res = await apiFetch('/api/fleet-control/autonomy/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to update autonomy policy');
        throw new Error(detail);
      }
      return parseApiJson<AutonomyEnvelopeSummary>(res);
    },
    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.autonomyPolicy });
      const previous = queryClient.getQueryData<AutonomyEnvelopeSummary>(
        queryKeys.user.autonomyPolicy,
      );
      if (previous) {
        const next: AutonomyEnvelopeSummary = {
          ...previous,
          mode: request.mode,
          posterior_aware_sizer_canary_opt_in:
            request.posterior_aware_sizer_canary_opt_in ??
            previous.posterior_aware_sizer_canary_opt_in,
        };
        queryClient.setQueryData(queryKeys.user.autonomyPolicy, next);
      }
      return { previous };
    },
    onError: (_err, _request, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.user.autonomyPolicy, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.autonomyPolicy, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.autonomyPolicy });
    },
  });
}
