'use client';

/**
 * CorrelationMatrix
 *
 * Shows pairwise EWMA correlation between all fleet bots for the current
 * market regime.  Each unique bot pair occupies a single line:
 *
 *   BotA ↔ BotB   [0.72]   CO-MOVEMENT RISK
 *
 * High-correlation pairs (ρ ≥ 0.6) get a filled red badge; moderate pairs
 * (ρ ≥ 0.35) get an amber outlined badge; low / negative pairs get a neutral
 * outlined badge.  An amber insight box below the list provides plain-language
 * context for any high-correlation pairs.
 *
 * Data: GET /api/fleet/correlation/{regime}
 */

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetCorrelation } from '@/hooks/useFleetCorrelation';
import type { Regime } from '@/types/api';

const HIGH_CORR_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Inline badge
// ---------------------------------------------------------------------------

function CorrBadge({ corr }: { corr: number }) {
  const formatted = corr.toFixed(2);

  if (corr >= HIGH_CORR_THRESHOLD) {
    // Filled red pill — matches the screenshot style for dangerous correlation
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
        {formatted}
      </span>
    );
  }

  if (corr >= 0.35) {
    return (
      <span className="inline-flex items-center justify-center rounded-full border border-amber-500/60 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-amber-400">
        {formatted}
      </span>
    );
  }

  // Low positive or negative — neutral outlined pill
  return (
    <span className="inline-flex items-center justify-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
      {formatted}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CorrelationMatrixProps {
  /** Regime to fetch correlations for (defaults to NORMAL). Driven by the
   *  current market regime from the fleet weather report. */
  initialRegime?: Regime;
}

export default function CorrelationMatrix({ initialRegime = 1 }: CorrelationMatrixProps) {
  const { data, isLoading, isError } = useFleetCorrelation(initialRegime);

  const n = data?.n_bots ?? 0;
  const botNames = data?.bot_names ?? [];
  const botTickers = data?.bot_tickers ?? [];
  const matrixValues = data?.matrix_values ?? [];

  const label = (i: number): string => {
    const ticker = botTickers[i] ?? '';
    return ticker ? `${botNames[i]} (${ticker})` : (botNames[i] ?? '');
  };

  // All unique upper-triangle pairs, sorted by |ρ| descending
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
        <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Correlation Matrix
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">Correlation data unavailable.</p>
        )}

        {!isLoading && !isError && (!data || n < 2) && (
          <p className="text-sm text-muted-foreground py-2">
            No correlation data available yet. Analytics run hourly.
          </p>
        )}

        {!isLoading && !isError && data && n >= 2 && (
          <>
            {/* One row per unique pair — all content on a single line */}
            <div className="space-y-2">
              {pairs.map(({ i, j, corr }) => (
                <div key={`${i}-${j}`} className="flex items-center gap-2">
                  <span className="text-xs text-foreground">
                    {label(i)}{' '}
                    <span className="text-muted-foreground">↔</span>{' '}
                    {label(j)}
                  </span>
                  <CorrBadge corr={corr} />
                  {corr >= HIGH_CORR_THRESHOLD && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                      Co-movement risk
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Plain-language insight box for high-correlation pairs */}
            {highCorrPairs.length > 0 && (
              <div className="flex gap-2.5 rounded border border-amber-500/40 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="space-y-1">
                  {highCorrPairs.map(({ i, j, corr }) => (
                    <p
                      key={`warn-${i}-${j}`}
                      className="text-xs leading-snug text-amber-700 dark:text-amber-300"
                    >
                      <span className="font-semibold">{botNames[i]}</span> and{' '}
                      <span className="font-semibold">{botNames[j]}</span> bots have{' '}
                      <span className="font-mono font-bold">{corr.toFixed(2)}</span> correlation
                      — a broad equity selloff would hit both simultaneously. Consider adding
                      uncorrelated strategies (commodities, FX) to reduce co-movement risk.
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
