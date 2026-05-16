'use client';

/**
 * v3 Bot Detail — port of inline BotDetail drilldown from
 * `_design/v3-bundle/project/v3/app.jsx` (lines ~1034–1163).
 *
 * Mock data only. Lifecycle ladder, 12-step admission ladder, trade tape,
 * lineage rail. UI-P2/P3 will wire to live bot snapshots.
 */

import Link from 'next/link';
import { Card, KPI, Pill, SectionHeader, Hairline } from '@/components/v3/atoms';
import { EquityChart, genWalk } from '@/components/v3/charts';

const STATES = [
  'stopped',
  'ramping',
  'active',
  'paused_monitoring',
  'paused_regime',
  'paused_user',
  'circuit_breaker',
];

const ADMISSION_GATES = [
  'regime rule check',
  'passport sizing',
  'entry validation',
  'Kelly fraction',
  'conviction multiplier',
  'daily loss limit',
  'loss streak guard',
  'per-position cap',
  'CVaR cap',
  'fleet concentration',
  'ramp multiplier',
  'final size',
];

export default function BotDetailScreen({ botId }: { botId: string }) {
  return (
    <div className="v3-page">
      <Link href="/v3/operations" className="v3-back">
        ← Operations
      </Link>
      <SectionHeader
        eyebrow={`bot · ${botId}`}
        title={botId}
        sub="active · day 42 · sizing 100% · last trade 2h ago"
        right={
          <div className="v3-toolbar">
            <Pill tone="mint">ACTIVE</Pill>
            <button className="v3-btn-ghost">Pause</button>
            <button className="v3-btn-ghost">Stop</button>
          </div>
        }
      />

      <div className="v3-grid-2 v3-gap-lg">
        <Card eyebrow="Lifecycle" title="Where this bot is in its life">
          <div className="lifecycle">
            {STATES.map((s, i) => (
              <div key={s} className={'life-state ' + (s === 'active' ? 'on' : '')}>
                <div className="num">{String(i + 1).padStart(2, '0')}</div>
                <div className="lbl">{s.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
          <div className="micro">
            42 days in <b>ACTIVE</b> · entered Apr 18 from RAMPING · zero state changes in 30 days
          </div>
        </Card>

        <Card eyebrow="Live vs CPCV expectation" title="Is it behaving like the backtest?">
          <EquityChart
            benchmark={genWalk(60, 0.8, 0.3)}
            strategy={genWalk(60, 1.0, 0.35)}
            oosAt={1}
            height={140}
          />
          <div className="metrics-strip">
            <KPI label="Live Sharpe" value="1.81" tone="mint" />
            <Hairline vertical />
            <KPI label="CPCV Sharpe" value="1.74" tone="" />
            <Hairline vertical />
            <KPI label="Drift" value="0.07σ" sub="within tolerance" tone="mint" />
          </div>
        </Card>
      </div>

      <Card title="12-step order admission ladder · last trade" sub="every gate passed">
        <div className="ladder">
          {ADMISSION_GATES.map((g, i) => (
            <div key={g} className="ladder-step pass">
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span className="name">{g}</span>
              <Pill tone="mint">PASS</Pill>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Recent trades" sub="last 8 of 184">
        <table className="v3-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Hold</th>
              <th>P&amp;L</th>
              <th>Regime</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">Apr 30 10:18</td>
              <td>Long</td>
              <td>22</td>
              <td>$522.40</td>
              <td>$524.12</td>
              <td>11d</td>
              <td className="pos">+$37.84</td>
              <td>
                <Pill tone="mint">Risk-On</Pill>
              </td>
            </tr>
            <tr>
              <td className="mono">Apr 18 09:55</td>
              <td>Long</td>
              <td>20</td>
              <td>$518.10</td>
              <td>$522.40</td>
              <td>9d</td>
              <td className="pos">+$86.00</td>
              <td>
                <Pill tone="mint">Risk-On</Pill>
              </td>
            </tr>
            <tr>
              <td className="mono">Apr 04 13:42</td>
              <td>Long</td>
              <td>18</td>
              <td>$510.80</td>
              <td>$514.20</td>
              <td>14d</td>
              <td className="pos">+$61.20</td>
              <td>
                <Pill tone="mint">Risk-On</Pill>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
