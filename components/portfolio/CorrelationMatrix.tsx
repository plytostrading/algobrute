'use client';

/**
 * CorrelationMatrix
 *
 * Shows pairwise co-movement between all fleet bots for the current market
 * regime.  Each unique bot pair occupies a single line with two score badges:
 *
 *   BotA ↔ BotB   [sync · 0.72]   [when trading · 0.71]   HIGH CO-MOVEMENT
 *
 * "sync" is the portfolio-level co-movement score (weighted by capital and
 * recency).  "when trading" is the score computed only on days when BOTH bots
 * had closing trades — a more direct read of shared outcome risk.
 *
 * Data: GET /api/fleet/correlation/{regime}
 */

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetCorrelation } from '@/hooks/useFleetCorrelation';
import { useFleetCorrelationInsight } from '@/hooks/useFleetCorrelationInsight';
import type { CorrelationPairContext, CorrelationPairInsight, Regime } from '@/types/api';

const HIGH_CORR_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Portfolio sync badge (fleet-level co-movement score)
// ---------------------------------------------------------------------------

/**
 * Displays the portfolio-level co-movement score (EWMA Pearson correlation).
 *
 * Label "sync" is used instead of "correlation" or "ρ" for a non-quant
 * audience.  The number tells you HOW MUCH the bots move together in the
 * portfolio: 0 = independent, 1 = always win/lose together.
 */
function CorrBadge({ corr }: { corr: number }) {
  const formatted = corr.toFixed(2);
  const tooltip =
    'Portfolio sync score (0 to 1). Shows how often these two bots win and lose '
    + 'at the same time across the whole portfolio, weighted by capital size and '
    + 'recent trade activity. Higher = more shared risk.';

  if (corr >= HIGH_CORR_THRESHOLD) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white"
        title={tooltip}
      >
        <span className="font-normal opacity-80">sync</span>
        {formatted}
      </span>
    );
  }

  if (corr >= 0.35) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-amber-400"
        title={tooltip}
      >
        <span className="font-normal opacity-70">sync</span>
        {formatted}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground"
      title={tooltip}
    >
      <span className="opacity-60">sync</span>
      {formatted}
    </span>
  );
}

// ---------------------------------------------------------------------------
// "When trading" badge (co-occurrence score on shared active days)
// ---------------------------------------------------------------------------

/**
 * Displays the co-occurrence score — the similarity of outcomes specifically
 * on days when BOTH bots have closing trades.
 *
 * Labeled "when trading" instead of "ρ_occ" or "conditional correlation" so
 * that a non-quant reader immediately understands what this number represents:
 * "on the days both bots were active, how often did they win and lose together?"
 *
 * Negative values (green) signal a natural hedge — the bots tend to offset
 * each other's losses on shared trading days.
 */
function CoOccBadge({ rho }: { rho: number }) {
  const formatted = rho.toFixed(2);

  if (rho >= HIGH_CORR_THRESHOLD) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm border border-red-500/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-red-400"
        title="When both bots have trades closing on the same day, this is how similar their results are. High values mean they tend to win and lose together — a shared drawdown risk."
      >
        <span className="font-normal opacity-70">when trading</span>
        {formatted}
      </span>
    );
  }
  if (rho >= 0.35) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-500/80"
        title="When both bots have trades closing on the same day, this is how similar their results are."
      >
        <span className="font-normal opacity-70">when trading</span>
        {formatted}
      </span>
    );
  }
  if (rho <= -0.35) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm border border-emerald-500/50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-400"
        title="These bots tend to move in opposite directions on shared trading days — they partially offset each other, which cushions combined drawdowns."
      >
        <span className="font-normal opacity-70">when trading</span>
        {formatted}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground"
      title="When both bots have trades closing on the same day, this is how similar their results are. Values near 0 mean their outcomes are mostly independent."
    >
      <span className="opacity-60">when trading</span>
      {formatted}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pair context chips (deterministic — from pair_contexts, no LLM needed)
// ---------------------------------------------------------------------------

/**
 * Converts a CorrelationPairContext into human-readable chip labels.
 *
 * These are derived directly from the computed trade-history metrics and are
 * always factually accurate (no LLM speculation involved).
 */
