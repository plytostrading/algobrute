import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import TerminalLabel from '@/components/common/TerminalLabel';
import InsightNarrative from '@/components/common/InsightNarrative';
import PLText from '@/components/common/PLText';
import RiskComfortMeter from '@/components/common/RiskComfortMeter';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { mockPortfolioIntelligence, mockCircuitBreaker, mockRegimeIndicator } from '@/mock/mockData';
import { formatPercent } from '@/utils/formatters';

export default function PortfolioImpact() {
  const intel = mockPortfolioIntelligence;
  const cb = mockCircuitBreaker;
  const regime = mockRegimeIndicator;
  const maxAbsImpact = Math.max(...intel.botImpacts.map((b) => Math.abs(b.equityImpactDollar)));

  return (
    <Card>
      <CardContent className="p-4">
        <TerminalLabel icon="◈" className="mb-3">PORTFOLIO_IMPACT</TerminalLabel>
        <InsightNarrative compact>{intel.overallNarrative}</InsightNarrative>

        {/* Equity Contribution */}
        <div className="mt-4 flex flex-col gap-3">
          <TerminalLabel icon="◧">EQUITY_CONTRIBUTION</TerminalLabel>
          {intel.botImpacts.map((bot) => {
            const barWidth = (Math.abs(bot.equityImpactDollar) / maxAbsImpact) * 100;
            const isPositive = bot.equityImpactDollar >= 0;
            const shareOfGains = intel.totalEquityPL > 0 ? ((bot.equityImpactDollar / intel.totalEquityPL) * 100).toFixed(0) : '0';
            return (
              <div key={bot.deploymentId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{bot.name}</span>
                  <div className="flex items-baseline gap-1.5">
                    <PLText value={bot.equityImpactDollar} size="sm" />
                    <span className="text-[10px] text-muted-foreground">{isPositive ? `${shareOfGains}% of gains` : 'drag'}</span>
                  </div>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isPositive ? 'bg-success' : 'bg-destructive'} opacity-80`} style={{ width: `${barWidth}%` }} />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground">DIRECTIONAL BIAS:</span>
            <span className={`numeric-data text-[11px] font-semibold ${intel.directionalBias === 'net_long' ? 'text-success' : intel.directionalBias === 'net_short' ? 'text-destructive' : 'text-muted-foreground'}`}>
              {intel.directionalBias === 'net_long' ? '▲' : intel.directionalBias === 'net_short' ? '▼' : '◆'} {intel.directionalBias.replace('_', ' ').toUpperCase()} ({intel.directionalBiasPercent}%)
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Sensitivity Analysis */}
        <div className="flex flex-col gap-2">
          <TerminalLabel icon="⚡">SENSITIVITY_ANALYSIS</TerminalLabel>
          {(() => {
            const topBot = [...intel.botImpacts].sort((a, b) => Math.abs(b.equityImpactDollar) - Math.abs(a.equityImpactDollar))[0];
            return (
              <div className="border-l-[3px] border-warning py-1 pl-3 text-[13px] leading-relaxed text-muted-foreground">
                {topBot.sensitivityNarrative}
              </div>
            );
          })()}
          <div className="flex flex-col gap-1.5">
            {intel.botImpacts.map((bot) => (
              <div key={bot.deploymentId} className="flex items-center gap-3 rounded bg-background px-3 py-1.5">
                <span className="min-w-[130px] text-xs font-medium">{bot.name}</span>
                <span className={`numeric-data min-w-[60px] text-[11px] font-semibold ${bot.equityImpactPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {bot.equityImpactPercent > 0 ? '+' : ''}{formatPercent(bot.equityImpactPercent)}
                </span>
                <div className="flex flex-1 items-center gap-1.5">
                  <div className={`h-1.5 rounded-full ${bot.riskSharePercent > 35 ? 'bg-destructive' : bot.riskSharePercent > 25 ? 'bg-warning' : 'bg-info'} opacity-70`} style={{ width: `${bot.riskSharePercent}%`, minWidth: 4 }} />
                  <span className="text-[9px] text-muted-foreground">{bot.riskSharePercent}% risk</span>
                </div>
                <span className="numeric-data text-[10px] text-muted-foreground">w/o: {formatPercent(bot.portfolioReturnWithout)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Risk Attribution */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <TerminalLabel icon="⊘">RISK_ATTRIBUTION</TerminalLabel>
            <span className="numeric-data text-xs font-semibold text-destructive">Max DD: {formatPercent(intel.portfolioMaxDD)}</span>
          </div>
          {intel.botImpacts.map((bot, i) => (
            <div key={bot.deploymentId} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-3">{i === intel.botImpacts.length - 1 ? '└' : '├'}</span>
              <span className="min-w-[120px] text-xs font-medium">{bot.name}</span>
              <span className="numeric-data min-w-[45px] text-[11px] font-semibold text-destructive">{formatPercent(bot.maxDDContribution)}</span>
              <div className="flex flex-1 items-center gap-1">
                <div className="h-1.5 rounded-full bg-destructive opacity-60" style={{ width: `${bot.maxDDContributionPercent}%`, minWidth: 4 }} />
                <span className="text-[9px] text-muted-foreground">{bot.maxDDContributionPercent}%</span>
              </div>
            </div>
          ))}

          {/* Correlation */}
          {intel.correlations.filter((c) => c.riskLevel === 'high').length > 0 && (
            <div className="mt-2 border-t pt-3">
              <span className="text-[10px] text-muted-foreground">CORRELATION MATRIX</span>
              <div className="mt-1.5 flex flex-col gap-1">
                {intel.correlations.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground min-w-[200px]">{pair.botA} ↔ {pair.botB}</span>
                    <Badge variant={pair.riskLevel === 'high' ? 'destructive' : 'outline'} className="text-[10px] h-5">{pair.correlation.toFixed(2)}</Badge>
                    {pair.riskLevel === 'high' && <span className="text-[9px] text-destructive">CO-MOVEMENT RISK</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concentration warning */}
          {intel.concentrationWarning && (
            <div className="mt-2 flex items-start gap-2 rounded border border-warning bg-warning/5 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
              <span className="text-[11px] leading-relaxed text-muted-foreground">{intel.concentrationWarning}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Risk Snapshot */}
        <div className="flex flex-col gap-3">
          <TerminalLabel icon="⊕">RISK_SNAPSHOT</TerminalLabel>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{regime.current}</Badge>
            <span className="numeric-data text-xs text-muted-foreground">{regime.confidence}% confidence</span>
            <span className="numeric-data text-xs text-muted-foreground">ATR: {regime.volatilityATR}</span>
          </div>
          <div className="border-t pt-3">
            <span className="text-xs text-muted-foreground mb-2 block">CIRCUIT BREAKERS</span>
            <div className="flex flex-col gap-2">
              <RiskComfortMeter label="Daily Loss" current={cb.dailyLossConsumed} limit={cb.dailyLossLimit} unit="$" />
              <RiskComfortMeter label="Max Drawdown" current={cb.maxDrawdownConsumed} limit={cb.maxDrawdownLimit} unit="%" />
              <RiskComfortMeter label="Consec. Losses" current={cb.consecutiveLosses} limit={cb.consecutiveLossLimit} unit="" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
