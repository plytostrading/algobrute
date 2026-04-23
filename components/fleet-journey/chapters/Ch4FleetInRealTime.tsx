'use client';

import { useMemo } from 'react';
import { StoryChapter } from '../StoryChapter';
import { InfoCallout } from '../InfoCallout';
import { ViolinPlot, type ViolinGroup } from '../ViolinPlot';
import { JourneyTimeline } from '../JourneyTimeline';
import {
  FleetExposureChart,
  InterventionsOverTimeChart,
} from '../JourneyAuxCharts';
import { InterventionLedger } from '../FleetJourneySections';
import type { JourneyResponse } from '@/hooks/useFleetJourney';

const MECH_COLOR: Record<string, string> = {
  fleet_exposure_gate: '#3b82f6',
  regime_rebalance_handler: '#8b5cf6',
  kelly_resize: '#14b8a6',
  stop_tighten: '#10b981',
  cooling_off_engaged: '#f59e0b',
  regime_adapt: '#0ea5e9',
  rollback_triggered: '#ef4444',
  auto_resume: '#22c55e',
};

export function Ch4FleetInRealTime({ data }: { data: JourneyResponse }) {
  const { timeline, fleet_multiplier_history, intervention_buckets, trailing_precision, ledger } = data;

  // Per-mechanism shadow-outcome distributions — was each intervention
  // correct (was a shadow loss observed)? This slice gives a
  // distributional view of precision per mechanism.
  const mechViolins: ViolinGroup[] = useMemo(() => {
    const byMech = new Map<string, number[]>();
    timeline.interventions.forEach((iv) => {
      if (iv.shadow_pnl_pct_next_window === null || iv.shadow_pnl_pct_next_window === undefined) return;
      const arr = byMech.get(iv.mechanism) ?? [];
      arr.push(iv.shadow_pnl_pct_next_window);
      byMech.set(iv.mechanism, arr);
    });
    return Array.from(byMech.entries())
      .filter(([, vs]) => vs.length >= 3)
      .map(([mech, vs]) => ({
        label: mech.replace(/_/g, ' ').slice(0, 14),
        values: vs,
        color: MECH_COLOR[mech] ?? '#64748b',
      }));
  }, [timeline.interventions]);

  return (
    <StoryChapter
      number={4}
      title="Fleet in real time"
      kicker={`${timeline.interventions.length} interventions fired across ${data.regime_effectiveness.length} regimes during the window`}
    >
      <InfoCallout title="The core cause-and-effect view">
        This is the heart of the risk-management story: the Journey Timeline
        shows your fleet&apos;s equity curve vs. the shadow counterfactual,
        with dispersion bands showing bootstrap-resampled uncertainty and
        intervention pins marking every action the platform took. Below, the
        exposure chart shows how aggressive your sizing was over time, and
        the intervention counter shows when the machinery fired most.
      </InfoCallout>

      <JourneyTimeline
        live_equity={timeline.live_equity}
        shadow_equity={timeline.shadow_equity}
        regime_bands={timeline.regime_bands}
        interventions={timeline.interventions}
        equity_percentiles={timeline.equity_percentiles}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <FleetExposureChart history={fleet_multiplier_history} />
        <InterventionsOverTimeChart
          buckets={intervention_buckets}
          trailing_precision={trailing_precision}
        />
      </div>

      {mechViolins.length > 0 && (
        <div className="rounded-md border bg-card/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Per-mechanism shadow-outcome distributions
          </div>
          <div className="mb-2 text-xs text-muted-foreground">
            For each intervention, the shadow fleet&apos;s P&L over the
            precision window afterwards. Negative values mean the platform
            correctly pre-empted adverse behaviour. Tighter downward violins
            = more consistent precision.
          </div>
          <ViolinPlot groups={mechViolins} yLabel="Shadow P&L post-intervention (%)" height={260} />
        </div>
      )}

      <InterventionLedger ledger={ledger} />
    </StoryChapter>
  );
}
