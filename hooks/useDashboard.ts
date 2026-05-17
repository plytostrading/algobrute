'use client';

/**
 * Customer dashboard hooks — wrap /api/dashboard/* endpoints that
 * aggregate across domain tables into chart-ready payloads.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────

export interface BacktestEvidenceCard {
  job_id: string;
  created_at: string;
  strategy_id: string;
  ticker: string;
  data_start_date: string | null;
  data_end_date: string | null;
  n_trades: number;
  sharpe_mean: number;
  sharpe_std: number;
  sharpe_ci_lower: number | null;
  sharpe_ci_upper: number | null;
  psr: number | null;
  dsr: number | null;
  pbo: number | null;
  total_return_pct: number | null;
  max_drawdown_ci_upper: number | null;
  deployment_approved: boolean;
  deployment_notes: string | null;
  reliability_passed: boolean | null;
  regime_degraded: boolean | null;
  qualified_regime_coverage_pct: number | null;
  qualified_regime_coverage_health: string | null;
  sizing_health: string | null;
  breakeven_slippage_bps: number | null;
  spa_p_value: number | null;
  passport_id: string | null;
}

export interface BacktestEvidenceSummary {
  n_complete: number;
  n_deployment_approved: number;
  n_reliability_passed: number;
  distinct_strategies: number;
  distinct_tickers: number;
  strategies_covered: string[];
  tickers_covered: string[];
  earliest: string | null;
  latest: string | null;
}

export interface BacktestEvidenceResponse {
  summary: BacktestEvidenceSummary;
  cards: BacktestEvidenceCard[];
}

export interface RegimeTimelinePoint {
  label_date: string;
  regime: string;
  conviction: number;
}

export interface RegimeTimelineResponse {
  summary: {
    earliest: string | null;
    latest: string | null;
    n_points: number;
    distribution: Record<string, number>;
  };
  points: RegimeTimelinePoint[];
}

// ── Hooks ─────────────────────────────────────────────────────────

export function useBacktestEvidence(limit = 50) {
  return useQuery<BacktestEvidenceResponse>({
    queryKey: ['dashboard', 'backtestEvidence', limit],
    queryFn: async () => {
      const res = await apiFetch(`/api/dashboard/backtest-evidence?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to load backtest evidence');
      return parseApiJson<BacktestEvidenceResponse>(res);
    },
  });
}

export function useRegimeTimeline(days = 365) {
  return useQuery<RegimeTimelineResponse>({
    queryKey: ['dashboard', 'regimeTimeline', days],
    queryFn: async () => {
      const res = await apiFetch(`/api/dashboard/regime-timeline?days=${days}`);
      if (!res.ok) throw new Error('Failed to load regime timeline');
      return parseApiJson<RegimeTimelineResponse>(res);
    },
  });
}

// ── Seed fleet ────────────────────────────────────────────────────

export interface SeedFleetRequest {
  max_bots?: number;
  initial_capital_per_bot?: number;
  capital_allocation_pct?: number;
  dry_run?: boolean;
}

export interface SeedFleetResultItem {
  passport_id: string;
  strategy_id: string;
  ticker: string;
  status: 'deployed' | 'skipped' | 'error';
  bot_id: string | null;
  reason: string | null;
}

export interface SeedFleetResponse {
  dry_run: boolean;
  candidates_considered: number;
  deployed: number;
  skipped: number;
  errored: number;
  items: SeedFleetResultItem[];
}

// ── Calibration ────────────────────────────────────────────────────

export interface BotCalibrationRow {
  bot_id: string;
  strategy_id: string;
  ticker: string;
  n_live_trades_closed: number;
  predicted_sharpe: number | null;
  predicted_win_rate: number | null;
  predicted_total_return_pct: number | null;
  breakeven_slippage_bps: number | null;
  realized_sharpe: number | null;
  realized_win_rate: number | null;
  realized_total_return_pct: number | null;
  realized_slippage_bps_mean: number | null;
  sharpe_delta: number | null;
  win_rate_delta: number | null;
  trust_band: 'no_evidence' | 'accumulating' | 'calibrated' | 'drift';
}

export interface CalibrationResponse {
  rows: BotCalibrationRow[];
  n_bots: number;
  n_with_passport: number;
  n_with_evidence: number;
  n_drifted: number;
}

export function useCalibration(minTrades = 10) {
  return useQuery<CalibrationResponse>({
    queryKey: ['dashboard', 'calibration', minTrades],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/dashboard/calibration?min_trades_for_evidence=${minTrades}`,
      );
      if (!res.ok) throw new Error('Failed to load calibration');
      return parseApiJson<CalibrationResponse>(res);
    },
    refetchInterval: 60_000,
  });
}

// ── Dashboard narrative (LLM prose) ────────────────────────────────

export interface DashboardNarrativeResponse {
  narrative: string;
  generated_at: string;
  source: 'llm' | 'template';
  /** When source=llm, the model name used. */
  model: string | null;
}

