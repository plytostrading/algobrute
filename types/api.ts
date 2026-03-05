/**
 * API Types — manually maintained.
 *
 * Once the backend is running, regenerate with:
 *   npx openapi-typescript http://localhost:4001/openapi.json -o types/api.ts
 *
 * Derived from:
 *   src/algobrute/api/schemas.py
 *   src/algobrute/contracts/bot.py
 *   src/algobrute/contracts/fleet_analytics.py
 *   src/algobrute/contracts/annotation.py
 *   src/algobrute/contracts/enums.py
 */

// ---------------------------------------------------------------------------
// Enum string types
// ---------------------------------------------------------------------------

export type WeatherLabel =
  | 'clear_skies'
  | 'partly_cloudy'
  | 'overcast'
  | 'stormy'
  | 'severe';

export type RegimeConviction = 'high' | 'moderate' | 'low';

/** Regime IntEnum: 0=LOW_VOL, 1=NORMAL, 2=ELEVATED_VOL, 3=CRISIS */
export type Regime = 0 | 1 | 2 | 3;

export type BotState =
  | 'active'
  | 'paused_regime'
  | 'paused_monitoring'
  | 'paused_user'
  | 'circuit_breaker'
  | 'ramping'
  | 'stopped';

export type RecommendationType =
  | 'kill'
  | 'pause'
  | 'reduce'
  | 'increase'
  | 'add'
  | 'rebalance';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type SkillLabel =
  | 'strong_skill'
  | 'probable_skill'
  | 'inconclusive'
  | 'probable_luck'
  | 'likely_unskilled'
  | 'insufficient_data';

export type AlphaDecayStatus =
  | 'stable'
  | 'declining_from_peak'
  | 'decaying'
  | 'insufficient_data';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type UserExpertise = 'beginner' | 'intermediate' | 'advanced';

// ---------------------------------------------------------------------------
// Fleet
// ---------------------------------------------------------------------------

/** GET /api/fleet/weather */
export interface FleetWeatherReport {
  user_id: string;
  analysis_run_id: string;
  weather_label: WeatherLabel;
  weather_score: number;
  timestamp: string;
  current_regime: Regime;
  regime_conviction: RegimeConviction;
  top_transition_target: Regime;
  top_transition_probability: number;
  n_bots: number;
  n_active_bots: number;
  n_bots_with_alerts: number;
  fleet_capital: number;
  cash_pct: number;
  /** Equity Not Invested in Bots (i.e. idle cash in dollar terms) */
  enib: number;
  diversification_cliff_magnitude: number;
  fleet_var_95_dollar: number;
  fleet_cvar_95_dollar: number;
  net_market_beta: number;
  n_recommendations: number;
  top_recommendation_type: RecommendationType | null;
  top_recommendation_summary: string | null;
}

/** GET /api/fleet/narrative */
export interface FleetNarrative {
  headline: string;
  briefing: string;
  urgency: string;
  next_step: string;
  weather_score: number;
  source_metrics: Record<string, number>;
}

/** GET /api/fleet/recommendations — item shape */
export interface Recommendation {
  recommendation_type: RecommendationType;
  priority: RecommendationPriority;
  bot_id: string | null;
  bot_name: string | null;
  reason: string;
  evidence: Record<string, number | string>;
  suggested_action: string;
  estimated_impact: string;
  confidence: string;
}

/** GET /api/fleet/correlation/{regime} — individual high-corr pair */
export interface CorrelatedPair {
  bot_a: string;
  bot_b: string;
  correlation: number;
}

/** GET /api/fleet/correlation/{regime} */
export interface CorrelationAnalysis {
  regime: Regime;
  matrix_values: number[];
  n_bots: number;
  bot_names: string[];
  n_days_used: number;
  source: string;
  max_pairwise_correlation: number;
  highly_correlated_pairs: CorrelatedPair[];
}

/** GET /api/fleet/var */
export interface FleetVaR {
  var_95_pct: number;
  var_99_pct: number;
  cvar_95_pct: number;
  var_95_dollar: number;
  var_99_dollar: number;
  cvar_95_dollar: number;
  horizon_days: number;
  regime: Regime;
  max_simulated_loss_pct: number;
  n_simulations: number;
  /** Map of bot_id → VaR contribution fraction */
  bot_var_contributions: Record<string, number>;
}

