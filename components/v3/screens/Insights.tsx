'use client';

/**
 * v3 Insights — port of the inline Insights component in
 * `_design/v3-bundle/project/v3/app.jsx` (lines ~833–934).
 *
 * 5 tabs: Regime distribution · P&L attribution · Correlation matrix ·
 * Benchmark · Journal. Mock data only.
 */

import { useState } from 'react';
import { Card, KPI, SectionHeader, Hairline } from '@/components/v3/atoms';
import {
  CalHeatmap,
  EquityChart,
  Ridge,
  Waterfall,
  genSeries,
  genWalk,
} from '@/components/v3/charts';

const TABS = [
  { id: 'regime', label: 'Regime distribution' },
  { id: 'attr', label: 'P&L attribution' },
  { id: 'corr', label: 'Correlation matrix' },
  { id: 'bench', label: 'Benchmark' },
  { id: 'journal', label: 'Journal' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function CorrMatrix() {
  const names = [
    'breakout-spy',
    'momentum-qqq',
    'trend-iwm',
    'pullback-xlk',
    'weak-signal-tlt',
    'reversal-arkk',
    'mean-revert-spy',
  ];
  const cell = (i: number, j: number) => {
    if (i === j) return 1;
    const seed = i * 7 + j;
    return Math.round((Math.sin(seed) * 0.5 + 0.3) * 100) / 100;
  };
  return (
    <table className="corr-matrix">
      <thead>
        <tr>
          <th></th>
          {names.map((n) => (
            <th key={n} className="rot">
              {n}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {names.map((n, i) => (
          <tr key={n}>
            <th>{n}</th>
            {names.map((m, j) => {
              const v = cell(i, j);
              const intensity = Math.abs(v);
              const color =
                v >= 0
                  ? `color-mix(in oklch, var(--mint) ${intensity * 80 + 8}%, var(--surface-3))`
                  : `color-mix(in oklch, var(--pink) ${Math.abs(v) * 80 + 8}%, var(--surface-3))`;
              return (
                <td key={m} style={{ background: color }}>
                  {v.toFixed(2)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function InsightsScreen() {
  const [tab, setTab] = useState<TabId>('regime');

  return (
    <div className="v3-page">
      <SectionHeader
        eyebrow="04 — Insights"
        title="What is the platform learning about you, your fleet, and the markets you trade."
      />
      <div className="v3-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab ' + (tab === t.id ? 'on' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'regime' && (
        <Card
          title="Regime distribution · last 6 months"
          sub="How much time markets spent in each regime — and how your fleet earned in each"
        >
          <Ridge
            rows={[
              {
                label: 'RISK-ON · Calm',
                color: 'rgb(120, 230, 200)',
                values: genSeries(60, 0.5, 0.2).map((v) => Math.max(0, v + 0.5)),
              },
              {
                label: 'RISK-ON · Normal',
                color: 'rgb(120, 230, 180)',
                values: genSeries(60, 0.6, 0.2).map((v) => Math.max(0, v + 0.4)),
              },
              {
                label: 'NEUTRAL',
                color: 'rgb(180, 180, 200)',
                values: genSeries(60, 0.3, 0.3).map((v) => Math.max(0, v + 0.3)),
              },
              {
                label: 'RISK-OFF · Stress',
                color: 'rgb(240, 180, 100)',
                values: genSeries(60, 0.15, 0.2).map((v) => Math.max(0, v + 0.15)),
              },
              {
                label: 'RISK-OFF · Crisis',
                color: 'rgb(240, 120, 100)',
                values: genSeries(60, 0.05, 0.1).map((v) => Math.max(0, v + 0.05)),
              },
            ]}
            height={220}
          />
        </Card>
      )}

      {tab === 'attr' && (
        <Card
          title="P&L attribution · last 30 days"
          sub="Where did your gains come from? Where did losses bite?"
        >
          <Waterfall
            rows={[
              { label: 'breakout-spy', val: 1842 },
              { label: 'pullback-xlk', val: 2110 },
              { label: 'momentum-qqq', val: 920 },
              { label: 'trend-iwm', val: 612 },
              { label: 'weak-signal-tlt', val: 88 },
              { label: 'reversal-arkk', val: 240 },
              { label: 'mean-revert-spy', val: -180 },
              { label: 'fees & slippage', val: -180 },
            ]}
          />
        </Card>
      )}

      {tab === 'corr' && (
        <Card
          title="Correlation matrix · last 30d returns"
          sub="0 = independent · 1 = identical · be wary above 0.7"
        >
          <CorrMatrix />
        </Card>
      )}

      {tab === 'bench' && (
        <Card title="Fleet vs benchmarks" sub="SPY · QQQ · 60/40">
          <EquityChart
            benchmark={genWalk(180, 0.6, 0.4)}
            strategy={genWalk(180, 1.4, 0.5)}
            oosAt={0.85}
            height={240}
          />
          <div className="metrics-strip">
            <KPI label="Fleet" value="+12.4%" tone="mint" />
            <Hairline vertical />
            <KPI label="SPY" value="+7.1%" tone="" />
            <Hairline vertical />
            <KPI label="QQQ" value="+9.8%" tone="" />
            <Hairline vertical />
            <KPI label="60/40" value="+4.6%" tone="" />
            <Hairline vertical />
            <KPI label="Alpha vs SPY" value="+5.3%" tone="mint" />
          </div>
        </Card>
      )}

      {tab === 'journal' && (
        <Card title="Trade journal" sub="all 184 trades · filterable">
          <CalHeatmap data={genSeries(7 * 26, 0, 0.4)} weeks={26} />
          <div className="micro" style={{ marginTop: 8 }}>
            Each cell is one day · mint = positive P&amp;L · pink = negative · empty = no trades
          </div>
        </Card>
      )}
    </div>
  );
}
