'use client';

import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { getRegimeLabel } from '@/lib/regimeLabel';
import { REGIME_HEX } from '@/lib/colors';
import type { FleetWeatherReport } from '@/types/api';
import type { FleetState } from '@/types/api';

interface PortfolioHeroProps {
  weather: FleetWeatherReport;
  fleetState: FleetState;
}

export default function PortfolioHero({ weather, fleetState }: PortfolioHeroProps) {
  const totalPnL = fleetState.bot_snapshots.reduce(
    (sum, b) => sum + b.unrealized_pnl,
    0,
  );
  const pnlPositive = totalPnL >= 0;
  const deployedPct = Math.round((1 - weather.cash_pct) * 100);
  const regimeColor = REGIME_HEX[weather.current_regime] ?? '#6b7280';

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* ── Concept introduction (shown once; minimal) ── */}
      <p className="text-[11px] text-muted-foreground/70 mb-4 leading-relaxed">
        Your fleet of bots <em>is</em> your portfolio. Each bot is a position in a strategy,
        sized by capital allocation and governed by its own risk harness.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total portfolio value */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Portfolio Value
          </p>
          <p className="font-mono-data text-2xl font-bold mt-1">
            {formatCurrency(weather.fleet_capital)}
          </p>
        </div>

        {/* Unrealized P&L */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Unrealized P&amp;L
          </p>
          <p
            className={`font-mono-data text-2xl font-bold mt-1 flex items-center gap-1.5 ${
              pnlPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {pnlPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {pnlPositive ? '+' : ''}
            {formatCurrency(totalPnL)}
          </p>
        </div>

        {/* Deployed / cash */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Deployed
          </p>
          <p className="font-mono-data text-2xl font-bold mt-1">
            {deployedPct}
            <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {Math.round(weather.cash_pct * 100)}% idle cash
          </p>
        </div>

        {/* Regime + bot health */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Market Regime
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: regimeColor }}
            />
            <span className="font-semibold text-sm">
              {getRegimeLabel(weather.current_regime)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {weather.n_active_bots} active
            </span>
            {weather.n_bots_with_alerts > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                {weather.n_bots_with_alerts} alert{weather.n_bots_with_alerts > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
