'use client';

/**
 * usePromoteToDeep — react-query mutation hook wiring the
 * /originate flow's "Accept Strategy" CTA to the engine's E.1
 * promotion endpoint.
 *
 * Engine endpoint:
 *   POST /api/origination/strategies/{light_passport_id}/promote-to-deep
 *
 * Engine response (HTTP 202):
 *   { deep_job_id: UUID, submitted_at: ISO-8601 timestamp }
 *
 * Error mappings (preserved as `HttpError.status` so the caller can
 * branch on failure mode rather than substring-matching the detail):
 *
 *   403 — passport belongs to another user; opaque "Forbidden" detail.
 *   404 — passport not found / never landed.
 *   409 — already promoted; detail body carries existing `deep_job_id`
 *         so the caller can navigate to the lifecycle view instead of
 *         retrying.
 *   422 — preconditions unmet (missing TradeIdeaSpec, materializer
 *         rejection, etc.); detail is the typed reason string.
 *
 * On 202 success, the hook invalidates the `originated-strategies-me`
 * listing query so any list view re-renders with the new deep_job_id
 * row (the listing endpoint surfaces the downstream lifecycle on the
 * same record per E.2's wire contract).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, HttpError, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

/** Successful 202 body. */
export interface PromoteToDeepResponse {
  deep_job_id: string;
  /** ISO-8601 UTC timestamp. */
  submitted_at: string;
}

/**
 * 409 body shape — FastAPI wraps the structured detail under
 * `{ detail: { deep_job_id, detail } }`.  When the hook surfaces a
 * 409 it stores the existing `deep_job_id` on the thrown
 * `HttpError.existingDeepJobId` so the click handler can navigate to
 * the lifecycle view without re-parsing the message.
 */
export interface AlreadyPromotedDetail {
  deep_job_id: string;
  detail?: string;
}

/**
 * Extended HttpError that carries the existing deep_job_id when the
 * server returns 409 ("already promoted").  The base `HttpError`
 * only carries status + message; this subclass adds the structured
 * field so the CTA's click handler can navigate without round-tripping
 * the parse.  Subclass rather than mutate-after-construct so the
 * instanceof check stays tight.
 */
export class AlreadyPromotedError extends HttpError {
  readonly existingDeepJobId: string;
  constructor(message: string, existingDeepJobId: string) {
    super(409, message);
    this.name = 'AlreadyPromotedError';
    this.existingDeepJobId = existingDeepJobId;
  }
}

/**
 * Parse the 409 body.  FastAPI's `HTTPException(detail={dict})`
 * emits `{ "detail": { "deep_job_id": "...", "detail": "..." } }`
 * — so we read `body.detail.deep_job_id`.  Falls back to a generic
 * `HttpError` if the shape is unexpected (which would be a server
 * contract violation worth surfacing).
 */
async function parseAlreadyPromoted(res: Response): Promise<AlreadyPromotedError> {
  try {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const body = (await res.json()) as {
        detail?: AlreadyPromotedDetail | string;
      };
      if (
        body.detail &&
        typeof body.detail === 'object' &&
        typeof body.detail.deep_job_id === 'string'
      ) {
        const msg = body.detail.detail ?? 'Strategy already promoted.';
        return new AlreadyPromotedError(msg, body.detail.deep_job_id);
      }
    }
  } catch {
    /* fall through to generic error below */
  }
  // Unexpected shape — surface as a plain 409 so the caller can still
  // distinguish the status code, even if we couldn't extract the job id.
  return new AlreadyPromotedError(
    'Strategy already promoted (unexpected response shape).',
    '',
  );
}

export function usePromoteToDeep() {
  const queryClient = useQueryClient();
  // TError is HttpError — the hook always throws either HttpError
  // (3xx / 4xx / 5xx HTTP failures, plus network-level failures
  // wrapped in HttpError(status=0)) or AlreadyPromotedError (subclass
  // of HttpError, surfaced on 409).  Callers should narrow via
  // `err instanceof AlreadyPromotedError` first to access
  // `.existingDeepJobId`, then read `err.status` / `err.message`
  // from the remaining HttpError branch.
  return useMutation<PromoteToDeepResponse, HttpError, string>({
    mutationFn: async (lightPassportId) => {
      let res: Response;
      try {
        res = await apiFetch(
          `/api/origination/strategies/${lightPassportId}/promote-to-deep`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Empty body — the endpoint accepts an optional `lookback_days`
            // override but we let the server pick the default for this
            // surface.  Sending `{}` keeps Content-Type honest.
            body: JSON.stringify({}),
          },
        );
      } catch (cause) {
        // Network-level failure (DNS, offline, CORS preflight, etc.).
        // Surface a status-zero HttpError so callers' instanceof checks
        // and status-based branching stay consistent across both
        // transport-level and HTTP-level failures.
        const message =
          cause instanceof Error
            ? cause.message || 'Network request failed.'
            : 'Network request failed.';
        throw new HttpError(0, message);
      }
      if (res.status === 409) {
        throw await parseAlreadyPromoted(res);
      }
      if (!res.ok) {
        const detail = await parseApiError(
          res,
          'Failed to promote strategy to deep validation.',
        );
        throw new HttpError(res.status, detail);
      }
      return parseApiJson<PromoteToDeepResponse>(res);
    },
    onSuccess: (_data, lightPassportId) => {
      // Invalidate the "my originated strategies" listing so any list
      // view picks up the new deep_job_id row.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.origination.strategiesList,
      });
      // Invalidate the per-strategy lifecycle so the F.2 timeline view
      // re-fetches the populated deep_promotion_job_id immediately.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.origination.lifecycle(lightPassportId),
      });
    },
  });
}
