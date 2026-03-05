'use client';

/**
 * CorrelationMatrix
 *
 * Shows pairwise EWMA correlation between all fleet bots for a selected regime.
 * Each unique bot pair is displayed as a row with a colored correlation badge
 * and a "CO-MOVEMENT RISK" label for highly-correlated pairs.  A plain-language
 * warning box below the list explains the risk and suggests remediation.
 *
 * Data: GET /api/fleet/correlation/{regime}
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetCorrelation } from '@/hooks/useFleetCorrelation';
import type { Regime } from '@/types/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIGH_CORR_THRESHOLD = 0.6;

const REGIMES: { value: Regime; label: string }[] = [
  { value: 0, label: 'Low Vol' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'High Vol' },
  { value: 3, label: 'Crisis' },
];

// ---------------------------------------------------------------------------
// Badge styling helpers
// ---------------------------------------------------------------------------

/** Returns Tailwind classes for the correlation value badge based on magnitude. */
function corrBadgeClasses(corr: number): string {
  if (corr >= HIGH_CORR_THRESHOLD)
    return 'border border-red-500/50 bg-red-500/15 text-red-400 font-bold';
  if (corr >= 0.35)
    return 'border border-amber-500/50 bg-amber-500/15 text-amber-400 font-semibold';
  if (corr >= 0)
    return 'border border-border bg-muted/60 text-muted-foreground';
  // Negative — blue tint
  return 'border border-blue-500/30 bg-blue-500/10 text-blue-400';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CorrelationMatrixProps {
  /** Pre-select a regime tab (e.g. current market regime from weather report). */
  initialRegime?: Regime;
}

export default function CorrelationMatrix({ initialRegime = 1 }: CorrelationMatrixProps) {
  const [selectedRegime, setSelectedRegime] = useState<Regime>(initialRegime);
  const { data, isLoading, isError } = useFleetCorrelation(selectedRegime);

  const n = data?.n_bots ?? 0;
  const botNames = data?.bot_names ?? [];
  const botTickers = data?.bot_tickers ?? [];
  const matrixValues = data?.matrix_values ?? [];

  /** Display label: "strategy (TICKER)" or just "strategy" when ticker absent. */
  const label = (i: number): string => {
    const ticker = botTickers[i] ?? '';
    return ticker ? `${botNames[i]} (${ticker})` : (botNames[i] ?? '');
  };

  /**
   * Build all unique upper-triangle pairs sorted by absolute correlation
   * descending so the most concerning pairs appear first.
   */
  const pairs: { i: number; j: number; corr: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push({ i, j, corr: matrixValues[i * n + j] ?? 0 });
    }
  }
  pairs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));

  const highCorrPairs = pairs.filter((p) => p.corr >= HIGH_CORR_THRESHOLD);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Correlation Matrix
          </CardTitle>
          {/* Regime tabs */}
          <div className="flex gap-1">
            {REGIMES.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRegime(r.value)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
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

      <CardContent className="space-y-3">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-sm text-destructive">Correlation data unavailable.</p>
        )}

        {/* Empty */}
        {!isLoading && !isError && (!data || n < 2) && (
          <p className="text-sm text-muted-foreground py-2">
            No correlation data for this regime yet. Analytics run hourly.
          </p>
        )}

        {/* Pair list */}
        {!isLoading && !isError && data && n >= 2 && (
          <>
            <div className="space-y-2">
              {pairs.map(({ i, j, corr }) => {
                const isHigh = corr >= HIGH_CORR_THRESHOLD;
                return (
                  <div
                    key={`${i}-${j}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-xs text-foreground truncate">
                      {label(i)}{' '}
                      <span className="text-muted-foreground">→</span>{' '}
                      {label(j)}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                          corrBadgeClasses(corr)
                        }`}
                      >
                        {corr >= 0 ? '+' : ''}{corr.toFixed(2)}
                      </span>
                      {isHigh && (
                        <span className="text-[10px] uppercase tracking-wide text-amber-500 font-semibold">
                          Co-movement risk
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plain-language warning for high-correlation pairs */}
            {highCorrPairs.length > 0 && (
              <div className="flex gap-2.5 rounded border border-amber-500/40 bg-amber-500/10 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {highCorrPairs.map(({ i, j, corr }) => (
                    <p
                      key={`warn-${i}-${j}`}
                      className="text-xs text-amber-700 dark:text-amber-300 leading-snug"
                    >
                      <span className="font-semibold">{botNames[i]}</span> and{' '}
                      <span className="font-semibold">{botNames[j]}</span> share a{' '}
                      <span className="font-mono font-bold">{corr.toFixed(2)}</span> correlation
                      — a broad selloff would hit both simultaneously. Consider adding
                      uncorrelated strategies to reduce co-movement risk.
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Data quality footnote */}
            <p className="text-[10px] text-muted-foreground">
              EWMA correlation · {data.n_days_used}d · {data.source}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
