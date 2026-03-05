'use client';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';
import { useBacktestTrades } from '@/hooks/useBacktestWorkflow';

const REGIME_NAMES: Record<number, string> = { 0: 'Low Vol', 1: 'Normal', 2: 'Elevated Vol', 3: 'Crisis' };

interface JournalTabProps {
  jobId: string | null;
}

export default function JournalTab({ jobId }: JournalTabProps) {
  const { data: trades = [], isLoading, isError, error } = useBacktestTrades(jobId, !!jobId);

  if (!jobId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-sm text-muted-foreground">Select a completed backtest above to view the trade journal.</p>
          <Link href="/workbench" className="text-xs text-primary underline-offset-4 hover:underline">
            Run a backtest in the Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">{error?.message ?? 'Failed to load trade journal.'}</p>
          <p className="text-xs text-muted-foreground">
            Select another completed backtest from the selector, or rerun this one.
          </p>
          <Link href="/workbench" className="text-xs text-primary underline-offset-4 hover:underline">
            Open Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">No completed trades were recorded for this backtest.</p>
          <p className="text-xs text-muted-foreground">
            Try a different completed job from the selector or rerun with a broader window.
          </p>
          <Link href="/workbench" className="text-xs text-primary underline-offset-4 hover:underline">
            Rerun in Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const wins = trades.filter((t) => (t.realized_pnl ?? 0) > 0);
  const losses = trades.filter((t) => (t.realized_pnl ?? 0) < 0);
  const totalPL = trades.reduce((s, t) => s + (t.realized_pnl ?? 0), 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + (t.realized_pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + (t.realized_pnl ?? 0), 0) / losses.length : 0;
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;

  const kpis = [
    { label: 'Total Trades', value: String(trades.length) },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%` },
    { label: 'Net P&L', value: formatCurrency(totalPL), positive: totalPL >= 0 },
    { label: 'Avg Win', value: formatCurrency(avgWin), positive: true },
    { label: 'Avg Loss', value: formatCurrency(avgLoss), positive: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="gap-1 py-3">
            <CardHeader className="pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className={`font-mono-data text-xl font-bold ${kpi.positive === true ? 'text-success' : kpi.positive === false ? 'text-destructive' : ''}`}>
                {kpi.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trade Journal Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Journal</CardTitle>
          <CardDescription>{isLoading ? 'Loading…' : `${trades.length} completed trades`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Ticker</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Side</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Entry Date</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Entry $</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Exit Date</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Exit $</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">P&L</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Ret%</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Bars</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Regime</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Exit Reason</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.trade_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-2 font-mono-data font-bold">{t.ticker}</td>
                    <td className="py-2.5 px-2">
                      <Badge variant={t.side === 'long' ? 'default' : 'destructive'} className="text-[10px]">
                        {t.side.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-data">{t.quantity}</td>
                    <td className="py-2.5 px-2 text-right font-mono-data text-muted-foreground">{t.entry_date.slice(0, 10)}</td>
                    <td className="py-2.5 px-2 text-right font-mono-data">{formatCurrency(t.entry_price)}</td>
                    <td className="py-2.5 px-2 text-right font-mono-data text-muted-foreground">{t.exit_date?.slice(0, 10) ?? '\u2014'}</td>
                    <td className="py-2.5 px-2 text-right font-mono-data">{t.exit_price != null ? formatCurrency(t.exit_price) : '\u2014'}</td>
                    <td className={`py-2.5 px-2 text-right font-mono-data font-bold ${(t.realized_pnl ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.realized_pnl != null ? `${t.realized_pnl >= 0 ? '+' : ''}${formatCurrency(t.realized_pnl)}` : '\u2014'}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono-data font-semibold ${(t.realized_pnl_pct ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.realized_pnl_pct != null ? `${t.realized_pnl_pct >= 0 ? '+' : ''}${t.realized_pnl_pct.toFixed(2)}%` : '\u2014'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-data text-muted-foreground">{t.holding_bars ?? '\u2014'}</td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground">{REGIME_NAMES[t.entry_regime] ?? String(t.entry_regime)}</td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground max-w-[140px] truncate">{t.exit_reason ?? '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
