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
              The <strong>regime ribbon</strong> above the chart shows each
              regime period as a labeled solid block, and the chart background
              tints the corresponding period with the same color. Regime is{' '}
              <strong>market-wide</strong> — derived from macro conditions —
              so the ribbon is the same across every ticker in the picker.
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
            {/* Three stacked regime ribbons — macro (market-wide) / sector /
                ticker — aligned to the price chart below. Customers asked for
                ticker-scoped regime directly (it's what they intuitively care
                about), with sector context so they know whether the ticker's
                state is idiosyncratic or shared by its peers. */}
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
              <RegimeRibbon
                title={`Ticker regime — ${effectiveData.ticker}`}
                subtitle="derived from this ticker's own vol + trend"
                bands={tickerBands}
                firstDate={effectiveData.points[0]?.date}
                lastDate={effectiveData.points[effectiveData.points.length - 1]?.date}
              />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={effectiveData.points.map((p) => ({
                    date: p.date,
                    close: p.close,
                  }))}
                  margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
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

                  {bands.map((b, i) => (
                    <ReferenceArea
                      key={`band-${i}`}
                      x1={b.start}
                      x2={b.end}
                      fill={regimeColor(b.regime, 0.18)}
                      fillOpacity={1}
                      stroke={regimeColor(b.regime, 1)}
                      strokeOpacity={0.35}
                      strokeDasharray="2 4"
                    />
                  ))}

                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      fontSize: 12,
                    }}
                    formatter={(v: unknown) => [
                      typeof v === 'number' ? `$${v.toFixed(2)}` : String(v),
                      'Close',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <RegimeLegend bands={bands} />

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

function RegimeLegend({ bands }: { bands: RegimeBand[] }) {
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
        Market regimes observed
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
