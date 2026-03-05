'use client';

import { X, Sun, Cloud, CloudRain, Zap } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getWeatherColors } from '@/lib/colors';
import { getWeatherDisplayLabel } from '@/lib/regimeLabel';
import { formatCurrency } from '@/utils/formatters';
import type { FleetWeatherReport } from '@/types/api';

// ---------------------------------------------------------------------------
// Weather icon map
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

interface WeatherDetailDrawerProps {
  weather: FleetWeatherReport;
  open: boolean;
  onClose: () => void;
}

/**
 * Right-side drawer with a full breakdown of the current fleet weather report.
 *
 * Sections: Fleet Capital, Risk Metrics, Fleet Activity, Recommendations.
 * Data is entirely from the already-fetched FleetWeatherReport — no additional
 * network request.
 */
export default function WeatherDetailDrawer({
  weather,
  open,
  onClose,
}: WeatherDetailDrawerProps) {
  const WeatherIcon = WEATHER_ICONS[weather.weather_label as keyof typeof WEATHER_ICONS] ?? Cloud;
  const colors = getWeatherColors(weather.weather_label);
  const displayLabel = getWeatherDisplayLabel(weather.weather_label);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] sm:max-w-[480px] p-0 gap-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}
            >
              <WeatherIcon className={`h-4 w-4 ${colors.text}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{displayLabel}</h2>
              <p className="text-xs text-muted-foreground">
                Score: {weather.weather_score.toFixed(1)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-6">
            {/* ── Fleet Capital ── */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Fleet Capital
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Total Capital
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1">
                    {formatCurrency(weather.fleet_capital)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Deployed
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1">
                    {formatCurrency(weather.fleet_capital * (1 - weather.cash_pct))}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Cash Held
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1">
                    {formatCurrency(weather.fleet_capital * weather.cash_pct)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    ENIB (Idle Cash)
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1">
                    {formatCurrency(weather.enib)}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Risk Metrics ── */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Risk Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    VaR 95% (daily)
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1 text-destructive">
                    {formatCurrency(weather.fleet_var_95_dollar)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    CVaR 95% (daily)
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1 text-destructive">
                    {formatCurrency(weather.fleet_cvar_95_dollar)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Net Market Beta
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1">
                    {weather.net_market_beta.toFixed(2)}&beta;
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Diversification Cliff
                  </p>
                  <p
                    className={`font-mono-data text-sm font-semibold mt-1 ${
                      weather.diversification_cliff_magnitude > 0.3
                        ? 'text-amber-600 dark:text-amber-400'
                        : ''
                    }`}
                  >
                    {(weather.diversification_cliff_magnitude * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </section>

            {/* ── Fleet Activity ── */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Fleet Activity
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Active Bots
                  </p>
                  <p className="font-mono-data text-sm font-semibold mt-1">
                    {weather.n_active_bots} / {weather.n_bots}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Bots with Alerts
                  </p>
                  <p
                    className={`font-mono-data text-sm font-semibold mt-1 ${
                      weather.n_bots_with_alerts > 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {weather.n_bots_with_alerts}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Recommendations summary ── */}
            {weather.n_recommendations > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Recommendations
                </h3>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {weather.n_recommendations} active recommendation
                    {weather.n_recommendations !== 1 ? 's' : ''}
                    {weather.top_recommendation_summary
                      ? `: ${weather.top_recommendation_summary}`
                      : ''}
                  </p>
                </div>
              </section>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-muted-foreground">
              Last updated: {new Date(weather.timestamp).toLocaleString()}
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
