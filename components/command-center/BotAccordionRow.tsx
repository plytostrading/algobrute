'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, RotateCcw, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBotStateColors } from '@/lib/colors';
import { formatCurrencyCompact } from '@/utils/formatters';
import type { BotSnapshot } from '@/types/api';

interface BotAccordionRowProps {
  bot: BotSnapshot;
}

export default function BotAccordionRow({ bot }: BotAccordionRowProps) {
  const router = useRouter();
  const stateColors = getBotStateColors(bot.state);
  const plPositive = bot.unrealized_pnl >= 0;
  const isCircuitBreaker = bot.state === 'circuit_breaker';

  // After Batch 6, bot_id is enriched with strategy_id + ticker.
  // Show strategy / ticker when both are non-empty; otherwise fall back to truncated UUID.
  const displayId =
    bot.strategy_id && bot.ticker
      ? `${bot.strategy_id} / ${bot.ticker}`
      : `${bot.bot_id.slice(0, 8)}…`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/operations?bot=${bot.bot_id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/operations?bot=${bot.bot_id}`)}
      className={[
        'flex items-center gap-3 rounded-lg border cursor-pointer select-none',
        'px-3 py-2.5 transition-colors hover:bg-muted/50',
        isCircuitBreaker
          ? 'border-l-[3px] border-l-destructive bg-destructive/5 hover:bg-destructive/10'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* State dot + badge + identifier */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Circle className={`h-2 w-2 fill-current shrink-0 ${stateColors.dotColor}`} />
        <Badge variant={stateColors.badgeVariant} className="text-[10px] h-5 shrink-0">
          {stateColors.label}
        </Badge>
        <span className="font-mono-data text-xs text-muted-foreground truncate">{displayId}</span>
      </div>

      {/* Drift / rediscovery icons — shown only when true */}
      {bot.drift_detected && (
        <AlertTriangle className="h-3 w-3 text-warning shrink-0" aria-label="Drift detected" />
      )}
      {bot.rediscovery_recommended && (
        <RotateCcw
          className="h-3 w-3 text-info shrink-0"
          aria-label="Rediscovery recommended"
        />
      )}

      {/* Unrealized P&L (primary) + deployed capital (secondary) */}
      <div className="text-right shrink-0">
        <p
          className={`font-mono-data text-sm font-bold leading-none ${
            plPositive ? 'text-success' : 'text-destructive'
          }`}
        >
          {plPositive ? '+' : ''}
          {formatCurrencyCompact(bot.unrealized_pnl)}
        </p>
        <p className="font-mono-data text-[10px] text-muted-foreground mt-0.5 leading-none">
          {formatCurrencyCompact(bot.current_capital)}
        </p>
      </div>
    </div>
  );
}
