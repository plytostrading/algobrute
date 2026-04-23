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

const REGIME_BAND_FILL: Record<string, string> = {
  '1': 'rgba(59,130,246,0.08)',
  '2': 'rgba(34,197,94,0.08)',
  '3': 'rgba(234,179,8,0.12)',
  '4': 'rgba(239,68,68,0.14)',
  default: 'rgba(156,163,175,0.08)',
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
              Regime-colored background shows the <strong>market-wide regime</strong>{' '}
              on each date — shading is the same across all tickers because
              the regime is derived from macro conditions, not per-equity
              volatility. Use the picker to inspect any ticker in your fleet.
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
                      stroke="none"
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
  const seen = new Set<string>();
  const regimes = bands.filter((b) => {
    if (seen.has(b.regime)) return false;
    seen.add(b.regime);
    return true;
  });
  if (regimes.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span className="font-semibold uppercase tracking-widest">Regimes</span>
      {regimes.map((b) => (
        <span key={b.regime} className="flex items-center gap-1">
          <span
            className="h-2.5 w-4 rounded-sm"
            style={{
              backgroundColor: REGIME_BAND_FILL[b.regime] ?? REGIME_BAND_FILL.default,
              borderColor: 'hsl(var(--border))',
              borderWidth: '1px',
            }}
          />
          <span>{REGIME_LABEL[b.regime] ?? b.regime}</span>
        </span>
      ))}
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
