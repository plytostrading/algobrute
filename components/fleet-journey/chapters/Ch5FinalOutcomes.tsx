'use client';

import { useMemo, useState } from 'react';
import { Shield, Sparkles, Activity } from 'lucide-react';
import { StoryChapter } from '../StoryChapter';
import { InfoCallout } from '../InfoCallout';
import { PlatformBaselineDelta } from '../PlatformBaselineDelta';
import { ViolinPlot, type ViolinGroup } from '../ViolinPlot';
import { ECDFPlot } from '../ECDFPlot';
import { PairedTradeScatter } from '../PairedTradeScatter';
import { TradeLevelRugPlot } from '../TradeLevelRugPlot';
import { LorenzCurve } from '../LorenzCurve';
import {
  DDDistributionChart,
  PnlDistributionChart,
  SharpeDistributionChart,
} from '../JourneyAuxCharts';
import {
  PerBotScatter,
  RegimeEffectiveness,
} from '../FleetJourneySections';
import type { JourneyResponse } from '@/hooks/useFleetJourney';

function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

function tone(n: number | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (n === null || n === undefined || Math.abs(n) < 1e-9) return 'neutral';
  return n > 0 ? 'positive' : 'negative';
}

type GroupBy = 'strategy' | 'ticker' | 'entry_regime' | 'intervention';

export function Ch5FinalOutcomes({ data }: { data: JourneyResponse }) {
  const {
    lift,
    per_trade_outcomes,
    bots,
    dd_histogram,
    pnl_histogram,
    sharpe_bars,
    regime_effectiveness,
  } = data;

  const [groupBy, setGroupBy] = useState<GroupBy>('strategy');

  // ECDF of per-trade P&L for live vs shadow
  const ecdfSeries = useMemo(() => {
    const live = per_trade_outcomes.map((t) => t.realized_pnl_pct);
    const shadow = per_trade_outcomes
      .map((t) => t.shadow_pnl_pct)
      .filter((v): v is number => v !== null);
    return [
      { label: 'Live', values: live, color: '#10b981' },
      { label: 'Shadow', values: shadow, color: '#8b5cf6', dashed: true },
    ];
  }, [per_trade_outcomes]);

  // Grouped bot outcome violins
  const botViolins: ViolinGroup[] = useMemo(() => {
    const groups = new Map<string, number[]>();
    per_trade_outcomes.forEach((t) => {
      let key: string;
      switch (groupBy) {
        case 'strategy':
          key = t.strategy_id;
          break;
        case 'ticker':
          key = t.ticker;
          break;
        case 'entry_regime':
          key = t.entry_regime ?? 'unknown';
          break;
        case 'intervention':
          // Proxy: bots are in "heavy" group if they have >= median n_interventions
          key = 'ungrouped'; // placeholder, populated below
          break;
      }
      const arr = groups.get(key) ?? [];
      arr.push(t.realized_pnl_pct);
      groups.set(key, arr);
    });
    if (groupBy === 'intervention') {
      // Compute median of n_interventions across bots, split bots into heavy/light
      const nInts = bots.map((b) => b.n_interventions).sort((a, b) => a - b);
      const median = nInts[Math.floor(nInts.length / 2)] ?? 0;
      const botIsHeavy = new Map<string, boolean>();
      bots.forEach((b) => botIsHeavy.set(b.bot_id, b.n_interventions > median));
      groups.clear();
      per_trade_outcomes.forEach((t) => {
        const heavy = botIsHeavy.get(t.bot_id) ?? false;
        const key = heavy ? 'Heavy intervention' : 'Light intervention';
        const arr = groups.get(key) ?? [];
        arr.push(t.realized_pnl_pct);
        groups.set(key, arr);
      });
    }
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#ec4899'];
    return Array.from(groups.entries())
      .filter(([, vs]) => vs.length >= 3)
      .map(([label, values], i) => ({
        label: label.replace(/_/g, ' ').slice(0, 14),
        values,
        color: colors[i % colors.length],
      }));
  }, [per_trade_outcomes, bots, groupBy]);

  // Holding period histogram data (grouped by win/loss)
  const holdingValues = useMemo(() => {
    return {
      wins: per_trade_outcomes.filter((t) => t.win).map((t) => t.holding_days),
      losses: per_trade_outcomes.filter((t) => !t.win).map((t) => t.holding_days),
    };
  }, [per_trade_outcomes]);

  // Lorenz contributions (P&L per bot = sum of realized_pnl_pct per bot)
  const lorenzValues = useMemo(() => {
    const byBot = new Map<string, number>();
    per_trade_outcomes.forEach((t) => {
      byBot.set(t.bot_id, (byBot.get(t.bot_id) ?? 0) + t.realized_pnl_pct);
    });
    return Array.from(byBot.values());
  }, [per_trade_outcomes]);

  const aboveDiagonalPct = useMemo(() => {
    const paired = per_trade_outcomes.filter((t) => t.shadow_pnl_pct !== null);
    if (paired.length === 0) return null;
    const above = paired.filter(
      (t) => (t.realized_pnl_pct ?? 0) > (t.shadow_pnl_pct ?? 0),
    ).length;
    return (above / paired.length) * 100;
  }, [per_trade_outcomes]);

  return (
    <StoryChapter
      number={5}
      title="Final outcomes"
      kicker={`${per_trade_outcomes.length} closed trades across ${bots.length} bots · ${sharpe_bars.length} bots with Sharpe`}
    >
      {/* Platform / Baseline / Δ — headline lift */}
      <div className="grid gap-3 md:grid-cols-3">
        <PlatformBaselineDelta
          label="Total P&L"
          platform={fmtPct(lift.live_total_pnl_pct)}
          baseline={fmtPct(lift.shadow_total_pnl_pct)}
          delta={fmtPct(lift.pnl_lift_pct)}
          deltaTone={tone(lift.pnl_lift_pct)}
          icon={<Sparkles className="h-3.5 w-3.5" />}
        />
        <PlatformBaselineDelta
          label="Max drawdown"
          platform={fmtPct(-lift.live_max_dd_pct)}
          baseline={fmtPct(-lift.shadow_max_dd_pct)}
          delta={fmtPct(lift.dd_protection_pct)}
          deltaTone={lift.dd_protection_pct > 0 ? 'positive' : 'negative'}
          icon={<Shield className="h-3.5 w-3.5" />}
        />
        <PlatformBaselineDelta
          label="Trades platform helped"
          platform={aboveDiagonalPct !== null ? `${aboveDiagonalPct.toFixed(0)}%` : '—'}
          baseline={aboveDiagonalPct !== null ? `${(100 - aboveDiagonalPct).toFixed(0)}%` : '—'}
          delta={
            aboveDiagonalPct !== null
              ? `${(aboveDiagonalPct - (100 - aboveDiagonalPct)).toFixed(0)} pp`
              : '—'
          }
          deltaTone={
            aboveDiagonalPct !== null && aboveDiagonalPct > 50 ? 'positive' : 'negative'
          }
          icon={<Activity className="h-3.5 w-3.5" />}
          helpText="Fraction of paired trades where live P&L exceeded shadow counterfactual."
        />
      </div>

      <InfoCallout title="Distributional view of outcomes">
        The charts below examine the SHAPE of your outcome distribution
        from multiple angles — histograms for bulk shape, ECDF for
        stochastic dominance, violins for grouped comparison, and paired
        scatter for the fundamental question: did the platform help each
        individual trade?
      </InfoCallout>

      {/* 3-panel distribution row as small multiples */}
      <div className="grid gap-3 md:grid-cols-3">
        <DDDistributionChart bins={dd_histogram} />
        <PnlDistributionChart bins={pnl_histogram} />
        <SharpeDistributionChart bars={sharpe_bars} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PerBotScatter bots={bots} />
        <div className="rounded-md border bg-card/40 p-3">
          <ECDFPlot
            series={ecdfSeries}
            xLabel="Trade P&L %"
            title="Trade P&L ECDF: live vs shadow"
            height={260}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card/40 p-3">
        <PairedTradeScatter
          trades={per_trade_outcomes}
          title="Live vs shadow per-trade — above the diagonal means platform helped"
        />
      </div>

      {/* Grouped bot outcome violins with selector */}
      <div className="rounded-md border bg-card/40 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Bot outcomes by{' '}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="ml-1 rounded border bg-background px-1 py-0.5 text-xs text-foreground"
            >
              <option value="strategy">strategy</option>
              <option value="ticker">ticker</option>
              <option value="entry_regime">regime of first trade</option>
              <option value="intervention">intervention profile</option>
            </select>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Switching the grouping dimension reveals different structure.
          </div>
        </div>
        <ViolinPlot groups={botViolins} yLabel="Trade P&L %" height={280} />
      </div>

      <div className="rounded-md border bg-card/40 p-3">
        <TradeLevelRugPlot
          trades={per_trade_outcomes}
          title="Per-trade rug: entry date vs holding period (size ∝ |P&L|, color = outcome)"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-md border bg-card/40 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Holding-period outcomes
          </div>
          <HoldingPeriodSmallMultiples wins={holdingValues.wins} losses={holdingValues.losses} />
        </div>
        <div className="rounded-md border bg-card/40 p-3">
          <LorenzCurve
            contributions={lorenzValues}
            title="Per-bot contribution concentration"
            entityLabel="bots"
          />
        </div>
      </div>

      <RegimeEffectiveness rows={regime_effectiveness} />
    </StoryChapter>
  );
}

