'use client';

import { useMemo } from 'react';
import { StoryChapter } from '../StoryChapter';
import { InfoCallout } from '../InfoCallout';
import { SmallMultiplesGrid, type MultiplePanel } from '../SmallMultiplesGrid';
import { ViolinPlot, type ViolinGroup } from '../ViolinPlot';
import {
  EfficientFrontierScatter,
  type FrontierPoint,
} from '../EfficientFrontierScatter';
import {
  StrategyAllocationOverTimeChart,
  StrategyMixDonut,
  StrategyPnlOverTimeChart,
} from '../StrategyBreakdownCharts';
import { StrategyRegimeHeatmap } from '@/components/dashboard/StrategyRegimeHeatmap';
import type { JourneyResponse } from '@/hooks/useFleetJourney';

const STRATEGY_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#0ea5e9',
  '#84cc16',
  '#a855f7',
];

export function Ch2WhatYoureRunning({ data }: { data: JourneyResponse }) {
  const { strategy_pnl_series, strategy_mix, strategy_allocation_history, per_trade_outcomes } = data;

  // Per-strategy mini P&L panels
  const miniPanels: MultiplePanel[] = strategy_pnl_series.map((s, i) => ({
    key: s.strategy_id,
    label: s.strategy_id.replace(/_/g, ' '),
    values: s.series.map((p) => p.cum_pnl_pct),
    accent: STRATEGY_COLORS[i % STRATEGY_COLORS.length],
    sublabel: `${s.n_trades} trades`,
  }));

  // Violin: per-strategy trade-outcome distributions
  const violins: ViolinGroup[] = useMemo(() => {
    const byStrat = new Map<string, number[]>();
    per_trade_outcomes.forEach((t) => {
      const arr = byStrat.get(t.strategy_id) ?? [];
      arr.push(t.realized_pnl_pct);
      byStrat.set(t.strategy_id, arr);
    });
    return Array.from(byStrat.entries())
      .filter(([, vs]) => vs.length >= 3)
      .map(([strat, vs], i) => ({
        label: strat.replace(/_/g, ' ').slice(0, 14),
        values: vs,
        color: STRATEGY_COLORS[i % STRATEGY_COLORS.length],
      }));
  }, [per_trade_outcomes]);

  // Efficient frontier: mean/std per strategy
  const frontier: FrontierPoint[] = useMemo(() => {
    const byStrat = new Map<string, number[]>();
    per_trade_outcomes.forEach((t) => {
      const arr = byStrat.get(t.strategy_id) ?? [];
      arr.push(t.realized_pnl_pct);
      byStrat.set(t.strategy_id, arr);
    });
    return Array.from(byStrat.entries())
      .filter(([, vs]) => vs.length >= 5)
      .map(([strat, vs], i) => {
        const mean = vs.reduce((s, v) => s + v, 0) / vs.length;
        const variance = vs.reduce((s, v) => s + (v - mean) ** 2, 0) / (vs.length - 1);
        const std = Math.sqrt(variance);
        return {
          label: strat.replace(/_/g, ' ').slice(0, 12),
          mean,
          std,
          color: STRATEGY_COLORS[i % STRATEGY_COLORS.length],
        };
      });
  }, [per_trade_outcomes]);

  return (
    <StoryChapter
      number={2}
      title="What you're running"
      kicker={`${strategy_mix.length} strategy families across ${data.fleet_tickers.length} tickers · ${per_trade_outcomes.length} closed trades`}
    >
      <InfoCallout title="Three views of the same strategies">
        The top chart shows cumulative P&L by strategy (who&apos;s winning
        today); the small-multiples grid separates them so no strategy is
        hidden by a noisier neighbor; the violin plot shows per-trade
        distributional shape — tight vs fat-tailed; the efficient frontier
        scatter shows mean-vs-volatility — Pareto-optimal strategies sit
        up-and-to-the-left.
      </InfoCallout>

      <StrategyPnlOverTimeChart series={strategy_pnl_series} />

      <SmallMultiplesGrid
        title="Per-strategy P&L (small multiples)"
        panels={miniPanels}
        columns={3}
        panelHeight={60}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-md border bg-card/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Per-strategy trade outcome distributions
          </div>
          <ViolinPlot groups={violins} yLabel="Trade P&L %" height={280} />
        </div>
        <div className="rounded-md border bg-card/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Strategy efficient frontier
          </div>
          <EfficientFrontierScatter
            points={frontier}
            xLabel="Trade P&L volatility (std %)"
            yLabel="Mean trade P&L %"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StrategyMixDonut mix={strategy_mix} />
        <StrategyAllocationOverTimeChart points={strategy_allocation_history} />
      </div>

      <StrategyRegimeHeatmap />
    </StoryChapter>
  );
}
