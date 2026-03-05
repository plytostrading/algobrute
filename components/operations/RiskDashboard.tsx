'use client';

import { useMemo } from 'react';
import { Sun, Cloud, CloudRain, Zap, CheckCircle, PlusCircle, Eye, MinusCircle, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import RecommendationActionButton from '@/components/recommendations/RecommendationActionButton';
import { useFleetWeather } from '@/hooks/useFleetWeather';
import { useFleetNarrative } from '@/hooks/useFleetNarrative';
import { useFleetRecommendations } from '@/hooks/useFleetRecommendations';
import { useUserProfile } from '@/hooks/useUserProfile';
import { weatherScoreToGrade, getWeatherColors } from '@/lib/colors';
import { getWeatherDisplayLabel } from '@/lib/regimeLabel';
import { formatCurrency, formatRelativeTimeFromISOString } from '@/utils/formatters';
import type { RiskWeatherCondition, RiskGrade, RiskActionType } from '@/types';

// WeatherLabel string (API) → RiskWeatherCondition (legacy UI)
function toCondition(label: string): RiskWeatherCondition {
  if (label === 'clear_skies') return 'clear';
  if (label === 'partly_cloudy') return 'fair';
  if (label === 'overcast') return 'cloudy';
  return 'stormy';
}

const conditionIcons: Record<RiskWeatherCondition, typeof Sun> = {
  clear: Sun, fair: Cloud, cloudy: CloudRain, stormy: Zap,
};

const actionIcons: Record<RiskActionType, typeof CheckCircle> = {
  keep: CheckCircle, add: PlusCircle, monitor: Eye, remove: MinusCircle,
};
const actionColors: Record<RiskActionType, string> = {
  keep: 'text-success', add: 'text-info', monitor: 'text-warning', remove: 'text-destructive',
};

function toActionType(type: string): RiskActionType {
  if (type === 'add') return 'add';
  if (type === 'kill') return 'remove';
  if (type === 'pause' || type === 'reduce') return 'monitor';
  return 'keep';
}

const gradeColor = (grade: RiskGrade) =>
  grade.startsWith('A') ? 'text-success' :
  grade.startsWith('B') ? 'text-info' :
  grade.startsWith('C') ? 'text-warning' : 'text-destructive';

export default function RiskDashboard() {
  const { data: weather, isLoading: weatherLoading } = useFleetWeather();
  const { data: narrative } = useFleetNarrative();
  const { data: recommendations } = useFleetRecommendations();
  const { data: profile } = useUserProfile();
  const drawdownTolerance = profile?.max_drawdown_tolerance_pct ?? 15;

  const condition = useMemo(() => (weather ? toCondition(weather.weather_label) : 'clear' as const), [weather]);
  const grade = useMemo(() => (weather ? weatherScoreToGrade(weather.weather_score) : 'B' as RiskGrade), [weather]);
  const wColors = useMemo(() => getWeatherColors(weather?.weather_label ?? 'clear_skies'), [weather]);
  const WeatherIcon = conditionIcons[condition];
  const weatherUpdated = useMemo(
    () => (weather?.timestamp ? formatRelativeTimeFromISOString(weather.timestamp) : 'unknown'),
    [weather?.timestamp],
  );

  const drawdownPct = useMemo(
    () => weather && weather.fleet_capital > 0
      ? (weather.fleet_var_95_dollar / weather.fleet_capital) * 100
      : 0,
    [weather],
  );

  const recs = useMemo(
    () => (recommendations ?? []).map((rec, i) => ({
      type: toActionType(rec.recommendation_type),
      recommendationType: rec.recommendation_type,
      botId: rec.bot_id,
      botName: rec.bot_name,
      title: rec.bot_name ? `${rec.recommendation_type.toUpperCase()}: ${rec.bot_name}` : rec.recommendation_type.toUpperCase(),
      description: rec.reason,
      evidence: rec.evidence,
      priority: i + 1,
    })),
    [recommendations],
  );

  if (weatherLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-muted-foreground">Unable to load risk data. Is the backend running?</p>
      </div>
    );
  }

  // Derived budget items from real API data
  const budgetItems = [
    {
      label: 'VaR 95%',
      current: Math.round(weather.fleet_var_95_dollar),
      limit: Math.round(weather.fleet_capital * 0.1),
      unit: '$',
      explanation: `95% VaR: $${weather.fleet_var_95_dollar.toFixed(0)} — max expected 1-day loss in 95% of scenarios.`,
    },
    {
      label: 'Capital Deployed',
      current: Math.round((1 - weather.cash_pct) * 100),
      limit: 100,
      unit: '%',
      explanation: `${((1 - weather.cash_pct) * 100).toFixed(0)}% of capital deployed across ${weather.n_active_bots} active bots.`,
    },
    {
      label: 'CVaR 95%',
      current: Math.round(weather.fleet_cvar_95_dollar),
      limit: Math.round(weather.fleet_capital * 0.15),
      unit: '$',
      explanation: `Conditional VaR (expected tail loss): $${weather.fleet_cvar_95_dollar.toFixed(0)} in a bad scenario.`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Risk Weather Hero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Risk Weather
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-mono-data font-bold text-base px-2.5">
              {grade}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${wColors.bg}`}>
              <WeatherIcon className={`h-7 w-7 ${wColors.text}`} />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">
                  {getWeatherDisplayLabel(weather.weather_label)}
                </span>
                <span className="text-xs text-muted-foreground">· Score: {weather.weather_score}/100</span>
                <span className="text-xs text-muted-foreground">· Updated {weatherUpdated}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {narrative?.briefing ?? weather.top_recommendation_summary ?? 'Fleet weather data is up to date.'}
              </p>

              {/* VaR drawdown meter */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">VaR 95% vs Capital</span>
                  <span className="font-mono-data text-xs text-muted-foreground">
                    {drawdownPct.toFixed(1)}% / {drawdownTolerance}%
                  </span>
                </div>
                {(() => {
                  const pct = Math.min((drawdownPct / drawdownTolerance) * 100, 100);
                  const indicatorClass = pct > 75 ? '[&>[data-slot=progress-indicator]]:bg-destructive' : pct > 50 ? '[&>[data-slot=progress-indicator]]:bg-warning' : '[&>[data-slot=progress-indicator]]:bg-success';
                  return <Progress value={pct} className={`h-2 ${indicatorClass}`} />;
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Budget */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Risk Budget</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {budgetItems.map((item, i) => {
            const pct = Math.min((item.current / item.limit) * 100, 100);
            const indicatorClass = pct > 75 ? '[&>[data-slot=progress-indicator]]:bg-destructive' : pct > 50 ? '[&>[data-slot=progress-indicator]]:bg-warning' : '[&>[data-slot=progress-indicator]]:bg-success';
            return (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium">{item.label}</span>
                    <span className="font-mono-data text-xs text-muted-foreground">
                      {item.current}{item.unit} / {item.limit}{item.unit}
                    </span>
                  </div>
                  <Progress value={pct} className={`h-1.5 mb-3 ${indicatorClass}`} />
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.explanation}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Fleet Summary + Narrative */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fleet Summary card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Fleet Summary
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={`font-mono-data font-bold ${gradeColor(grade)}`}>
                {grade}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Fleet Capital', value: formatCurrency(weather.fleet_capital) },
                { label: 'Active Bots', value: `${weather.n_active_bots} / ${weather.n_bots}` },
                { label: 'Bots with Alerts', value: String(weather.n_bots_with_alerts) },
                { label: 'Net Market Beta', value: weather.net_market_beta.toFixed(2) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="font-mono-data text-xs font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            {narrative && (
              <div className="mt-4 pt-4 border-t">
                <div className="rounded-lg border-l-4 border-info bg-info/5 p-3">
                  <p className="text-xs font-semibold text-info mb-0.5">Next Step</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{narrative.next_step}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>What To Do Next</CardTitle>
            <CardDescription>Prioritised recommendations from the analytics pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {recs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recommendations at this time.</p>
            ) : (
              <div className="space-y-3">
                {recs.map((rec) => {
                  const ActionIcon = actionIcons[rec.type];
                  const color = actionColors[rec.type];
                  return (
                    <div key={rec.priority} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono-data text-[10px]">#{rec.priority}</Badge>
                        <ActionIcon className={`h-4 w-4 ${color}`} />
                      </div>
                      <p className="text-sm font-semibold">{rec.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                      <RecommendationActionButton
                        recommendationType={rec.recommendationType}
                        botId={rec.botId}
                        botName={rec.botName}
                        reason={rec.description}
                        evidence={rec.evidence}
                        buttonVariant="outline"
                        buttonSize="sm"
                        className={`h-7 px-2 text-xs ${color}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
