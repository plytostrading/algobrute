'use client';

/**
 * RegimeTimelineChart
 *
 * Visualises the strategy's cumulative return over time with the market
 * regime at each trade entry shown as coloured background segments.
 *
 * DATA SOURCES:
 * - Line colour: TradeRecord.entry_regime via an SVG linearGradient on the
 *   Area stroke — one <Area> component, no extra Lines.
 * - Regime sections: <ReferenceArea> coloured background bands per regime.
 * - Conviction (optional): WFLabelPoint[] used only for the bottom legend.
 *
 * PERFORMANCE NOTE:
 * All object/function props passed to Recharts components are defined at
 * module scope (constants or named functions) so their identity is stable
 * across renders. Inline object literals or arrow functions would make
 * Recharts detect prop changes on every render and re-layout unnecessarily.
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import type { TradeRecord, Regime, WFLabelPoint } from '@/types/api';

// ---------------------------------------------------------------------------
// Stable Recharts prop constants — module scope so identity never changes
// ---------------------------------------------------------------------------

const CHART_MARGIN_NORMAL = { top: 8, right: 4, left: 4, bottom: 0 } as const;
const CHART_MARGIN_COMPACT = { top: 4, right: 4, left: 0, bottom: 0 } as const;
const AXIS_TICK_STYLE = { fontSize: 10, fill: 'var(--color-muted-foreground)' } as const;
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'var(--color-popover)',
  borderColor: 'var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
} as const;

// Named functions so Recharts sees the same reference across renders
function formatXAxisTick(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
}
function formatYAxisTick(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(0)}%`;
}
function formatTooltipLabel(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
function formatTooltipValue(
  v: number,
  _: string,
  item: { payload?: { regime?: Regime } },
): [string, string] {
  const regime = item.payload?.regime ?? 1;
  return [
    `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
    `Cum. return \u00b7 ${REGIME_LABELS[regime]} regime`,
  ];
}

// ---------------------------------------------------------------------------
// Regime constants
// ---------------------------------------------------------------------------

const REGIME_LABELS: Record<Regime, string> = {
  0: 'Low Vol',
  1: 'Normal',
  2: 'Elevated Vol',
  3: 'Crisis',
};

/**
 * Line stroke colour per regime.
 * Low Vol uses blue (matches blue-100 fill, clearly distinct from Normal's green).
 * Normal/Elevated Vol/Crisis follow green→orange→red severity spectrum.
 */
const REGIME_LINE_COLORS: Record<Regime, string> = {
  0: '#3B82F6', // blue-500  — Low Vol: calm, matches blue-100 background fill
  1: '#22C55E', // green-500 — Normal: medium green
  2: '#F97316', // orange-500 — Elevated Vol: amber-orange
  3: '#EF4444', // red-500   — Crisis: bright red
};

/** Soft background fills for regime bands (unchanged from v1). */
const REGIME_FILLS: Record<Regime, string> = {
  0: '#dbeafe', // blue-100  — calm
  1: '#dcfce7', // green-100 — normal
  2: '#fef3c7', // amber-100 — elevated
  3: '#fee2e2', // red-100   — crisis
};

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface CurvePoint {
  date: string;
  cumReturn: number;
  regime: Regime;
}

type BandDef = { x1: string; x2: string; regime: Regime };
type ConvictionMap = Record<string, { meanPct: number }>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the cumulative return curve as a CPCV path-averaged equity curve.
 *
 * all_trade_records contains each trade replicated once per CPCV path (e.g.
 * C(10,2)=45 paths → each trade appears ~9 times). Naive arithmetic summation
 * inflates cumulative returns ~9×. Correct approach mirrors the backend's
 * _build_cpcv_chart_data:
 *   1. Group trades by backtest_path_id.
 *   2. Per path: sort by exit_date, compound equity (×(1 + pnl/100)).
 *   3. For each unique exit date (union across paths): forward-fill each path's
 *      last-known equity, then average across paths that have started trading.
 *   4. Convert mean equity → cumulative return %: (equity − 1) × 100.
 *
 * Regime at each date is taken from the first path that records a trade there;
 * regime labels are global (walk-forward labeler), so they are identical across
 * paths for the same date.
 */