/** GET /api/fleet/risk — individual bot contribution */
export interface BotRiskContribution {
  bot_id: string;
  strategy_name: string;
  allocation_pct: number;
  standalone_volatility: number;
  marginal_contribution: number;
  component_risk: number;
  risk_contribution_pct: number;
  risk_efficiency: number;
  diversification_benefit: number;
}

/** GET /api/fleet/risk */
export interface FleetRiskAttribution {
  fleet_volatility_annualized: number;
  regime: Regime;
  bot_contributions: BotRiskContribution[];
  concentration_alert: boolean;
  most_risk_efficient: string;
  least_risk_efficient: string;
}

// ---------------------------------------------------------------------------
// Bots
// ---------------------------------------------------------------------------

/** GET /api/bots and GET /api/bots/{bot_id} */
export interface BotSnapshot {
  bot_id: string;
  timestamp: string;
  state: BotState;
  current_capital: number;
  unrealized_pnl: number;
  n_open_trades: number;
  n_closed_trades: number;
  sharpe_realized: number;
  drift_detected: boolean;
  rediscovery_recommended: boolean;
  /** Enriched by backend — empty string for legacy bots pre-enrichment */
  strategy_id: string;
  /** Enriched by backend — empty string for legacy bots pre-enrichment */
  ticker: string;
}

/** GET /api/fleet/state */
export interface FleetState {
  user_id: string;
  timestamp: string;
  total_capital: number;
  cash_pct: number;
  /** Deployed capital = total_capital * (1 - cash_pct) */
  n_bots: number;
  bot_snapshots: BotSnapshot[];
}

/** POST /api/bots response and PATCH /api/bots/{bot_id} response */
export interface BotConfig {
  bot_id: string;
  strategy_id: string;
  ticker: string;
  capital_allocation_pct: number;
  initial_capital: number;
  state: BotState;
  created_at: string;
  passport_id: string | null;
  passport_version: number | null;
  direction: 'long' | 'short';
}

/** GET /api/bots/{bot_id}/skill */
export interface SkillAssessment {
  bot_id: string;
  strategy_name: string;
  n_trades: number;
  realized_sharpe: number;
  psr: number;
  sharpe_ci_lower: number;
  sharpe_ci_upper: number;
  skill_label: SkillLabel;
  win_rate: number;
  win_rate_significant: boolean;
  payoff_ratio: number;
  alpha_decay_status: AlphaDecayStatus;
  trades_needed_for_95: number | null;
}

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

/** GET /api/monitoring/regime */
export interface MonitoringRegimeStatus {
  /** "pending" | "initializing" | "ready" | "failed" */
  status: string;
  /** Regime.name if status === "ready", else null */
  regime: string | null;
  /** RegimeConviction.value if status === "ready", else null */
  conviction: string | null;
  error: string | null;
}

/** GET /api/monitoring/bots/{bot_id}/report */
export interface MonitoringBotReport {
  bot_id: string;
  timestamp: string;
  sprt_win_rate_decision: string;
  sprt_win_rate_n_obs: number;
  sprt_win_rate_llr: number;
  sprt_payoff_decision: string;
  sprt_payoff_n_obs: number;
  sprt_payoff_llr: number;
  cusum_status: string;
  cusum_sum: number;
  win_rate_posterior_mean: number;
  win_rate_posterior_ci_lower: number;
  win_rate_posterior_ci_upper: number;
  pnl_posterior_mean: number;
  pnl_posterior_ci_lower: number;
  pnl_posterior_ci_upper: number;
  alerts: string[];
  passport_id: string | null;
  passport_version: number | null;
}

