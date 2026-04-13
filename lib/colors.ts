/**
 * Color constants and utility maps.
 *
 * Centralises all color decisions so components don't hardcode hex values
 * or Tailwind class names in isolation.
 *
 * Accent hex values are aligned with the AlgoBrute Design System (DESIGN_SYSTEM.md
 * in algobrute-website). Always use the dark-mode hex values here because these
 * are used in SVG / canvas / Recharts contexts that cannot use CSS variables.
 */

// ---------------------------------------------------------------------------
// Regime colors (backend uses integer keys 0-3)
// ---------------------------------------------------------------------------

/**
 * Chart background fill colors by Regime integer.
 * Uses design-system alpha convention: hex + '1a' (10%) tint.
 */
export const REGIME_CHART_FILLS: Record<number, string> = {
  0: '#3b82f614', // LOW_VOL      — BLUE  + chartArea alpha
  1: '#10b98114', // NORMAL       — GREEN + chartArea alpha
  2: '#f59e0b14', // ELEVATED_VOL — AMBER + chartArea alpha
  3: '#ef444414', // CRISIS       — RED   + chartArea alpha
};

/**
 * Line / badge hex colors by Regime integer.
 * Exact design-system dark-mode accent values.
 */
export const REGIME_HEX: Record<number, string> = {
  0: '#3b82f6', // LOW_VOL      — DS: BLUE
  1: '#10b981', // NORMAL       — DS: GREEN  (was #22C55E, now emerald-aligned)
  2: '#f59e0b', // ELEVATED_VOL — DS: AMBER
  3: '#ef4444', // CRISIS       — DS: RED
};

/** Legacy mapping from RegimeType string (used in mock/chart components) */
export const REGIME_STRING_HEX: Record<string, string> = {
  LOW_VOL:      '#3b82f6', // DS: BLUE
  NORMAL:       '#10b981', // DS: GREEN
  HIGH_VOL:     '#f59e0b', // DS: AMBER
  ELEVATED_VOL: '#f59e0b', // DS: AMBER
  CRISIS:       '#ef4444', // DS: RED
};

// ---------------------------------------------------------------------------
// Weather label → Tailwind classes
// ---------------------------------------------------------------------------

export interface ColorPair {
  text: string;
  bg: string;
}

export const WEATHER_COLORS: Record<string, ColorPair> = {
  clear_skies:   { text: 'text-success',     bg: 'bg-success/10'     },
  partly_cloudy: { text: 'text-info',        bg: 'bg-info/10'        },
  overcast:      { text: 'text-warning',     bg: 'bg-warning/10'     },
  stormy:        { text: 'text-destructive', bg: 'bg-destructive/10' },
  severe:        { text: 'text-destructive', bg: 'bg-destructive/10' },
};

export function getWeatherColors(label: string): ColorPair {
  return WEATHER_COLORS[label] ?? { text: 'text-muted-foreground', bg: 'bg-muted' };
}

// ---------------------------------------------------------------------------
// WeatherLabel → FleetHealthStatus (for legacy components)
// ---------------------------------------------------------------------------

export type FleetHealthStatus = 'HEALTHY' | 'CAUTION' | 'AT_RISK';

export function weatherToFleetStatus(label: string): FleetHealthStatus {
  if (label === 'clear_skies' || label === 'partly_cloudy') return 'HEALTHY';
  if (label === 'overcast') return 'CAUTION';
  return 'AT_RISK';
}

// ---------------------------------------------------------------------------
// BotState → badge variant + dot color
// ---------------------------------------------------------------------------

export interface BotStateColors {
  dotColor: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  label: string;
}

export const BOT_STATE_COLORS: Record<string, BotStateColors> = {
  active:            { dotColor: 'text-success',           badgeVariant: 'default',     label: 'Active'           },
  paused_regime:     { dotColor: 'text-warning',           badgeVariant: 'secondary',   label: 'Paused (Regime)'  },
  paused_monitoring: { dotColor: 'text-warning',           badgeVariant: 'secondary',   label: 'Paused (Monitor)' },
  paused_user:       { dotColor: 'text-warning',           badgeVariant: 'secondary',   label: 'Paused'           },
  circuit_breaker:   { dotColor: 'text-destructive',       badgeVariant: 'destructive', label: 'Circuit Break'    },
  ramping:           { dotColor: 'text-info',              badgeVariant: 'outline',     label: 'Ramping'          },
  stopped:           { dotColor: 'text-muted-foreground',  badgeVariant: 'destructive', label: 'Stopped'          },
};

export function getBotStateColors(state: string): BotStateColors {
  return BOT_STATE_COLORS[state] ?? {
    dotColor: 'text-muted-foreground',
    badgeVariant: 'outline',
    label: state,
  };
}

// ---------------------------------------------------------------------------
// RecommendationType → action color (for cue panels)
// ---------------------------------------------------------------------------

export const RECOMMENDATION_TYPE_COLORS: Record<string, string> = {
  kill:      'text-destructive',
  pause:     'text-warning',
  reduce:    'text-warning',
  increase:  'text-success',
  add:       'text-info',
  rebalance: 'text-info',
};

export function getRecommendationTypeColor(type: string): string {
  return RECOMMENDATION_TYPE_COLORS[type] ?? 'text-muted-foreground';
}

// ---------------------------------------------------------------------------
// WeatherScore → letter grade
// ---------------------------------------------------------------------------

export type RiskGrade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D' | 'F';

export function weatherScoreToGrade(score: number): RiskGrade {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 40) return 'D';
  return 'F';
}