function buildContextChips(ctx: CorrelationPairContext): string[] {
  const chips: string[] = [];

  // How often do they trade on the same day?
  if (ctx.n_shared_exit_dates > 0) {
    const overlapPct = Math.round(ctx.date_overlap_pct * 100);
    chips.push(`${overlapPct}% of exit days overlap (${ctx.n_shared_exit_dates} shared days)`);
    // On those shared days, how often do they win/lose together?
    const samePct = Math.round(ctx.win_loss_cosign_rate * 100);
    chips.push(`same outcome ${samePct}% of shared days`);
  } else {
    chips.push('never trade on the same day');
  }

  // Which direction do they bet?
  const bothLong = ctx.long_pct_a >= 0.8 && ctx.long_pct_b >= 0.8;
  const bothShort = ctx.long_pct_a <= 0.2 && ctx.long_pct_b <= 0.2;
  if (bothLong) {
    chips.push('both bet long — same market exposure');
  } else if (bothShort) {
    chips.push('both bet short — same market exposure');
  } else {
    chips.push(
      `${Math.round(ctx.long_pct_a * 100)}% long vs ${Math.round(ctx.long_pct_b * 100)}% long`,
    );
  }

  // How much of the portfolio do they represent together?
  chips.push(`${ctx.combined_capital_pct.toFixed(1)}% of portfolio capital combined`);

  // How long do they hold trades?
  const holdA = Math.round(ctx.avg_holding_bars_a);
  const holdB = Math.round(ctx.avg_holding_bars_b);
  if (Math.abs(holdA - holdB) <= 2) {
    chips.push(`both hold ~${Math.round((holdA + holdB) / 2)} days per trade`);
  } else {
    chips.push(`hold ${holdA} days vs ${holdB} days per trade`);
  }

  return chips;
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
  const {
    data: insight,
    isLoading: insightLoading,
  } = useFleetCorrelationInsight(initialRegime);

  const n = data?.n_bots ?? 0;
  const botNames = data?.bot_names ?? [];
  const botTickers = data?.bot_tickers ?? [];
  const matrixValues = data?.matrix_values ?? [];
  const pairContexts = data?.pair_contexts ?? [];

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

  /**
   * Look up the LLM insight for a specific bot pair.
   * Matches on both orderings since the LLM may return them in either order.
   */
  const getPairInsight = (nameA: string, nameB: string): CorrelationPairInsight | undefined => {
    if (!insight?.pair_insights) return undefined;
    return insight.pair_insights.find(
      (p) =>
        (p.bot_a === nameA && p.bot_b === nameB) ||
        (p.bot_a === nameB && p.bot_b === nameA),
    );
  };

  /**
   * Look up the deterministic pair context for a specific bot pair.
   * Sourced directly from the analytics API — no LLM involved.
   */
  const getPairContext = (nameA: string, nameB: string): CorrelationPairContext | undefined =>
    pairContexts.find(
      (c) =>
        (c.bot_a === nameA && c.bot_b === nameB) ||
        (c.bot_a === nameB && c.bot_b === nameA),
    );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Correlation Matrix
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Loading skeletons for correlation data */}
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
            {/* Fleet-level LLM headline when available */}
            {insight?.headline && (
              <p className="text-xs text-foreground font-medium">{insight.headline}</p>
            )}

            {/* Per-pair rows — badge + risk label on first line; evidence chips + LLM narrative below */}
            <div className="space-y-3">
              {pairs.map(({ i, j, corr }) => {
                const pairInsight = getPairInsight(botNames[i], botNames[j]);
                const pairCtx = getPairContext(botNames[i], botNames[j]);
                const ctxChips = pairCtx ? buildContextChips(pairCtx) : [];
                return (
                  <div key={`${i}-${j}`} className="space-y-0.5">
                    {/* Main row: names, EWMA badge, co-occurrence badge, risk label */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-foreground">
                        {label(i)}{' '}
                        <span className="text-muted-foreground">↔</span>{' '}
                        {label(j)}
                      </span>
                      {/* Portfolio sync score — how much they co-move across the whole portfolio */}
                      <CorrBadge corr={corr} />
                      {/* "When trading" score — how similar their results are on shared active days */}
                      {pairCtx?.co_occurrence_correlation != null && (
                        <CoOccBadge rho={pairCtx.co_occurrence_correlation} />
                      )}
                      {corr >= HIGH_CORR_THRESHOLD && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                          Co-movement risk
                        </span>
                      )}
                    </div>

                    {/* LLM narrative: interpretation of the evidence (shown when available) */}
                    {insightLoading && (
                      <Skeleton className="h-3 w-4/5 ml-0.5" />
                    )}
                    {!insightLoading && pairInsight?.insight && (
                      <p className="text-[11px] text-muted-foreground leading-snug ml-0.5">
                        {pairInsight.insight}
                      </p>
                    )}

                    {/* Context chips: deterministic facts from trade history.
                        Always visible when live trade data exists — no LLM needed. */}
                    {ctxChips.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-0.5 mt-0.5">
                        {ctxChips.map((chip, ci) => (
                          <span
                            key={ci}
                            className="inline-flex items-center rounded-sm bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fleet-level action from LLM (shown when available and non-trivial) */}
            {insight?.action && (
              <p className="text-[11px] text-muted-foreground border-t pt-2 leading-snug">
                <span className="font-semibold text-foreground">Recommended action: </span>
                {insight.action}
              </p>
            )}

            {/* Amber warning box for high-correlation pairs — uses LLM summary when available,
                falls back to deterministic text */}
            {highCorrPairs.length > 0 && (
              <div className="flex gap-2.5 rounded border border-amber-500/40 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="space-y-1">
                  {insight?.summary ? (
                    <p className="text-xs leading-snug text-amber-700 dark:text-amber-300">
                      {insight.summary}
                    </p>
                  ) : (
                    highCorrPairs.map(({ i, j, corr }) => (
                      <p
                        key={`warn-${i}-${j}`}
                        className="text-xs leading-snug text-amber-700 dark:text-amber-300"
                      >
                        <span className="font-semibold">{botNames[i]}</span> and{' '}
                        <span className="font-semibold">{botNames[j]}</span> tend to win and lose
                        at the same time (sync score{' '}
                        <span className="font-mono font-bold">{corr.toFixed(2)}</span>).
                        A broad market drop would likely hit both bots together. Consider adding
                        strategies that move differently to reduce shared risk.
                      </p>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
