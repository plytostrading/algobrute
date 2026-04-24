'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useReferencePrice,
  type ReferencePriceSeries,
} from '@/hooks/useFleetJourney';

// 16-state composite palette: "market.stress".
// Market axis drives HUE, stress axis drives LIGHTNESS/SATURATION.
// One axis per dimension means customers learn "4×4 = 16" mentally.
//
// MARKET    → HUE
//   bull     → green (140°)
//   bear     → red   (0°)
//   sideways → blue  (220°)
//   transition → amber (38°)
//
// STRESS    → LIGHTNESS (lighter = calmer)
//   calm     → 70% light
//   normal   → 55%
//   elevated → 42%
//   crisis   → 30%

const MARKET_HUE: Record<string, number> = {
  bull: 140,
  bear: 0,
  sideways: 220,
  transition: 38,
};
const STRESS_LIGHT: Record<string, number> = {
  calm: 70,
  normal: 55,
  elevated: 42,
  crisis: 30,
};
const STRESS_SAT: Record<string, number> = {
  calm: 45,
  normal: 55,
  elevated: 65,
  crisis: 75,
};

function regimeColor(regime: string | null | undefined, alpha = 1): string {
  if (!regime) return `rgba(156,163,175,${(alpha * 0.6).toFixed(2)})`;
  // Handle legacy numeric keys by projecting to sideways.*
  const key = /^\d+$/.test(regime)
    ? ({ '0': 'sideways.calm', '1': 'sideways.normal', '2': 'sideways.elevated', '3': 'sideways.crisis', '4': 'sideways.crisis' }[regime] ?? 'sideways.normal')
    : regime;
  const [market, stress] = key.split('.') as [string, string];
  const h = MARKET_HUE[market] ?? 220;
  const s = STRESS_SAT[stress] ?? 45;
  const l = STRESS_LIGHT[stress] ?? 55;
  if (alpha >= 1) return `hsl(${h}, ${s}%, ${l}%)`;
  return `hsla(${h}, ${s}%, ${l}%, ${alpha.toFixed(2)})`;
}

function regimeLabel(regime: string | null | undefined): string {
  if (!regime) return '—';
  if (/^\d+$/.test(regime)) {
    return ({ '0': 'LOW_VOL', '1': 'NORMAL', '2': 'LOW_VOL', '3': 'ELEVATED_VOL', '4': 'CRISIS' }[regime] ?? regime);
  }
  if (!regime.includes('.')) return regime.toUpperCase();
  const [m, s] = regime.split('.');
  return `${m.toUpperCase()} · ${s.toUpperCase()}`;
}

function regimeShortLabel(regime: string | null | undefined): string {
  if (!regime) return '—';
  if (!regime.includes('.')) return regime.toUpperCase();
  const [m, s] = regime.split('.');
  // Short form for tight ribbon segments: "BULL/CALM"
  return `${m.slice(0, 4).toUpperCase()}/${s.slice(0, 4).toUpperCase()}`;
}

// Plain-English descriptions shown in tooltips. Grounded in trading semantics
// so customers can interpret what the state actually means for behavior.
const REGIME_DESCRIPTIONS: Record<string, string> = {
  'bull.calm': 'Trending up in calm conditions — stable uptrend.',
  'bull.normal': 'Trending up at typical volatility — healthy uptrend.',
  'bull.elevated': 'Trending up with elevated vol — choppy but upward.',
  'bull.crisis': 'Trending up in crisis vol — rare; often short-covering.',
  'bear.calm': 'Trending down in calm conditions — orderly selloff.',
  'bear.normal': 'Trending down at typical vol — sustained selling.',
  'bear.elevated': 'Trending down with elevated vol — accelerating decline.',
  'bear.crisis': 'Trending down with crisis vol — severe risk-off / panic.',
  'sideways.calm': 'Range-bound in calm conditions — low-risk consolidation.',
  'sideways.normal': 'Range-bound at typical vol — uncommitted market.',
  'sideways.elevated': 'Range-bound with elevated vol — indecisive but jumpy.',
  'sideways.crisis': 'Range-bound with crisis vol — violent chop, no direction.',
  'transition.calm': 'Regime transition in calm conditions — character shift.',
  'transition.normal': 'Regime transition at typical vol — shift underway.',
  'transition.elevated': 'Regime transition under stress — volatile shift.',
  'transition.crisis': 'Regime transition in crisis — violent regime flip.',
};

