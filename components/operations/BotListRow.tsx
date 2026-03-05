'use client';

import { ChevronDown, ChevronRight, AlertTriangle, RefreshCw, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BotAccordionBody from '@/components/operations/BotAccordionBody';
import { getBotStateColors } from '@/lib/colors';
import { getBotStateLabel } from '@/lib/regimeLabel';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { BotSnapshot, Recommendation } from '@/types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBotIdentifier(bot: BotSnapshot): string {
  if (bot.strategy_id && bot.ticker) return `${bot.strategy_id} / ${bot.ticker}`;
  return `${bot.bot_id.slice(0, 8)}\u2026`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BotListRowProps {
  bot: BotSnapshot;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenDrawer: () => void;
  recommendations: Recommendation[];
}

/**
 * Single expandable row in the Operations bot list.
 *
 * Header (always visible): chevron · state dot · state badge · bot identifier ·
 * drift/rediscovery icons · capital · unrealized P&L
 *
 * Body (when expanded): trade summary, matching recommendations (≤2), action buttons.
 *
 * Circuit_breaker bots get a 3px red left border + subtle red background.
 */
export default function BotListRow({
  bot,
  isExpanded,
  onToggle,
  onOpenDrawer,
  recommendations,
}: BotListRowProps) {
  const stateColors = getBotStateColors(bot.state);
  const stateLabel = getBotStateLabel(bot.state);
  const isCircuitBreaker = bot.state === 'circuit_breaker';
  const pnlPositive = bot.unrealized_pnl >= 0;

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isCircuitBreaker && 'border-l-[3px] border-l-destructive bg-destructive/5',
      )}
    >
      {/* Row header — click to expand / collapse */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left rounded-lg"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${getBotIdentifier(bot)} — ${isExpanded ? 'collapse' : 'expand'}`}
      >
        {/* Chevron */}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* State dot */}
        <Circle className={`h-2 w-2 shrink-0 fill-current ${stateColors.dotColor}`} />

        {/* State badge */}
        <Badge variant={stateColors.badgeVariant} className="text-[10px] h-5 shrink-0">
          {stateLabel}
        </Badge>

        {/* Bot identifier */}
        <span className="font-mono-data text-xs text-muted-foreground truncate min-w-0">
          {getBotIdentifier(bot)}
        </span>

        {/* Drift / rediscovery icons — only when flags are set */}
        {bot.drift_detected && (
          <AlertTriangle
            className="h-3.5 w-3.5 shrink-0 text-amber-500"
            aria-label="Drift detected"
          />
        )}
        {bot.rediscovery_recommended && (
          <RefreshCw
            className="h-3.5 w-3.5 shrink-0 text-blue-500"
            aria-label="Rediscovery recommended"
          />
        )}

        {/* Right-side: capital + P&L */}
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {formatCurrency(bot.current_capital)}
          </span>
          <span
            className={`font-mono-data text-xs font-semibold ${
              pnlPositive ? 'text-green-600 dark:text-green-400' : 'text-destructive'
            }`}
          >
            {pnlPositive ? '+' : ''}
            {formatCurrency(bot.unrealized_pnl)}
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <BotAccordionBody
          bot={bot}
          recommendations={recommendations}
          onOpenDrawer={onOpenDrawer}
        />
      )}
    </div>
  );
}
