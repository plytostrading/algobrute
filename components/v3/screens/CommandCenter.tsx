'use client';

/**
 * v3 Command Center — port of the inline CommandCenter component in
 * `_design/v3-bundle/project/v3/app.jsx` (lines ~57–207).
 *
 * Mock data only. UI-P2/P3 will wire to live backend hooks.
 */

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, Pill, KPI, SectionHeader, Hairline } from '@/components/v3/atoms';
import {
  EquityChart,
  RadialBars,
  RegimePolar,
  Beeswarm,
  Sparkline,
  Bullet,
  genWalk,
  genSeries,
} from '@/components/v3/charts';

// ---------------------------------------------------------------------------
// Bot row sub-components
// ---------------------------------------------------------------------------

interface BotEntry {
  name: string;
  state: string;
  days: number;
  pnl: number;
  sharpe: number;
  sizing: number;
  reason?: string;
  flag?: string;
}

function BotRow({ name, state, days, pnl, sharpe, sizing, reason, flag }: BotEntry) {
  return (
    <Link href={`/v3/operations/${name}`} className="bot-row" style={{ textDecoration: 'none' }}>
      <span className="dot">●</span>
      <div className="name">
        <span>{name}</span>
        <span className="state">{state.replace(/_/g, ' ')}</span>
      </div>
      <div className="metric">
        <span className="lbl">days</span>
        <b>{days}</b>
      </div>
      <div className="metric">
        <span className="lbl">P&amp;L</span>
        <b className={pnl >= 0 ? 'pos' : 'neg'}>
          {pnl >= 0 ? '+' : '−'}${Math.abs(pnl)}
        </b>
      </div>
      <div className="metric">
        <span className="lbl">Sharpe</span>
        <b>{sharpe.toFixed(2)}</b>
      </div>
      <div className="metric wide">
        <span className="lbl">Sizing</span>
        <Bullet value={sizing} max={100} q1={40} q2={80} />
      </div>
      {flag && <Pill tone="warn">{flag}</Pill>}
      {reason && <span className="reason">{reason}</span>}
      <span className="chevron">›</span>
    </Link>
  );
}

interface BotGroupProps {
  title: string;
  tone: 'mint' | 'warn' | 'alert' | 'neutral';
  count: number;
  forceOpen?: boolean;
  lockedOpen?: boolean;
  children: ReactNode;
}

