'use client';

import { Cloud, Sun, CloudRain, CloudLightning, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import type { RiskIntelligenceData, RiskWeatherCondition } from '@/types';

const weatherIcons: Record<RiskWeatherCondition, typeof Sun> = {
  clear: Sun,
  fair: Cloud,
  cloudy: CloudRain,
  stormy: CloudLightning,
};

const weatherColors: Record<RiskWeatherCondition, { text: string; bg: string }> = {
  clear: { text: 'text-success', bg: 'bg-success/10' },
  fair: { text: 'text-info', bg: 'bg-info/10' },
  cloudy: { text: 'text-warning', bg: 'bg-warning/10' },
  stormy: { text: 'text-destructive', bg: 'bg-destructive/10' },
};

interface RiskSummaryProps {
  risk: RiskIntelligenceData;
}

export default function RiskSummary({ risk }: RiskSummaryProps) {
  const WeatherIcon = weatherIcons[risk.weather.condition];
  const colors = weatherColors[risk.weather.condition];
  const topRec = risk.recommendations[0];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Risk Weather */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Risk Weather
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-mono-data font-bold">
              {risk.weather.overallGrade}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
              <WeatherIcon className={`h-6 w-6 ${colors.text}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold capitalize">{risk.weather.condition}</span>
                <span className="text-xs text-muted-foreground">· Risk level: {risk.weather.riskLevel}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{risk.weather.narrative}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Risk Budget
          </CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
              <Link href="/operations">
                Details <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {risk.budget.items.map((item) => {
              const pct = Math.min((item.current / item.limit) * 100, 100);
              const indicatorClass = pct > 75 ? '[&>[data-slot=progress-indicator]]:bg-destructive' : pct > 50 ? '[&>[data-slot=progress-indicator]]:bg-warning' : '[&>[data-slot=progress-indicator]]:bg-success';
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">{item.label}</span>
                    <span className="font-mono-data text-xs text-muted-foreground">
                      {item.current}{item.unit} / {item.limit}{item.unit}
                    </span>
                  </div>
                  <Progress value={pct} className={`h-1.5 ${indicatorClass}`} />
                </div>
              );
            })}
          </div>

          {/* Top recommendation */}
          {topRec && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">{topRec.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{topRec.description}</p>
                </div>
                {topRec.ctaLabel && (
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0 ml-3">
                    {topRec.ctaLabel}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
