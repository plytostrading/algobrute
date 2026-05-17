'use client';

/**
 * Tier 11 fleet-control hooks.
 *
 * Wraps the /api/fleet-control/* endpoints introduced by the
 * algobrute-engine Tier 11 rollout.  Five primary hooks + three
 * debug-only event publishers (visible when the backend exposes
 * /debug endpoints under use_fleet_control_debug_endpoints).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';

// ── Types (mirror the backend response_model shapes) ──────────────

export type AutonomyMode =
  | 'advisory_only'
  | 'auto_protect_only'
  | 'auto_protect_and_revalidate'
  | 'auto_manage_with_bounds'
  | 'user_gated_deployment_autonomous_runtime'
  | 'full_bounded_autonomy';

export type AutonomyDecision = 'allowed' | 'blocked' | 'user_gated';

export interface AutonomyEnvelopeSummary {
  policy_id: string;
  mode: AutonomyMode;
  allowed_actions: Record<string, AutonomyDecision>;
}

export interface FleetControlRecommendation {
  decision_id: string;
  controller_kind: string;
  action: string;
  outcome: string;
  resolved_at: string;
  payload: Record<string, unknown>;
  evidence: Record<string, unknown>;
}

export interface FleetBenchmarkDelta {
  user_id: string;
  window_start: string;
  window_end: string;
  live_fleet_pnl: number;
  shadow_fleet_pnl: number;
  platform_delta: number;
  platform_delta_pct: number;
  live_sharpe: number;
  shadow_sharpe: number;
  sharpe_delta: number;
  n_live_trades: number;
  n_shadow_trades: number;
  n_suppressed_in_live: number;
  computed_at: string;
}

export interface FleetAutonomyPolicyRequest {
  mode: AutonomyMode;
  allow_reduce_fleet_exposure?: boolean;
  allow_restore_fleet_exposure?: boolean;
  allow_trigger_fleet_rebalance?: boolean;
}

export interface FleetControlKPIs {
  fleet_multiplier: number;
  n_controllers: number;
  n_decisions_total: number;
  n_decisions_acted: number;
  n_decisions_recommended_pending: number;
  n_decisions_blocked: number;
  n_decisions_deduped: number;
  n_shadow_trades_open: number;
  n_shadow_trades_closed: number;
  n_shadow_trades_suppressed: number;
  last_decision_at: string | null;
  latest_benchmark_delta_pct: number | null;
  latest_benchmark_computed_at: string | null;
}

export interface ShadowTradeView {
  shadow_trade_id: string;
  strategy_id: string;
  symbol: string;
  side: 'long' | 'short';
  signal_price: number;
  shadow_fill_price: number;
  slippage_bps_applied: number;
  commission: number;
  entered_at: string;
  exited_at: string | null;
  exit_price: number | null;
  realized_pnl: number | null;
  realized_pnl_pct: number | null;
  was_suppressed_in_live: boolean;
}

export interface AutonomyDecisionView {
  decision_id: string;
  controller_kind: string;
  action: string;
  outcome: string;
  envelope_mode: string;
  latency_ms: number;
  resolved_at: string;
  suggested_multiplier: number | null;
  advisory_only: boolean | null;
}

export interface ControllerHealthEntry {
  controller_kind: string;
  current_multiplier: number | null;
}

export interface ControllerHealthResponse {
  fleet_multiplier: number;
  controllers: ControllerHealthEntry[];
}

// ── Query keys ────────────────────────────────────────────────────

const qk = {
  policy: ['fleetControl', 'policy'] as const,
  recommendations: ['fleetControl', 'recommendations'] as const,
  benchmarkDelta: ['fleetControl', 'benchmarkDelta'] as const,
  kpis: ['fleetControl', 'kpis'] as const,
  shadowTrades: ['fleetControl', 'shadowTrades'] as const,
  decisions: ['fleetControl', 'decisions'] as const,
  controllerHealth: ['fleetControl', 'controllerHealth'] as const,
};

// ── Read hooks ────────────────────────────────────────────────────

export function useFleetControlPolicy() {
  return useQuery<AutonomyEnvelopeSummary>({
    queryKey: qk.policy,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet-control/policy');
      if (!res.ok) throw new Error('Failed to fetch policy');
      return parseApiJson<AutonomyEnvelopeSummary>(res);
    },
  });
}

export function useFleetControlRecommendations() {
  return useQuery<FleetControlRecommendation[]>({
    queryKey: qk.recommendations,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet-control/recommendations');
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return parseApiJson<FleetControlRecommendation[]>(res);
    },
    refetchInterval: 15_000, // refresh quickly so demo chain is visible
  });
}

export function useFleetControlBenchmarkDelta() {
  return useQuery<FleetBenchmarkDelta | null>({
    queryKey: qk.benchmarkDelta,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet-control/benchmark-delta');
      if (!res.ok) throw new Error('Failed to fetch benchmark delta');
      return parseApiJson<FleetBenchmarkDelta | null>(res);
    },
  });
}

export function useFleetControlKPIs() {
  return useQuery<FleetControlKPIs>({
    queryKey: qk.kpis,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet-control/kpis');
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      return parseApiJson<FleetControlKPIs>(res);
    },
    refetchInterval: 15_000,
  });
}

export function useShadowTrades(limit = 50) {
  return useQuery<ShadowTradeView[]>({
    queryKey: [...qk.shadowTrades, limit],
    queryFn: async () => {
      const res = await apiFetch(`/api/fleet-control/shadow-trades?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch shadow trades');
      return parseApiJson<ShadowTradeView[]>(res);
    },
    refetchInterval: 15_000,
  });
}

export function useFleetDecisions(limit = 50) {
  return useQuery<AutonomyDecisionView[]>({
    queryKey: [...qk.decisions, limit],
    queryFn: async () => {
      const res = await apiFetch(`/api/fleet-control/decisions?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch decisions');
      return parseApiJson<AutonomyDecisionView[]>(res);
    },
    refetchInterval: 15_000,
  });
}

export function useControllerHealth() {
  return useQuery<ControllerHealthResponse>({
    queryKey: qk.controllerHealth,
    queryFn: async () => {
      const res = await apiFetch('/api/fleet-control/controller-health');
      if (!res.ok) throw new Error('Failed to fetch controller health');
      return parseApiJson<ControllerHealthResponse>(res);
    },
    refetchInterval: 15_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────

export function useUpdateFleetControlPolicy() {
  const qc = useQueryClient();
  return useMutation<AutonomyEnvelopeSummary, Error, FleetAutonomyPolicyRequest>({
    mutationFn: async (req) => {
      const res = await apiFetch('/api/fleet-control/autonomy/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Update failed (${res.status})`);
      }
      return parseApiJson<AutonomyEnvelopeSummary>(res);
    },
    onSuccess: (data) => {
      qc.setQueryData(qk.policy, data);
      qc.invalidateQueries({ queryKey: qk.recommendations });
    },
  });
}

// ── Debug publishers (gated server-side by
// regime.use_fleet_control_debug_endpoints; 404 when disabled) ────

export interface PublishAck {
  event_id: string;
  event_type: string;
  published_at: string;
  /** Price actually used for the event (real last-close from market-data DB,
   *  caller override, or null when a synthetic fallback was needed). */
  resolved_price?: number | null;
  /** "market_data_db" | "override" | "synthetic" */
  price_source?: string;
}