function buildCurve(trades: TradeRecord[]): CurvePoint[] {
  const closed = trades.filter((t) => t.exit_date && t.realized_pnl_pct != null);
  if (closed.length === 0) return [];

  // Group by CPCV path.
  const pathGroups = new Map<number, TradeRecord[]>();
  for (const t of closed) {
    const pid = t.backtest_path_id ?? -1;
    if (!pathGroups.has(pid)) pathGroups.set(pid, []);
    pathGroups.get(pid)!.push(t);
  }

  // Per path: build date → cumulative equity map (compounded).
  const allDates = new Set<string>();
  const pathEquityMaps = new Map<number, Map<string, number>>();
  const dateRegime = new Map<string, Regime>();

  for (const [pid, pathTrades] of pathGroups) {
    const sorted = [...pathTrades].sort((a, b) => a.exit_date!.localeCompare(b.exit_date!));
    let equity = 1.0;
    const eqMap = new Map<string, number>();
    for (const t of sorted) {
      equity *= 1.0 + t.realized_pnl_pct! / 100.0;
      const d = t.exit_date!.slice(0, 10);
      eqMap.set(d, equity);
      allDates.add(d);
      // Regime labels are shared across paths; first writer wins.
      if (!dateRegime.has(d)) dateRegime.set(d, (t.entry_regime ?? 1) as Regime);
    }
    pathEquityMaps.set(pid, eqMap);
  }

  const sortedDates = Array.from(allDates).sort();

  // Forward-fill each path's equity and average across started paths.
  const pathLastEquity = new Map<number, number>();
  return sortedDates.map((date) => {
    for (const [pid, eqMap] of pathEquityMaps) {
      if (eqMap.has(date)) pathLastEquity.set(pid, eqMap.get(date)!);
    }
    const equities = Array.from(pathLastEquity.values());
    const meanEquity = equities.length > 0
      ? equities.reduce((s, v) => s + v, 0) / equities.length
      : 1.0;
    return {
      date,
      cumReturn: parseFloat(((meanEquity - 1.0) * 100).toFixed(3)),
      regime: dateRegime.get(date) ?? 1,
    };
  });
}

/** Regime background bands — string dates match the category x-axis dataKey. */
function buildBands(curve: CurvePoint[]): BandDef[] {
  if (curve.length === 0) return [];

  const bands: BandDef[] = [];
  let start = curve[0].date;
  let current = curve[0].regime;

  for (let i = 1; i < curve.length; i++) {
    if (curve[i].regime !== current) {
      bands.push({ x1: start, x2: curve[i - 1].date, regime: current });
      current = curve[i].regime;
      start = curve[i].date;
    }
  }
  bands.push({ x1: start, x2: curve[curve.length - 1].date, regime: current });
  return bands;
}

/**
 * Build colour stops for the SVG linearGradient that drives the regime-coloured
 * line stroke on the single <Area> component.
 *
 * With a category x-axis of N points, Recharts places point i at position
 * i/(N-1) of the path's bounding-box width (verified via SVG objectBoundingBox
 * maths).  We insert a pair of stops at the midpoint between i-1 and i for
 * each regime transition so the colour change is sharp, not blended.
 */
function buildStrokeGradientStops(
  curve: CurvePoint[],
): Array<{ offset: string; color: string }> {
  const n = curve.length;
  if (n < 2) {
    const c = REGIME_LINE_COLORS[curve[0]?.regime ?? 1];
    return [{ offset: '0%', color: c }, { offset: '100%', color: c }];
  }

  const stops: Array<{ offset: string; color: string }> = [];
  stops.push({ offset: '0%', color: REGIME_LINE_COLORS[curve[0].regime] });

  for (let i = 1; i < n; i++) {
    if (curve[i].regime !== curve[i - 1].regime) {
      const mid = (((i - 0.5) / (n - 1)) * 100).toFixed(3);
      stops.push({ offset: `${mid}%`, color: REGIME_LINE_COLORS[curve[i - 1].regime] });
      stops.push({ offset: `${mid}%`, color: REGIME_LINE_COLORS[curve[i].regime] });
    }
  }

  stops.push({ offset: '100%', color: REGIME_LINE_COLORS[curve[n - 1].regime] });
  return stops;
}

/**
 * Compute mean model-assigned probability per regime from WFLabelPoints.
 * For each snapshot where ensemble_label is regime R, we read
 * signal.regime_probabilities[R] — the model's probability for that regime.
 * The mean across all such snapshots is the average confidence when in R.
 */
