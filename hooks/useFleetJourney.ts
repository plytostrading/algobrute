'use client';

/**
 * Fleet Journey — one-shot aggregator for the risk-management-
 * effectiveness narrative page.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';

export interface JourneyHero {
  n_interventions: number;
  dd_avoided_pct: number;
  intervention_precision_pct: number | null;
  current_regime: string | null;
  fleet_multiplier: number;
}

export interface JourneyEquityPoint {
  date: string;
  cum_pnl_pct: number;
  max_dd_pct: number;
}

export interface JourneyRegimeBand {
  start: string;
  end: string;
  regime: string;
}

export interface JourneyIntervention {
  id: string;
  mechanism: string;
  label: string;
  timestamp: string;
  bot_id: string | null;
  reason: string;
  action_summary: string;
  outcome: string;
  was_correct: boolean | null;
  shadow_pnl_pct_next_window: number | null;
}

export interface InterventionLedgerEntry {
  mechanism: string;
  label: string;
  icon: string;
  n_fired: number;
  n_acted: number;
  n_recommended: number;
  precision_pct: number | null;
  dd_avoided_estimate_pct: number | null;
}

export interface RegimeEffectivenessRow {
  regime: string;
  regime_label: string;
  days_in_regime: number;
  interventions_fired: number;
  dd_avoided_pct: number | null;
  mean_fleet_multiplier: number | null;
}

export interface JourneyLift {
  live_max_dd_pct: number;
  shadow_max_dd_pct: number;
  dd_protection_pct: number;
  live_vol_pct: number | null;
  shadow_vol_pct: number | null;
  vol_reduction_pct: number | null;
  live_total_pnl_pct: number;
  shadow_total_pnl_pct: number;
  pnl_lift_pct: number;
}

export interface JourneyBot {
  bot_id: string;
  ticker: string;
  strategy_id: string;
  sharpe: number | null;
  max_dd_pct: number | null;
  n_trades: number;
  most_applied_intervention: string | null;
  n_interventions: number;
}

export interface JourneyHonesty {
  overall_precision_pct: number | null;
  n_correct: number;
  n_over_cautious: number;
  n_pending_window: number;
}

export interface FleetMultiplierPoint {
  date: string;
  multiplier: number;
  regime: string | null;
  driver_mechanism?: string | null;
}

export interface InterventionBucket {
  date: string;
  counts: Record<string, number>;
}

export interface SharpeBar {
  bot_id: string;
  ticker: string;
  sharpe: number;
  n_trades: number;
}

export interface HistogramBin {
  lower_pct: number;
  upper_pct: number;
  live_count: number;
  shadow_count: number;
}

export interface JourneyResponse {
  as_of: string;
  window_days: number;
  precision_window_days: number;
  regime_scope: 'current' | 'all';
  hero: JourneyHero;
  timeline: {
    live_equity: JourneyEquityPoint[];
    shadow_equity: JourneyEquityPoint[];
    regime_bands: JourneyRegimeBand[];
    interventions: JourneyIntervention[];
    equity_percentiles?: EquityPercentilePoint[];
  };
  ledger: InterventionLedgerEntry[];
  regime_effectiveness: RegimeEffectivenessRow[];
  lift: JourneyLift;
  bots: JourneyBot[];
  honesty: JourneyHonesty;
  fleet_multiplier_history: FleetMultiplierPoint[];
  intervention_buckets: InterventionBucket[];
  sharpe_bars: SharpeBar[];
  dd_histogram: HistogramBin[];
  pnl_histogram: HistogramBin[];
  strategy_pnl_series: StrategyPnlSeries[];
  strategy_mix: StrategyMixEntry[];
  sh_event_breakdown: ShEventBreakdownEntry[];
  strategy_allocation_history: StrategyAllocationPoint[];
  reference_price: ReferencePriceSeries | null;
  fleet_tickers: string[];
  per_trade_outcomes: PerTradeOutcome[];
  per_bot_sparklines: BotSparkline[];
  macro_conditions: MacroSnapshot | null;
  trailing_precision: TrailingPrecisionPoint[];
}

export interface StrategyPnlPoint {
  date: string;
  cum_pnl_pct: number;
}

export interface StrategyPnlSeries {
  strategy_id: string;
  n_trades: number;
  series: StrategyPnlPoint[];
}

export interface StrategyMixEntry {
  strategy_id: string;
  n_bots: number;
  capital_allocation_pct: number;
}

export interface ShEventBreakdownEntry {
  event_type: string;
  count: number;
}

export interface StrategyAllocationPoint {
  date: string;
  allocations: Record<string, number>;
}

export interface ReferencePricePoint {
  date: string;
  close: number;
  /** Market-wide (macro) composite regime key, e.g. "bear.elevated". */
  regime: string | null;
}