export function usePublishRegimeTransition() {
  const qc = useQueryClient();
  return useMutation<
    PublishAck,
    Error,
    { previous_regime: number; new_regime: number; conviction: 'low' | 'moderate' | 'high' }
  >({
    mutationFn: async (body) => {
      const res = await apiFetch('/api/fleet-control/debug/publish-regime-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Publish failed (${res.status})`);
      return parseApiJson<PublishAck>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recommendations });
      qc.invalidateQueries({ queryKey: qk.decisions });
      qc.invalidateQueries({ queryKey: qk.kpis });
      qc.invalidateQueries({ queryKey: qk.controllerHealth });
    },
  });
}

export function usePublishSignal() {
  const qc = useQueryClient();
  return useMutation<
    PublishAck,
    Error,
    { ticker: string; entry_target?: number }
  >({
    mutationFn: async (body) => {
      const payload: Record<string, unknown> = {
        ticker: body.ticker,
        side: 'long',
        strategy_id: 'trend',
      };
      if (body.entry_target !== undefined) {
        payload.entry_target = body.entry_target;
      }
      const res = await apiFetch('/api/fleet-control/debug/publish-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Publish failed (${res.status})`);
      return parseApiJson<PublishAck>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shadowTrades });
      qc.invalidateQueries({ queryKey: qk.kpis });
    },
  });
}

export function usePublishTradeClosed() {
  const qc = useQueryClient();
  return useMutation<
    PublishAck,
    Error,
    { ticker: string; exit_price?: number; realized_pnl_pct?: number }
  >({
    mutationFn: async (body) => {
      const payload: Record<string, unknown> = {
        ticker: body.ticker,
        exit_reason: 'take_profit',
      };
      if (body.exit_price !== undefined) {
        payload.exit_price = body.exit_price;
      }
      if (body.realized_pnl_pct !== undefined) {
        payload.realized_pnl_pct = body.realized_pnl_pct;
      }
      const res = await apiFetch('/api/fleet-control/debug/publish-trade-closed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Publish failed (${res.status})`);
      return parseApiJson<PublishAck>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shadowTrades });
      qc.invalidateQueries({ queryKey: qk.kpis });
    },
  });
}
