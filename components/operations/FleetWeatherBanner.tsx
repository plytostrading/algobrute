'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sun, Cloud, CloudRain, Zap, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import RegimeBadge from '@/components/shared/RegimeBadge';
import WeatherDetailDrawer from '@/components/shared/WeatherDetailDrawer';
import RegimeDetailDrawer from '@/components/shared/RegimeDetailDrawer';
import { getWeatherColors } from '@/lib/colors';
import { getWeatherDisplayLabel } from '@/lib/regimeLabel';
import type { FleetWeatherReport } from '@/types/api';

// ---------------------------------------------------------------------------
// Weather icon map — mirrored from WeatherDisplay
// ---------------------------------------------------------------------------

const WEATHER_ICONS = {
  clear_skies: Sun,
  partly_cloudy: Cloud,
  overcast: CloudRain,
  stormy: Zap,
  severe: Zap,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FleetWeatherBannerProps {
  weather: FleetWeatherReport;
}

/**
 * Compact fleet-context banner at the top of the Operations page.
 *
 * Left to right: weather icon → label → score → separator → RegimeBadge →
 * alert count badge → spacer → "→ Command Center" link.
 *
 * Max height: 56px. Clicking weather icon opens WeatherDetailDrawer;
 * clicking RegimeBadge opens RegimeDetailDrawer.
 */
export default function FleetWeatherBanner({ weather }: FleetWeatherBannerProps) {
  const [weatherDrawerOpen, setWeatherDrawerOpen] = useState(false);
  const [regimeDrawerOpen, setRegimeDrawerOpen] = useState(false);

  const WeatherIcon = WEATHER_ICONS[weather.weather_label as keyof typeof WEATHER_ICONS] ?? Cloud;
  const colors = getWeatherColors(weather.weather_label);
  const displayLabel = getWeatherDisplayLabel(weather.weather_label);

  return (
    <>
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 flex-wrap min-h-0 max-h-14">
      {/* Weather icon + label + score — click opens weather drawer */}
      <button
        type="button"
        className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setWeatherDrawerOpen(true)}
        aria-label="View weather detail"
      >
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${colors.bg}`}>
          <WeatherIcon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold">{displayLabel}</span>
          <span className="text-xs text-muted-foreground">{weather.weather_score.toFixed(1)}</span>
        </div>
      </button>

      {/* Separator */}
      <div className="h-4 w-px bg-border shrink-0" />

      {/* Regime badge — click opens regime drawer */}
      <RegimeBadge
        regime={weather.current_regime}
        conviction={weather.regime_conviction}
        transitionProbability={weather.top_transition_probability}
        onClick={() => setRegimeDrawerOpen(true)}
      />

      {/* Alert count — only when bots have alerts */}
      {weather.n_bots_with_alerts > 0 && (
        <Badge variant="destructive" className="gap-1 text-xs shrink-0">
          <Bell className="h-3 w-3" />
          {weather.n_bots_with_alerts} alert{weather.n_bots_with_alerts !== 1 ? 's' : ''}
        </Badge>
      )}

      {/* Spacer */}
      <div className="ml-auto" />

      {/* Navigation link */}
      <Link
        href="/"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        → Command Center
      </Link>
    </div>

    {/* Drawers */}
    <WeatherDetailDrawer
      weather={weather}
      open={weatherDrawerOpen}
      onClose={() => setWeatherDrawerOpen(false)}
    />
    <RegimeDetailDrawer
      weather={weather}
      open={regimeDrawerOpen}
      onClose={() => setRegimeDrawerOpen(false)}
    />
    </>
  );
}