export interface TickerRegimePoint {
  date: string;
  regime: string;
  /** Max-posterior probability at label time (0..1). */
  confidence?: number;
  /**
   * Current-bar posterior distribution over {bull, sideways, bear,
   * transition}. Makes the classifier's certainty visible in the
   * tooltip — e.g., a "bear" label at 58% bull prior / 30% bear
   * posterior tells the user the Markov prior was doing the heavy
   * lifting and the regime may be about to shift.
   */
  posterior?: Record<string, number>;
  /**
   * Predicted posterior for t+1 absent new evidence (= posterior ×
   * Markov transition matrix). Exposes where the Markov stickiness
   * is pulling the label without any fresh signal.
   */
  next_posterior?: Record<string, number>;
}

export interface ReferencePriceSeries {
  ticker: string;
  /** "fleet_most_traded" | "fleet_first_bot" | "default_spy" | "picker" */
  source: string;
  points: ReferencePricePoint[];
  /** Ticker-scoped regime series derived from THIS ticker's OHLCV. */
  ticker_regime: TickerRegimePoint[];
  /** Sector name, e.g. "Technology". None when unknown. */
  sector: string | null;
  /** Proxy ETF used to derive the sector regime (XLK / XLE / etc.). */
  sector_proxy_ticker: string | null;
  /** Sector-scoped regime series from the proxy ETF's OHLCV. */
  sector_regime: TickerRegimePoint[];
}

// ── Density-boosting additions for 6-chapter redesign ──

export interface PerTradeOutcome {
  trade_id: string;
  bot_id: string;
  strategy_id: string;
  ticker: string;
  entry_date: string;
  exit_date: string;
  holding_days: number;
  entry_regime: string | null;
  exit_regime: string | null;
  realized_pnl_pct: number;
  shadow_pnl_pct: number | null;
  win: boolean;
}

export interface EquityPercentilePoint {
  date: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MacroSeriesPoint {
  date: string;
  value: number;
}

export interface MacroSnapshot {
  vix: MacroSeriesPoint[];
  hy_spread: MacroSeriesPoint[];
  spy_vs_tlt: MacroSeriesPoint[];
  as_of: string;
}

export interface BotSparklinePoint {
  date: string;
  cum_pnl_pct: number;
}

export interface BotSparkline {
  bot_id: string;
  ticker: string;
  strategy_id: string;
  points: BotSparklinePoint[];
  delta_30d_pct: number;
}

export interface TrailingPrecisionPoint {
  date: string;
  precision_pct: number | null;
  n_interventions: number;
}

export interface JourneyQuery {
  window_days?: number;
  precision_window_days?: number;
  regime_scope?: 'current' | 'all';
}

export function useReferencePrice(
  ticker: string | null,
  windowDays: number = 365,
  enabled: boolean = true,
) {
  return useQuery<ReferencePriceSeries>({
    queryKey: ['dashboard', 'referencePrice', ticker, windowDays],
    enabled: Boolean(ticker) && enabled,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/dashboard/reference-price?ticker=${encodeURIComponent(
          ticker ?? '',
        )}&window_days=${windowDays}`,
      );
      if (!res.ok) throw new Error(`Failed to load reference price (${res.status})`);
      return parseApiJson<ReferencePriceSeries>(res);
    },
    staleTime: 60_000,
  });
}

export function useFleetJourney(params: JourneyQuery = {}) {
  const {
    window_days = 365,
    precision_window_days = 5,
    regime_scope = 'current',
  } = params;

  return useQuery<JourneyResponse>({
    queryKey: [
      'dashboard',
      'journey',
      window_days,
      precision_window_days,
      regime_scope,
    ],
    queryFn: async () => {
      const query = new URLSearchParams({
        window_days: String(window_days),
        precision_window_days: String(precision_window_days),
        regime_scope,
      });
      const res = await apiFetch(`/api/dashboard/journey?${query.toString()}`);
      if (!res.ok) throw new Error(`Failed to load Fleet Journey (${res.status})`);
      return parseApiJson<JourneyResponse>(res);
    },
    refetchInterval: 60_000,
  });
}
