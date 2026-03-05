/**
 * Regime label utilities.
 *
 * The backend uses a Regime IntEnum:
 *   0 = LOW_VOL, 1 = NORMAL, 2 = ELEVATED_VOL, 3 = CRISIS
 *
 * Weather labels are StrEnum strings matching WeatherLabel in contracts/enums.py.
 */

// ---------------------------------------------------------------------------
// Regime integer → display label
// ---------------------------------------------------------------------------

export const REGIME_LABELS: Record<number, string> = {
  0: 'Low Volatility',
  1: 'Normal',
  2: 'Elevated Volatility',
  3: 'Crisis',
};

export const REGIME_SHORT_LABELS: Record<number, string> = {
  0: 'LOW_VOL',
  1: 'NORMAL',
  2: 'HIGH_VOL',
  3: 'CRISIS',
};

export function getRegimeLabel(regime: number): string {
  return REGIME_LABELS[regime] ?? 'Unknown';
}

export function getRegimeShortLabel(regime: number): string {
  return REGIME_SHORT_LABELS[regime] ?? 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// WeatherLabel → display text
// ---------------------------------------------------------------------------

export const WEATHER_DISPLAY_LABELS: Record<string, string> = {
  clear_skies: 'Clear Skies',
  partly_cloudy: 'Partly Cloudy',
  overcast: 'Overcast',
  stormy: 'Stormy',
  severe: 'Severe',
};

export function getWeatherDisplayLabel(label: string): string {
  return WEATHER_DISPLAY_LABELS[label] ?? label;
}

// ---------------------------------------------------------------------------
// BotState → human-readable label
// ---------------------------------------------------------------------------

export const BOT_STATE_LABELS: Record<string, string> = {
  active: 'Active',
  paused_regime: 'Paused (Regime)',
  paused_monitoring: 'Paused (Monitoring)',
  paused_user: 'Paused',
  circuit_breaker: 'Circuit Breaker',
  ramping: 'Ramping Up',
  stopped: 'Stopped',
};

export function getBotStateLabel(state: string): string {
  return BOT_STATE_LABELS[state] ?? state;
}

// ---------------------------------------------------------------------------
// RecommendationType → action verb
// ---------------------------------------------------------------------------

export const RECOMMENDATION_LABELS: Record<string, string> = {
  kill: 'Retire Bot',
  pause: 'Pause Bot',
  reduce: 'Reduce Size',
  increase: 'Increase Size',
  add: 'Add Strategy',
  rebalance: 'Rebalance Fleet',
};

export function getRecommendationLabel(type: string): string {
  return RECOMMENDATION_LABELS[type] ?? type;
}