function BotGroup({
  title,
  tone,
  count,
  forceOpen = false,
  lockedOpen = false,
  children,
}: BotGroupProps) {
  const [open, setOpen] = useState(forceOpen);
  return (
    <div className="bot-group">
      <button
        className="bot-group-head"
        onClick={() => !lockedOpen && setOpen(!open)}
        disabled={lockedOpen}
      >
        <span className={'caret ' + (open ? 'open' : '')}>▸</span>
        <Pill tone={tone}>{title}</Pill>
        <span className="count">
          {count} bot{count !== 1 ? 's' : ''}
        </span>
        {lockedOpen && <span className="locked">always visible</span>}
      </button>
      {open && <div className="bot-group-body">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommandCenterScreen() {
  const regime = Array.from({ length: 16 }).map((_, i) => {
    if (i < 4) return 0.85 - i * 0.08;
    if (i < 8) return 0.5 - (i - 4) * 0.05;
    if (i < 12) return 0.25;
    return 0.08;
  });

  const operating: BotEntry[] = [
    { name: 'breakout-spy', state: 'active', days: 42, pnl: 1842, sharpe: 1.81, sizing: 100 },
    { name: 'momentum-qqq', state: 'active', days: 38, pnl: 920, sharpe: 1.43, sizing: 100, flag: 'drift' },
    { name: 'trend-iwm', state: 'active', days: 21, pnl: 612, sharpe: 1.62, sizing: 100 },
    { name: 'weak-signal-tlt', state: 'ramping', days: 4, pnl: 88, sharpe: 0.94, sizing: 45 },
    { name: 'pullback-xlk', state: 'active', days: 56, pnl: 2110, sharpe: 1.92, sizing: 100 },
  ];

  const standingDown: BotEntry[] = [
    {
      name: 'mean-revert-spy',
      state: 'paused_regime',
      days: 12,
      pnl: -180,
      sharpe: 0.82,
      sizing: 0,
      reason: 'regime: risk-on (waiting risk-off)',
    },
    {
      name: 'reversal-arkk',
      state: 'paused_user',
      days: 30,
      pnl: 240,
      sharpe: 1.12,
      sizing: 0,
      reason: 'you paused this on Apr 28',
    },
  ];

  return (
    <div className="v3-page">
      <SectionHeader
        eyebrow="01 — Command Center"
        title="Your fleet is calm. Two things want a glance."
        sub="Tuesday morning briefing · markets opened 23 minutes ago"
        right={
          <div className="v3-toolbar">
            <Pill tone="mint">LIVE</Pill>
            <Pill>MARKET OPEN</Pill>
            <span className="v3-time">10:53 ET</span>
          </div>
        }
      />

      <div className="v3-grid-3 v3-gap-lg">
        <Card
          eyebrow="Capital"
          title="$48,212"
          sub="+$312 today · +0.65%"
          action={<Pill tone="mint">+0.65%</Pill>}
        >
          <div className="hero-capital">
            <EquityChart
              benchmark={genWalk(60, 1, 1)}
              strategy={genWalk(60, 1.3, 0.6)}
              oosAt={0.55}
              height={120}
            />
            <div className="period-row">
              {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map((p) => (
                <button key={p} className={'period ' + (p === '1D' ? 'on' : '')}>
                  {p}
                </button>
              ))}
            </div>
            <div className="metrics-strip">
              <KPI label="Sharpe" value="1.82" sub="OOS 1.61" />
              <Hairline vertical />
              <KPI label="Vol" value="11.4%" sub="ann." />
              <Hairline vertical />
              <KPI label="Max DD" value="−6.2%" sub="Apr-08" tone="alert" />
            </div>
          </div>
        </Card>

        <Card eyebrow="Weather Score" title="72 — Partly Cloudy" sub="Up 4 from yesterday">
          <div className="weather-card">
            <RadialBars
              rows={[
                { value: 72, color: 'var(--mint)' },
                { value: 64, color: 'var(--mint-2)' },
                { value: 81, color: 'var(--mint-3)' },
                { value: 48, color: 'var(--warn)' },
              ]}
              size={130}
              thickness={9}
            />
            <div className="weather-legend">
              <div>
                <i style={{ background: 'var(--mint)' }} />
                Composite <b>72</b>
              </div>
              <div>
                <i style={{ background: 'var(--mint-2)' }} />
                Breadth <b>64</b>
              </div>
              <div>
                <i style={{ background: 'var(--mint-3)' }} />
                Liquidity <b>81</b>
              </div>
              <div>
                <i style={{ background: 'var(--warn)' }} />
                Volatility <b>48</b>
              </div>
            </div>
          </div>
        </Card>

        <Card
          eyebrow="Regime composite"
          title="Risk-On · Low stress"
          sub="16-cell regime grid · 14 of 16 confirm"
        >
          <div className="regime-card">
            <RegimePolar value={regime} size={150} />
            <div className="regime-legend">
              <div className="row">
                <span className="dot mint" />
                Global<Pill tone="mint">Risk-On</Pill>
              </div>
              <div className="row">
                <span className="dot mint" />
                Sector<Pill tone="mint">Tech leading</Pill>
              </div>
              <div className="row">
                <span className="dot warn" />
                Local<Pill tone="warn">Mean-revert</Pill>
              </div>
              <div className="row">
                <span className="dot mint" />
                Stress<Pill tone="mint">Low</Pill>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="v3-grid-2 v3-gap-lg">
        <Card
          eyebrow="Fleet briefing"
          title="Your fleet is doing fine."
          sub="written 3 minutes ago · refresh every 15m"
        >
          <p className="narrative-lead">
            Six of seven bots are sized normally.{' '}
            <b>The seventh, mean-revert-spy, took a small stop overnight on the gap up</b> — that&apos;s
            its job, no action needed. Two ideas in validation finished overnight; one looks{' '}
            <b>promising</b>.
          </p>
          <div className="narrative-stats">
            <div>
              <b>6/7</b>
              <span>bots in nominal sizing</span>
            </div>
            <Hairline vertical />
            <div>
              <b>0</b>
              <span>circuit breakers active</span>
            </div>
            <Hairline vertical />
            <div>
              <b>2</b>
              <span>validations completed</span>
            </div>
            <Hairline vertical />
            <div>
              <b>1</b>
              <span>recommendation</span>
            </div>
          </div>
          <button className="v3-link">Read full briefing →</button>
        </Card>

        <Card
          eyebrow="Top recommendation"
          title="Reduce momentum-qqq from 18% → 12%"
          action={<Pill tone="warn">PRIORITY · MEDIUM</Pill>}
        >
          <p className="reco-lead">
            It&apos;s been correlated above 0.78 with breakout-spy for 8 days. You&apos;re carrying
            the same exposure twice.
          </p>
          <div className="reco-evidence">
            <div>
              <div className="lbl">Correlation</div>
              <Beeswarm values={genSeries(40, 0.6, 0.1)} height={42} color="warn" />
            </div>
            <div>
              <div className="lbl">Drift since deploy</div>
              <Sparkline values={genSeries(30, 0.2, 0.01)} width={220} height={36} color="var(--warn)" />
            </div>
          </div>
          <div className="reco-actions">
            <button className="v3-btn-primary">Review evidence →</button>
            <button className="v3-btn-ghost">Snooze 24h</button>
            <button className="v3-btn-ghost">Dismiss</button>
          </div>
        </Card>
      </div>

      <Card
        title="Your bots"
        sub="grouped by urgency · 7 bots · 1 reviewing"
        action={
          <Link href="/v3/operations" className="v3-link">
            Open Operations →
          </Link>
        }
      >
        <BotGroup title="Risk Controls Active" tone="alert" count={0} forceOpen lockedOpen>
          <div className="empty-row">
            No circuit breakers active. We&apos;re showing this row anyway because if it ever fires,
            you&apos;d want to know.
          </div>
        </BotGroup>

        <BotGroup title="In Operation" tone="mint" count={5} forceOpen>
          {operating.map((b) => (
            <BotRow key={b.name} {...b} />
          ))}
        </BotGroup>

        <BotGroup title="Standing Down" tone="warn" count={2}>
          {standingDown.map((b) => (
            <BotRow key={b.name} {...b} />
          ))}
        </BotGroup>
      </Card>

      <Card
        eyebrow="Diff since last visit"
        title="3 things changed while you were away"
        sub="last visit: Mon 8:14 PM ET · 14 hours ago"
      >
        <div className="diff-grid">
          <div className="diff-row">
            <span className="diff-time">+11h</span>
            <span className="diff-icon mint">▲</span>
            <span className="diff-text">
              <b>weak-signal-tlt</b> finished ramping
            </span>
            <Pill tone="mint">45% → 100% sizing</Pill>
          </div>
          <div className="diff-row">
            <span className="diff-time">+6h</span>
            <span className="diff-icon warn">●</span>
            <span className="diff-text">
              Recommendation generated for <b>momentum-qqq</b>
            </span>
            <Pill tone="warn">Reduce 18% → 12%</Pill>
          </div>
          <div className="diff-row">
            <span className="diff-time">+2h</span>
            <span className="diff-icon mint">✓</span>
            <span className="diff-text">
              2 backtests finished — &quot;breakout-iwm&quot; looks <b>promising</b>
            </span>
            <Link href="/v3/workbench" className="v3-link">
              Open →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
