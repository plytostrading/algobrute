'use client';

/**
 * BotAllocationGrid
 *
 * Shows each bot as a "portfolio holding" row — allocation percentage,
 * capital, unrealized P&L, bot state, and an expandable Strategy DNA panel.
 *
 * Strategy DNA is linked by finding the most recent completed backtest job
 * where strategy_id + ticker match and a passport exists. This is pure
 * frontend filtering of already-fetched data; no new API calls are invented.
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { getBotStateColors } from '@/lib/colors';
import { getBotStateLabel } from '@/lib/regimeLabel';
import { useBacktestList } from '@/hooks/useBacktestWorkflow';
import StrategyDNA from '@/components/portfolio/StrategyDNA';
import type { BotSnapshot, FleetState } from '@/types/api';

// ---------------------------------------------------------------------------
// Helper: find the most recent passport-linked job for a bot
// ---------------------------------------------------------------------------

interface JobSummary {
  job_id: string;
  strategy_id: string;
  ticker: string;
  passport_id: string | null;
  updated_at: string;
  status: string;
}

function findDnaJobId(
  bot: BotSnapshot,
  jobs: JobSummary[],
): string | null {
  if (!bot.strategy_id || !bot.ticker) return null;
  const candidates = jobs
    .filter(
      (j) =>
        j.status === 'complete' &&
        j.passport_id !== null &&
        j.strategy_id === bot.strategy_id &&
        j.ticker === bot.ticker,
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return candidates[0]?.job_id ?? null;
}

// ---------------------------------------------------------------------------
// Single bot row
// ---------------------------------------------------------------------------

interface BotRowProps {
  bot: BotSnapshot;
  totalCapital: number;
  jobs: JobSummary[];
}

function BotRow({ bot, totalCapital, jobs }: BotRowProps) {
  const [open, setOpen] = useState(false);

  const allocationPct =
    totalCapital > 0
      ? Math.round((bot.current_capital / totalCapital) * 1000) / 10
      : 0;

  const pnlPositive = bot.unrealized_pnl >= 0;
  const stateColors = getBotStateColors(bot.state);
  const dnaJobId = useMemo(() => findDnaJobId(bot, jobs), [bot, jobs]);

  const label =
    bot.strategy_id && bot.ticker
      ? `${bot.strategy_id} · ${bot.ticker}`
      : bot.bot_id.slice(0, 12) + '…';

  return (
    <div className="rounded-lg border bg-card">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Allocation bar */}
        <div className="shrink-0 w-8 text-center">
          <div className="h-8 w-1.5 rounded-full bg-muted mx-auto relative">
            <div
              className="absolute bottom-0 left-0 w-full rounded-full bg-primary transition-all"
              style={{ height: `${Math.min(allocationPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{label}</span>
            <Badge
              variant={stateColors.badgeVariant}
              className="text-[10px] h-4.5 shrink-0"
            >
              {getBotStateLabel(bot.state)}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {allocationPct}% of portfolio
          </p>
        </div>

        {/* P&L */}
        <div className="text-right shrink-0">
          <p className="font-mono-data text-sm font-semibold">
            {formatCurrency(bot.current_capital)}
          </p>
          <p
            className={`font-mono-data text-[11px] ${
              pnlPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {pnlPositive ? '+' : ''}
            {formatCurrency(bot.unrealized_pnl)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle Strategy DNA"
          >
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            asChild
          >
            <Link href={`/operations?bot=${bot.bot_id}`} aria-label="Open in Operations">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Strategy DNA panel */}
      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <StrategyDNA jobId={dnaJobId} compact />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid wrapper
// ---------------------------------------------------------------------------

interface BotAllocationGridProps {
  fleetState: FleetState;
}

export default function BotAllocationGrid({ fleetState }: BotAllocationGridProps) {
  const { data: jobs = [] } = useBacktestList();

  const bots = useMemo(
    () =>
      [...fleetState.bot_snapshots].sort(
        (a, b) => b.current_capital - a.current_capital,
      ),
    [fleetState.bot_snapshots],
  );

  if (bots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-14 text-center">
        <p className="text-sm text-muted-foreground">
          No bots deployed yet.{' '}
          <Link href="/workbench" className="text-primary underline-offset-4 hover:underline">
            Build one in the Workbench
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Portfolio Holdings ({bots.length})
        </h3>
      </div>
      {bots.map((bot) => (
        <BotRow
          key={bot.bot_id}
          bot={bot}
          totalCapital={fleetState.total_capital}
          jobs={jobs}
        />
      ))}
    </div>
  );
}
