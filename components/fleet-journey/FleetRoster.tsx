'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JourneyBot } from '@/hooks/useFleetJourney';

type SortKey =
  | 'ticker'
  | 'strategy_id'
  | 'n_trades'
  | 'sharpe'
  | 'max_dd_pct'
  | 'n_interventions';

export function FleetRoster({ bots }: { bots: JourneyBot[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('n_trades');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const copy = [...bots];
    copy.sort((a, b) => {
      const va = pickSortable(a, sortKey);
      const vb = pickSortable(b, sortKey);
      const mult = sortDir === 'asc' ? 1 : -1;
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * mult;
      }
      return String(va).localeCompare(String(vb)) * mult;
    });
    return copy;
  }, [bots, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'ticker' || key === 'strategy_id' ? 'asc' : 'desc');
    }
  };

  const active = bots.filter((b) => b.n_trades > 0).length;
  const dormant = bots.length - active;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your fleet — {bots.length} bot{bots.length === 1 ? '' : 's'}
        </CardTitle>
        <CardDescription>
          Every bot in your fleet, across all tickers and strategies.{' '}
          {active} actively trading · {dormant} dormant (no closed trades yet).
          Click a bot to see its individual equity curve and interventions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
            <Users className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">No bots deployed yet</div>
            <div className="max-w-sm text-xs text-muted-foreground">
              Deploy paper bots from the Workbench to start populating the
              Fleet Journey.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <SortHeader
                    label="Ticker"
                    active={sortKey === 'ticker'}
                    dir={sortDir}
                    onClick={() => toggleSort('ticker')}
                  />
                  <SortHeader
                    label="Strategy"
                    active={sortKey === 'strategy_id'}
                    dir={sortDir}
                    onClick={() => toggleSort('strategy_id')}
                  />
                  <SortHeader
                    label="Trades"
                    align="right"
                    active={sortKey === 'n_trades'}
                    dir={sortDir}
                    onClick={() => toggleSort('n_trades')}
                  />
                  <SortHeader
                    label="Sharpe"
                    align="right"
                    active={sortKey === 'sharpe'}
                    dir={sortDir}
                    onClick={() => toggleSort('sharpe')}
                  />
                  <SortHeader
                    label="Max DD"
                    align="right"
                    active={sortKey === 'max_dd_pct'}
                    dir={sortDir}
                    onClick={() => toggleSort('max_dd_pct')}
                  />
                  <SortHeader
                    label="Interventions"
                    align="right"
                    active={sortKey === 'n_interventions'}
                    dir={sortDir}
                    onClick={() => toggleSort('n_interventions')}
                  />
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <FleetRosterRow key={b.bot_id} bot={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FleetRosterRow({ bot: b }: { bot: JourneyBot }) {
  const sharpeTone =
    b.sharpe === null
      ? 'text-muted-foreground'
      : b.sharpe >= 1
        ? 'text-green-600'
        : b.sharpe >= 0
          ? 'text-amber-600'
          : 'text-destructive';
  const ddTone =
    b.max_dd_pct === null
      ? 'text-muted-foreground'
      : b.max_dd_pct <= 5
        ? 'text-green-600'
        : b.max_dd_pct <= 15
          ? 'text-amber-600'
          : 'text-destructive';
  return (
    <tr className="border-b last:border-0 hover:bg-muted/40">
      <td className="px-3 py-2">
        <Link
          href={`/portfolio/${b.bot_id}`}
          className="font-mono font-semibold hover:text-primary"
          title="View bot detail"
        >
          {b.ticker}
        </Link>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {prettyStrategy(b.strategy_id)}
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs">{b.n_trades}</td>
      <td className={`px-3 py-2 text-right font-mono text-xs ${sharpeTone}`}>
        {b.sharpe === null ? '—' : b.sharpe.toFixed(2)}
      </td>
      <td className={`px-3 py-2 text-right font-mono text-xs ${ddTone}`}>
        {b.max_dd_pct === null ? '—' : `-${b.max_dd_pct.toFixed(1)}%`}
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs">
        {b.n_interventions}
        {b.most_applied_intervention && (
          <span className="ml-1 text-muted-foreground">
            · {b.most_applied_intervention}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        {b.n_trades === 0 ? (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Dormant
          </Badge>
        ) : b.n_trades < 5 ? (
          <Badge variant="outline" className="text-[10px] text-amber-600">
            Accumulating
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-green-600">
            Active
          </Badge>
        )}
      </td>
    </tr>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
  align?: 'left' | 'right';
}) {
  const Icon = dir === 'asc' ? ChevronUp : ChevronDown;
  return (
    <th className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        <span>{label}</span>
        {active && <Icon className="h-3 w-3" />}
      </button>
    </th>
  );
}

function pickSortable(b: JourneyBot, key: SortKey): string | number | null {
  switch (key) {
    case 'ticker':
      return b.ticker;
    case 'strategy_id':
      return b.strategy_id;
    case 'n_trades':
      return b.n_trades;
    case 'sharpe':
      return b.sharpe;
    case 'max_dd_pct':
      return b.max_dd_pct;
    case 'n_interventions':
      return b.n_interventions;
  }
}

function prettyStrategy(id: string): string {
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
