'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockPortfolioIntelligence } from '@/mock/mockData';
import { formatCurrency, formatPercent } from '@/utils/formatters';

export default function PortfolioImpact() {
  const intel = mockPortfolioIntelligence;
  const maxImpact = Math.max(...intel.botImpacts.map((b) => Math.abs(b.equityImpactDollar)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Impact</CardTitle>
        <CardDescription>How each bot contributes to your portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Bot impact bars */}
        <div className="space-y-4">
          {intel.botImpacts.map((bot) => {
            const isPositive = bot.equityImpactDollar >= 0;
            const barWidth = Math.round((Math.abs(bot.equityImpactDollar) / maxImpact) * 100);

            return (
              <div key={bot.deploymentId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{bot.name}</span>
                  <span className={`font-mono-data text-sm font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(bot.equityImpactDollar)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isPositive ? 'bg-success' : 'bg-destructive'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {bot.riskSharePercent}% risk
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bot.sensitivityNarrative}</p>
              </div>
            );
          })}
        </div>

        {/* Correlations */}
        <div className="mt-5 pt-4 border-t">
          <p className="text-xs font-semibold mb-2">Correlations</p>
          <div className="flex flex-wrap gap-2">
            {intel.correlations.map((corr, i) => (
              <Badge
                key={i}
                variant={corr.riskLevel === 'high' ? 'destructive' : corr.riskLevel === 'moderate' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {corr.botA.split(' ')[0]} ↔ {corr.botB.split(' ')[0]}: {corr.correlation.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Concentration warning */}
        {intel.concentrationWarning && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {intel.concentrationWarning}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