export function useDashboardNarrative(section: string = 'fleet_overview') {
  return useQuery<DashboardNarrativeResponse>({
    queryKey: ['dashboard', 'narrative', section],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/dashboard/narrative?section=${encodeURIComponent(section)}`,
      );
      if (!res.ok) throw new Error('Failed to load narrative');
      return parseApiJson<DashboardNarrativeResponse>(res);
    },
    refetchInterval: 300_000, // 5 min — narrative is cheap to stale
  });
}

// ── Strategy × regime attribution ────────────────────────────────

export interface StrategyRegimeCell {
  strategy_id: string;
  regime: string;
  n_trades: number;
  n_wins: number;
  win_rate: number;
  mean_pnl_pct: number;
  median_pnl_pct: number;
  total_pnl_pct: number;
  sharpe_annualized: number;
  max_drawdown: number;
}

export interface StrategyRegimeAttributionResponse {
  strategies: string[];
  regimes: string[];
  cells: StrategyRegimeCell[];
  coverage_trades: number;
  total_strategies: number;
  total_regimes: number;
}

export function useStrategyRegimeAttribution(windowDays = 365) {
  return useQuery<StrategyRegimeAttributionResponse>({
    queryKey: ['dashboard', 'strategyRegimeAttribution', windowDays],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/dashboard/strategy-regime-attribution?window_days=${windowDays}`,
      );
      if (!res.ok) throw new Error('Failed to load attribution');
      return parseApiJson<StrategyRegimeAttributionResponse>(res);
    },
    refetchInterval: 60_000,
  });
}

// ── Bot performance ────────────────────────────────────────────────

export interface EquityPoint {
  date: string;
  cumulative_pnl_pct: number;
  trade_count: number;
  entry_regime: string | null;
}

export interface ShadowEquityPoint {
  date: string;
  cumulative_pnl_pct: number;
  trade_count: number;
}

export interface BotSelfHealingEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  reason: string;
}

export interface BotPerformanceSummary {
  bot_id: string;
  strategy_id: string;
  ticker: string;
  state: string;
  trading_mode: string;
  initial_capital: number;
  n_trades_total: number;
  n_trades_closed: number;
  n_trades_open: number;
  total_pnl_pct: number;
  win_rate: number | null;
  first_trade_date: string | null;
  last_activity_date: string | null;
  shadow_trades_available: boolean;
  platform_alpha_vs_shadow_pct: number | null;
}

export interface BotPerformanceResponse {
  summary: BotPerformanceSummary;
  live_equity: EquityPoint[];
  shadow_equity: ShadowEquityPoint[];
  sh_events: BotSelfHealingEvent[];
  regime_timeline: RegimeTimelinePoint[];
}

export function useBotPerformance(botId: string | null, windowDays = 365) {
  return useQuery<BotPerformanceResponse>({
    queryKey: ['dashboard', 'botPerformance', botId, windowDays],
    enabled: Boolean(botId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/dashboard/bot-performance/${botId}?window_days=${windowDays}`,
      );
      if (!res.ok) throw new Error(`Failed to load bot performance (${res.status})`);
      return parseApiJson<BotPerformanceResponse>(res);
    },
    refetchInterval: 30_000,
  });
}

function useSeedFleetBase(endpoint: string) {
  const qc = useQueryClient();
  return useMutation<SeedFleetResponse, Error, SeedFleetRequest>({
    mutationFn: async (body) => {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_bots: body.max_bots ?? 10,
          initial_capital_per_bot: body.initial_capital_per_bot ?? 10_000,
          capital_allocation_pct: body.capital_allocation_pct ?? 0.05,
          dry_run: body.dry_run ?? false,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Seed request failed (${res.status})`);
      }
      return parseApiJson<SeedFleetResponse>(res);
    },
    onSuccess: (data) => {
      if (!data.dry_run && data.deployed > 0) {
        qc.invalidateQueries({ queryKey: ['bots'] });
        qc.invalidateQueries({ queryKey: ['fleetControl'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

export function useSeedFleet() {
  return useSeedFleetBase('/api/dashboard/seed-fleet');
}

/** Ungated demo-grade seed — uses create_bot (no passport admission). */
export function useSeedDemoFleet() {
  return useSeedFleetBase('/api/dashboard/seed-demo-fleet');
}

// ── Paper-only passport linking (unlocks true-auto) ───────────────

export interface LinkPaperPassportsResponse {
  dry_run: boolean;
  n_bots: number;
  n_linked: number;
  n_skipped: number;
  n_errored: number;
  items: Array<{
    bot_id: string;
    ticker: string;
    strategy_id: string;
    status: 'linked' | 'skipped' | 'error';
    passport_id: string | null;
    reason: string | null;
  }>;
}

export function useLinkPaperPassports() {
  const qc = useQueryClient();
  return useMutation<
    LinkPaperPassportsResponse,
    Error,
    { overwrite?: boolean; dry_run?: boolean }
  >({
    mutationFn: async (body) => {
      const res = await apiFetch('/api/dashboard/link-paper-passports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overwrite: body.overwrite ?? false,
          dry_run: body.dry_run ?? false,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Link failed (${res.status})`);
      }
      return parseApiJson<LinkPaperPassportsResponse>(res);
    },
    onSuccess: (data) => {
      if (!data.dry_run && data.n_linked > 0) {
        qc.invalidateQueries({ queryKey: ['bots'] });
        qc.invalidateQueries({ queryKey: ['fleetControl'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}
