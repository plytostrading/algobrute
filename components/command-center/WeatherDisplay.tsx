'use client';

import { useState } from 'react';
import { Sun, Cloud, CloudRain, Zap } from 'lucide-react';
import { getWeatherColors } from '@/lib/colors';
import { getWeatherDisplayLabel } from '@/lib/regimeLabel';
import RegimeBadge from '@/components/shared/RegimeBadge';
import WeatherDetailDrawer from '@/components/shared/WeatherDetailDrawer';
import RegimeDetailDrawer from '@/components/shared/RegimeDetailDrawer';
import type { FleetWeatherReport } from '@/types/api';

// ---------------------------------------------------------------------------
// Weather icon mapping — WeatherLabel → lucide icon
// ---------------------------------------------------------------------------

// Must be static for TypeScript's component type inference.
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

interface WeatherDisplayProps {
  weather: FleetWeatherReport;
}

/**
 * Compact market-weather + regime context block for the HeroZone right column.
 *
 * Layout:
 * - Desktop (lg): weather icon+label stacked above RegimeBadge (flex-col)
 * - Mobile: weather icon+label side-by-side with RegimeBadge (flex-row)
 *
 * Clicking the weather area opens WeatherDetailDrawer.
 * Clicking RegimeBadge opens RegimeDetailDrawer.
 */
export default function WeatherDisplay({ weather }: WeatherDisplayProps) {
  const [weatherDrawerOpen, setWeatherDrawerOpen] = useState(false);
  const [regimeDrawerOpen, setRegimeDrawerOpen] = useState(false);

  const WeatherIcon =
    WEATHER_ICONS[weather.weather_label as keyof typeof WEATHER_ICONS] ?? Cloud;
  const colors = getWeatherColors(weather.weather_label);
  const displayLabel = getWeatherDisplayLabel(weather.weather_label);

  return (
    <>
      <div className="flex flex-row items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
        {/* Weather icon + label row — click opens weather drawer */}
        <button
          type="button"
          className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-80 transition-opacity"
          onClick={() => setWeatherDrawerOpen(true)}
          aria-label="View weather detail"
        >
          {/* Icon */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}
          >
            <WeatherIcon className={`h-5 w-5 ${colors.text}`} />
          </div>
          {/* Label + score */}
          <div>
            <p className="text-sm font-semibold leading-none">{displayLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Score: {weather.weather_score}
            </p>
          </div>
        </button>

        {/* Regime badge — click opens regime drawer */}
        <RegimeBadge
          regime={weather.current_regime}
          conviction={weather.regime_conviction}
          transitionProbability={weather.top_transition_probability}
          onClick={() => setRegimeDrawerOpen(true)}
        />
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
