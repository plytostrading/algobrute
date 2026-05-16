'use client';

/**
 * v3 Validation — placeholder scaffold for the "ValidationReplay" surface
 * described in `_design/v3-bundle/project/v3/validation.jsx`.
 *
 * The full validation prototype is 600+ lines (replay scrubber, paired
 * metrics strip, regime-transition events, decision-state inspector, ask-
 * this-validation dock). UI-P1 ships the visual frame only — the
 * interactive scrubber + event log are deferred to UI-P2/P3.
 */

import { Card, KPI, Pill, SectionHeader, Hairline } from '@/components/v3/atoms';
import { EquityChart, ScaleBar, genWalk } from '@/components/v3/charts';

export default function ValidationScreen() {
  return (
    <div className="v3-page">
      <SectionHeader
        eyebrow="04 — Validation"
        title="Forward simulation on data the model never saw."
        sub="60-day holdout · breakout-iwm · v3"
        right={
          <div className="v3-toolbar">
            <Pill tone="mint">PASS</Pill>
            <Pill>HOLDOUT 60d</Pill>
          </div>
        }
      />

      <Card eyebrow="Holdout window" title="2024-03-01 → 2024-04-30">
        <EquityChart
          benchmark={genWalk(60, 0.6, 0.4)}
          strategy={genWalk(60, 1.4, 0.5)}
          oosAt={0}
          height={220}
        />
      </Card>

      <Card eyebrow="Paired comparison" title="Discovery → Holdout — 6 metrics">
        <div className="metrics-strip">
          <KPI label="Sharpe" value="1.74 → 1.62" tone="mint" />
          <Hairline vertical />
          <KPI label="Win rate" value="62% → 58%" tone="" />
          <Hairline vertical />
          <KPI label="Max DD" value="−4.8% → −5.1%" tone="warn" />
          <Hairline vertical />
          <KPI label="Trades" value="184 → 38" tone="" />
          <Hairline vertical />
          <KPI label="Avg hold" value="11d → 10d" tone="" />
          <Hairline vertical />
          <KPI label="Drift" value="0.07σ" sub="within tolerance" tone="mint" />
        </div>
      </Card>

      <div className="v3-grid-2 v3-gap-lg">
        <Card eyebrow="Reliability" title="Holdout Sharpe sits above the min line">
          <ScaleBar
            value={0.74}
            min={0}
            max={1}
            markers={['0', '0.65', '1']}
            thresholds={[{ at: 0.65, label: 'MIN' }]}
            label="0.74"
          />
        </Card>
        <Card eyebrow="Regime transitions" title="2 regime flips observed">
          <ul className="reasons">
            <li>
              <b>day 25:</b> Normal → Elevated — VIX crossed 22; sector dispersion widened.
            </li>
            <li>
              <b>day 40:</b> Elevated → Normal — stress moderated; back to Normal regime.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
