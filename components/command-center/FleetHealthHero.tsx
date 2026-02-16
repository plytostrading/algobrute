import { Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InsightNarrative from '@/components/common/InsightNarrative';
import RiskComfortMeter from '@/components/common/RiskComfortMeter';
import type { FleetHealthStatus } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const healthConfig: Record<FleetHealthStatus, { color: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  HEALTHY: { color: 'rgb(16, 185, 129)', variant: 'default' },
  CAUTION: { color: 'rgb(245, 158, 11)', variant: 'secondary' },
  AT_RISK: { color: 'rgb(239, 68, 68)', variant: 'destructive' },
};

interface FleetHealthHeroProps {
  status: FleetHealthStatus;
  equity: number;
  dayPL: number;
  dayPLPercent: number;
  activeBots: number;
  drawdownPercent: number;
  drawdownTolerance: number;
  narrative: string;
}

export default function FleetHealthHero({ status, equity, dayPL, dayPLPercent, activeBots, drawdownPercent, drawdownTolerance, narrative }: FleetHealthHeroProps) {
  const config = healthConfig[status];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="h-3.5 w-3.5 fill-current pulse-animation" style={{ color: config.color }} />
              <Badge variant={config.variant} className="numeric-data font-bold">{status.replace('_', ' ')}</Badge>
              <span className="numeric-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">FLEET_HEALTH</span>
            </div>
            <span className="text-xs text-muted-foreground">{activeBots} bots active</span>
          </div>

          {/* Key metrics + drawdown meter */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex flex-1 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">PORTFOLIO EQUITY</span>
                <span className="numeric-data text-xl font-bold">{formatCurrency(equity)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">DAY P&L</span>
                <span className="numeric-data text-xl font-bold" style={{ color: dayPL >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)' }}>
                  {dayPL >= 0 ? '+' : ''}{formatCurrency(dayPL)} {formatPercent(dayPLPercent, true)}
                </span>
              </div>
            </div>
            <div className="min-w-[280px]">
              <RiskComfortMeter label="PORTFOLIO DRAWDOWN" current={drawdownPercent} limit={drawdownTolerance} unit="%" showPercentOfLimit />
            </div>
          </div>

          <InsightNarrative>{narrative}</InsightNarrative>
        </div>
      </CardContent>
    </Card>
  );
}
