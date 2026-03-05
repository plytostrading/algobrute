'use client';

import { useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
// KPICards.tsx preserved — superseded by HeroZone in Batch 3.
import HeroZone from '@/components/command-center/HeroZone';
import PortfolioChart from '@/components/command-center/PortfolioChart';
import BotAccordion from '@/components/command-center/BotAccordion';
// FleetStatusGrid import removed — superseded by BotAccordion (Batch 4). File preserved.
import FleetNarrativeCard from '@/components/command-center/FleetNarrativeCard';
import TopRecommendationPreview from '@/components/command-center/TopRecommendationPreview';
import AlertStrip from '@/components/command-center/AlertStrip';
import RiskSummary from '@/components/command-center/RiskSummary';
// ActionCuesPanel intentionally removed from this page — preserved as a file for
// potential relocation to the Operations screen in a future batch.
// RegimeBadge is now rendered inside WeatherDisplay (part of HeroZone).
import PortfolioImpact from '@/components/command-center/PortfolioImpact';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetWeather, useFleetWeatherHistory } from '@/hooks/useFleetWeather';
import { useFleetNarrative } from '@/hooks/useFleetNarrative';
import { useFleetRecommendations } from '@/hooks/useFleetRecommendations';
import { useBots } from '@/hooks/useBots';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFleetBenchmark } from '@/hooks/useFleetBenchmark';
import { weatherScoreToGrade } from '@/lib/colors';
import type { FleetWeatherReport, FleetNarrative, Recommendation } from '@/types/api';
import type {
  RiskIntelligenceData,
  RiskWeatherCondition,
  RiskActionType,
} from '@/types';

// ---------------------------------------------------------------------------
// Helpers — map API types to legacy UI types
// ---------------------------------------------------------------------------

function toRiskCondition(label: string): RiskWeatherCondition {
  if (label === 'clear_skies') return 'clear';
  if (label === 'partly_cloudy') return 'fair';
  if (label === 'overcast') return 'cloudy';
  return 'stormy';
}

function toRiskActionType(type: string): RiskActionType {
  if (type === 'add') return 'add';
  if (type === 'kill') return 'remove';
  if (type === 'pause' || type === 'reduce') return 'monitor';
  return 'keep';
}

