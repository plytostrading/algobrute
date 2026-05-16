'use client';

/**
 * v3 Operations — port of inline Operations component in
 * `_design/v3-bundle/project/v3/app.jsx` (lines ~243–358).
 *
 * Mock data only; tabs: Fleet · Risk Dashboard · Monitoring.
 * UI-P2/P3 will wire to live backend.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Card, Pill, SectionHeader } from '@/components/v3/atoms';
import {
  Bullet,
  Donut,
  Picto,
  ScaleBar,
  Sparkline,
  genSeries,
} from '@/components/v3/charts';

interface OpsRow {
  name: string;
  state: { label: string; tone: 'mint' | 'warn' | 'alert' | 'neutral' };
  days: number;
  pnl: number;
  sharpe: number;
  sizing: number;
  lastAction: string;
  drift?: boolean;
}

const OPS_ROWS: OpsRow[] = [
  {
    name: 'mean-revert-spy',
    state: { label: 'paused · regime', tone: 'warn' },
    days: 12,
    pnl: -180,
    sharpe: 0.82,
    sizing: 0,
    lastAction: 'regime change 2d ago',
  },
  {
    name: 'weak-signal-tlt',
    state: { label: 'ramping', tone: 'mint' },
    days: 4,
    pnl: 88,
    sharpe: 0.94,
    sizing: 45,
    lastAction: 'day 4 of 7',
  },
  {
    name: 'momentum-qqq',
    state: { label: 'active', tone: 'mint' },
    days: 38,
    pnl: 920,
    sharpe: 1.43,
    sizing: 100,
    lastAction: '',
    drift: true,
  },
  {
    name: 'breakout-spy',
    state: { label: 'active', tone: 'mint' },
    days: 42,
    pnl: 1842,
    sharpe: 1.81,
    sizing: 100,
    lastAction: '—',
  },
  {
    name: 'pullback-xlk',
    state: { label: 'active', tone: 'mint' },
    days: 56,
    pnl: 2110,
    sharpe: 1.92,
    sizing: 100,
    lastAction: '—',
  },
  {
    name: 'trend-iwm',
    state: { label: 'active', tone: 'mint' },
    days: 21,
    pnl: 612,
    sharpe: 1.62,
    sizing: 100,
    lastAction: '—',
  },
  {
    name: 'reversal-arkk',
    state: { label: 'paused · you', tone: 'warn' },
    days: 30,
    pnl: 240,
    sharpe: 1.12,
    sizing: 0,
    lastAction: 'Apr 28 · "high vol"',
  },
];

const formatPnl = (n: number) => (n >= 0 ? '+' : '−') + '$' + Math.abs(n).toLocaleString();

export default function OperationsScreen() {
  const [tab, setTab] = useState<'fleet' | 'risk' | 'monitoring'>('fleet');
  const opsTabs: Array<{ id: typeof tab; label: string }> = [
    { id: 'fleet', label: 'Fleet' },
    { id: 'risk', label: 'Risk Dashboard' },
    { id: 'monitoring', label: 'Monitoring' },
  ];

  return (
    <div className="v3-page">
      <SectionHeader
        eyebrow="02 — Operations"
        title="Bot lifecycle, sorted by urgency."
        sub="Click any bot for the full lifecycle drilldown"
      />

      <div className="ops-tabs">
        {opsTabs.map((t) => (
          <button
            key={t.id}
            className={'ops-tab ' + (tab === t.id ? 'on' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fleet' && (
        <>
          <Card
            eyebrow="Correlation alert"
            title="2 bots above 0.75 correlation for 8+ days"
            action={<Pill tone="warn">REVIEW</Pill>}
          >
            <div className="corr-banner">
              <div className="corr-pair">
                <Pill>breakout-spy</Pill>
                <span className="corr-link">0.78 →</span>
                <Pill>momentum-qqq</Pill>
              </div>
              <Sparkline values={genSeries(30, 0.65, 0.05)} width={200} height={36} />
              <button className="v3-btn-primary">See recommendation →</button>
            </div>
          </Card>

          <div className="v3-grid-cols-3-1 v3-gap-lg">
            <div>
              <Card
                title="Fleet — sorted by urgency"
                sub="circuit_breaker → paused → ramping → active → stopped"
              >
                <table className="v3-table">
                  <thead>
                    <tr>
                      <th>Bot</th>
                      <th>State</th>
                      <th>Days</th>
                      <th>P&amp;L</th>
                      <th>Sharpe</th>
                      <th>Sizing</th>
                      <th>Last action</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {OPS_ROWS.map((r) => (
                      <tr key={r.name}>
                        <td>
                          <b>{r.name}</b>
                        </td>
                        <td>
                          <Pill tone={r.state.tone}>{r.state.label}</Pill>
                        </td>
                        <td>{r.days}</td>
                        <td className={r.pnl >= 0 ? 'pos' : 'neg'}>{formatPnl(r.pnl)}</td>
                        <td>{r.sharpe.toFixed(2)}</td>
                        <td>
                          <Bullet value={r.sizing} max={100} />
                        </td>
                        <td>
                          {r.drift ? <Pill tone="warn">drift</Pill> : r.lastAction}
                        </td>
                        <td>
                          <Link href={`/v3/operations/${r.name}`} className="v3-link">
                            open →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <div className="v3-stack">
              <Card eyebrow="Shadow Sizer" title="Canary mode" dense>
                <div className="canary-row">
                  <Donut
                    slices={[{ value: 64, color: 'var(--mint)' }]}
                    size={84}
                    thickness={10}
                    label="64%"
                    sub="alignment"
                  />
                  <div className="canary-text">
                    Shadow Sizer agreed with live sizing on <b>64% of trades</b> this week. The
                    remaining 36% were within 1 risk-unit. Safe to promote.
                  </div>
                </div>
              </Card>
              <Card eyebrow="Circuit breaker fleet" title="Fleet utilisation" dense>
                <ScaleBar
                  value={42}
                  markers={['0', '50', '100']}
                  thresholds={[
                    { at: 70, label: 'WARN', color: 'var(--warn)' },
                    { at: 90, label: 'TRIP', color: 'var(--alert)' },
                  ]}
                />
                <div className="micro">Per-bot meters in detail view</div>
              </Card>
              <Card eyebrow="Daily" title="Order admissions" dense>
                <div className="admit-rows">
                  <div className="admit-row">
                    <span>Admitted</span>
                    <Picto value={31} total={36} tone="on" />
                    <b>31</b>
                  </div>
                  <div className="admit-row">
                    <span>Denied · regime</span>
                    <Picto value={3} total={36} tone="warn" />
                    <b>3</b>
                  </div>
                  <div className="admit-row">
                    <span>Denied · risk</span>
                    <Picto value={2} total={36} tone="warn" />
                    <b>2</b>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === 'risk' && (
        <Card eyebrow="Risk Dashboard" title="Fleet risk weather">
          <p className="reco-prose">
            Fleet is operating within risk parameters. VaR is well below tolerance and no circuit
            breakers are active. The correlation flag on momentum-qqq and breakout-spy is the
            primary action item.
          </p>
          <div className="metrics-strip" style={{ marginTop: 14 }}>
            <div className="v3-kpi">
              <div className="lbl">Weather</div>
              <div className="val mint">72</div>
              <div className="sub">partly cloudy</div>
            </div>
            <div className="v3-hair v" />
            <div className="v3-kpi">
              <div className="lbl">VaR 95%</div>
              <div className="val">4.2%</div>
            </div>
            <div className="v3-hair v" />
            <div className="v3-kpi">
              <div className="lbl">CVaR 95%</div>
              <div className="val">5.8%</div>
            </div>
            <div className="v3-hair v" />
            <div className="v3-kpi">
              <div className="lbl">Active</div>
              <div className="val">5/7</div>
              <div className="sub">bots</div>
            </div>
            <div className="v3-hair v" />
            <div className="v3-kpi">
              <div className="lbl">Net Beta</div>
              <div className="val">0.42</div>
            </div>
          </div>
        </Card>
      )}

      {tab === 'monitoring' && (
        <Card eyebrow="Fleet monitoring" title="Decision engine health — all active bots">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {OPS_ROWS.filter((r) => r.state.tone === 'mint').map((b, idx) => (
              <div key={b.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Pill tone={b.state.tone}>{b.state.label}</Pill>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>{b.name}</span>
                  <Link
                    href={`/v3/operations/${b.name}`}
                    className="v3-link"
                    style={{ marginLeft: 'auto' }}
                  >
                    open →
                  </Link>
                </div>
                <div className="metrics-strip">
                  <div className="v3-kpi">
                    <div className="lbl">SPRT LLR</div>
                    <div className="val mint">{(0.6 + idx * 0.12).toFixed(2)}</div>
                  </div>
                  <div className="v3-hair v" />
                  <div className="v3-kpi">
                    <div className="lbl">CUSUM</div>
                    <div className="val">stable</div>
                  </div>
                  <div className="v3-hair v" />
                  <div className="v3-kpi">
                    <div className="lbl">Win-rate (Bayes)</div>
                    <div className="val mint">{(0.57 + idx * 0.02).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
