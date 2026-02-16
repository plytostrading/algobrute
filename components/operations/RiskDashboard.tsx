'use client';

import { Sun, Cloud, CloudRain, Zap, ArrowRight, CheckCircle, PlusCircle, Eye, MinusCircle, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockRiskIntelligence } from '@/mock/mockData';
import { formatCurrency } from '@/utils/formatters';
import type { RiskWeatherCondition, RiskGrade, RiskActionType, ScenarioSeverity } from '@/types';

const weatherIcons: Record<RiskWeatherCondition, typeof Sun> = { clear: Sun, fair: Cloud, cloudy: CloudRain, stormy: Zap };
const weatherLabels: Record<RiskWeatherCondition, string> = { clear: 'Clear Skies', fair: 'Fair', cloudy: 'Cloudy', stormy: 'Stormy' };
const weatherColors: Record<RiskWeatherCondition, { text: string; bg: string }> = {
  clear: { text: 'text-success', bg: 'bg-success/10' },
  fair: { text: 'text-info', bg: 'bg-info/10' },
  cloudy: { text: 'text-warning', bg: 'bg-warning/10' },
  stormy: { text: 'text-destructive', bg: 'bg-destructive/10' },
};
const gradeColor = (grade: RiskGrade) => grade.startsWith('A') ? 'text-success' : grade.startsWith('B') ? 'text-info' : grade.startsWith('C') ? 'text-warning' : 'text-destructive';
const severityConfig: Record<ScenarioSeverity, { color: string; badge: 'secondary' | 'destructive' }> = {
  moderate: { color: 'text-warning', badge: 'secondary' },
  significant: { color: 'text-destructive', badge: 'destructive' },
  severe: { color: 'text-destructive', badge: 'destructive' },
};
const actionIcons: Record<RiskActionType, typeof CheckCircle> = { keep: CheckCircle, add: PlusCircle, monitor: Eye, remove: MinusCircle };
const actionColors: Record<RiskActionType, string> = { keep: 'text-success', add: 'text-info', monitor: 'text-warning', remove: 'text-destructive' };

export default function RiskDashboard() {
  const intel = mockRiskIntelligence;
  const WeatherIcon = weatherIcons[intel.weather.condition];
  const wColors = weatherColors[intel.weather.condition];

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
              {intel.weather.overallGrade}
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
                <span className="text-sm font-semibold capitalize">{weatherLabels[intel.weather.condition]}</span>
                <span className="text-xs text-muted-foreground">· Risk level: {intel.weather.riskLevel}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{intel.weather.narrative}</p>

              {/* Drawdown meter */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Portfolio Drawdown</span>
                  <span className="font-mono-data text-xs text-muted-foreground">
                    {intel.weather.drawdownCurrent}% / {intel.weather.drawdownLimit}%
                  </span>
                </div>
                {(() => {
                  const pct = Math.min((intel.weather.drawdownCurrent / intel.weather.drawdownLimit) * 100, 100);
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
          {intel.budget.items.map((item, i) => {
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

      {/* Deep Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Diversification */}
        <Card>
          <CardHeader>
            <CardTitle>Diversification Report</CardTitle>
            <CardAction>
              <Badge variant="outline" className={`font-mono-data font-bold ${gradeColor(intel.diversification.overallGrade)}`}>
                {intel.diversification.overallGrade}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {intel.diversification.dimensions.map((dim, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Badge variant="outline" className={`text-xs font-bold min-w-[32px] justify-center shrink-0 ${gradeColor(dim.grade)}`}>
                    {dim.grade}
                  </Badge>
                  <div>
                    <p className="text-xs font-semibold">{dim.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{dim.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
            {intel.diversification.narrative && (
              <div className="mt-4 pt-4 border-t">
                <div className="rounded-lg border-l-4 border-info bg-info/5 p-3">
                  <p className="text-xs font-semibold text-info mb-0.5">Insight</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{intel.diversification.narrative}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stress Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>What Could Go Wrong</CardTitle>
            <CardDescription>Stress test scenarios based on historical events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {intel.stressScenarios.map((scenario) => {
                const sc = severityConfig[scenario.severity];
                return (
                  <div key={scenario.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{scenario.icon}</span>
                        <span className="text-sm font-semibold">{scenario.title}</span>
                      </div>
                      <Badge variant={sc.badge} className="text-[10px]">{scenario.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{scenario.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      <span className="font-mono-data font-bold text-destructive">−{formatCurrency(scenario.estimatedLossDollar)}</span>
                      <span className="text-muted-foreground">({scenario.estimatedLossPercent.toFixed(1)}%)</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{scenario.historicalOccurrences}× tested</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">~{scenario.avgRecoveryDays}d recovery</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-success">
                      <span>🛡️</span>
                      <span>{scenario.safetyNet}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>What To Do Next</CardTitle>
          <CardDescription>Prioritized recommendations for your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...intel.recommendations].sort((a, b) => a.priority - b.priority).map((rec) => {
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
                  {rec.ctaLabel && (
                    <Button size="sm" variant="ghost" className={`h-7 px-2 text-xs ${color}`}>
                      {rec.ctaLabel} <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
