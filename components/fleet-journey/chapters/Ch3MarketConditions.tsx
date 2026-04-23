'use client';

import { StoryChapter } from '../StoryChapter';
import { InfoCallout } from '../InfoCallout';
import { Sparkline } from '../Sparkline';
import { ReferencePriceChart } from '../ReferencePriceChart';
import type { JourneyResponse } from '@/hooks/useFleetJourney';
import { useMemo } from 'react';

const REGIME_COLOR: Record<string, string> = {
  '1': '#3b82f6',
  '2': '#22c55e',
  '3': '#f59e0b',
  '4': '#ef4444',
};
const REGIME_LABEL: Record<string, string> = {
  '1': 'NORMAL',
  '2': 'LOW_VOL',
  '3': 'ELEVATED_VOL',
  '4': 'CRISIS',
};

export function Ch3MarketConditions({ data }: { data: JourneyResponse }) {
  const bands = data.timeline.regime_bands;
  const macro = data.macro_conditions;

  // Compute the span of the regime band timeline — used to scale each
  // band's render width proportional to calendar duration.
  const stripRender = useMemo(() => {
    if (bands.length === 0) return null;
    const firstStart = bands[0].start;
    const lastEnd = bands[bands.length - 1].end;
    const ms0 = new Date(firstStart).getTime();
    const ms1 = new Date(lastEnd).getTime();
    const total = Math.max(1, ms1 - ms0);
    return bands.map((b) => {
      const s = new Date(b.start).getTime();
      const e = new Date(b.end).getTime();
      const pct = ((e - s) / total) * 100;
      return {
        regime: b.regime,
        pct,
        startLabel: b.start.slice(5),
        endLabel: b.end.slice(5),
      };
    });
  }, [bands]);

  return (
    <StoryChapter
      number={3}
      title="Market conditions"
      kicker="The environment your bots traded through — regime context, reference price, macro backdrop."
    >
      <InfoCallout title="How to read this chapter">
        Regime bands (NORMAL / LOW_VOL / ELEVATED_VOL / CRISIS) tell you
        what market conditions your bots faced. The reference price chart
        below shows the same regimes overlaid on a price curve. Macro
        conditions at the bottom give the broader context — VIX, credit
        spreads, safe-haven flows.
      </InfoCallout>

      {stripRender && stripRender.length > 0 && (
        <div className="rounded-md border bg-card/40 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Regime timeline
          </div>
          <div className="flex h-6 w-full overflow-hidden rounded">
            {stripRender.map((b, i) => (
              <div
                key={i}
                title={`${REGIME_LABEL[b.regime] ?? b.regime} · ${b.startLabel} → ${b.endLabel}`}
                className="h-full"
                style={{
                  width: `${b.pct}%`,
                  backgroundColor: (REGIME_COLOR[b.regime] ?? '#94a3b8') + '99',
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {Object.entries(REGIME_LABEL).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-1">
                <span
                  className="h-2 w-3 rounded-sm"
                  style={{ backgroundColor: (REGIME_COLOR[k] ?? '#94a3b8') + '99' }}
                />
                {lbl}
              </span>
            ))}
          </div>
        </div>
      )}

      <ReferencePriceChart
        data={data.reference_price}
        fleetTickers={data.fleet_tickers}
        windowDays={data.window_days}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MacroCard
          title="VIX (fear gauge)"
          unit=""
          points={macro?.vix}
          helpText="CBOE Volatility Index. Rising VIX = growing option-implied expected market volatility."
        />
        <MacroCard
          title="High-yield spread"
          unit="pp"
          points={macro?.hy_spread}
          helpText="ICE BofA US HY Option-Adjusted Spread (BAMLH0A0HYM2). Widening = risk-off credit conditions."
        />
        <MacroCard
          title="SPY vs TLT (relative)"
          unit=""
          points={macro?.spy_vs_tlt}
          helpText="SPY/TLT ratio normalized to 100 at window start. Rising = stocks outperforming bonds (risk-on)."
        />
      </div>
    </StoryChapter>
  );
}

function MacroCard({
  title,
  unit,
  points,
  helpText,
}: {
  title: string;
  unit: string;
  points: { date: string; value: number }[] | undefined;
  helpText: string;
}) {
  const values = points?.map((p) => p.value) ?? [];
  const last = values.length > 0 ? values[values.length - 1] : null;
  const first = values.length > 0 ? values[0] : null;
  const delta = last !== null && first !== null ? last - first : null;
  const deltaTone =
    delta === null
      ? 'text-muted-foreground'
      : delta > 0
        ? 'text-destructive'
        : 'text-green-600';
  return (
    <div
      className="rounded-md border bg-card/40 p-3"
      title={helpText}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        {last !== null && (
          <span className="font-mono text-sm text-foreground">
            {last.toFixed(2)}
            {unit}
          </span>
        )}
      </div>
      <div className="text-sky-500">
        <Sparkline
          values={values}
          width={200}
          height={40}
          stroke="currentColor"
          fillArea
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">
          {points && points.length > 0 ? `${points[0].date} → ${points[points.length - 1].date}` : 'No data'}
        </span>
        {delta !== null && (
          <span className={`font-mono ${deltaTone}`}>
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)}
            {unit} over window
          </span>
        )}
      </div>
    </div>
  );
}