/** GET /api/monitoring/harness/{bot_id} */
export interface HarnessStatus {
  bot_id: string;
  is_monitored: boolean;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/** GET /api/user/profile */
export interface UserProfile {
  user_id: string;
  email: string;
  expertise_level: UserExpertise;
  subscription_tier: SubscriptionTier;
  is_active: boolean;
  created_at: string;
  // Risk profile fields — nullable until the user configures them
  capital_base: number | null;
  max_drawdown_tolerance_pct: number | null;
  daily_loss_limit: number | null;
  risk_comfort_level: string | null;
  target_annual_return_pct: number | null;
}

/** GET /api/user/alpaca/status */
export interface AlpacaConnectionStatus {
  connected: boolean;
  account_id: string | null;
  is_paper: boolean;
  status_message: string;
}

// ---------------------------------------------------------------------------
// Fleet analytics — benchmark
// ---------------------------------------------------------------------------

/** GET /api/fleet/benchmark/{benchmark} */
export interface BenchmarkComparison {
  benchmark: string;
  fleet_return_pct: number;
  benchmark_return_pct: number;
  alpha: number;
  beta: number;
  information_ratio: number;
}

// ---------------------------------------------------------------------------
// LLM annotation
// ---------------------------------------------------------------------------

/** Response from POST /api/fleet/question */
export interface AnnotationOutput {
  headline: string;
  explanation: string;
  action: string;
  severity: string;
  /** Values may be strings or nested objects depending on LLM output. */
  additional_sections: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

/** GET /api/strategies */
export interface StrategyInfo {
  strategy_id: string;
  name: string;
  description: string;
  is_active: boolean;
}

/** GET /api/strategies/{strategy_id} */
export interface StrategyDetail {
  strategy_id: string;
  name: string;
  description: string;
  parameters: Record<string, number | string | boolean>;
  regime_qualifications: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Trading
// ---------------------------------------------------------------------------

export type OrderSide = 'long' | 'short';

/** Returned by GET /api/backtest/{id}/trades and GET /api/bots/{id}/trades */
export interface TradeRecord {
  trade_id: string;
  bot_id: string;
  strategy_id: string;
  ticker: string;
  side: OrderSide;
  entry_date: string;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_regime: Regime;
  exit_regime: Regime | null;
  realized_pnl: number | null;
  realized_pnl_pct: number | null;
  mfe_pct: number | null;
  mae_pct: number | null;
  holding_bars: number | null;
  exit_reason: string | null;
  backtest_path_id: number | null;
  signal_strength: number | null;
}

// ---------------------------------------------------------------------------
// Backtest (job lifecycle)
// ---------------------------------------------------------------------------

/** POST /api/backtest/run request body */
export interface BacktestRequest {
  strategy_id: string;
  ticker: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
}

/** POST /api/backtest/run response */
export interface BacktestJobId {
  job_id: string;
}

/** GET /api/backtest/{id} — in-progress status */
export interface JobStatus {
  job_id: string;
  status: string; // "pending" | "running" | "complete" | "failed" | "cancelled"
  progress_pct: number | null;
  /** Pipeline phase identifier — one of the PHASE_* constants from backtest_phases.py */
  progress_phase: string | null;
  error_message: string | null;
}

/** GET /api/backtest/{id} — completed result (minimal) */
export interface BacktestResult {
  job_id: string;
  strategy_id: string;
  sharpe_ratio: number | null;
  total_return_pct: number | null;
  max_drawdown_pct: number | null;
  n_trades: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Backtest Export Report
// ---------------------------------------------------------------------------

export interface BacktestExportSummary {
  sharpe_ratio: number | null;
  total_return_pct: number | null;
  max_drawdown_pct: number | null;
  n_trades: number;
  win_rate: number | null;
  payoff_ratio: number | null;
  avg_return_pct: number | null;
  return_std_pct: number | null;
  profit_factor: number | null;
  pbo_probability: number | null;
  path_consistency: number | null;
  mc_overall_p_value: number | null;
  reliability_score: number | null;
  reliability_passed: boolean | null;
  deployment_approved: boolean | null;
  // Enriched ratio metrics — null for legacy jobs pre-dating report_json
  /** Sortino ratio (semi-deviation denominator, trade-freq annualised) */
  sortino_ratio: number | null;
  /** Calmar ratio = CAGR / |worst-path max drawdown| */
  calmar_ratio: number | null;
  /** Omega ratio = gross gains / gross losses vs threshold=0 */
  omega_ratio: number | null;
  /** CAGR annualised over OOS fraction (K/N) of the window */
  cagr_pct: number | null;
  /** Expectancy = win_rate×avg_win + (1−win_rate)×avg_loss in % */
  expectancy_pct: number | null;
  /** Historical VaR-95 = 5th-percentile trade return in % */
  var_95_pct: number | null;
  /** CVaR-95 = mean of returns ≤ VaR-95 in % */
  cvar_95_pct: number | null;
}

export interface BacktestExportCPCV {
  n_splits: number;
  n_test_groups: number;
  n_paths: number;
  sufficient_paths: number;
  total_paths: number;
  purge_days: number;
  embargo_days: number;
  regime_label_source: string;
  mean_sharpe: number;
  std_sharpe: number;
  min_sharpe: number;
  pbo_probability: number;
  path_consistency: number;
  path_sharpes: number[];
  sharpe_pct_5: number | null;
  sharpe_pct_25: number | null;
  sharpe_pct_50: number | null;
  sharpe_pct_75: number | null;
  sharpe_pct_95: number | null;
  positive_paths_pct: number | null;
  trades_per_path: number[];
}

export interface BacktestExportMCVariant {
  variant_code: string;
  variant_name: string;
  p_value: number;
  real_sharpe: number;
  null_sharpe_mean: number;
  null_sharpe_std: number;
  z_score: number | null;
  significant_at_95pct: boolean;
  metadata: Record<string, number | string>;
}

export interface BacktestExportMonteCarlo {
  n_simulations: number;
  overall_p_value: number;
  significant_at_95pct: boolean;
  variants: Record<string, BacktestExportMCVariant>;
}

export interface BacktestExportBootstrap {
  observed_sharpe: number;
  bootstrap_mean: number;
  bootstrap_std: number;
  ci_lower: number;
  ci_upper: number;
  ci_width: number;
  confidence_level: number;
  n_replicates: number;
  optimal_block_length: number;
  ci_excludes_zero: boolean;
}

export interface BacktestExportReturnsDistribution {
  min_pct: number;
  max_pct: number;
  mean_pct: number;
  std_pct: number;
  pct_5: number;
  pct_10: number;
  pct_25: number;
  pct_50: number;
  pct_75: number;
  pct_90: number;
  pct_95: number;
  skewness: number;
  kurtosis: number;
  positive_return_pct: number;
}

export interface BacktestExportTradeAnalytics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_return_pct: number;
  return_std_pct: number;
  payoff_ratio: number;
  profit_factor: number;
  avg_holding_bars: number | null;
  avg_mfe_pct: number | null;
  avg_mae_pct: number | null;
  max_consecutive_losses: number | null;
  returns_distribution: BacktestExportReturnsDistribution | null;
  by_regime: Record<string, Record<string, number | boolean>>;
  by_side: Record<string, Record<string, number>>;
  by_cpcv_path: Array<Record<string, number>>;
}

export interface BacktestExportPassport {
  passport_id: string;
  passport_version: number;
  strategy_id: string;
  strategy_class: string;
  ticker: string;
  created_at: string;
  data_start_date: string;
  data_end_date: string;
  regime_model_version: string;
  n_regime_states: number;
  regime_names: Record<number, string>;
  regime_conviction_mean: number;
  psr: number;
  dsr: number;
  mcs_included: boolean;
  bootstrap_sharpe_ci_lower: number;
  bootstrap_sharpe_ci_upper: number;
  reliability_overall: number;
  reliability_passed: boolean;
  reliability_layer_scores: Record<string, number>;
  reliability_hard_failures: string[];
  deployment_approved: boolean;
  deployment_notes: string;
  sensitivity_overall_robustness: number;
  fragile_parameters: string[];
  robust_parameters: string[];
  content_hash: string;
}

export interface BacktestExportLLMContext {
  key_strengths: string[];
  key_concerns: string[];
  deployment_recommendation: string;
  interpretation_notes: Record<string, string>;
}

/**
 * Risk rules for a single regime — from BacktestExportRegimeRiskRules (backend).
 * Contains per-regime performance stats and Kelly/stop/size parameters.
 */
export interface BacktestExportRegimeRiskRules {
  regime: string;
  qualified: boolean;
  qualification_reason: string;
  n_trades_in_regime: number;
  win_rate_in_regime: number;
  avg_return_in_regime: number;
  return_std_in_regime: number;
  max_drawdown_in_regime: number;
  kelly_fraction: number;
  kelly_full: number;
  kelly_ci_lower: number;
  kelly_ci_upper: number;
  max_position_pct: number;
  initial_stop_pct: number;
  initial_stop_confidence: number;
  trailing_stop_retracement_pct: number;
  breakeven_trigger_pct: number;
  time_stop_bars: number;
  time_stop_confidence: number;
  circuit_breaker_dd_pct: number;
  circuit_breaker_loss_streak: number;
  transition_stop_tightening_pct: number;
  transition_size_reduction_pct: number;
  transition_blackout_bars: number;
  signal_filter_threshold: number | null;
  signal_strength_correlation: number | null;
  prior_win_rate_alpha: number;
  prior_win_rate_beta: number;
  prior_payoff_mu: number;
  prior_payoff_kappa: number;
  prior_payoff_alpha: number;
  prior_payoff_beta_param: number;
}

/** GET /api/backtest/{id}/insight/{section_key} */
export interface BacktestSectionInsight {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'caution' | 'warning';
  cached: boolean;
}

/** GET /api/backtest/{id}/export */
export interface BacktestExportReport {
  metadata: {
    report_version: string;
    generated_at: string;
    job_id: string;
    strategy_id: string;
    ticker: string;
    start_date: string;
    end_date: string;
    initial_capital: number;
    status: string;
    created_at: string;
    completed_at: string | null;
  };
  executive_summary: BacktestExportSummary;
  cpcv_analysis: BacktestExportCPCV | null;
  monte_carlo_analysis: BacktestExportMonteCarlo | null;
  bootstrap_analysis: BacktestExportBootstrap | null;
  /** Keyed by regime name (e.g. "LOW_VOL", "NORMAL", "ELEVATED_VOL", "CRISIS") */
  risk_rules_by_regime: Record<string, BacktestExportRegimeRiskRules>;
  trade_analytics: BacktestExportTradeAnalytics | null;
  passport: BacktestExportPassport | null;
  llm_context: BacktestExportLLMContext | null;
}

// ---------------------------------------------------------------------------
// Regime labels — walk-forward inference series
// ---------------------------------------------------------------------------

/** Slim regime signal shape returned by GET /api/backtest/{id}/regime-labels. */
export interface RegimeSignalSlim {
  /** 0=LOW_VOL, 1=NORMAL, 2=ELEVATED_VOL, 3=CRISIS */
  ensemble_label: Regime;
  /** Aggregate conviction scalar [0, 1] */
  conviction_score: number;
  /**
   * Per-regime probability from ensemble (sums to ~1.0).
   * JSON keys are stringified integers: "0", "1", "2", "3".
   */
  regime_probabilities: Record<string, number>;
}

/** GET /api/backtest/{id}/regime-labels — one walk-forward inference snapshot. */
export interface WFLabelPoint {
  /** ISO date string "YYYY-MM-DD" */
  label_date: string;
  signal: RegimeSignalSlim;
}

// ---------------------------------------------------------------------------
// Bot creation
// ---------------------------------------------------------------------------

/** POST /api/bots request body */
export interface BotCreateRequest {
  strategy_id: string;
  ticker: string;
  capital_allocation_pct: number;
  initial_capital: number;
}

// ---------------------------------------------------------------------------
// Backtest
// ---------------------------------------------------------------------------

/** GET /api/backtest — list item shape */
export interface BacktestJobSummary {
  job_id: string;
  status: string;
  strategy_id: string;
  ticker: string;
  start_date: string;
  end_date: string;
  passport_id: string | null;
  sharpe_ratio: number | null;
  total_return_pct: number | null;
  /** Current pipeline phase while the job is running; null when pending or complete. */
  progress_phase: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Backtest chart data — CPCV equity fan with regime annotations
// ---------------------------------------------------------------------------

/** One point on a CPCV per-path or mean equity curve. */
export interface EquityCurvePoint {
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  /** Cumulative equity multiplier from 1.0 (1.0 = 100%) */
  equity: number;
}

/** Equity curve for a single CPCV path (sparse — one point per closed trade exit date). */
export interface CPCVPathSeries {
  /** Corresponds to TradeRecord.backtest_path_id */
  path_id: number;
  /** Points sorted by date ascending */
  points: EquityCurvePoint[];
}

/** A contiguous block of the same regime label for chart background shading. */
export interface RegimeBand {
  /** ISO date string "YYYY-MM-DD" */
  start_date: string;
  /** ISO date string "YYYY-MM-DD" */
  end_date: string;
  /** Regime IntEnum value: 0=LOW_VOL, 1=NORMAL, 2=ELEVATED_VOL, 3=CRISIS */
  regime: Regime;
}

/** GET /api/backtest/{id}/chart-data */
export interface CPCVChartData {
  /** Per-path equity curves */
  paths: CPCVPathSeries[];
  /** Date-aligned mean across all paths (forward-filled per-path equity, then averaged) */
  mean_curve: EquityCurvePoint[];
  /** Contiguous regime blocks for background shading */
  regime_bands: RegimeBand[];
  n_paths: number;
  mean_sharpe: number;
  pbo_probability: number;
  path_consistency: number;
}

/** POST /api/backtest/promote-to-passport */
export interface PassportPromotionResponse {
  job_id: string;
  strategy_id: string;
  ticker: string;
  passport_id: string;
  passport_version: number;
  deployment_approved: boolean;
  deployment_notes: string;
  reliability_overall: number;
  reliability_passed: boolean;
  /** ISO format datetime */
  created_at: string;
  /** Full StrategyPassport serialized to JSON */
  passport_json: string;
}