function buildRiskIntelligence(
  weather: FleetWeatherReport,
  narrative: FleetNarrative | undefined,
  recommendations: Recommendation[],
  drawdownTolerance: number,
): RiskIntelligenceData {
  const drawdownPct =
    weather.fleet_capital > 0
      ? (weather.fleet_var_95_dollar / weather.fleet_capital) * 100
      : 0;
  const riskLevel: 'low' | 'moderate' | 'elevated' | 'high' =
    weather.weather_score >= 70
      ? 'low'
      : weather.weather_score >= 50
        ? 'moderate'
        : weather.weather_score >= 30
          ? 'elevated'
          : 'high';

  return {
    weather: {
      condition: toRiskCondition(weather.weather_label),
      overallGrade: weatherScoreToGrade(weather.weather_score),
      riskLevel,
      narrative:
        narrative?.briefing ??
        weather.top_recommendation_summary ??
        'Fleet data is being processed.',
      drawdownCurrent: drawdownPct,
      drawdownLimit: drawdownTolerance,
    },
    budget: {
      items: [
        {
          label: 'VaR 95%',
          current: Math.round(weather.fleet_var_95_dollar),
          limit: Math.round(weather.fleet_capital * 0.1),
          unit: '$',
          explanation: `95% VaR: $${weather.fleet_var_95_dollar.toFixed(0)} — maximum expected 1-day loss in 95% of scenarios.`,
        },
        {
          label: 'Capital Deployed',
          current: Math.round((1 - weather.cash_pct) * 100),
          limit: 100,
          unit: '%',
          explanation: `${((1 - weather.cash_pct) * 100).toFixed(0)}% deployed across ${weather.n_active_bots} active bots.`,
        },
      ],
      narrative: 'How much of your risk budget is consumed across the fleet.',
    },
    stressScenarios: [],
    diversification: {
      dimensions: [],
      overallGrade: weatherScoreToGrade(weather.weather_score),
      narrative:
        weather.diversification_cliff_magnitude > 0.3
          ? `Diversification cliff detected (magnitude ${weather.diversification_cliff_magnitude.toFixed(2)}). Consider adding uncorrelated strategies.`
          : 'Fleet diversification is within acceptable range.',
    },
    recommendations: recommendations.map((rec, i) => ({
      type: toRiskActionType(rec.recommendation_type),
      recommendationType: rec.recommendation_type,
      title: rec.bot_name
        ? `${rec.recommendation_type.toUpperCase()}: ${rec.bot_name}`
        : rec.recommendation_type.toUpperCase(),
      description: rec.reason,
      priority: i + 1,
      deploymentId: rec.bot_id ?? undefined,
      botName: rec.bot_name ?? undefined,
      evidence: rec.evidence,
      ctaLabel: rec.suggested_action,
    })),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommandCenter() {
  const { data: weather, isLoading: weatherLoading } = useFleetWeather();
  const { data: history } = useFleetWeatherHistory();
  const { data: narrative } = useFleetNarrative();
  const { data: recommendations } = useFleetRecommendations();
  const { data: bots } = useBots();
  const { data: profile } = useUserProfile();
  const { data: benchmarkData } = useFleetBenchmark();

  const drawdownTolerance = profile?.max_drawdown_tolerance_pct ?? 15;

  // Aggregate unrealized P&L across all live bots
  const totalUnrealizedPL = useMemo(
    () => (bots ?? []).reduce((s, b) => s + b.unrealized_pnl, 0),
    [bots],
  );

  // Bots in circuit_breaker or paused_monitoring — shown in AlertStrip
  const alertBots = useMemo(
    () =>
      (bots ?? []).filter(
        (b) => b.state === 'circuit_breaker' || b.state === 'paused_monitoring',
      ),
    [bots],
  );

  // Fire toast notifications when any bot transitions INTO a critical state.
  // useRef tracks previous states so we only toast on transitions, not initial load.
  const prevBotStatesRef = useRef<Record<string, string>>({});
  const botsInitializedRef = useRef(false);
  useEffect(() => {
    if (!bots) return;
    if (!botsInitializedRef.current) {
      // First render — seed the ref without firing toasts
      botsInitializedRef.current = true;
      for (const bot of bots) {
        prevBotStatesRef.current[bot.bot_id] = bot.state;
      }
      return;
    }
    for (const bot of bots) {
      const prev = prevBotStatesRef.current[bot.bot_id];
      if (prev !== undefined && prev !== bot.state) {
        const label = bot.strategy_id
          ? `${bot.strategy_id}${bot.ticker ? ` (${bot.ticker})` : ''}`
          : `Bot ${bot.bot_id.slice(0, 8)}`;
        if (bot.state === 'circuit_breaker') {
          toast.error(`Circuit Breaker: ${label}`, {
            description: 'Trading halted automatically. Review this bot in Operations.',
          });
        } else if (bot.state === 'paused_monitoring') {
          toast.warning(`Monitoring Paused: ${label}`, {
            description: 'Bot paused by the monitoring harness. Review in Operations.',
          });
        }
      }
      // Always update ref to current state
      prevBotStatesRef.current[bot.bot_id] = bot.state;
    }
  }, [bots]);

  // Build equity curve from weather history
  const equityCurve = useMemo(() => {
    if (!history || history.length === 0) return [];
    const regimeMap = ['LOW_VOL', 'NORMAL', 'HIGH_VOL', 'CRISIS'] as const;
    return history.map((w) => ({
      time: new Date(w.timestamp),
      value: w.fleet_capital,
      regime: (regimeMap[w.current_regime] ?? 'NORMAL') as
        'LOW_VOL' | 'NORMAL' | 'HIGH_VOL' | 'CRISIS',
    }));
  }, [history]);

  const riskIntelligence = useMemo(
    () =>
      weather
        ? buildRiskIntelligence(weather, narrative, recommendations ?? [], drawdownTolerance)
        : null,
    [weather, narrative, recommendations, drawdownTolerance],
  );

  // Loading skeleton — matches HeroZone + narrative card + equity chart shape
  if (weatherLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  // Error / backend offline state
  if (!weather || !riskIntelligence) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-muted-foreground">
          Unable to load fleet data. Is the backend running?
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Zone — capital overview + market context */}
      <HeroZone weather={weather} totalUnrealizedPL={totalUnrealizedPL} />

      {/* Fleet Narrative — headline always visible; full briefing behind expand toggle */}
      <FleetNarrativeCard
        narrative={narrative}
        weatherTimestamp={weather?.timestamp}
      />

      {/* Top Recommendation — single highest-priority item; full list in Operations */}
      <TopRecommendationPreview
        recommendation={recommendations?.[0] ?? null}
        totalCount={recommendations?.length ?? 0}
      />

      {/* Alert Strip — chips for circuit_breaker / paused_monitoring bots; absent when empty */}
      <AlertStrip bots={alertBots} />

      {/* Portfolio Equity Chart — derived from fleet weather history; SPY strip only when backend data present */}
      {equityCurve.length > 0 && (
        <PortfolioChart equityCurve={equityCurve} benchmarkData={benchmarkData} />
      )}

      {/* Risk Summary — VaR budget and weather grade */}
      <RiskSummary
        risk={riskIntelligence}
        weatherTimestamp={weather?.timestamp}
      />

      {/* Portfolio Risk Attribution — full-width (was half-width before Batch 3) */}
      <PortfolioImpact />

      {/* Fleet — grouped accordion: Risk Controls Active / In Operation / Standing Down */}
      <BotAccordion bots={bots ?? []} />
    </div>
  );
}
