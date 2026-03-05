'use client';

/**
 * CorrelationMatrix
 *
 * Renders an NxN EWMA correlation heatmap for the fleet, with regime selector
 * tabs to switch between LOW_VOL / NORMAL / ELEVATED_VOL / CRISIS regimes.
 *
 * Data: GET /api/fleet/correlation/{regime}
 *
 * Design:
 *   - Blue → white → red color scale (−1 to +1)
 *   - Axis labels: "strategy (TICKER)" or "strategy" when ticker is empty
 *   - Diagonal cells (self-correlation = 1.0) shown in muted gray
 *   - Highly-correlated pairs listed below as amber warnings
 *   - Data quality footnote: EWMA half-life 60d + n_days_used
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetCorrelation } from '@/hooks/useFleetCorrelation';
import { getRegimeLabel } from '@/lib/regimeLabel';
import type { Regime } from '@/types/api';

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

/** Map correlation [-1, +1] to CSS rgb(). Diagonal handled separately. */
function corrToRgb(corr: number, isDiag: boolean): string {
  if (isDiag) return 'hsl(var(--muted))';
  const c = Math.max(-1, Math.min(1, corr));
  if (c >= 0) {
    // White → red
    const v = Math.round(255 * (1 - c));
    return `rgb(255, ${v}, ${v})`;
  } else {
    // White → blue
    const v = Math.round(255 * (1 + c));
    return `rgb(${v}, ${v}, 255)`;
  }
}

/** Text color for contrast on correlation cell background. */
function corrTextClass(corr: number, isDiag: boolean): string {
  if (isDiag) return 'text-muted-foreground';
  return Math.abs(corr) > 0.55 ? 'text-white font-semibold' : 'text-foreground';
}

// ---------------------------------------------------------------------------
// Regime tab buttons
// ---------------------------------------------------------------------------

const REGIMES: { value: Regime; label: string }[] = [
  { value: 0, label: 'Low Vol' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'High Vol' },
  { value: 3, label: 'Crisis' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CorrelationMatrixProps {
  /** Pre-select a regime (e.g. the current market regime from weather). */
  initialRegime?: Regime;
}

export default function CorrelationMatrix({ initialRegime = 1 }: CorrelationMatrixProps) {
  const [selectedRegime, setSelectedRegime] = useState<Regime>(initialRegime);
  const { data, isLoading, isError } = useFleetCorrelation(selectedRegime);

  const n = data?.n_bots ?? 0;
  const botNames = data?.bot_names ?? [];
  const botTickers = data?.bot_tickers ?? [];
  const matrixValues = data?.matrix_values ?? [];

  /** Axis label: "strategy (TICKER)" or "strategy" if ticker absent */
  const axisLabel = (i: number): string => {
    const name = botNames[i] ?? '';
    const ticker = botTickers[i] ?? '';
    return ticker ? `${name} (${ticker})` : name;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base">Correlation Matrix</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Regime-conditioned EWMA pairwise correlation
            </CardDescription>
          </div>

          {/* Regime selector */}
          <div className="flex gap-1 flex-wrap">
            {REGIMES.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRegime(r.value)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedRegime === r.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Correlation data unavailable for {getRegimeLabel(selectedRegime)} regime.
          </p>
        )}

        {!isLoading && !isError && !data && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No correlation data for this regime yet. Analytics run hourly.
          </p>
        )}

        {!isLoading && !isError && data && n > 0 && (
          <div className="space-y-4">
            {/* NxN heatmap */}
            <div className="overflow-x-auto">
              <table className="text-[10px] border-collapse">
                <thead>
                  <tr>
                    {/* Empty corner cell */}
                    <th className="w-20" />
                    {Array.from({ length: n }, (_, j) => (
                      <th
                        key={j}
                        className="pb-1 px-1 font-medium text-muted-foreground text-right max-w-[60px] truncate"
                        title={axisLabel(j)}
                      >
                        <span className="block truncate max-w-[60px]">{axisLabel(j)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: n }, (_, i) => (
                    <tr key={i}>
                      {/* Row label */}
                      <td
                        className="pr-2 py-0.5 font-medium text-muted-foreground truncate max-w-[80px] text-right"
                        title={axisLabel(i)}
                      >
                        <span className="block truncate max-w-[80px]">{axisLabel(i)}</span>
                      </td>
                      {/* Cells */}
                      {Array.from({ length: n }, (_, j) => {
                        const corr = matrixValues[i * n + j] ?? 0;
                        const isDiag = i === j;
                        return (
                          <td key={j} className="p-0.5">
                            <div
                              className={`w-12 h-10 flex items-center justify-center rounded text-[10px] tabular-nums ${corrTextClass(corr, isDiag)}`}
                              style={{ background: corrToRgb(corr, isDiag) }}
                              title={
                                isDiag
                                  ? axisLabel(i)
                                  : `${axisLabel(i)} ↔ ${axisLabel(j)}: ρ = ${corr.toFixed(2)}`
                              }
                            >
                              {isDiag ? '—' : corr.toFixed(2)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Highly correlated pairs */}
            {data.highly_correlated_pairs.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  High-Correlation Pairs (ρ &gt; threshold)
                </p>
                {data.highly_correlated_pairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1.5"
                  >
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      {pair.bot_a} ↔ {pair.bot_b}
                      <span className="ml-2 font-mono font-semibold">
                        ρ = {pair.correlation.toFixed(2)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Data quality footnote */}
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Correlation estimated via EWMA (half-life 60d) with Ledoit-Wolf shrinkage over{' '}
              <span className="font-semibold">{data.n_days_used}</span> shared trading days.
              {' '}Source: {data.source}.
              {' '}Sparse return series may compress pairwise estimates toward zero.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
