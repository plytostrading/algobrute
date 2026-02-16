'use client';

import { Sun, Cloud, CloudRain, Zap, ArrowRight, CheckCircle, PlusCircle, Eye, MinusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import TerminalLabel from '@/components/common/TerminalLabel';
import InsightNarrative from '@/components/common/InsightNarrative';
import RiskComfortMeter from '@/components/common/RiskComfortMeter';
import { mockRiskIntelligence, mockPortfolio } from '@/mock/mockData';
import { formatCurrency } from '@/utils/formatters';
import type { RiskWeatherCondition, RiskGrade, RiskActionType, ScenarioSeverity } from '@/types';

const weatherIcons: Record<RiskWeatherCondition, typeof Sun> = { clear: Sun, fair: Cloud, cloudy: CloudRain, stormy: Zap };
const weatherLabels: Record<RiskWeatherCondition, string> = { clear: 'Clear Skies', fair: 'Fair', cloudy: 'Cloudy', stormy: 'Stormy' };
const gradeColor = (grade: RiskGrade) => grade.startsWith('A') ? 'text-success' : grade.startsWith('B') ? 'text-info' : grade.startsWith('C') ? 'text-warning' : 'text-destructive';
const gradeBg = (grade: RiskGrade) => grade.startsWith('A') ? 'bg-success' : grade.startsWith('B') ? 'bg-info' : grade.startsWith('C') ? 'bg-warning' : 'bg-destructive';
const severityConfig: Record<ScenarioSeverity, { color: string; border: string }> = {
  moderate: { color: 'text-warning', border: 'border-warning' },
  significant: { color: 'text-destructive', border: 'border-destructive' },
  severe: { color: 'text-destructive', border: 'border-destructive' },
};
const actionIcons: Record<RiskActionType, typeof CheckCircle> = { keep: CheckCircle, add: PlusCircle, monitor: Eye, remove: MinusCircle };
const actionColors: Record<RiskActionType, string> = { keep: 'text-success', add: 'text-info', monitor: 'text-warning', remove: 'text-destructive' };

export default function RiskDashboard() {
  const intel = mockRiskIntelligence;
  const WeatherIcon = weatherIcons[intel.weather.condition];

  return (
    <div className="flex flex-col gap-3">
      {/* Chapter 1: Risk Weather Hero */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="☀" className="mb-3">RISK_WEATHER</TerminalLabel>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3 flex-shrink-0">
              <WeatherIcon className="h-7 w-7 text-success" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={`${gradeBg(intel.weather.overallGrade)} text-white font-bold text-base px-2`}>{intel.weather.overallGrade}</Badge>
                  <span className="text-sm font-semibold">{weatherLabels[intel.weather.condition]}</span>
                </div>
                <span className={`text-[9px] uppercase tracking-wider ${gradeColor(intel.weather.overallGrade)}`}>RISK LEVEL: {intel.weather.riskLevel.toUpperCase()}</span>
              </div>
            </div>
            <div className="min-w-[220px] flex-1 max-w-[320px]">
              <RiskComfortMeter label="PORTFOLIO DRAWDOWN" current={intel.weather.drawdownCurrent} limit={intel.weather.drawdownLimit} unit="%" showPercentOfLimit />
            </div>
            <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground md:border-l md:pl-4">{intel.weather.narrative}</p>
          </div>
        </CardContent>
      </Card>

      {/* Chapter 2: Risk Budget */}
      <div>
        <TerminalLabel icon="◧" className="mb-2">YOUR_RISK_BUDGET</TerminalLabel>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {intel.budget.items.map((item, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <RiskComfortMeter label={item.label.toUpperCase()} current={item.current} limit={item.limit} unit={item.unit} showPercentOfLimit />
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{item.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chapter 3: Deep Analysis */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Diversification */}
        <Card>
          <CardContent className="p-4">
            <TerminalLabel icon="◉" className="mb-3">DIVERSIFICATION_REPORT</TerminalLabel>
            <div className="flex flex-col items-center mb-4 py-2">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">OVERALL GRADE</span>
              <Badge className={`${gradeBg(intel.diversification.overallGrade)} text-white font-black text-2xl px-3 py-1.5 rounded-md`}>{intel.diversification.overallGrade}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {intel.diversification.dimensions.map((dim, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Badge variant={dim.grade.startsWith('A') || dim.grade.startsWith('B') ? 'outline' : 'default'} className={`text-[11px] font-bold min-w-[32px] justify-center flex-shrink-0 ${dim.grade.startsWith('C') || dim.grade === 'D' || dim.grade === 'F' ? gradeBg(dim.grade) + ' text-white' : ''}`}>{dim.grade}</Badge>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{dim.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{dim.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <InsightNarrative compact>{intel.diversification.narrative}</InsightNarrative>
            </div>
          </CardContent>
        </Card>

        {/* Stress Scenarios */}
        <Card>
          <CardContent className="p-4">
            <TerminalLabel icon="⚡" className="mb-3">WHAT_COULD_GO_WRONG</TerminalLabel>
            <div className="flex flex-col">
              {intel.stressScenarios.map((scenario, idx) => {
                const sc = severityConfig[scenario.severity];
                return (
                  <div key={scenario.id} className={`border-l-[3px] ${sc.border} pl-3 py-2.5 ${idx < intel.stressScenarios.length - 1 ? 'border-b pb-3' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{scenario.icon}</span>
                        <span className="text-[13px] font-semibold">{scenario.title}</span>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${sc.color}`}>{scenario.severity.toUpperCase()}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mb-1.5">{scenario.description}</p>
                    <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
                      <span className="numeric-data text-sm font-bold text-destructive">−{formatCurrency(scenario.estimatedLossDollar)}</span>
                      <span className="text-[9px] text-muted-foreground">({scenario.estimatedLossPercent.toFixed(1)}%)</span>
                      <span className="text-[9px] text-muted-foreground">·</span>
                      <span className="numeric-data text-[9px] text-muted-foreground">{scenario.historicalOccurrences}× tested</span>
                      <span className="text-[9px] text-muted-foreground">·</span>
                      <span className="numeric-data text-[9px] text-muted-foreground">~{scenario.avgRecoveryDays}d recovery</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[11px]">🛡️</span>
                      <span className="text-[10px] text-success leading-snug">{scenario.safetyNet}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapter 4: Playbook */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="🎯" className="mb-3">WHAT_TO_DO_NEXT</TerminalLabel>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[...intel.recommendations].sort((a, b) => a.priority - b.priority).map((rec) => {
              const ActionIcon = actionIcons[rec.type];
              const color = actionColors[rec.type];
              return (
                <div key={rec.priority} className={`rounded-md border border-t-[3px] bg-background p-3 flex flex-col`} style={{ borderTopColor: `var(--${rec.type === 'keep' ? 'success' : rec.type === 'add' ? 'info' : rec.type === 'monitor' ? 'warning' : 'destructive'})` }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="numeric-data text-[9px] text-muted-foreground">#{rec.priority}</span>
                    <ActionIcon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className="text-xs font-semibold mb-1 leading-tight">{rec.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{rec.description}</p>
                  {rec.ctaLabel && (
                    <Button size="sm" variant="ghost" className={`mt-2 h-6 self-start text-[10px] font-semibold px-1 ${color}`}>
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
