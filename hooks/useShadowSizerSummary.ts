'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

// ---------------------------------------------------------------------------
// Types — mirror algobrute.api.routers.dashboard.ShadowSizerDashboardSummary
// and CohortSummary.  See:
//   src/algobrute/api/routers/dashboard.py:4505 (CohortSummary)
//   src/algobrute/api/routers/dashboard.py:4548 (ShadowSizerDashboardSummary)
// ---------------------------------------------------------------------------

export type CohortKey = 'all' | 'canary_opt_in' | 'canary_opt_out';

/** Per-cohort rollup for the shadow-sizer dashboard panel. */
export interface CohortSummary {
  n_observations: number;
  /**
   * Share of observations whose posterior-aware ``prior_source`` is
   * ``universal_default`` (rather than ``cluster_specific``).  0.0
   * when ``n_observations == 0``.
   */
  universal_default_fraction: number;
  /**
   * Median of ``posterior_aware_kelly_cap - legacy_argmax_kelly_cap``
   * across the cohort.  0.0 when the cohort is empty.
   */
  median_delta_kelly_cap: number;
  /** scipy.stats.wilcoxon p-value; null when the cohort is empty. */
  wilcoxon_p_value: number | null;
}

/** GET /api/dashboard/shadow-sizer-summary response shape. */
export interface ShadowSizerDashboardSummary {
  /** ISO date string "YYYY-MM-DD". */
  window_start: string;
  /** ISO date string "YYYY-MM-DD". */
  window_end: string;
  n_observations: number;
  universal_default_fraction: number;
  median_delta_kelly_cap: number;
  wilcoxon_statistic: number | null;
  wilcoxon_p_value: number | null;
  /** §9.3 G2-2 acceptance-gate p-value threshold. */
  g2_2_threshold: number;
  /** True iff p < threshold AND n_observations >= minimum sample size. */
  g2_2_pass: boolean;
  by_cohort: Record<CohortKey, CohortSummary>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseShadowSizerSummaryOptions {
  /**
   * Rolling-window length in days.  Server clamps to ``[1, 365]``;
   * defaults to 30.
   */
  windowDays?: number;
}

/**
 * Read the rolling-window shadow-sizer comparison metrics for the
 * operator dashboard panel.  Backed by
 * ``GET /api/dashboard/shadow-sizer-summary``.
 *
 * The response includes the §9.3 G2-2 PASS/FAIL verdict plus per-cohort
 * (``all`` / ``canary_opt_in`` / ``canary_opt_out``) breakdowns of
 * universal-default rate, median Kelly-cap delta, and paired-Wilcoxon
 * p-values.
 */
export function useShadowSizerSummary({
  windowDays = 30,
}: UseShadowSizerSummaryOptions = {}): UseQueryResult<ShadowSizerDashboardSummary> {
  return useQuery<ShadowSizerDashboardSummary>({
    queryKey: queryKeys.dashboard.shadowSizerSummary(windowDays),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/dashboard/shadow-sizer-summary?window_days=${windowDays}`,
      );
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to load shadow-sizer summary');
        throw new Error(detail);
      }
      return parseApiJson<ShadowSizerDashboardSummary>(res);
    },
    staleTime: 60_000,
  });
}
