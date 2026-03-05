'use client';

import { formatCurrencyCompact } from '@/utils/formatters';
import type { FleetWeatherReport } from '@/types/api';

interface CapitalSummaryProps {
  weather: FleetWeatherReport;
  /** Aggregated unrealized P&L across all live bots (summed in page.tsx). */
  totalUnrealizedPL: number;
}

/**
 * Four key capital figures in a 2×2 grid.
 *
 * Designed to fit within the HeroZone height budget (~90px content).
 * Values use compact currency (e.g. $1.23M) to avoid overflow.
 * P&L colored green/red; all others neutral.
 */
export default function CapitalSummary({
  weather,
  totalUnrealizedPL,
}: CapitalSummaryProps) {
  const deployed = weather.fleet_capital * (1 - weather.cash_pct);
  const cashHeld = weather.fleet_capital * weather.cash_pct;
  const plPositive = totalUnrealizedPL >= 0;

  const items = [
    {
      label: 'Total Capital',
      value: formatCurrencyCompact(weather.fleet_capital),
      colorClass: '' as string,
    },
    {
      label: 'Deployed',
      value: formatCurrencyCompact(deployed),
      colorClass: '' as string,
    },
    {
      label: 'Cash Held',
      value: formatCurrencyCompact(cashHeld),
      colorClass: '' as string,
    },
    {
      label: 'Unrealized P&L',
      value: `${plPositive ? '+' : ''}${formatCurrencyCompact(totalUnrealizedPL)}`,
      colorClass: plPositive ? 'text-success' : 'text-destructive',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </p>
          <p
            className={`font-mono-data text-2xl font-bold leading-tight mt-0.5 ${item.colorClass}`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