function HoldingPeriodSmallMultiples({ wins, losses }: { wins: number[]; losses: number[] }) {
  const maxVal = Math.max(1, ...wins, ...losses);
  const binCount = 10;
  const toHistogram = (values: number[]) => {
    const counts = new Array(binCount).fill(0);
    for (const v of values) {
      let b = Math.floor((v / maxVal) * binCount);
      if (b >= binCount) b = binCount - 1;
      if (b < 0) b = 0;
      counts[b] += 1;
    }
    return counts;
  };
  const winBins = toHistogram(wins);
  const lossBins = toHistogram(losses);
  const binMax = Math.max(1, ...winBins, ...lossBins);

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-muted-foreground">
        Winners (green) vs losers (red) across holding durations — does
        the platform tend to close losers faster and let winners run?
      </div>
      <div>
        <div className="mb-0.5 text-[10px] text-green-600">Winners ({wins.length})</div>
        <svg
          width="100%"
          height={40}
          viewBox={`0 0 ${binCount} ${binMax}`}
          preserveAspectRatio="none"
        >
          {winBins.map((c, i) => (
            <rect
              key={i}
              x={i + 0.05}
              y={binMax - c}
              width={0.9}
              height={c}
              fill="#10b981"
            />
          ))}
        </svg>
        <div className="mt-1 text-[10px] text-destructive">Losers ({losses.length})</div>
        <svg
          width="100%"
          height={40}
          viewBox={`0 0 ${binCount} ${binMax}`}
          preserveAspectRatio="none"
        >
          {lossBins.map((c, i) => (
            <rect
              key={i}
              x={i + 0.05}
              y={binMax - c}
              width={0.9}
              height={c}
              fill="#ef4444"
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
          <span>0d</span>
          <span>{Math.round(maxVal / 2)}d</span>
          <span>{maxVal}d</span>
        </div>
      </div>
    </div>
  );
}
