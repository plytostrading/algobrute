import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TerminalLabel from '@/components/common/TerminalLabel';
import MetricGrid from '@/components/common/MetricGrid';
import PLText from '@/components/common/PLText';
import { mockJournalEntries } from '@/mock/mockData';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import type { BacktestMetric } from '@/types';

export default function JournalTab() {
  const entries = mockJournalEntries;
  const totalTrades = entries.length;
  const wins = entries.filter((e) => e.netPL > 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalPL = entries.reduce((s, e) => s + e.netPL, 0);
  const avgWin = entries.filter((e) => e.netPL > 0).reduce((s, e) => s + e.netPL, 0) / (wins || 1);
  const losses = entries.filter((e) => e.netPL < 0);
  const avgLoss = losses.length > 0 ? losses.reduce((s, e) => s + e.netPL, 0) / losses.length : 0;

  const kpis: BacktestMetric[] = [
    { label: 'TOTAL TRADES', value: totalTrades, format: 'number' },
    { label: 'WIN RATE', value: winRate, format: 'percent' },
    { label: 'NET P&L', value: totalPL, format: 'currency' },
    { label: 'AVG WIN', value: avgWin, format: 'currency' },
    { label: 'AVG LOSS', value: avgLoss, format: 'currency' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* KPIs */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="⊞" className="mb-3">JOURNAL_KPIs</TerminalLabel>
          <MetricGrid metrics={kpis} columns={5} />
        </CardContent>
      </Card>

      {/* Trade Journal Table */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="⊞" className="mb-3">TRADE_JOURNAL</TerminalLabel>
          {/* Header */}
          <div className="grid grid-cols-[60px_60px_50px_80px_80px_80px_60px_60px_1fr] gap-2 border-b pb-2 mb-2">
            {['SYMBOL', 'SIDE', 'QTY', 'ENTRY', 'EXIT', 'NET P&L', 'RETURN', 'DURATION', 'NOTES'].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</span>
            ))}
          </div>
          {/* Rows */}
          <div className="flex flex-col gap-1">
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[60px_60px_50px_80px_80px_80px_60px_60px_1fr] gap-2 items-center rounded-md border bg-background px-2 py-1.5">
                <span className="numeric-data text-xs font-bold">{entry.symbol}</span>
                <Badge variant={entry.side === 'long' ? 'default' : 'destructive'} className="text-[10px] w-fit">{entry.side.toUpperCase()}</Badge>
                <span className="numeric-data text-xs">{entry.quantity}</span>
                <span className="numeric-data text-xs">{formatCurrency(entry.entryPrice)}</span>
                <span className="numeric-data text-xs">{formatCurrency(entry.exitPrice)}</span>
                <PLText value={entry.netPL} size="sm" />
                <span className={`numeric-data text-xs font-semibold ${entry.returnPercent >= 0 ? 'text-success' : 'text-destructive'}`}>{entry.returnPercent >= 0 ? '+' : ''}{entry.returnPercent.toFixed(2)}%</span>
                <span className="numeric-data text-xs">{formatDuration(entry.holdingPeriod)}</span>
                <span className="text-xs text-muted-foreground truncate">{entry.notes}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
