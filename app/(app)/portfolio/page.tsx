'use client';

import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PortfolioHero from '@/components/portfolio/PortfolioHero';
import PortfolioChart from '@/components/command-center/PortfolioChart';
import TopRecommendationPreview from '@/components/command-center/TopRecommendationPreview';
import CorrelationMatrix from '@/components/portfolio/CorrelationMatrix';
import PortfolioContributionPanel from '@/components/portfolio/PortfolioContributionPanel';
import { useFleetWeather, useFleetWeatherHistory } from '@/hooks/useFleetWeather';
import { useFleetState } from '@/hooks/useFleetState';
import { useFleetRecommendations } from '@/hooks/useFleetRecommendations';
import type { RegimeType } from '@/types';

export default function PortfolioPage() {
  const { data: weather, isLoading: weatherLoading } = useFleetWeather();
  const { data: history } = useFleetWeatherHistory();
  const { data: fleetState, isLoading: stateLoading } = useFleetState();
  const { data: recommendations } = useFleetRecommendations();

  const equityCurve = useMemo(() => {
    if (!history || history.length === 0) return [];
    const regimeMap = ['LOW_VOL', 'NORMAL', 'HIGH_VOL', 'CRISIS'] as const;
    return history.map((w) => ({
      time: new Date(w.timestamp),
      value: w.fleet_capital,
      regime: (regimeMap[w.current_regime] ?? 'NORMAL') as RegimeType,
    }));
  }, [history]);

  const isLoading = weatherLoading || stateLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!weather || !fleetState) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-muted-foreground">
          Unable to load portfolio data. Is the backend running?
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Fleet identity + headline metrics */}
      <PortfolioHero weather={weather} fleetState={fleetState} />

      {/* Equity timeline with regime bands */}
      {equityCurve.length > 0 && <PortfolioChart equityCurve={equityCurve} />}

      {/* Top recommendation — surfaced prominently */}
      <TopRecommendationPreview
        recommendation={recommendations?.[0] ?? null}
        totalCount={recommendations?.length ?? 0}
      />

      {/* F3 — Deployed strategies: holdings, risk attribution, regime breakdown, and Strategy DNA */}
      <PortfolioContributionPanel />

      {/* F1 — Regime-conditioned pairwise correlation heatmap */}
      <CorrelationMatrix initialRegime={weather.current_regime} />
    </div>
  );
}