function regimeDescription(regime: string | null | undefined): string {
  if (!regime) return 'No regime data available at this date.';
  return REGIME_DESCRIPTIONS[regime] ?? 'Regime description not available.';
}

// Sanitize a regime key for use as a Recharts dataKey (no dots/spaces).
function regimeKeyId(regime: string): string {
  return regime.replace(/[^a-z0-9]/gi, '_');
}

interface RegimeBand {
  start: string;
  end: string;
  regime: string;
}

export function ReferencePriceChart({
  data,
  fleetTickers,
  windowDays = 365,
}: {
  data: ReferencePriceSeries | null;
  fleetTickers: string[];
  windowDays?: number;
}) {
  const defaultTicker = data?.ticker ?? null;
  const [selectedTicker, setSelectedTicker] = useState<string | null>(defaultTicker);

  // Keep selection in sync when the default-ticker prop changes (e.g. on
  // first fetch), but don't overwrite a user's explicit pick.
  useEffect(() => {
    if (selectedTicker === null && defaultTicker) {
      setSelectedTicker(defaultTicker);
    }
  }, [defaultTicker, selectedTicker]);

  const isDefaultSelected =
    selectedTicker === null || selectedTicker === defaultTicker;
  const override = useReferencePrice(
    isDefaultSelected ? null : selectedTicker,
    windowDays,
    true,
  );

  const effectiveData: ReferencePriceSeries | null = isDefaultSelected
    ? data
    : override.data ?? null;

  const tickersToShow = useMemo(() => {
    const set = new Set<string>(fleetTickers);
    if (defaultTicker) set.add(defaultTicker);
    set.add('SPY');
    return Array.from(set).sort();
  }, [fleetTickers, defaultTicker]);

  const bands = useMemo(
    () => (effectiveData ? compressRegimeBands(effectiveData.points) : []),
    [effectiveData],
  );

  const tickerBands = useMemo(() => {
    if (!effectiveData) return [];
    return compressRegimeBands(
      effectiveData.ticker_regime.map((p) => ({ date: p.date, regime: p.regime })),
    );
  }, [effectiveData]);

  const sectorBands = useMemo(() => {
    if (!effectiveData) return [];
    return compressRegimeBands(
      effectiveData.sector_regime.map((p) => ({ date: p.date, regime: p.regime })),
    );
  }, [effectiveData]);

  // Lookup maps for ticker + sector regime at each date (for tooltip).
  const tickerRegimeByDate = useMemo(() => {
    const m = new Map<string, string>();
    effectiveData?.ticker_regime.forEach((p) => m.set(p.date, p.regime));
    return m;
  }, [effectiveData]);
  // Posterior + next-posterior + confidence lookups for the ticker
  // regime — exposed in the tooltip so a user debugging a visually-
  // surprising label can see the classifier's full uncertainty (e.g.,
  // "labeled bear at 0.62 confidence, but posterior has 33% bull —
  // prior is dragging this").
  const tickerPosteriorByDate = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    effectiveData?.ticker_regime.forEach((p) => {
      if (p.posterior) m.set(p.date, p.posterior);
    });
    return m;
  }, [effectiveData]);
  const tickerNextPosteriorByDate = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    effectiveData?.ticker_regime.forEach((p) => {
      if (p.next_posterior) m.set(p.date, p.next_posterior);
    });
    return m;
  }, [effectiveData]);
  const tickerConfidenceByDate = useMemo(() => {
    const m = new Map<string, number>();
    effectiveData?.ticker_regime.forEach((p) => {
      if (typeof p.confidence === 'number') m.set(p.date, p.confidence);
    });
    return m;
  }, [effectiveData]);
  const sectorRegimeByDate = useMemo(() => {
    const m = new Map<string, string>();
    effectiveData?.sector_regime.forEach((p) => m.set(p.date, p.regime));
    return m;
  }, [effectiveData]);

  // Build per-segment line data: each row has close_{regime} where regime
  // is the **TICKER's own regime** at that date (falling back to the macro
  // regime when the ticker regime isn't available). The price line is a
  // ticker-specific story, so it should be colored by the ticker's state,
  // not by the market-wide macro state. Only the matching field is non-null
  // so Recharts draws each regime's line only on its dates; boundary points
  // appear in both regimes so line segments meet without gaps.
  //
  // ``row.regime`` is intentionally kept as the MACRO regime so the tooltip's
  // "Market" row continues to read it directly (see PriceChartTooltip below).
  const { chartRows, usedRegimes } = useMemo(() => {
    if (!effectiveData) return { chartRows: [], usedRegimes: [] as string[] };
    const points = effectiveData.points;
    const segmentRegimeSet = new Set<string>();
    // Row values include primitives + posterior dicts; Recharts treats
    // data as `Record<string, unknown>` so the widening is safe.
    type RowValue =
      | string
      | number
      | null
      | Record<string, number>;
    const rows: Array<Record<string, RowValue>> = [];

    function segmentRegimeForDate(
      date: string,
      macro: string | null | undefined,
    ): string {
      // Prefer the ticker's own regime; fall back to macro when the
      // ticker regime isn't yet available (sparse early-period coverage
      // from the per-ticker inference pipeline).
      return tickerRegimeByDate.get(date) ?? macro ?? 'unknown';
    }

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const macroRegime = p.regime ?? 'unknown';
      const segmentRegime = segmentRegimeForDate(p.date, p.regime);
      segmentRegimeSet.add(segmentRegime);
      const row: Record<string, RowValue> = {
        date: p.date,
        close: p.close,
        regime: macroRegime, // tooltip's Market row reads this
        ticker_regime: tickerRegimeByDate.get(p.date) ?? null,
        ticker_posterior: tickerPosteriorByDate.get(p.date) ?? null,
        ticker_next_posterior: tickerNextPosteriorByDate.get(p.date) ?? null,
        ticker_confidence: tickerConfidenceByDate.get(p.date) ?? null,
        sector_regime: sectorRegimeByDate.get(p.date) ?? null,
      };
      row[`close_${regimeKeyId(segmentRegime)}`] = p.close;
      // Fill the previous segment regime's field on boundary so lines join.
      if (i > 0) {
        const prevPoint = points[i - 1];
        const prevSegmentRegime = segmentRegimeForDate(
          prevPoint.date,
          prevPoint.regime,
        );
        if (prevSegmentRegime !== segmentRegime) {
          row[`close_${regimeKeyId(prevSegmentRegime)}`] = p.close;
        }
      }
      rows.push(row);
    }
    return { chartRows: rows, usedRegimes: Array.from(segmentRegimeSet) };
  }, [
    effectiveData,
    tickerRegimeByDate,
    tickerPosteriorByDate,
    tickerNextPosteriorByDate,
    tickerConfidenceByDate,
    sectorRegimeByDate,
  ]);

  const coverage = useMemo(() => {
    if (!effectiveData || effectiveData.points.length === 0) {
      return null;
    }
    const total = effectiveData.points.length;
    const labeled = effectiveData.points.filter((p) => p.regime).length;
    const firstLabeled = effectiveData.points.find((p) => p.regime)?.date ?? null;
    return { total, labeled, firstLabeled, pct: (labeled / total) * 100 };
  }, [effectiveData]);

  const isLoading = !isDefaultSelected && override.isLoading;
  const isError = !isDefaultSelected && override.isError;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Market context — {effectiveData?.ticker ?? '—'}
              {effectiveData && (
                <Badge variant="outline" className="ml-1 text-[10px]">
                  {sourceToLabel(effectiveData.source)}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real close prices over the same window as your fleet journey.
              The <strong>price line is colored by the ticker&apos;s own regime</strong>{' '}
              at each date — each segment reflects the state of this specific
              ticker (trending up, sideways, choppy, crisis, etc.), not the
              market as a whole. The shaded <strong>backdrop</strong> shows
              the market-wide (macro) regime as context, with inline tags
              above each macro band. Hover the line for a tooltip that lists
              ticker, sector, and macro regimes together.
            </CardDescription>
          </div>

          <TickerPicker
            tickers={tickersToShow}
            selected={selectedTicker ?? defaultTicker ?? 'SPY'}
            onSelect={setSelectedTicker}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Loading {selectedTicker}…
          </div>
        ) : isError || !effectiveData ? (
          <div className="flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            {isError
              ? `No price history available for ${selectedTicker ?? '—'}`
              : 'No reference price available yet'}
          </div>
        ) : (
          <>
            {/* Two context ribbons — macro + sector — aligned to the price
                chart below. The ticker's own regime is shown directly ON the
                price line via per-segment coloring (see LineChart below) and
                in the hover tooltip. */}
            <div className="space-y-1.5">
              <RegimeRibbon
                title="Market regime (macro)"
                subtitle="market-wide composite from the hierarchical detector"
                bands={bands}
                firstDate={effectiveData.points[0]?.date}
                lastDate={effectiveData.points[effectiveData.points.length - 1]?.date}
              />
              <RegimeRibbon
                title={`Sector regime${effectiveData.sector ? ' — ' + effectiveData.sector : ''}`}
                subtitle={
                  effectiveData.sector_proxy_ticker
                    ? `derived from ${effectiveData.sector_proxy_ticker} proxy`
                    : undefined
                }
                bands={sectorBands}
                firstDate={effectiveData.points[0]?.date}
                lastDate={effectiveData.points[effectiveData.points.length - 1]?.date}
              />
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartRows}
                  margin={{ top: 20, right: 20, bottom: 10, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                    domain={['auto', 'auto']}
                  />

                  {/* Background regime shading with inline labels so the
                      regime name is visible without hovering. */}
                  {bands.map((b, i) => (
                    <ReferenceArea
                      key={`band-${i}`}
                      x1={b.start}
                      x2={b.end}
                      fill={regimeColor(b.regime, 0.12)}
                      fillOpacity={1}
                      stroke={regimeColor(b.regime, 1)}
                      strokeOpacity={0.25}
                      strokeDasharray="2 4"
                      label={{
                        value: regimeShortLabel(b.regime),
                        position: 'insideTop',
                        fontSize: 10,
                        fontFamily: 'ui-monospace, monospace',
                        fill: regimeColor(b.regime, 1),
                        fontWeight: 600,
                      }}
                    />
                  ))}

                  <Tooltip
                    content={
                      <PriceChartTooltip
                        sectorName={effectiveData.sector}
                        sectorProxy={effectiveData.sector_proxy_ticker}
                        ticker={effectiveData.ticker}
                      />
                    }
                  />

                  {/* One <Line> per ticker regime present in the window.
                      Each renders only on its own dates (null elsewhere),
                      so the colored segments reflect the ticker's own
                      regime at each date. The macro backdrop above is a
                      separate axis of context. */}
                  {usedRegimes.map((regime) => (
                    <Line
                      key={regime}
                      type="monotone"
                      dataKey={`close_${regimeKeyId(regime)}`}
                      name={regimeLabel(regime)}
                      stroke={regimeColor(regime, 1)}
                      strokeWidth={2.4}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <RegimeLegend
              title="Ticker regimes observed"
              bands={tickerBands}
            />
            <RegimeLegend title="Market regimes observed" bands={bands} />

            {coverage && coverage.pct < 100 && (
              <div className="text-[11px] text-muted-foreground">
                Regime data covers {coverage.labeled} of {coverage.total} days
                ({coverage.pct.toFixed(0)}%)
                {coverage.firstLabeled
                  ? ` — observations available from ${coverage.firstLabeled} onwards.`
                  : '.'}{' '}
                Earlier dates have no shading because the regime inference
                pipeline hadn&apos;t started yet.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TickerPicker({
  tickers,
  selected,
  onSelect,
}: {
  tickers: string[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  if (tickers.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tickers.map((t) => {
        const isActive = t === selected;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
            className={`rounded-md border px-2 py-1 text-xs font-mono tracking-wide transition ${
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Rich tooltip for the price chart. Unlike the default Recharts
 * tooltip, this one picks the single non-null `close_*` value (the
 * active regime's close) and enriches it with:
 *   • the market (macro) regime label + description
 *   • the ticker regime label + description
 *   • the sector regime label + description
 *
 * The three layers answer, in order: "what's this ticker doing?", "is
 * its sector doing the same?", and "is the macro market backing it?".
 */
function PriceChartTooltip({
  active,
  payload,
  label,
  sectorName,
  sectorProxy,
  ticker,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: Record<
      string,
      string | number | null | Record<string, number>
    >;
  }>;
  label?: string;
  sectorName?: string | null;
  sectorProxy?: string | null;
  ticker?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const close = typeof row.close === 'number' ? row.close : null;
  const marketRegime = typeof row.regime === 'string' ? row.regime : null;
  const tickerRegime =
    typeof row.ticker_regime === 'string' ? row.ticker_regime : null;
  const sectorRegime =
    typeof row.sector_regime === 'string' ? row.sector_regime : null;
  const tickerPosterior = isPosteriorDict(row.ticker_posterior)
    ? row.ticker_posterior
    : null;
  const tickerNextPosterior = isPosteriorDict(row.ticker_next_posterior)
    ? row.ticker_next_posterior
    : null;
  const tickerConfidence =
    typeof row.ticker_confidence === 'number' ? row.ticker_confidence : null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="font-mono text-foreground">{label}</span>
        {close !== null && (
          <span className="font-mono font-semibold text-foreground">
            ${close.toFixed(2)}
          </span>
        )}
      </div>
      <div className="space-y-1.5 border-t pt-1.5">
        <RegimeTooltipRow
          scope="Market"
          subtitle="macro hierarchical detector"
          regime={marketRegime}
        />
        <RegimeTooltipRow
          scope={sectorName ? `Sector · ${sectorName}` : 'Sector'}
          subtitle={sectorProxy ? `from ${sectorProxy} proxy` : undefined}
          regime={sectorRegime}
        />
        <RegimeTooltipRow
          scope={ticker ? `Ticker · ${ticker}` : 'Ticker'}
          subtitle="derived from this ticker's vol + trend"
          regime={tickerRegime}
          confidence={tickerConfidence}
          posterior={tickerPosterior}
          nextPosterior={tickerNextPosterior}
        />
      </div>
    </div>
  );
}

function isPosteriorDict(
  v: unknown,
): v is Record<string, number> {
  if (v === null || typeof v !== 'object') return false;
  // Expect the four market states as keys; accept any dict-of-numbers
  // gracefully — the renderer below tolerates missing keys.
  return Object.values(v as Record<string, unknown>).every(
    (x) => typeof x === 'number' && Number.isFinite(x),
  );
}

function RegimeTooltipRow({
  scope,
  subtitle,
  regime,
  confidence,
  posterior,
  nextPosterior,
}: {
  scope: string;
  subtitle?: string;
  regime: string | null;
  confidence?: number | null;
  posterior?: Record<string, number> | null;
  nextPosterior?: Record<string, number> | null;
}) {
  const color = regimeColor(regime, 1);
  const label = regimeLabel(regime);
  const desc = regimeDescription(regime);
  return (
    <div className="flex gap-2">
      <span
        className="mt-[3px] h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 space-y-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {scope}
          </span>
          <span className="font-mono font-semibold text-foreground">{label}</span>
          {typeof confidence === 'number' && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {(confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        {subtitle && (
          <div className="text-[10px] text-muted-foreground/80">{subtitle}</div>
        )}
        {posterior && (
          <PosteriorStrip label="now" dist={posterior} />
        )}
        {nextPosterior && (
          <PosteriorStrip label="next" dist={nextPosterior} />
        )}
        <div className="text-[11px] text-foreground/90">{desc}</div>
      </div>
    </div>
  );
}

/**
 * Posterior strip — compact visual breakdown of the classifier's
 * probability distribution. Used in the tooltip to show both the
 * current-bar posterior (`now`) and the next-bar predicted posterior
 * (`next`), so the user can see:
 *   - how confident the classifier is in the displayed label
 *   - where the Markov prior is pulling the next bar absent new
 *     evidence (e.g., a `bear` label with a 38% bull posterior tells
 *     the user the regime is likely about to flip)
 *
 * Renders as a single horizontal stacked bar per posterior, with the
 * largest three states labeled inline. Ordered {bull, sideways,
 * bear, transition} so the strip reads left-to-right same as the
 * composite-regime cell key.
 */
function PosteriorStrip({
  label,
  dist,
}: {
  label: string;
  dist: Record<string, number>;
}) {
  const STATES = ['bull', 'sideways', 'bear', 'transition'] as const;
  const entries = STATES.map((s) => ({ state: s, p: dist[s] ?? 0 }));
  // Colors pinned to the macro market-axis palette so the strip reads
  // consistently with the chart ribbons above.
  const colorFor = (s: string) => regimeColor(`${s}.normal`, 1);
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[34px] shrink-0 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex h-[10px] flex-1 overflow-hidden rounded-sm border border-border/50">
        {entries.map(({ state, p }) => (
          <div
            key={state}
            title={`${state} ${(p * 100).toFixed(1)}%`}
            style={{
              width: `${(p * 100).toFixed(2)}%`,
              backgroundColor: colorFor(state),
            }}
          />
        ))}
      </div>
      <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
        {entries
          .filter((e) => e.p >= 0.05)
          .map((e) => `${e.state[0]}${(e.p * 100).toFixed(0)}`)
          .join(' ')}
      </span>
    </div>
  );
}

function compressRegimeBands(
  points: { date: string; regime: string | null }[],
): RegimeBand[] {
  const bands: RegimeBand[] = [];
  let current: RegimeBand | null = null;
  for (const p of points) {
    if (!p.regime) {
      if (current) {
        bands.push(current);
        current = null;
      }
      continue;
    }
    if (!current) {
      current = { start: p.date, end: p.date, regime: p.regime };
    } else if (current.regime === p.regime) {
      current.end = p.date;
    } else {
      bands.push(current);
      current = { start: p.date, end: p.date, regime: p.regime };
    }
  }
  if (current) bands.push(current);
  return bands;
}

function RegimeLegend({
  title = 'Market regimes observed',
  bands,
}: {
  title?: string;
  bands: RegimeBand[];
}) {
  const counts = new Map<string, number>();
  for (const b of bands) {
    const days = Math.max(
      1,
      Math.floor(
        (new Date(b.end).getTime() - new Date(b.start).getTime()) /
          (24 * 3600 * 1000),
      ) + 1,
    );
    counts.set(b.regime, (counts.get(b.regime) ?? 0) + days);
  }
  const regimes = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  if (regimes.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px]">
      <span className="font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </span>
      {regimes.map(([regime, days]) => (
        <span key={regime} className="flex items-center gap-1.5">
          <span
            className="h-3 w-4 rounded-sm border"
            style={{
              backgroundColor: regimeColor(regime, 1),
              borderColor: 'hsl(var(--border))',
            }}
          />
          <span className="font-semibold text-foreground">
            {regimeLabel(regime)}
          </span>
          <span className="font-mono text-muted-foreground">{days}d</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Regime ribbon: a solid-colored strip rendered above the price chart.
 * Stacked 3-high (market / sector / ticker) so customers see all three
 * layers aligned at a glance. Each regime period labeled inline; pre-
 * and post-observation gaps rendered as muted neutral blocks.
 */
function RegimeRibbon({
  title,
  subtitle,
  bands,
  firstDate,
  lastDate,
}: {
  title: string;
  subtitle?: string;
  bands: RegimeBand[];
  firstDate: string | undefined;
  lastDate: string | undefined;
}) {
  if (!firstDate || !lastDate) return null;
  const winStart = new Date(firstDate).getTime();
  const winEnd = new Date(lastDate).getTime();
  const winSpan = Math.max(1, winEnd - winStart);

  // Handle empty-bands case (sector or ticker with too little history)
  if (bands.length === 0) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-baseline gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
          {subtitle && (
            <span className="normal-case font-normal text-muted-foreground/70">
              · {subtitle}
            </span>
          )}
        </div>
        <div className="flex h-5 w-full items-center justify-center rounded border bg-muted text-[9px] font-mono text-muted-foreground">
          no regime data — ticker may not have enough history
        </div>
      </div>
    );
  }

  const firstBand = bands[0];
  const lastBand = bands[bands.length - 1];
  const bandStart = new Date(firstBand.start).getTime();
  const bandEnd = new Date(lastBand.end).getTime();

  const prePct = Math.max(0, ((bandStart - winStart) / winSpan) * 100);
  const postPct = Math.max(0, ((winEnd - bandEnd) / winSpan) * 100);

  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
        {subtitle && (
          <span className="normal-case font-normal text-muted-foreground/70">
            · {subtitle}
          </span>
        )}
      </div>
      <div className="flex h-6 w-full items-stretch overflow-hidden rounded border">
        {prePct > 0.5 && (
          <div
            className="flex items-center justify-center bg-muted text-[9px] font-mono text-muted-foreground"
            style={{ width: `${prePct}%` }}
            title="No regime data before first observation"
          >
            {prePct > 10 ? 'no regime data' : ''}
          </div>
        )}
        {bands.map((b, i) => {
          const segStart = new Date(b.start).getTime();
          const segEnd = new Date(b.end).getTime();
          const pct = ((segEnd - segStart) / winSpan) * 100;
          const days =
            Math.floor((segEnd - segStart) / (24 * 3600 * 1000)) + 1;
          const fillColor = regimeColor(b.regime, 1);
          const longLabel = regimeLabel(b.regime);
          const shortLabel = regimeShortLabel(b.regime);
          return (
            <div
              key={i}
              className="flex items-center justify-center text-[9px] font-mono font-semibold text-white"
              style={{
                width: `${Math.max(0.5, pct)}%`,
                backgroundColor: fillColor,
                borderLeft: i === 0 ? undefined : '1px solid rgba(0,0,0,0.25)',
              }}
              title={`${longLabel} · ${b.start} → ${b.end} (${days}d)`}
            >
              {pct > 10
                ? `${longLabel} ${days}d`
                : pct > 5
                  ? shortLabel
                  : pct > 2
                    ? shortLabel.slice(0, 1)
                    : ''}
            </div>
          );
        })}
        {postPct > 0.5 && (
          <div
            className="flex items-center justify-center bg-muted text-[9px] font-mono text-muted-foreground"
            style={{ width: `${postPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

function sourceToLabel(source: string): string {
  switch (source) {
    case 'fleet_most_traded':
      return 'your most-traded';
    case 'fleet_first_bot':
      return 'your first bot';
    case 'default_spy':
      return 'default SPY';
    case 'picker':
      return 'switched';
    default:
      return source;
  }
}
