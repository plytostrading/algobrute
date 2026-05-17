'use client';

/**
 * LiveOperationStageCard — fifth (final) row of the F.2 timeline.
 *
 * Four mutually-exclusive states:
 *
 *   1. No bot yet           (bot_id === null)
 *      → pending status, "Awaiting deployment" copy.
 *   2. Bot ramping          (bot_id set, live_closed_trade_count is null/0)
 *      → pending status, "Ramping; no closed trades yet" copy.
 *   3. Bot live with trades (bot_id set, live_closed_trade_count > 0)
 *      → complete status, live P&L (USD + %) + closed/open counts +
 *        last_updated_at + "View Full Performance" link.
 *   4. Bot stopped without trades (bot_id set, state = 'stopped',
 *      live_closed_trade_count is 0)
 *      → skipped — bot retired before recording trade evidence.
 *
 * Live P&L is colour-coded vs zero; ``live_total_pnl_usd`` of exactly
 * ``0.0`` (closed trades that net to zero) renders neutrally rather
 * than green/red — the colour conveys "did the bot make or lose
 * money", and exactly-zero is neither.
 *
 * Behavioral monitoring (task #365):
 *   When the variant is ``active`` — i.e., the bot has produced at
 *   least one closed trade — a "Live behavior" section appears
 *   beneath the P&L block.  It reuses the operations-route
 *   :file:`MonitoringPanel` component to surface SPRT, CUSUM, and
 *   Bayesian indicators in plain language, sourced from
 *   :func:`useMonitoringReport`.  The hook is gated by
 *   ``enabled: !!botId``, so no request is made for ``no_bot`` /
 *   ``ramping`` / ``stopped`` variants.  The intent is that a
 *   customer viewing a single strategy's lifecycle never needs to
 *   bounce to the Operations route just to learn what the platform
 *   thinks of its live behavior.
 */

