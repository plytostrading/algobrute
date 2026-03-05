'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useFleetAnalytics } from '@/hooks/useFleetAnalytics';
import { useFleetVar } from '@/hooks/useFleetVar';
import { formatCurrency } from '@/utils/formatters';
import type { FleetWeatherReport } from '@/types/api';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FleetAnalyticsSidebarProps {
  /** Fleet weather report — provides net_market_beta, enib, diversification_cliff_magnitude. */
  weather: FleetWeatherReport | undefined;
}

/**
 * Fixed-width analytics sidebar (~320px) for the Operations page.
 * Visible only at xl (1280px) and above.
 *
 * Sections:
 *   1. Value at Risk — VaR 95%/99%, CVaR 95%, max simulated loss
 *   2. Fleet Exposure — net market beta, ENIB (idle cash), diversification cliff
 *   3. Risk Attribution — fleet volatility, bot contributions bar chart
 */
export default function FleetAnalyticsSidebar({ weather }: FleetAnalyticsSidebarProps) {
  const { data: risk, isLoading: riskLoading } = useFleetAnalytics();
  const { data: varData, isLoading: varLoading } = useFleetVar();

  return (
    <aside className="w-80 shrink-0 space-y-4">
      {/* ── Value at Risk ── */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Value at Risk
        </h3>

        {varLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : varData ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  VaR 95%
                </p>
                <p className="font-mono-data text-sm font-semibold text-destructive">
                  {formatCurrency(varData.var_95_dollar)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {(varData.var_95_pct * 100).toFixed(1)}% of capital
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  CVaR 95%
                </p>
                <p className="font-mono-data text-sm font-semibold text-destructive">
                  {formatCurrency(varData.cvar_95_dollar)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {(varData.cvar_95_pct * 100).toFixed(1)}% of capital
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  VaR 99%
                </p>
                <p className="font-mono-data text-sm font-semibold text-destructive">
                  {formatCurrency(varData.var_99_dollar)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Max Sim. Loss
                </p>
                <p className="font-mono-data text-sm font-semibold text-destructive">
                  {(varData.max_simulated_loss_pct * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground border-t pt-2">
              {varData.n_simulations.toLocaleString()} simulations &middot;{' '}
              {varData.horizon_days}d horizon
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">VaR data unavailable.</p>
        )}
      </div>

      {/* ── Fleet Exposure ── */}
      {weather && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fleet Exposure
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Net Market Beta</span>
              <span className="font-mono-data text-xs font-semibold">
                {weather.net_market_beta.toFixed(2)}&beta;
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ENIB (idle cash)</span>
              <span className="font-mono-data text-xs font-semibold">
                {formatCurrency(weather.enib)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Diversification cliff</span>
              <span
                className={`font-mono-data text-xs font-semibold ${
                  weather.diversification_cliff_magnitude > 0.3
                    ? 'text-amber-600 dark:text-amber-400'
                    : ''
                }`}
              >
                {(weather.diversification_cliff_magnitude * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Risk Attribution ── */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Risk Attribution
        </h3>

        {riskLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 rounded" />
            ))}
          </div>
        ) : risk ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Fleet Volatility (ann.)</span>
              <span className="font-mono-data text-xs font-semibold">
                {(risk.fleet_volatility_annualized * 100).toFixed(1)}%
              </span>
            </div>

            {risk.concentration_alert && (
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                ⚠ Concentration alert — rebalancing may be needed
              </p>
            )}

            {/* Bot contribution bars */}
            <div className="space-y-1.5 pt-1">
              {risk.bot_contributions.slice(0, 6).map((bc) => (
                <div key={bc.bot_id} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
                    {bc.strategy_name}
                  </span>
                  <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${Math.min(bc.risk_contribution_pct * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono-data text-[10px] text-muted-foreground w-7 text-right shrink-0">
                    {(bc.risk_contribution_pct * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Risk data unavailable.</p>
        )}
      </div>
    </aside>
  );
}
