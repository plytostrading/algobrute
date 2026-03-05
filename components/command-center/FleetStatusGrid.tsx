// @deprecated — Superseded by BotAccordion (Batch 4). Kept for reference; safe to delete after PR is verified.
'use client';

import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pause, Play, Eye, Circle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBots, usePauseBot, useResumeBot } from '@/hooks/useBots';
import { toast } from 'sonner';
import { getBotStateColors } from '@/lib/colors';
import { getBotStateLabel } from '@/lib/regimeLabel';
import { formatCurrency } from '@/utils/formatters';
import type { BotSnapshot } from '@/types/api';

function botNarrative(bot: BotSnapshot): string {
  if (bot.drift_detected) return '⚠ Performance drift detected — rediscovery may be recommended.';
  if (bot.rediscovery_recommended) return 'Rediscovery recommended based on recent trade patterns.';
  if (bot.state === 'circuit_breaker') return 'Circuit breaker triggered. Bot paused until manual review.';
  if (bot.state === 'paused_regime') return 'Bot paused automatically due to adverse regime conditions.';
  return 'Bot operating normally within expected parameters.';
}

export default function FleetStatusGrid() {
  const router = useRouter();
  const { data: bots, isLoading, isError } = useBots();
  const pauseBot = usePauseBot();
  const resumeBot = useResumeBot();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Status</CardTitle>
        <CardDescription>
          {isLoading ? 'Loading…' : `${bots?.length ?? 0} bots deployed`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">Failed to load fleet data. Please try again.</p>
        )}

        {!isLoading && !isError && (
          <div className="space-y-4">
            {(bots ?? []).map((bot) => {
              const stateColors = getBotStateColors(bot.state);
              const stateLabel = getBotStateLabel(bot.state);
              const unrealizedPositive = bot.unrealized_pnl >= 0;
              const sharpeDisplay = isNaN(bot.sharpe_realized)
                ? '—'
                : bot.sharpe_realized.toFixed(2);
              const isPending =
                pauseBot.isPending && pauseBot.variables === bot.bot_id ||
                resumeBot.isPending && resumeBot.variables === bot.bot_id;

              return (
                <div
                  key={bot.bot_id}
                  className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  {/* Status dot + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Circle className={`h-2 w-2 fill-current ${stateColors.dotColor}`} />
                      <span className="font-mono-data text-xs text-muted-foreground truncate">
                        {bot.bot_id.substring(0, 8)}…
                      </span>
                      <Badge variant={stateColors.badgeVariant} className="text-[10px] h-5">
                        {stateLabel}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                      {botNarrative(bot)}
                    </p>

                    {/* Metrics row */}
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Capital</p>
                        <p className="font-mono-data text-sm font-medium">{formatCurrency(bot.current_capital)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unrealized P&L</p>
                        <p className={`font-mono-data text-sm font-medium ${unrealizedPositive ? 'text-success' : 'text-destructive'}`}>
                          {unrealizedPositive ? '+' : ''}{formatCurrency(bot.unrealized_pnl)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Open Trades</p>
                        <p className="font-mono-data text-sm font-medium">{bot.n_open_trades}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sharpe</p>
                        <p className="font-mono-data text-sm font-medium">{sharpeDisplay}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isPending}>
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {bot.state === 'active' && (
                        <DropdownMenuItem onClick={() => pauseBot.mutate(bot.bot_id, {
                          onSuccess: () => toast.success('Bot paused'),
                          onError: (err) => toast.error(`Failed to pause: ${err.message}`),
                        })}>
                          <Pause className="mr-2 h-4 w-4" /> Pause
                        </DropdownMenuItem>
                      )}
                      {(bot.state === 'paused_user' || bot.state === 'paused_regime' || bot.state === 'paused_monitoring') && (
                        <DropdownMenuItem onClick={() => resumeBot.mutate(bot.bot_id, {
                          onSuccess: () => toast.success('Bot resumed'),
                          onError: (err) => toast.error(`Failed to resume: ${err.message}`),
                        })}>
                          <Play className="mr-2 h-4 w-4" /> Resume
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/operations')}>
                        <Eye className="mr-2 h-4 w-4" /> View in Operations
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}

            {bots?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No bots deployed yet.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
