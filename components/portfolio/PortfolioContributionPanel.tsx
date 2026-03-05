'use client';

/**
 * PortfolioContributionPanel
 *
 * Unified "Deployed Strategies" panel — merges Portfolio Holdings and Portfolio
 * Contribution into a single accordion list.  Each bot row shows:
 *
 *   Header (always visible):
 *     strategyName · ticker  [STATE BADGE]               $capital  [ops link]
 *     Capital X% · Risk Share X% · Tail Loss X% · VaR X%  +/-unrealized
 *                                                          +/-realized · fleet%
 *
 *   Expanded (click to toggle):
 *     1. Regime P&L Breakdown — 4 regime cards with Avg PnL/Trade labels
 *     2. Strategy DNA — passport + reliability + regime chart (from backtest)
 *
 * Metric labels:
 *   Risk Share      = Euler component VaR-99 share (fraction of fleet tail risk)
 *   Tail Loss Share = On fleet's worst days, this bot's fraction of realized losses
 *   Standalone VaR  = 1-day 95% historical VaR for this bot in isolation
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetPortfolioContribution } from '@/hooks/useFleetPortfolioContribution';
import { useFleetState } from '@/hooks/useFleetState';
import { useBacktestList } from '@/hooks/useBacktestWorkflow';
import StrategyDNA from '@/components/portfolio/StrategyDNA';
import { formatCurrencyCompact, formatPercent } from '@/utils/formatters';
import { getBotStateColors } from '@/lib/colors';
import { getBotStateLabel } from '@/lib/regimeLabel';
import type { BacktestJobSummary, BotPortfolioContribution, BotSnapshot, Regime } from '@/types/api';

const REGIME_ORDER: Regime[] = [0, 1, 2, 3];
const REGIME_LABELS: Record<Regime, string> = {
  0: 'LOW_VOL',
  1: 'NORMAL',
  2: 'ELEVATED_VOL',
  3: 'CRISIS',
};

/** Backend returns risk fractions in (0..1]; normalize to percentage points. */
function normalizePct(v: number): number {
  return Math.abs(v) <= 1 ? v * 100 : v;
}

/**
 * Find the most recent completed backtest job with a passport for the given
 * strategy + ticker combination.
 */