function buildConviction(labels: WFLabelPoint[]): ConvictionMap | null {
  if (labels.length === 0) return null;

  const acc: Record<string, { sum: number; count: number }> = {};
  for (const lp of labels) {
    const r = String(lp.signal.ensemble_label);
    // regime_probabilities keys are stringified ints (JSON serialisation of Python IntEnum dict)
    const prob = lp.signal.regime_probabilities[r] ?? lp.signal.conviction_score;
    if (!acc[r]) acc[r] = { sum: 0, count: 0 };
    acc[r].sum += prob;
    acc[r].count++;
  }

  return Object.fromEntries(
    Object.entries(acc).map(([r, { sum, count }]) => [r, { meanPct: sum / count }]),
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RegimeTimelineChartProps {
  trades: TradeRecord[];
  /**
   * Walk-forward regime label series from GET /api/backtest/{id}/regime-labels.
   * When present, a model-conviction legend is shown in the top-right corner.
   */
  regimeLabels?: WFLabelPoint[];
  /** Reduce height to 80 px for compact embed (e.g. Strategy DNA panel). */
  compact?: boolean;
}

export default function RegimeTimelineChart({
  trades,
  regimeLabels,
  compact = false,
}: RegimeTimelineChartProps) {
  const curve = useMemo(() => buildCurve(trades), [trades]);
  const bands = useMemo(() => buildBands(curve), [curve]);
  const gradientStops = useMemo(() => buildStrokeGradientStops(curve), [curve]);
  const conviction = useMemo(
    () => (regimeLabels ? buildConviction(regimeLabels) : null),
    [regimeLabels],
  );

  if (curve.length < 2) {
    return (
      <p className="text-[11px] italic text-muted-foreground/60 py-2">
        No closed trades available for timeline.
      </p>
    );
  }

  const height = compact ? 80 : 220;

  return (
    <div className="w-full">
      {!compact && (
        <p className="mb-1 text-[10px] text-muted-foreground/70 italic">
          Regime at trade entry — line coloured by market regime
        </p>
      )}

      {/* relative so the conviction overlay can be absolutely placed */}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={curve}
            margin={compact ? CHART_MARGIN_COMPACT : CHART_MARGIN_NORMAL}
          >
            <defs>
              {/* Neutral vertical gradient for the area fill — same as original */}
              <linearGradient id="ctGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
              {/*
               * Horizontal gradient for the line stroke, coloured by regime.
               * gradientUnits="objectBoundingBox" means offset 0 = first data
               * point, offset 1 = last data point.  With N category-axis points,
               * point i sits at i/(N-1) of the bounding-box width, so the
               * midpoint stops produce sharp (not blended) colour transitions.
               */}
              <linearGradient
                id="regimeStroke"
                x1="0" y1="0" x2="1" y2="0"
                gradientUnits="objectBoundingBox"
              >
                {gradientStops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
            </defs>

            {!compact && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                strokeOpacity={0.4}
              />
            )}

            {/* Regime background bands */}
            {bands.map((b, i) => (
              <ReferenceArea
                key={i}
                x1={b.x1}
                x2={b.x2}
                fill={REGIME_FILLS[b.regime]}
                fillOpacity={0.35}
              />
            ))}

            {!compact && (
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisTick}
                tick={AXIS_TICK_STYLE}
                tickLine={false}
                axisLine={false}
                minTickGap={70}
              />
            )}

            {!compact && (
              <YAxis
                tickFormatter={formatYAxisTick}
                tick={AXIS_TICK_STYLE}
                tickLine={false}
                axisLine={false}
                width={44}
              />
            )}

            {!compact && (
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                formatter={formatTooltipValue}
                labelFormatter={formatTooltipLabel}
              />
            )}

            {/* Single Area — same as original, stroke now uses the regime gradient */}
            <Area
              type="monotone"
              dataKey="cumReturn"
              stroke="url(#regimeStroke)"
              strokeWidth={compact ? 1.5 : 2}
              fill="url(#ctGrad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>

      </div>

      {/* Bottom regime colour legend — shows conviction % when available */}
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {(Object.entries(REGIME_LABELS) as [string, string][]).map(([k, label]) => {
            const regimeNum = Number(k) as Regime;
            const convPct = conviction?.[k]?.meanPct;
            return (
              <div key={k} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-1.5 rounded-sm"
                  style={{ backgroundColor: REGIME_LINE_COLORS[regimeNum] }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {label}
                  {convPct != null && (
                    <span className="ml-1 text-[9px] text-muted-foreground/70">
                      {(convPct * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          <span className="ml-auto text-[10px] italic text-muted-foreground/60">
            regime at trade entry
          </span>
        </div>
      )}
    </div>
  );
}
