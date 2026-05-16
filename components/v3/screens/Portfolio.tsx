'use client';

/**
 * v3 Portfolio — port of the inline Portfolio component in
 * `_design/v3-bundle/project/v3/app.jsx` (lines ~939–1029).
 *
 * Mock data only. The Sankey-style FlowDiagram in the original is
 * replaced with a simpler bento card here pending a TypeScript port —
 * this is the only material simplification vs the v3 prototype.
 */

import { Card, SectionHeader } from '@/components/v3/atoms';
import {
  Bullet,
  Donut,
  EquityChart,
  Sparkline,
  genSeries,
  genWalk,
} from '@/components/v3/charts';

const HOLDINGS = [
  { sym: 'SPY', bot: 'breakout-spy', side: 'Long', qty: 22, price: 524.12, mv: 11530, today: 0.42, since: 3.8 },
  { sym: 'QQQ', bot: 'momentum-qqq', side: 'Long', qty: 16, price: 498.2, mv: 7971, today: 0.18, since: 2.4 },
  { sym: 'IWM', bot: 'trend-iwm', side: 'Long', qty: 30, price: 201.34, mv: 6040, today: -0.31, since: 1.2 },
  { sym: 'XLK', bot: 'pullback-xlk', side: 'Long', qty: 42, price: 218.1, mv: 9160, today: 0.61, since: 4.9 },
  { sym: 'TLT', bot: 'weak-signal-tlt', side: 'Long', qty: 28, price: 92.4, mv: 2587, today: 0.04, since: 0.2 },
];

export default function PortfolioScreen() {
  return (
    <div className="v3-page">
      <SectionHeader eyebrow="06 — Portfolio" title="$48,212 · the capital view" />

      <div className="v3-grid-3 v3-gap-lg">
        <Card eyebrow="Capital" title="$48,212" sub="+$312 today · +0.65%">
          <EquityChart
            benchmark={genWalk(80, 0.6, 0.4)}
            strategy={genWalk(80, 1.4, 0.6)}
            oosAt={1}
            height={140}
          />
        </Card>
        <Card eyebrow="Allocation" title="By strategy" dense>
          <Donut
            slices={[
              { value: 24, color: 'rgb(120, 230, 200)' },
              { value: 18, color: 'rgb(160, 220, 180)' },
              { value: 16, color: 'rgb(200, 210, 180)' },
              { value: 14, color: 'rgb(220, 200, 170)' },
              { value: 12, color: 'rgb(230, 180, 160)' },
              { value: 10, color: 'rgb(230, 160, 170)' },
              { value: 6, color: 'rgb(220, 160, 200)' },
            ]}
            size={140}
            thickness={20}
            label="7"
            sub="strategies"
          />
        </Card>
        <Card eyebrow="Risk" title="At-a-glance" dense>
          <div className="risk-stack">
            <div className="risk-row">
              <span>VaR 95%</span>
              <b>−$2,140</b>
              <Sparkline
                values={genSeries(40, -1, 0.2)}
                width={80}
                height={20}
                color="var(--alert)"
              />
            </div>
            <div className="risk-row">
              <span>Cash %</span>
              <b>18%</b>
              <Bullet value={18} max={30} q1={10} q2={20} />
            </div>
            <div className="risk-row">
              <span>Beta vs SPY</span>
              <b>0.42</b>
              <Sparkline values={genSeries(40, 0.4, 0.05)} width={80} height={20} />
            </div>
            <div className="risk-row">
              <span>Diversification</span>
              <b>4.8 / 7</b>
              <Bullet value={68} max={100} q1={40} q2={70} />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Holdings" sub="13 positions">
        <table className="v3-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Source bot</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Market value</th>
              <th>Today</th>
              <th>Since entry</th>
            </tr>
          </thead>
          <tbody>
            {HOLDINGS.map((h) => (
              <tr key={h.sym}>
                <td>
                  <b>{h.sym}</b>
                </td>
                <td className="micro">{h.bot}</td>
                <td>{h.side}</td>
                <td>{h.qty}</td>
                <td className="mono">${h.price.toFixed(2)}</td>
                <td className="mono">${h.mv.toLocaleString()}</td>
                <td className={h.today >= 0 ? 'pos' : 'neg'}>
                  {h.today >= 0 ? '+' : '−'}
                  {Math.abs(h.today).toFixed(2)}%
                </td>
                <td className={h.since >= 0 ? 'pos' : 'neg'}>
                  {h.since >= 0 ? '+' : '−'}
                  {Math.abs(h.since).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
