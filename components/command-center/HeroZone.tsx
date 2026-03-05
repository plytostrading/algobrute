'use client';

import { Card, CardContent } from '@/components/ui/card';
import CapitalSummary from '@/components/command-center/CapitalSummary';
import WeatherDisplay from '@/components/command-center/WeatherDisplay';
import type { FleetWeatherReport } from '@/types/api';

interface HeroZoneProps {
  weather: FleetWeatherReport;
  /** Pre-aggregated unrealized P&L across all live bots. */
  totalUnrealizedPL: number;
}

/**
 * Above-the-fold command center header.
 *
 * Desktop layout (lg and above):
 *   [CapitalSummary ————————— 70%] | [WeatherDisplay + Regime — 30%]
 *
 * Mobile layout:
 *   [CapitalSummary — full width]
 *   [WeatherDisplay — full width, icon+badge side-by-side within]
 *
 * Height target: 120–150px on a 1080p display.
 * The right column carries a left-border separator on desktop.
 */
export default function HeroZone({ weather, totalUnrealizedPL }: HeroZoneProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid items-center gap-6 lg:grid-cols-[7fr_3fr]">
          {/* Left — capital figures */}
          <CapitalSummary weather={weather} totalUnrealizedPL={totalUnrealizedPL} />

          {/* Right — market weather + regime context */}
          <div className="lg:border-l lg:border-border lg:pl-6">
            <WeatherDisplay weather={weather} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
