'use client';

/**
 * RegimeBreakdown
 *
 * Accordion panel showing trade strategy performance broken out by market
 * regime. Placed below the RegimeTimelineChart inside the Regime Timeline card.
 *
 * DATA NOTES — CPCV path deduplication:
 * all_trade_records contains each trade once per CPCV path. All per-regime
 * stats are computed as path-averages (group by backtest_path_id, compute stats
 * per path, then average across paths) so the numbers are consistent with the
 * backend's total_return_pct methodology.
 *
 * EPISODE BREAKDOWN:
 * When regimeLabels (WFLabelPoint[]) is available we extract contiguous date
 * ranges for each regime and show per-range performance stats.
 */

import { useState, useMemo } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import type { TradeRecord, Regime, WFLabelPoint } from '@/types/api';

// ---------------------------------------------------------------------------
// Regime display constants (kept in sync with RegimeTimelineChart)
// ---------------------------------------------------------------------------

const REGIME_LABELS: Record<Regime, string> = {
  0: 'Low Vol',
  1: 'Normal',
  2: 'Elevated Vol',
  3: 'Crisis',
};

const REGIME_COLORS: Record<Regime, string> = {
  0: '#3B82F6', // blue-500
  1: '#22C55E', // green-500
  2: '#F97316', // orange-500
  3: '#EF4444', // red-500
};

const ALL_REGIMES: Regime[] = [0, 1, 2, 3];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PathStats {
  /** Average number of trades per CPCV path. */
  avgTrades: number;
  /** Average win-rate across paths (wins/count per path, then mean). */
  winRate: number;
  /** Average per-trade return % across paths (sum/count per path, then mean). */
  avgReturn: number;
  /** Number of CPCV paths that had at least one trade in this bucket. */
  pathCount: number;
}

interface RegimeEpisode {
  startDate: string;
  endDate: string;
  /** Calendar days where this regime was active (from regimeLabels count). */
  days: number;
  stats: PathStats;
}

interface RegimeSummary {
  regime: Regime;
  /** Total label-days where this regime was active (0 if regimeLabels absent). */
  totalDays: number;
  /** Contiguous date ranges in which this regime was active. */
  episodes: RegimeEpisode[];
  /** Path-averaged stats over all trades in this regime. */
  stats: PathStats;
}

// ---------------------------------------------------------------------------
// Pure computation helpers
// ---------------------------------------------------------------------------

/**
 * Compute CPCV path-averaged performance stats for a set of trades.
 *
 * Groups by backtest_path_id, computes per-path statistics, then averages
 * across paths. Handles the case where all trades share path_id == null
 * (treated as a single path with id -1).
 */
function computePathStats(trades: TradeRecord[]): PathStats {
  const pathMap = new Map<number, { wins: number; count: number; sumReturn: number }>();
  for (const t of trades) {
    if (t.realized_pnl_pct == null) continue;
    const pid = t.backtest_path_id ?? -1;
    if (!pathMap.has(pid)) pathMap.set(pid, { wins: 0, count: 0, sumReturn: 0 });
    const p = pathMap.get(pid)!;
    p.count++;
    p.sumReturn += t.realized_pnl_pct;
    if (t.realized_pnl_pct > 0) p.wins++;
  }

  const active = Array.from(pathMap.values()).filter((p) => p.count > 0);
  if (active.length === 0) return { avgTrades: 0, winRate: 0, avgReturn: 0, pathCount: 0 };

  const n = active.length;
  return {
    avgTrades: active.reduce((s, p) => s + p.count, 0) / n,
    winRate: active.reduce((s, p) => s + p.wins / p.count, 0) / n,
    avgReturn: active.reduce((s, p) => s + p.sumReturn / p.count, 0) / n,
    pathCount: n,
  };
}

/**
 * Extract contiguous date ranges (episodes) for each regime from the
 * walk-forward label series.
 *
 * A new episode begins whenever the regime changes. The label granularity is
 * one entry per bar (daily), so episode.days counts label-points.
 */
function extractEpisodes(
  regimeLabels: WFLabelPoint[],
): Map<Regime, { startDate: string; endDate: string; days: number }[]> {
  const result = new Map<Regime, { startDate: string; endDate: string; days: number }[]>();

  if (regimeLabels.length === 0) return result;

  const sorted = [...regimeLabels].sort((a, b) => a.label_date.localeCompare(b.label_date));

  let curRegime = sorted[0].signal.ensemble_label as Regime;
  let epStart = sorted[0].label_date;
  let epDays = 1;

  const push = (regime: Regime, start: string, end: string, days: number) => {
    if (!result.has(regime)) result.set(regime, []);
    result.get(regime)!.push({ startDate: start, endDate: end, days });
  };

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i].signal.ensemble_label as Regime;
    if (r !== curRegime) {
      push(curRegime, epStart, sorted[i - 1].label_date, epDays);
      curRegime = r;
      epStart = sorted[i].label_date;
      epDays = 1;
    } else {
      epDays++;
    }
  }
  push(curRegime, epStart, sorted[sorted.length - 1].label_date, epDays);

  return result;
}

/**
 * Build the full list of per-regime summaries used by the component.
 * Returns only regimes that appear in at least one trade.
 */
