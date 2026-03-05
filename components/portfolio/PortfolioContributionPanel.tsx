'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetPortfolioContribution } from '@/hooks/useFleetPortfolioContribution';
import { formatCurrencyCompact, formatPercent } from '@/utils/formatters';
import type { BotPortfolioContribution, Regime } from '@/types/api';

const REGIME_ORDER: Regime[] = [0, 1, 2, 3];
const REGIME_LABELS: Record<Regime, string> = {
  0: 'LOW_VOL',
  1: 'NORMAL',
  2: 'ELEVATED_VOL',
  3: 'CRISIS',
};

function normalizePct(v: number): number {
  // Backend may return fractions (0..1) for risk fields; normalize to percentage units.
  return Math.abs(v) <= 1 ? v * 100 : v;
}

function contributionRowLabel(bot: BotPortfolioContribution): string {
  return bot.ticker ? `${bot.strategy_name} · ${bot.ticker}` : bot.strategy_name;
}

export default function PortfolioContributionPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data, isLoading, isError } = useFleetPortfolioContribution();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Contribution</CardTitle>
          <CardDescription>Capital, P&amp;L, risk, and regime attribution per bot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Contribution</CardTitle>
          <CardDescription>Capital, P&amp;L, risk, and regime attribution per bot</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load portfolio contribution data.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Contribution</CardTitle>
          <CardDescription>Capital, P&amp;L, risk, and regime attribution per bot</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No portfolio contribution data available yet. Deploy at least one bot with closed trades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Contribution</CardTitle>
        <CardDescription>
          Total capital {formatCurrencyCompact(data.total_capital)} · realized P&amp;L{' '}
          {formatCurrencyCompact(data.total_realized_pnl)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.bot_contributions.map((bot) => {
          const botOpen = expanded[bot.bot_id] ?? false;
          const pnlPositive = bot.realized_pnl >= 0;
          const riskPct = normalizePct(bot.risk_contribution_pct);
          const varPct = normalizePct(bot.var_contribution_pct);

          const regimeById = new Map(bot.regime_pnl.map((r) => [r.regime, r]));

          return (
            <div key={bot.bot_id} className="rounded-lg border">
              <button
                className="w-full px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [bot.bot_id]: !botOpen }))
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contributionRowLabel(bot)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Capital {formatPercent(bot.capital_allocation_pct)} · Risk{' '}
                      {formatPercent(riskPct)}
                      {' '}· VaR {formatPercent(varPct)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          pnlPositive ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {pnlPositive ? '+' : ''}
                        {formatCurrencyCompact(bot.realized_pnl)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatPercent(bot.realized_pnl_pct_of_fleet, true)} fleet P&amp;L
                      </p>
                    </div>
                    {botOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {botOpen && (
                <div className="border-t px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Regime P&amp;L Breakdown
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {REGIME_ORDER.map((regimeId) => {
                      const r = regimeById.get(regimeId);
                      const pnl = r?.realized_pnl ?? 0;
                      const wins = r ? r.win_rate * 100 : 0;
                      const count = r?.trade_count ?? 0;
                      const avgRet = r?.avg_return_pct ?? 0;

                      return (
                        <div key={regimeId} className="rounded border p-2 bg-muted/20">
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            {REGIME_LABELS[regimeId]}
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              pnl >= 0 ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {pnl >= 0 ? '+' : ''}
                            {formatCurrencyCompact(pnl)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Trades {count}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Win {wins.toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Avg {formatPercent(avgRet, true)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {data.fleet_regime_pnl.length > 0 && (
          <div className="rounded-lg border border-dashed p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Fleet Regime P&amp;L Summary
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {REGIME_ORDER.map((regimeId) => {
                const r = data.fleet_regime_pnl.find((x) => x.regime === regimeId);
                const pnl = r?.realized_pnl ?? 0;
                return (
                  <div key={regimeId} className="rounded border p-2 bg-muted/20">
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {REGIME_LABELS[regimeId]}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        pnl >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {pnl >= 0 ? '+' : ''}
                      {formatCurrencyCompact(pnl)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Trades {r?.trade_count ?? 0}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
