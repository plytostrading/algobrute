'use client';

import { useMemo } from 'react';
import { StoryChapter } from '../StoryChapter';
import { InfoCallout } from '../InfoCallout';
import { CalibrationScatter } from '../CalibrationScatter';
import { QQPlot } from '../QQPlot';
import { PlatformHonesty } from '../FleetJourneySections';
import { useCalibration } from '@/hooks/useDashboard';
import type { JourneyResponse } from '@/hooks/useFleetJourney';

export function Ch6HowToJudgeSuccess({ data }: { data: JourneyResponse }) {
  const cal = useCalibration(10);

  const tradePnls = useMemo(
    () => data.per_trade_outcomes.map((t) => t.realized_pnl_pct),
    [data.per_trade_outcomes],
  );

  const calibErrors = useMemo(() => {
    if (!cal.data?.rows) return [] as number[];
    return cal.data.rows
      .map((r) =>
        r.realized_sharpe !== null && r.predicted_sharpe !== null
          ? r.realized_sharpe - r.predicted_sharpe
          : null,
      )
      .filter((v): v is number => v !== null);
  }, [cal.data]);

  const coverage = {
    regimeDays: new Set(data.timeline.regime_bands.flatMap((b) => [b.start, b.end])).size,
    tradesTotal: data.per_trade_outcomes.length,
    tradesWithShadow: data.per_trade_outcomes.filter((t) => t.shadow_pnl_pct !== null).length,
    interventionsTotal: data.timeline.interventions.length,
    interventionsMatured: data.timeline.interventions.filter((i) => i.was_correct !== null).length,
  };
  const shadowPct =
    coverage.tradesTotal > 0
      ? (coverage.tradesWithShadow / coverage.tradesTotal) * 100
      : 0;
  const maturedPct =
    coverage.interventionsTotal > 0
      ? (coverage.interventionsMatured / coverage.interventionsTotal) * 100
      : 0;

  return (
    <StoryChapter
      number={6}
      title="How to judge success"
      kicker="Trust is earned — this chapter shows every honesty signal and data-coverage caveat."
    >
      <InfoCallout title="A deliberate honesty audit">
        A platform that never tells you what it doesn&apos;t know is lying.
        This chapter intentionally surfaces the calibration gaps, the pending
        precision checks, and the coverage holes — both to keep ourselves
        honest and so that you can judge the evidence on its own terms.
      </InfoCallout>

      <PlatformHonesty honesty={data.honesty} precisionWindow={data.precision_window_days} />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-md border bg-card/40 p-3">
          <CalibrationScatter
            rows={cal.data?.rows ?? []}
            axis="sharpe"
            title="Predicted vs realized Sharpe per bot"
            height={280}
          />
        </div>
        <div className="rounded-md border bg-card/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Calibration-error distribution (realized − predicted Sharpe)
          </div>
          <MiniHistogram values={calibErrors} />
          <div className="mt-1 text-[11px] text-muted-foreground">
            Centered on zero = unbiased calibration; skewed = systematic
            over/underestimation. {calibErrors.length} bots with matched predictions.
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card/40 p-3">
        <QQPlot
          values={tradePnls}
          title="Trade P&L vs normal quantiles — are your returns fat-tailed?"
          height={260}
        />
      </div>

      <div className="rounded-md border bg-card/40 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Data coverage disclosure
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <CoverageRow
            label="Window"
            value={`${data.window_days} days (${data.regime_scope})`}
          />
          <CoverageRow
            label="Closed trades"
            value={`${coverage.tradesTotal}`}
          />
          <CoverageRow
            label="Trades with shadow counterfactual"
            value={`${coverage.tradesWithShadow} / ${coverage.tradesTotal} (${shadowPct.toFixed(0)}%)`}
            tone={shadowPct > 80 ? 'good' : shadowPct > 50 ? 'ok' : 'warn'}
          />
          <CoverageRow
            label="Interventions matured past precision window"
            value={`${coverage.interventionsMatured} / ${coverage.interventionsTotal} (${maturedPct.toFixed(0)}%)`}
            tone={maturedPct > 80 ? 'good' : maturedPct > 50 ? 'ok' : 'warn'}
          />
          <CoverageRow
            label="Regime bands"
            value={`${data.timeline.regime_bands.length}`}
          />
          <CoverageRow
            label="Current regime"
            value={data.hero.current_regime ?? '—'}
          />
        </div>
      </div>

      <GlossaryFooter />
    </StoryChapter>
  );
}

function CoverageRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'good' | 'ok' | 'warn' | 'neutral';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-green-600'
      : tone === 'warn'
        ? 'text-destructive'
        : tone === 'ok'
          ? 'text-amber-600'
          : 'text-foreground';
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/50 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${toneClass}`}>{value}</span>
    </div>
  );
}

function MiniHistogram({ values }: { values: number[] }) {
  if (values.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground">
        No matched predictions yet
      </div>
    );
  }
  const bins = 15;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    let b = Math.floor(((v - min) / span) * bins);
    if (b >= bins) b = bins - 1;
    if (b < 0) b = 0;
    counts[b] += 1;
  }
  const maxCount = Math.max(1, ...counts);
  const zeroBin = Math.floor(((0 - min) / span) * bins);
  return (
    <svg width="100%" height={80} viewBox={`0 0 ${bins} ${maxCount}`} preserveAspectRatio="none">
      {counts.map((c, i) => {
        const color = i < zeroBin ? '#ef4444' : i > zeroBin ? '#10b981' : '#64748b';
        return (
          <rect
            key={i}
            x={i + 0.05}
            y={maxCount - c}
            width={0.9}
            height={c}
            fill={color}
          />
        );
      })}
      <line
        x1={zeroBin}
        x2={zeroBin}
        y1={0}
        y2={maxCount}
        stroke="currentColor"
        strokeWidth={0.1}
        strokeDasharray="0.2 0.2"
        className="text-muted-foreground"
      />
    </svg>
  );
}

function GlossaryFooter() {
  return (
    <details className="rounded-md border bg-card/40 p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-foreground">
        Glossary — 12 terms the platform uses
      </summary>
      <dl className="mt-3 grid gap-3 md:grid-cols-2">
        <Term name="Sharpe ratio">
          Risk-adjusted return: (mean return − risk-free) / std of return. Higher is better.
          A Sharpe &gt; 1 is generally considered good; &gt; 2 is excellent.
        </Term>
        <Term name="Sortino ratio">
          Like Sharpe but only penalizes downside volatility. Helpful when returns are skewed —
          you don&apos;t want to punish upside volatility.
        </Term>
        <Term name="Max drawdown (DD)">
          The largest peak-to-trough decline in cumulative P&amp;L. Tighter max-DD = better risk
          management. Every intervention aims to keep this small.
        </Term>
        <Term name="Regime">
          A classified market state. The platform uses 4 canonical labels (NORMAL, LOW_VOL,
          ELEVATED_VOL, CRISIS) derived from voters combining volatility, macro data, and
          cross-sectional signals.
        </Term>
        <Term name="Fleet multiplier">
          Global sizing factor (0-100%) applied to every bot&apos;s position size. Platform
          dampens this in adverse regimes; &quot;×100%&quot; means fully sized, &quot;×50%&quot; means half-sized.
        </Term>
        <Term name="Shadow fleet">
          A counterfactual copy of your bots that runs without any platform risk-management.
          Used as the baseline to measure how much value the platform added.
        </Term>
        <Term name="Intervention">
          A discrete risk-management action the platform took — e.g. tightening a stop, resizing
          via Kelly, gating fleet exposure, triggering cooling-off.
        </Term>
        <Term name="Precision (of interventions)">
          What fraction of interventions were followed by an actual shadow loss in the next window.
          High precision = the platform intervened when it mattered; low = over-cautious.
        </Term>
        <Term name="Passport">
          A backtest&apos;s signed proof that a strategy cleared all reliability gates (Sharpe CI,
          PSR/DSR, PBO, regime coverage, etc.). Only passport-approved strategies can be deployed.
        </Term>
        <Term name="Walk-forward labeling">
          Regime labels assigned only using past data, with no lookahead leakage into the future.
          Prevents the backtest from benefitting from future knowledge.
        </Term>
        <Term name="Kelly sizing">
          Position sizing based on the Kelly criterion — bets proportional to edge × probability,
          with correlation adjustment across the fleet to avoid over-concentration.
        </Term>
        <Term name="Calibration">
          How closely the backtest&apos;s predicted performance matches the live performance.
          Drift = material gap. Calibrated = close match. A platform that predicts accurately
          is a platform you can trust.
        </Term>
      </dl>
    </details>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold text-foreground">{name}</dt>
      <dd className="text-xs text-muted-foreground">{children}</dd>
    </div>
  );
}