function buildSummaries(
  trades: TradeRecord[],
  regimeLabels?: WFLabelPoint[],
): RegimeSummary[] {
  const episodeMap = regimeLabels
    ? extractEpisodes(regimeLabels)
    : new Map<Regime, { startDate: string; endDate: string; days: number }[]>();

  return ALL_REGIMES.reduce<RegimeSummary[]>((acc, regime) => {
    const regimeTrades = trades.filter((t) => t.entry_regime === regime);
    if (regimeTrades.length === 0) return acc;

    const totalDays = regimeLabels
      ? regimeLabels.filter((lp) => lp.signal.ensemble_label === regime).length
      : 0;

    const rawEpisodes = episodeMap.get(regime) ?? [];

    // Per-episode path-averaged stats.
    const episodes: RegimeEpisode[] = rawEpisodes.map((ep) => {
      const epTrades = regimeTrades.filter(
        (t) => t.entry_date >= ep.startDate && t.entry_date <= ep.endDate,
      );
      return { ...ep, stats: computePathStats(epTrades) };
    });

    acc.push({
      regime,
      totalDays,
      episodes,
      stats: computePathStats(regimeTrades),
    });
    return acc;
  }, []);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtPct(v: number, decimals = 2): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

function fmtWR(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RegimeBreakdownProps {
  trades: TradeRecord[];
  regimeLabels?: WFLabelPoint[];
}

export default function RegimeBreakdown({ trades, regimeLabels }: RegimeBreakdownProps) {
  const [openRegimes, setOpenRegimes] = useState<Set<Regime>>(new Set());

  const summaries = useMemo(
    () => buildSummaries(trades, regimeLabels),
    [trades, regimeLabels],
  );

  if (summaries.length === 0) return null;

  const toggle = (regime: Regime) => {
    setOpenRegimes((prev) => {
      const next = new Set(prev);
      if (next.has(regime)) next.delete(regime);
      else next.add(regime);
      return next;
    });
  };

  return (
    <div className="mt-5 pt-4 border-t border-border/50">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Regime Performance Breakdown
      </p>
      <p className="mb-3 text-[10px] text-muted-foreground/70 italic">
        Path-averaged stats across all CPCV paths · expand to view by date range
      </p>

      <div className="divide-y divide-border/40 rounded-md border border-border/50 overflow-hidden">
        {summaries.map((s) => {
          const isOpen = openRegimes.has(s.regime);
          const color = REGIME_COLORS[s.regime];
          const returnColor =
            s.stats.avgReturn >= 0 ? 'var(--color-success)' : 'var(--color-destructive)';

          return (
            <Collapsible.Root
              key={s.regime}
              open={isOpen}
              onOpenChange={() => toggle(s.regime)}
            >
              {/* Summary row — always visible */}
              <Collapsible.Trigger asChild>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
                  aria-label={`Toggle ${REGIME_LABELS[s.regime]} regime breakdown`}
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 text-sm font-semibold">
                    {REGIME_LABELS[s.regime]}
                  </span>

                  {s.totalDays > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {s.totalDays} days
                    </span>
                  )}

                  <span className="text-[11px] text-muted-foreground font-mono-data">
                    ~{s.stats.avgTrades.toFixed(0)} trades/path
                  </span>

                  <span className="text-[11px] text-muted-foreground font-mono-data w-14 text-right">
                    WR {fmtWR(s.stats.winRate)}
                  </span>

                  <span
                    className="text-[11px] font-mono-data w-14 text-right"
                    style={{ color: returnColor }}
                  >
                    {fmtPct(s.stats.avgReturn)}
                  </span>

                  <ChevronDown
                    className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-150"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
              </Collapsible.Trigger>

              {/* Episode detail rows */}
              <Collapsible.Content>
                {s.episodes.length > 0 ? (
                  <div className="bg-muted/10 px-4 pb-3 pt-1">
                    {/* Header */}
                    <div className="mb-1 grid grid-cols-[1fr_56px_56px_56px_56px] gap-x-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>Date Range</span>
                      <span className="text-right">Days</span>
                      <span className="text-right">Trades</span>
                      <span className="text-right">Win Rate</span>
                      <span className="text-right">Avg Ret</span>
                    </div>

                    <div className="divide-y divide-border/30 rounded border border-border/30">
                      {s.episodes.map((ep, i) => {
                        const epColor =
                          ep.stats.avgReturn >= 0
                            ? 'var(--color-success)'
                            : 'var(--color-destructive)';
                        const hasData = ep.stats.pathCount > 0;
                        return (
                          <div
                            key={i}
                            className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-x-2 px-2 py-1.5 text-[11px]"
                          >
                            <span className="font-mono-data text-muted-foreground">
                              {ep.startDate} – {ep.endDate}
                            </span>
                            <span className="text-right font-mono-data">{ep.days}</span>
                            <span className="text-right font-mono-data">
                              {hasData ? ep.stats.avgTrades.toFixed(1) : '—'}
                            </span>
                            <span className="text-right font-mono-data">
                              {hasData ? fmtWR(ep.stats.winRate) : '—'}
                            </span>
                            <span
                              className="text-right font-mono-data"
                              style={{ color: hasData ? epColor : undefined }}
                            >
                              {hasData ? fmtPct(ep.stats.avgReturn) : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="px-4 pb-3 pt-1 text-xs italic text-muted-foreground/70">
                    No regime-label data available for episode breakdown.
                  </p>
                )}
              </Collapsible.Content>
            </Collapsible.Root>
          );
        })}
      </div>
    </div>
  );
}
