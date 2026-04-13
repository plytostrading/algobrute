/**
 * Color constants and utility maps.
 *
 * Centralises all color decisions so components don't hardcode hex values
 * or Tailwind class names in isolation.
 */

// ---------------------------------------------------------------------------
// Regime colors (backend uses integer keys 0-3)
// ---------------------------------------------------------------------------

/** Chart background fill colors by Regime integer */
export const REGIME_CHART_FILLS: Record<number, string> = {
  0: '#dbeafe', // LOW_VOL      — blue-100
  1: '#dcfce7', // NORMAL       — green-100
  2: '#fef3c7', // ELEVATED_VOL — amber-100
  3: '#fee2e2', // CRISIS       — red-100
};

/** Line / badge hex colors by Regime integer */
export const REGIME_HEX: Record<number, string> = {
  0: '#3B82F6', // LOW_VOL      — blue-500
  1: '#22C55E', // NORMAL       — green-500
  2: '#F59E0B', // ELEVATED_VOL — amber-500
  3: '#EF4444', // CRISIS       — red-500
};

/** Legacy mapping from RegimeType string (used in mock/chart components) */
export const REGIME_STRING_HEX: Record<string, string> = {
  LOW_VOL:      '#3B82F6',
  NORMAL:       '#22C55E',
  HIGH_VOL:     '#F59E0B',
  ELEVATED_VOL: '#F59E0B',
  CRISIS:       '#EF4444',
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