function findDnaJobId(
  strategyId: string,
  ticker: string,
  jobs: BacktestJobSummary[],
): string | null {
  if (!strategyId || !ticker) return null;
  const candidates = jobs
    .filter(
      (j) =>
        j.status === 'complete' &&
        j.passport_id !== null &&
        j.strategy_id === strategyId &&
        j.ticker === ticker,
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return candidates[0]?.job_id ?? null;
}

function rowLabel(bot: BotPortfolioContribution): string {
  return bot.ticker ? `${bot.strategy_name} · ${bot.ticker}` : bot.strategy_name;
}

// ---------------------------------------------------------------------------
// Single bot accordion row
// ---------------------------------------------------------------------------

interface BotRowProps {
  bot: BotPortfolioContribution;
  snapshot: BotSnapshot | undefined;
  jobs: BacktestJobSummary[];
  open: boolean;
  onToggle: () => void;
}

function BotRow({ bot, snapshot, jobs, open, onToggle }: BotRowProps) {
  const stateColors = snapshot ? getBotStateColors(snapshot.state) : null;
  const pnlPositive = bot.realized_pnl >= 0;
  const unrealizedPositive = (snapshot?.unrealized_pnl ?? 0) >= 0;

  const riskPct = normalizePct(bot.risk_contribution_pct);
  const varPct = normalizePct(bot.var_contribution_pct);
  const standaloneVarPct = normalizePct(bot.standalone_var_pct ?? 0);

  const regimeById = new Map(bot.regime_pnl.map((r) => [r.regime, r]));

  const dnaJobId = useMemo(
    () => findDnaJobId(bot.strategy_name, bot.ticker, jobs),
    [bot.strategy_name, bot.ticker, jobs],
  );

  return (
    <div className="rounded-lg border">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Left: identity + metrics (clicking here toggles expand) */}
        <button
          className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium truncate">{rowLabel(bot)}</span>
            {stateColors && snapshot && (
              <Badge variant={stateColors.badgeVariant} className="text-[10px] h-4 shrink-0">
                {getBotStateLabel(snapshot.state)}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <span title="This bot's share of total fleet capital.">
              Capital {formatPercent(bot.capital_allocation_pct)}
            </span>
            {' · '}
            <span title="Euler component VaR-99 share. Higher than Capital % → bot amplifies fleet tail risk; lower → diversifier.">
              Risk Share {formatPercent(riskPct)}
            </span>
            {' · '}
            <span title="On the fleet's worst days (99th percentile), this fraction of losses came from this bot.">
              Tail Loss Share {formatPercent(varPct)}
            </span>
            {' · '}
            <span title="This bot's own worst-day loss estimate with 95% confidence, measured in isolation (1-day historical VaR). Does not account for correlation with other bots.">
              Standalone VaR {formatPercent(standaloneVarPct)}
            </span>
          </p>
        </button>

        {/* Right: capital value + P&L */}
        <div className="text-right shrink-0">
          <p className="font-mono-data text-sm font-semibold">
            {formatCurrencyCompact(bot.capital_allocation)}
          </p>
          {snapshot != null && (
            <p
              className={`font-mono-data text-[11px] ${
                unrealizedPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {unrealizedPositive ? '+' : ''}
              {formatCurrencyCompact(snapshot.unrealized_pnl)}{' '}
              <span className="opacity-70">open</span>
            </p>
          )}
          <p
            className={`font-mono-data text-[11px] font-semibold ${
              pnlPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {pnlPositive ? '+' : ''}
            {formatCurrencyCompact(bot.realized_pnl)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatPercent(bot.realized_pnl_pct_of_fleet, true)} fleet P&amp;L
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
            <Link href={`/operations?bot=${bot.bot_id}`} aria-label="Open in Operations">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onToggle}
            aria-label="Toggle details"
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Expanded accordion body */}
      {open && (
        <div className="border-t px-3 py-3 space-y-4">
          {/* Section 1: Regime P&L Breakdown */}
          <div>
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
                    <p className="text-[10px] text-muted-foreground">Trades {count}</p>
                    <p className="text-[10px] text-muted-foreground">Win {wins.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">
                      Avg PnL/Trade {formatPercent(avgRet, true)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Strategy DNA */}
          <StrategyDNA jobId={dnaJobId} compact />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function PortfolioContributionPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError } = useFleetPortfolioContribution();
  const { data: fleetState } = useFleetState();
  const { data: jobs = [] } = useBacktestList();

  // Snapshot lookup by bot_id — for state badge and unrealized P&L
  const snapshotById = useMemo(() => {
    const map: Record<string, BotSnapshot> = {};
    for (const snap of fleetState?.bot_snapshots ?? []) {
      map[snap.bot_id] = snap;
    }
    return map;
  }, [fleetState]);

  const toggle = (botId: string) =>
    setExpanded((prev) => ({ ...prev, [botId]: !prev[botId] }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployed Strategies</CardTitle>
          <CardDescription>Holdings, realized P&amp;L, risk attribution, and regime breakdown per bot</CardDescription>
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
          <CardTitle>Deployed Strategies</CardTitle>
          <CardDescription>Holdings, realized P&amp;L, risk attribution, and regime breakdown per bot</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load portfolio data.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployed Strategies</CardTitle>
          <CardDescription>Holdings, realized P&amp;L, risk attribution, and regime breakdown per bot</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No portfolio data available yet. Deploy at least one bot with closed trades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployed Strategies</CardTitle>
        <CardDescription>
          Total capital {formatCurrencyCompact(data.total_capital)} · realized P&amp;L{' '}
          {formatCurrencyCompact(data.total_realized_pnl)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.bot_contributions.map((bot) => (
          <BotRow
            key={bot.bot_id}
            bot={bot}
            snapshot={snapshotById[bot.bot_id]}
            jobs={jobs}
            open={expanded[bot.bot_id] ?? false}
            onToggle={() => toggle(bot.bot_id)}
          />
        ))}

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
