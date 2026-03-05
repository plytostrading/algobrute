'use client';

import Link from 'next/link';
import type { BotSnapshot } from '@/types/api';

interface AlertStripProps {
  /** Only bots with state === 'circuit_breaker' | 'paused_monitoring' */
  bots: BotSnapshot[];
}

/**
 * Horizontal strip of alert chips for bots requiring operator attention.
 * Returns null when there are no alerted bots — no DOM presence, no empty space.
 *
 * Each chip links to /operations?bot={bot_id} so the operator can drill in.
 * Horizontal scroll handles the multi-bot case.
 */
export default function AlertStrip({ bots }: AlertStripProps) {
  if (bots.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto py-1"
      role="status"
      aria-label="Fleet alerts"
    >
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        Alerts:
      </span>

      {bots.map((bot) => {
        const isCircuitBreaker = bot.state === 'circuit_breaker';
        const stateLabel = isCircuitBreaker ? 'Circuit Breaker' : 'Monitoring';
        // Show first 8 chars of bot_id — standard UUID prefix convention
        const shortId = bot.bot_id.length > 8 ? `${bot.bot_id.slice(0, 8)}\u2026` : bot.bot_id;

        return (
          <Link
            key={bot.bot_id}
            href={`/operations?bot=${bot.bot_id}`}
            className={[
              'shrink-0 inline-flex items-center gap-1.5 rounded-full border',
              'px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80',
              isCircuitBreaker
                ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
            ].join(' ')}
          >
            {/* State indicator dot */}
            <div
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                isCircuitBreaker ? 'bg-red-500' : 'bg-amber-500'
              }`}
            />
            <span>
              {stateLabel}: {shortId}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
