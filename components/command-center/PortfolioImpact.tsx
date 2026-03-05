'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetAnalytics } from '@/hooks/useFleetAnalytics';
import { formatCurrency } from '@/utils/formatters';

export default function PortfolioImpact() {
  const { data: analytics, isLoading, isError } = useFleetAnalytics();

  const maxRisk = analytics
    ? Math.max(...analytics.bot_contributions.map((b) => Math.abs(b.component_risk)), 0.0001)
    : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Risk Attribution</CardTitle>
        <CardDescription>Per-bot contribution to fleet volatility</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">Failed to load risk attribution. Please try again.</p>
        )}

        {!isLoading && !isError && analytics && (
          <>
            {/* Bot risk contribution bars */}
            <div className="space-y-4">
              {analytics.bot_contributions.map((bot) => {
                const barWidth = Math.round((Math.abs(bot.component_risk) / maxRisk) * 100);
                const isHighRisk = bot.risk_contribution_pct > 40;

                return (
                  <div key={bot.bot_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate">{bot.strategy_name}</span>
                      <span className="font-mono-data text-sm font-semibold text-muted-foreground">
                        {bot.risk_contribution_pct.toFixed(1)}% of risk
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isHighRisk ? 'bg-destructive' : 'bg-primary'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {formatCurrency(bot.component_risk)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Alloc: {(bot.allocation_pct * 100).toFixed(1)}% · Efficiency: {bot.risk_efficiency.toFixed(2)}
                    </p>
                  </div>
                );
              })}

              {analytics.bot_contributions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No bots with risk data yet.
                </p>
              )}
            </div>

            {/* Concentration alert */}
            {analytics.concentration_alert && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Concentration alert: {analytics.least_risk_efficient} has the lowest risk efficiency.
                  Consider rebalancing towards {analytics.most_risk_efficient}.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
