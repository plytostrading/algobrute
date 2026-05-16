'use client';

/**
 * v3 Workbench — port of the inline Workbench + WBConcept / WBDiscover /
 * WBBuild / WBSim / WBDeploy components from
 * `_design/v3-bundle/project/v3/app.jsx` (lines ~363–828).
 *
 * Mock data only. The 5-tab pipeline (Concept → Discover → Build & Test →
 * Trade Simulation → Deploy) is preserved verbatim; some content is
 * simplified relative to the prototype but the structure and visuals match.
 */

import { useState, type ReactNode } from 'react';
import { Card, Pill, KPI, SectionHeader, Hairline } from '@/components/v3/atoms';
import {
  Bullet,
  DotMatrix,
  EquityChart,
  genWalk,
} from '@/components/v3/charts';

// ---------------------------------------------------------------------------
// Concept tab
// ---------------------------------------------------------------------------

function WBConcept() {
  return (
    <>
      <Card eyebrow="Plain-English input" title="Describe a pattern in your own words.">
        <textarea
          className="v3-textarea"
          defaultValue="when small caps start rallying faster than large caps for a few days in a row, that move usually keeps going for about two weeks — unless volatility is high, then I'd rather wait"
        />
        <div className="suggest-chips">
          <Pill>breakouts on rising volume</Pill>
          <Pill>oversold bounces in trends</Pill>
          <Pill>sector rotation</Pill>
          <Pill>gap fades</Pill>
        </div>
      </Card>
      <div className="v3-grid-2 v3-gap-lg">
        <Card eyebrow="What I heard you say" title="Coach playback">
          <div className="playback-cols">
            <div>
              <div className="lbl">What we&apos;re looking at</div>
              <p>Small-caps outperforming large-caps for several days in a row.</p>
            </div>
            <div>
              <div className="lbl">When we enter</div>
              <p>After 3 consecutive days of IWM outpacing SPY by &gt;0.3% each.</p>
            </div>
            <div>
              <div className="lbl">How long we hold</div>
              <p>About 10 trading days, or until the spread turns.</p>
            </div>
            <div>
              <div className="lbl">When we don&apos;t trade</div>
              <p>If VIX is above 22, sit it out.</p>
            </div>
          </div>
        </Card>
        <Card eyebrow="Receipts" title="What you said → what I'm measuring" sub="You never edit the right column">
          <table className="v3-table receipts">
            <thead>
              <tr>
                <th>What you said</th>
                <th>What I&apos;m measuring</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>&quot;small caps rallying faster than large caps&quot;</td>
                <td>(IWM_5d_return − SPY_5d_return) &gt; 0</td>
                <td>
                  <Bullet value={88} max={100} q1={50} q2={75} />
                </td>
              </tr>
              <tr>
                <td>&quot;a few days in a row&quot;</td>
                <td>condition holds for ≥3 sessions</td>
                <td>
                  <Bullet value={92} max={100} q1={50} q2={75} />
                </td>
              </tr>
              <tr>
                <td>&quot;about two weeks&quot;</td>
                <td>hold for 10 trading days</td>
                <td>
                  <Bullet value={76} max={100} q1={50} q2={75} />
                </td>
              </tr>
              <tr>
                <td>&quot;if volatility is high, wait&quot;</td>
                <td>VIX_close &lt; 22 entry filter</td>
                <td>
                  <Bullet value={94} max={100} q1={50} q2={75} />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="receipt-actions">
            <button className="v3-btn-primary">Send to Build &amp; Test →</button>
            <button className="v3-btn-ghost">Refine in chat</button>
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Discover tab
// ---------------------------------------------------------------------------

function WBDiscover() {
  const templates = [
    {
      name: 'Trend Continuation',
      tag: 'long-horizon',
      desc: 'Stays with established trends until they break.',
      sharpe: 1.84,
    },
    {
      name: 'Mean Reversion',
      tag: 'short-horizon',
      desc: 'Buys the dip in oversold trends.',
      sharpe: 1.21,
    },
    {
      name: 'Breakout Volume',
      tag: 'medium',
      desc: 'Catches the start of new moves with volume confirmation.',
      sharpe: 1.62,
    },
    {
      name: 'Pullback Resumption',
      tag: 'medium',
      desc: 'Buys the second test of a moving average in an uptrend.',
      sharpe: 1.49,
    },
    {
      name: 'Failed Move Reversal',
      tag: 'short',
      desc: 'Fades broken breakouts.',
      sharpe: 0.94,
    },
    {
      name: 'Sector Rotation',
      tag: 'long',
      desc: 'Rotates into leading sectors as breadth shifts.',
      sharpe: 1.71,
    },
  ];

  return (
    <Card title="Templates — proven starting points" sub="9 templates · filterable by horizon, market, signal family">
      <div className="template-grid">
        {templates.map((t) => (
          <div key={t.name} className="template-card">
            <div className="t-head">
              <div className="t-name">{t.name}</div>
              <Pill>{t.tag}</Pill>
            </div>
            <p className="t-desc">{t.desc}</p>
            <div className="t-foot">
              <DotMatrix value={32} total={50} cols={10} size={6} gap={2} />
              <div className="t-sharpe">
                Sharpe<b>{t.sharpe.toFixed(2)}</b>
              </div>
            </div>
            <button className="v3-btn-ghost">Use this →</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Build tab
// ---------------------------------------------------------------------------

function WBBuild() {
  return (
    <>
      <div className="v3-grid-2 v3-gap-lg">
        <Card eyebrow="Verdict" title="LEGS." action={<Pill tone="mint">PROMISING</Pill>}>
          <div className="verdict-card">
            <div className="verdict-mark">LEGS.</div>
            <p className="verdict-prose">
              This idea showed consistent edge across 8 of 10 CPCV folds, survived 5,000 Monte
              Carlo perturbations, and held up out-of-sample. It struggled in{' '}
              <b>high-volatility regimes</b> — we&apos;d suggest pausing it when VIX &gt; 22.
            </p>
          </div>
          <div className="verdict-stats">
            <KPI label="CPCV folds" value="8/10" sub="passed" tone="mint" />
            <Hairline vertical />
            <KPI label="MC robust" value="83%" sub="of paths profitable" tone="mint" />
            <Hairline vertical />
            <KPI label="Reliability" value="0.74" sub="threshold 0.65" tone="mint" />
          </div>
        </Card>
        <Card eyebrow="Three reasons we like this" title="Why it earned LEGS">
          <ol className="reasons">
            <li>
              <b>Survives the hard months.</b> 2020 March, 2022 June — equity dipped but didn&apos;t
              break.
            </li>
            <li>
              <b>Few losing streaks.</b> Worst losing streak was 4 trades, well below the 8-trade
              reliability bar.
            </li>
            <li>
              <b>Doesn&apos;t overlap with what you already have.</b> Correlation with your active
              fleet stays below 0.42.
            </li>
          </ol>
        </Card>
      </div>

      <Card title="Sample trade ledger" sub="last 12 of 184 trades">
        <table className="v3-table">
          <thead>
            <tr>
              <th>Entry</th>
              <th>Side</th>
              <th>Hold</th>
              <th>P&amp;L</th>
              <th>Regime</th>
              <th>Reason exited</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">2024-03-14</td>
              <td>Long</td>
              <td>11d</td>
              <td className="pos">+2.3%</td>
              <td>
                <Pill tone="mint">Risk-On</Pill>
              </td>
              <td>target</td>
            </tr>
            <tr>
              <td className="mono">2024-02-28</td>
              <td>Long</td>
              <td>8d</td>
              <td className="pos">+1.7%</td>
              <td>
                <Pill tone="mint">Risk-On</Pill>
              </td>
              <td>target</td>
            </tr>
            <tr>
              <td className="mono">2024-02-12</td>
              <td>Long</td>
              <td>14d</td>
              <td className="neg">−1.1%</td>
              <td>
                <Pill tone="warn">Stress</Pill>
              </td>
              <td>stop</td>
            </tr>
            <tr>
              <td className="mono">2024-01-30</td>
              <td>Long</td>
              <td>9d</td>
              <td className="pos">+2.9%</td>
              <td>
                <Pill tone="mint">Risk-On</Pill>
              </td>
              <td>target</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Simulation tab
// ---------------------------------------------------------------------------

function WBSim() {
  return (
    <>
      <Card eyebrow="Paper trade · day 14 of 30" title="Walking it forward on real ticks">
        <EquityChart
          benchmark={genWalk(14, 0.4, 0.3)}
          strategy={genWalk(14, 0.9, 0.4)}
          oosAt={1}
          height={160}
        />
        <div className="metrics-strip">
          <KPI label="Trades" value="7" tone="" />
          <Hairline vertical />
          <KPI label="Win rate" value="71%" tone="mint" />
          <Hairline vertical />
          <KPI label="P&L (paper)" value="+$84" tone="mint" />
          <Hairline vertical />
          <KPI label="Sharpe" value="1.62" tone="mint" />
          <Hairline vertical />
          <KPI label="Drift vs backtest" value="0.04σ" sub="within tolerance" tone="" />
        </div>
      </Card>
      <Card title="Live trade tape" sub="real ticks · paper fills · zero capital at risk">
        <table className="v3-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Fill</th>
              <th>Slippage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">10:42:18</td>
              <td>IWM</td>
              <td>BUY</td>
              <td>120</td>
              <td>$201.34</td>
              <td className="micro">+0.02</td>
              <td>
                <Pill tone="mint">filled</Pill>
              </td>
            </tr>
            <tr>
              <td className="mono">10:18:02</td>
              <td>SPY</td>
              <td>SELL</td>
              <td>50</td>
              <td>$524.12</td>
              <td className="micro">−0.01</td>
              <td>
                <Pill tone="mint">filled</Pill>
              </td>
            </tr>
            <tr>
              <td className="mono">09:55:41</td>
              <td>QQQ</td>
              <td>BUY</td>
              <td>30</td>
              <td>$498.20</td>
              <td className="micro">+0.04</td>
              <td>
                <Pill tone="mint">filled</Pill>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Deploy tab
// ---------------------------------------------------------------------------

function WBDeploy() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card title="Save · Validated · Paper · Live" sub="The deployment ladder. Each rung is a real ceremony.">
        <div className="deploy-ladder">
          {[
            {
              num: '01',
              name: 'Saved',
              state: 'done',
              desc: 'Idea stored in your library.',
              when: 'Mar 02',
            },
            {
              num: '02',
              name: 'Validated',
              state: 'done',
              desc: 'Passed CPCV + MC + governance review.',
              when: 'Mar 14',
            },
            {
              num: '03',
              name: 'Paper',
              state: 'current',
              desc: 'Trading paper on live ticks for 30 days.',
              when: 'day 14 of 30',
            },
            {
              num: '04',
              name: 'Live',
              state: 'locked',
              desc: 'Real capital. Requires confirmation.',
              when: 'unlocks in 16 days',
            },
          ].map((r) => (
            <div key={r.num} className={'rung ' + r.state}>
              <div className="rung-num">{r.num}</div>
              <div className="rung-body">
                <div className="rung-name">
                  {r.name}
                  <Pill
                    tone={r.state === 'current' ? 'mint' : r.state === 'done' ? 'neutral' : 'warn'}
                  >
                    {r.state}
                  </Pill>
                </div>
                <div className="rung-desc">{r.desc}</div>
                <div className="rung-when">{r.when}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="What this means">
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--f-display)',
            fontStyle: 'italic',
            fontSize: 17,
            lineHeight: 1.5,
            color: 'var(--text)',
            maxWidth: '60ch',
          }}
        >
          With these settings, the bot will trade up to{' '}
          <b style={{ color: 'var(--mint)' }}>~$400 per signal</b> against{' '}
          <b>$10,000 of paper capital</b>, only when the market is in Low-Vol or Normal regime, and
          will stop trading for the day if it loses more than <b>$120</b>. Estimated{' '}
          <b>3–7 trades/week</b> based on backtest signal frequency.
        </p>
      </Card>

      <div className="deploy-confirm">
        <h4>Before you deploy live, we&apos;ll ask you four things:</h4>
        <ol>
          <li>Do you understand the worst-case drawdown shown above?</li>
          <li>Have you agreed the position sizing matches your risk budget?</li>
          <li>Are you OK with this bot pausing itself when regime shifts?</li>
          <li>Do you understand this can lose money?</li>
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workbench shell
// ---------------------------------------------------------------------------

type TabId = 'concept' | 'discover' | 'build' | 'sim' | 'deploy';

const STEPS: Array<{ id: TabId; num: string; label: string; state: string }> = [
  { id: 'concept', num: '01', label: 'Concept', state: 'active' },
  { id: 'discover', num: '02', label: 'Discover', state: 'done' },
  { id: 'build', num: '03', label: 'Build & Test', state: 'current' },
  { id: 'sim', num: '04', label: 'Trade Simulation', state: 'next' },
  { id: 'deploy', num: '05', label: 'Deploy', state: 'next' },
];

export default function WorkbenchScreen() {
  const [tab, setTab] = useState<TabId>('concept');

  const body: Record<TabId, ReactNode> = {
    concept: <WBConcept />,
    discover: <WBDiscover />,
    build: <WBBuild />,
    sim: <WBSim />,
    deploy: <WBDeploy />,
  };

  return (
    <div className="v3-page">
      <SectionHeader
        eyebrow="03 — Workbench"
        title="Idea → Validation → Deploy"
        sub="A pipeline. Everything flows the same direction."
        right={
          <div className="v3-toolbar">
            <Pill tone="mint">2 RUNNING</Pill>
            <Pill>3 IN QUEUE</Pill>
          </div>
        }
      />

      <div className="wb-pipeline">
        {STEPS.map((s) => (
          <button
            key={s.id}
            className={'wb-step ' + (tab === s.id ? 'on' : '')}
            onClick={() => setTab(s.id)}
          >
            <span className="num">{s.num}</span>
            <span className="lbl">{s.label}</span>
            <span className={'state ' + s.state}>{s.state}</span>
          </button>
        ))}
      </div>

      <div className="v3-card dense">
        <div className="v3-card-body">
          <div className="job-rail">
            <span className="lbl">backtest queue</span>
            <div className="job">
              <span className="name">breakout-iwm · v3</span>
              <div className="prog">
                <div style={{ width: '67%' }} />
              </div>
              <span className="pct">67%</span>
            </div>
            <div className="job">
              <span className="name">pullback-xlf · v2</span>
              <div className="prog">
                <div style={{ width: '23%' }} />
              </div>
              <span className="pct">23%</span>
            </div>
            <span className="queued">+ 3 queued</span>
          </div>
        </div>
      </div>

      {body[tab]}
    </div>
  );
}
