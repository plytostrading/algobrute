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

// Fills for the overlay on the price chart. Raised from ~8% to 18-22%
// so NORMAL / LOW_VOL are actually visible (previously indistinguishable).
// Hues chosen for distinguishability even under low saturation:
//   NORMAL   — indigo/blue
//   LOW_VOL  — teal (NOT green, which is too close to blue at low alpha)
//   ELEVATED — amber
//   CRISIS   — red
const REGIME_BAND_FILL: Record<string, string> = {
  '1': 'rgba(99,102,241,0.18)',    // indigo — NORMAL
  '2': 'rgba(20,184,166,0.18)',    // teal — LOW_VOL (more distinct from blue than green was)
  '3': 'rgba(234,179,8,0.22)',     // amber — ELEVATED_VOL
  '4': 'rgba(239,68,68,0.26)',     // red — CRISIS
  default: 'rgba(156,163,175,0.10)',
};

// Solid variants for the regime ribbon strip (above the chart) + legend
// swatches. Same hues, full saturation.
const REGIME_RIBBON_FILL: Record<string, string> = {
  '1': '#6366f1',
  '2': '#14b8a6',
  '3': '#eab308',
  '4': '#ef4444',
  default: '#94a3b8',
};

const REGIME_LABEL: Record<string, string> = {
  '1': 'NORMAL',
  '2': 'LOW_VOL',
  '3': 'ELEVATED_VOL',
  '4': 'CRISIS',
};

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
            {/* Regime ribbon — always visible caption above the price chart.
                Labels each regime segment so even subtle background bands are
                unambiguous. */}
            <RegimeRibbon
              bands={bands}
              firstDate={effectiveData.points[0]?.date}
              lastDate={effectiveData.points[effectiveData.points.length - 1]?.date}
            />

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
                      fill={REGIME_BAND_FILL[b.regime] ?? REGIME_BAND_FILL.default}
                      fillOpacity={1}
                      stroke={REGIME_RIBBON_FILL[b.regime] ?? REGIME_RIBBON_FILL.default}
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
        Regimes observed
      </span>
      {regimes.map(([regime, days]) => (
        <span key={regime} className="flex items-center gap-1.5">
          <span
            className="h-3 w-4 rounded-sm border"
            style={{
              backgroundColor: REGIME_RIBBON_FILL[regime] ?? REGIME_RIBBON_FILL.default,
              borderColor: 'hsl(var(--border))',
            }}
          />
          <span className="font-semibold text-foreground">
            {REGIME_LABEL[regime] ?? regime}
          </span>
          <span className="font-mono text-muted-foreground">{days}d</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Regime ribbon: a thick solid-colored strip rendered directly above
 * the price chart. Each regime band is drawn as a labeled segment
 * proportional to its duration. Even when the background shading on
 * the chart is subtle, the ribbon is unmissable.
 */
function RegimeRibbon({
  bands,
  firstDate,
  lastDate,
}: {
  bands: RegimeBand[];
  firstDate: string | undefined;
  lastDate: string | undefined;
}) {
  if (bands.length === 0 || !firstDate || !lastDate) return null;
  const winStart = new Date(firstDate).getTime();
  const winEnd = new Date(lastDate).getTime();
  const winSpan = Math.max(1, winEnd - winStart);

  const firstBand = bands[0];
  const lastBand = bands[bands.length - 1];
  const bandStart = new Date(firstBand.start).getTime();
  const bandEnd = new Date(lastBand.end).getTime();

  const prePct = Math.max(0, ((bandStart - winStart) / winSpan) * 100);
  const postPct = Math.max(0, ((winEnd - bandEnd) / winSpan) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Regime timeline
        <span className="font-normal text-muted-foreground/70">
          · each block is a regime period ({firstDate} → {lastDate})
        </span>
      </div>
      <div className="flex h-6 w-full items-stretch overflow-hidden rounded-md border">
        {/* Pre-observation gap (no regime data collected here) */}
        {prePct > 0.5 && (
          <div
            className="flex items-center justify-center bg-muted text-[9px] font-mono text-muted-foreground"
            style={{ width: `${prePct}%` }}
            title="No regime data before first observation"
          >
            {prePct > 8 ? 'no regime data' : ''}
          </div>
        )}
        {bands.map((b, i) => {
          const segStart = new Date(b.start).getTime();
          const segEnd = new Date(b.end).getTime();
          const pct = ((segEnd - segStart) / winSpan) * 100;
          const days =
            Math.floor((segEnd - segStart) / (24 * 3600 * 1000)) + 1;
          const color = REGIME_RIBBON_FILL[b.regime] ?? REGIME_RIBBON_FILL.default;
          const label = REGIME_LABEL[b.regime] ?? b.regime;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-[9px] font-mono font-semibold text-white"
              style={{
                width: `${Math.max(0.5, pct)}%`,
                backgroundColor: color,
                borderLeft: i === 0 ? undefined : '1px solid rgba(0,0,0,0.2)',
              }}
              title={`${label} · ${b.start} → ${b.end} (${days}d)`}
            >
              {pct > 6 ? `${label} ${days}d` : pct > 3 ? label : ''}
            </div>
          );
        })}
        {/* Post-observation gap (if the last band ends before end-of-window) */}
        {postPct > 0.5 && (
          <div
            className="flex items-center justify-center bg-muted text-[9px] font-mono text-muted-foreground"
            style={{ width: `${postPct}%` }}
            title="No regime data after last observation"
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
