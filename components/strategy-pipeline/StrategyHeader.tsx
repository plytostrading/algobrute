'use client';

/**
 * StrategyHeader — page header for the F.2 strategy-lifecycle view.
 *
 * Renders:
 *   - Ticker (mono-font) + humanised strategy_class
 *   - Originated date in a "{N} days ago" tone with absolute date in
 *     the tooltip
 *   - Current stage chip — the most-recently-active stage as derived
 *     from the lifecycle view.  Lets the user orient instantly:
 *     "Where am I in this strategy's life?"
 *
 * Stage-chip ordering (most-recently-active first match wins):
 *   1. Live operating (bot exists + closed trades > 0)
 *   2. Bot deployed (bot exists)
 *   3. Deep validation running (deep_job_status === 'running' | 'pending')
 *   4. Deep validation complete (deep_passport_deployment_approved !== null)
 *   5. Deep validation failed (deep_job_status === 'failed')
 *   6. Light backtest complete (default — passport row exists)
 */

import { Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { StrategyLifecycleView } from '@/types/api';

interface StrategyHeaderProps {
  view: StrategyLifecycleView;
}

interface CurrentStageChip {
  label: string;
  className: string;
}

function humaniseClass(cls: string): string {
  return cls
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function relativeTime(iso: string): { relative: string; absolute: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { relative: '—', absolute: iso };
  }
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const absolute = d.toLocaleString();
  if (diffSec < 60) return { relative: 'just now', absolute };
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return { relative: `${diffMin}m ago`, absolute };
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return { relative: `${diffHr}h ago`, absolute };
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return { relative: `${diffDay}d ago`, absolute };
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return { relative: `${diffMonth}mo ago`, absolute };
  const diffYear = Math.floor(diffDay / 365);
  return { relative: `${diffYear}y ago`, absolute };
}

export function deriveCurrentStageChip(view: StrategyLifecycleView): CurrentStageChip {
  if (view.bot_id !== null && (view.live_closed_trade_count ?? 0) > 0) {
    return {
      label: 'Live operating',
      className:
        'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
    };
  }
  if (view.bot_id !== null) {
    return {
      label: 'Bot deployed',
      className: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300',
    };
  }
  if (view.deep_job_status === 'running' || view.deep_job_status === 'pending') {
    return {
      label: 'Deep validation running',
      className: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300',
    };
  }
  if (view.deep_job_status === 'failed') {
    return {
      label: 'Deep validation failed',
      className: 'bg-destructive/15 text-destructive border-destructive/30',
    };
  }
  if (
    view.deep_job_status === 'complete' &&
    view.deep_passport_deployment_approved !== null
  ) {
    return view.deep_passport_deployment_approved
      ? {
          label: 'Deep validation approved',
          className:
            'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        }
      : {
          label: 'Deep validation blocked',
          className:
            'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
        };
  }
  return {
    label: 'Light backtest complete',
    className: 'bg-muted text-muted-foreground border-border',
  };
}

export default function StrategyHeader({ view }: StrategyHeaderProps) {
  const { relative, absolute } = relativeTime(view.originated_at);
  const chip = deriveCurrentStageChip(view);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div>
        <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span className="font-mono">{view.ticker}</span>
          <span className="text-muted-foreground">·</span>
          <span data-testid="strategy-class">{humaniseClass(view.strategy_class)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Strategy Lifecycle — originated{' '}
          <span title={absolute}>{relative}</span>
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground/70">
            <Hash className="h-3 w-3" />
            <span className="font-mono">{view.light_passport_id.slice(0, 8)}…</span>
          </span>
        </p>
      </div>
      <Badge
        variant="outline"
        className={`text-xs ${chip.className}`}
        data-testid="current-stage-chip"
      >
        {chip.label}
      </Badge>
    </div>
  );
}