import Link from 'next/link';
import { Activity, ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import StageCard, { type StageStatus } from './StageCard';
import MonitoringPanel from '@/components/operations/MonitoringPanel';
import { useMonitoringReport } from '@/hooks/useMonitoringReport';
import { cn } from '@/lib/utils';
import type { StrategyLifecycleView } from '@/types/api';

interface LiveOperationStageCardProps {
  view: StrategyLifecycleView;
}

interface DerivedState {
  status: StageStatus;
  statusLabel: string;
  variant: 'no_bot' | 'ramping' | 'active' | 'stopped';
}

export function deriveLiveState(view: StrategyLifecycleView): DerivedState {
  if (view.bot_id === null) {
    return { status: 'pending', statusLabel: 'Awaiting deployment', variant: 'no_bot' };
  }
  if (view.bot_state === 'stopped' && (view.live_closed_trade_count ?? 0) === 0) {
    return { status: 'skipped', statusLabel: 'Stopped', variant: 'stopped' };
  }
  if ((view.live_closed_trade_count ?? 0) === 0) {
    return { status: 'pending', statusLabel: 'Ramping', variant: 'ramping' };
  }
  return { status: 'complete', statusLabel: 'Live', variant: 'active' };
}

function pnlTone(value: number | null): 'positive' | 'negative' | 'neutral' {
  if (value === null) return 'neutral';
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

function pnlClass(tone: 'positive' | 'negative' | 'neutral'): string {
  switch (tone) {
    case 'positive':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'negative':
      return 'text-destructive';
    case 'neutral':
      return 'text-muted-foreground';
  }
}

function formatUsd(value: number | null): string {
  if (value === null) return '—';
  const abs = Math.abs(value);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}$${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPct(value: number | null): string {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function LiveOperationStageCard({ view }: LiveOperationStageCardProps) {
  const state = deriveLiveState(view);
  const tone = pnlTone(view.live_total_pnl_usd);
  const ToneIcon =
    tone === 'positive' ? TrendingUp : tone === 'negative' ? TrendingDown : Minus;

  // Behavioral monitoring is meaningful only once the bot has produced
  // closed-trade evidence — SPRT/CUSUM/Bayesian indicators have no
  // input before the first close.  The hook short-circuits when bot_id
  // is null/undefined; we additionally gate by variant so no fetch is
  // issued for ramping/stopped bots either.
  const monitoringBotId = state.variant === 'active' ? view.bot_id : null;
  const { data: monitoringReport, isLoading: monitoringLoading } =
    useMonitoringReport(monitoringBotId);

  return (
    <StageCard
      stageNumber={5}
      title="Live operation"
      subtitle={
        state.variant === 'active'
          ? 'Realised P&L from closed trades'
          : state.variant === 'ramping'
            ? 'Bot deployed; waiting for first closed trade'
            : state.variant === 'stopped'
              ? 'Bot retired before producing live evidence'
              : 'Deploy a bot to begin recording live evidence'
      }
      status={state.status}
      statusLabel={state.statusLabel}
      testId="stage-live-operation"
    >
      {state.variant === 'no_bot' && (
        <p className="text-xs text-muted-foreground" data-testid="live-state-no-bot">
          Live trade evidence will appear here once a paper bot is
          deployed in stage 4 above.
        </p>
      )}

      {state.variant === 'ramping' && (
        <div className="space-y-2" data-testid="live-state-ramping">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Bot is ramping; no closed trades yet.
          </p>
          {view.live_open_position_count !== null && view.live_open_position_count > 0 && (
            <p className="text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">
                {view.live_open_position_count}
              </span>{' '}
              open position{view.live_open_position_count === 1 ? '' : 's'}{' '}
              currently held.
            </p>
          )}
        </div>
      )}

      {state.variant === 'stopped' && (
        <p className="text-xs text-muted-foreground" data-testid="live-state-stopped">
          This bot was retired before any trades closed.  No live
          evidence was recorded.
        </p>
      )}

      {state.variant === 'active' && (
        <div className="space-y-3" data-testid="live-state-active">
          {/* Headline P&L */}
          <div className="flex flex-wrap items-baseline gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Total P&amp;L
              </span>
              <p
                className={cn('font-mono text-2xl font-semibold', pnlClass(tone))}
                data-testid="live-total-pnl-usd"
              >
                <ToneIcon className="inline h-5 w-5 mr-1 align-middle" />
                {formatUsd(view.live_total_pnl_usd)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Return
              </span>
              <p
                className={cn('font-mono text-base font-semibold', pnlClass(tone))}
                data-testid="live-total-pnl-pct"
              >
                {formatPct(view.live_total_pnl_pct)}
              </p>
            </div>
          </div>

          {/* Trade counts */}
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-md border bg-card p-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Closed trades
              </span>
              <p className="font-mono text-sm font-semibold mt-0.5">
                {view.live_closed_trade_count ?? 0}
              </p>
            </div>
            <div className="rounded-md border bg-card p-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Open positions
              </span>
              <p className="font-mono text-sm font-semibold mt-0.5">
                {view.live_open_position_count ?? 0}
              </p>
            </div>
            <div className="rounded-md border bg-card p-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Last activity
              </span>
              <p className="text-xs mt-0.5">{relativeTime(view.live_last_updated_at)}</p>
            </div>
          </div>

          {/* Behavioral monitoring — task #365.  Reuses the operations
              MonitoringPanel so the customer never needs to leave this
              page to see SPRT / CUSUM / Bayesian verdicts in plain
              language.  Visible only when the bot has produced closed
              trades (active variant only). */}
          <div
            className="mt-4 space-y-2 border-t border-border pt-3"
            data-testid="live-monitoring-section"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live behavior
            </h4>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Real-time skill, drift, and win-rate verdicts derived
              from this bot&apos;s closed trades.
            </p>
            <MonitoringPanel
              report={monitoringReport}
              isLoading={monitoringLoading}
            />
          </div>

          <Link
            href={`/operations?bot=${view.bot_id}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
            data-testid="live-view-performance-link"
          >
            <Activity className="h-3 w-3" />
            View Full Performance
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </StageCard>
  );
}
