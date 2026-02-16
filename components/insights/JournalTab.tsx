'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockJournalEntries } from '@/mock/mockData';
import { formatCurrency, formatDuration } from '@/utils/formatters';

export default function JournalTab() {
  const entries = mockJournalEntries;
  const totalTrades = entries.length;
  const wins = entries.filter((e) => e.netPL > 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalPL = entries.reduce((s, e) => s + e.netPL, 0);
  const avgWin = entries.filter((e) => e.netPL > 0).reduce((s, e) => s + e.netPL, 0) / (wins || 1);
  const losses = entries.filter((e) => e.netPL < 0);
  const avgLoss = losses.length > 0 ? losses.reduce((s, e) => s + e.netPL, 0) / losses.length : 0;

  const kpis = [
    { label: 'Total Trades', value: String(totalTrades) },
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
          <CardDescription>{entries.length} completed trades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Symbol</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Side</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Entry</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Exit</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Net P&L</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Return</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Duration</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-2 font-mono-data font-bold">{entry.symbol}</td>
                    <td className="py-2.5 px-2">
                      <Badge variant={entry.side === 'long' ? 'default' : 'destructive'} className="text-[10px]">
                        {entry.side.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-data">{entry.quantity}</td>
                    <td className="py-2.5 px-2 text-right font-mono-data">{formatCurrency(entry.entryPrice)}</td>
                    <td className="py-2.5 px-2 text-right font-mono-data">{formatCurrency(entry.exitPrice)}</td>
                    <td className={`py-2.5 px-2 text-right font-mono-data font-bold ${entry.netPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {entry.netPL >= 0 ? '+' : ''}{formatCurrency(entry.netPL)}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono-data font-semibold ${entry.returnPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {entry.returnPercent >= 0 ? '+' : ''}{entry.returnPercent.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-data text-muted-foreground">{formatDuration(entry.holdingPeriod)}</td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground max-w-[200px] truncate">{entry.notes}</td>
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
