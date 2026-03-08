'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetRiskSnapshot } from '@/hooks/useFleetRiskSnapshot';
import { formatRelativeTimeFromISOString } from '@/utils/formatters';
import { REGIME_HEX } from '@/lib/colors';
import FleetPanelInsightCard from '@/components/insights/FleetPanelInsightCard';
import type { TickerTrendMetrics } from '@/types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REGIME_LABELS: Record<number, string> = {
  0: 'LOW VOL',
  1: 'NORMAL',
  2: 'ELEV. VOL',
  3: 'CRISIS',
};

/** Dominant direction is the direction of the highest-ADX ticker in the bot. */
type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

function directionColor(dir: TrendDirection): string {
  if (dir === 'BULLISH') return '#22c55e'; // green-500
  if (dir === 'BEARISH') return '#ef4444'; // red-500
  return '#f59e0b';                         // amber-500
}

function directionIcon(dir: TrendDirection): string {
  if (dir === 'BULLISH') return '▲';
  if (dir === 'BEARISH') return '▼';
  return '–';
}

/** Truncate a string with ellipsis at max chars. */
function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function strengthBadgeVariant(label: string): 'default' | 'secondary' | 'outline' {
  if (label === 'STRONG') return 'default';
  if (label === 'TRENDING') return 'secondary';
  return 'outline';
}

interface StatBoxProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function StatBox({ label, value, sub, highlight }: StatBoxProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 px-3 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={`font-mono-data text-lg font-bold leading-none ${highlight ? 'text-destructive' : ''}`}>
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-muted-foreground">{sub}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bot-centric chart types
// ---------------------------------------------------------------------------

/**
 * One row in the bar chart: aggregated trend environment for a single bot.
 * The bar represents mean ADX across all tickers this bot trades.
 * Color reflects the dominant direction (highest-ADX ticker wins).
 */
interface BotChartEntry {
  /** Full strategy name, used as the Recharts category key. */
  botName: string;
  /** Truncated name rendered on the Y-axis. */
  displayName: string;
  /** Mean ADX across all tickers (bar length). */
  meanAdx: number;
  /** Direction of the highest-ADX ticker — colors the bar. */
  dominantDirection: TrendDirection;
  /** All tickers this bot trades, sorted by ADX descending. */
  tickers: TickerTrendMetrics[];
  /** Compact ticker summary shown as Y-axis sub-label: e.g. "SPY, QQQ +1" */
  tickerSummary: string;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function BotADXTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BotChartEntry }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover p-3 text-xs shadow-lg min-w-[220px] max-w-[280px]">
      <p className="font-semibold text-sm mb-0.5">{entry.botName}</p>
      <p className="font-mono-data text-muted-foreground mb-2">
        Avg ADX{' '}
        <span className="font-bold text-foreground">{entry.meanAdx.toFixed(1)}</span>
        {' · '}
        <span style={{ color: directionColor(entry.dominantDirection) }}>
          {directionIcon(entry.dominantDirection)} {entry.dominantDirection}
        </span>
      </p>
      <div className="border-t border-border pt-2 space-y-1.5">
        {entry.tickers.map((t) => {
          const dir = t.trend_direction as TrendDirection;
          return (
            <div key={t.ticker} className="grid grid-cols-[2.5rem_1fr_auto] gap-1 font-mono-data items-center">
              <span className="font-semibold text-foreground">{t.ticker}</span>
              <span className="text-muted-foreground text-[10px]">{t.trend_strength_label}</span>
              <span className="text-right">
                <span className="font-bold text-foreground">{t.adx.toFixed(1)}</span>{' '}
                <span style={{ color: directionColor(dir) }}>{directionIcon(dir)}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 border-t border-border pt-1.5">
        Wilder ADX · 14-period
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RiskSnapshotCard() {
  const { data, isLoading, isError } = useFleetRiskSnapshot();

  /**
   * Build one chart row per bot.
   *
   * Strategy:
   * 1. Invert ticker_bots (ticker→bots) to bot→tickers.
   * 2. For each bot, gather its tickers' TickerTrendMetrics.
   * 3. Mean ADX = the bar length; dominant direction = direction of the
   *    highest-ADX ticker (most conviction signal for the bot's universe).
   * 4. tickerSummary = top-3 tickers by ADX, e.g. "SPY, QQQ +1".
   * 5. Sort bots by mean ADX descending.
   */
  const chartData = useMemo((): BotChartEntry[] => {
    if (!data) return [];

    const metricsMap = new Map(
      (data.ticker_trend_metrics ?? []).map((m) => [m.ticker, m]),
    );

    // Invert ticker→bots to bot→tickers
    const botTickers = new Map<string, string[]>();
    for (const [ticker, bots] of Object.entries(data.ticker_bots ?? {})) {
      for (const bot of bots) {
        const arr = botTickers.get(bot) ?? [];
        arr.push(ticker);
        botTickers.set(bot, arr);
      }
    }

    return Array.from(botTickers.entries())
      .flatMap(([botName, tickerList]) => {
        const tickers = tickerList
          .map((t) => metricsMap.get(t))
          .filter((m): m is TickerTrendMetrics => m !== undefined)
          .sort((a, b) => b.adx - a.adx);

        if (tickers.length === 0) return [];

        const meanAdx = tickers.reduce((s, t) => s + t.adx, 0) / tickers.length;
        const dominantDirection = tickers[0].trend_direction as TrendDirection;

        // Compact ticker summary: show top 3, overflow as "+N"
        const TOP_N = 3;
        const tickerSummary =
          tickers.length <= TOP_N
            ? tickers.map((t) => t.ticker).join(', ')
            : `${tickers
                .slice(0, TOP_N)
                .map((t) => t.ticker)
                .join(', ')} +${tickers.length - TOP_N}`;

        return [{
          botName,
          displayName: truncate(botName, 14),
          meanAdx,
          dominantDirection,
          tickers,
          tickerSummary,
        } satisfies BotChartEntry];
      })
      .sort((a, b) => b.meanAdx - a.meanAdx);
  }, [data]);

  const regimeLabel = data ? REGIME_LABELS[data.regime] ?? 'UNKNOWN' : '';
  const regimeColor = data ? REGIME_HEX[data.regime] : '#6b7280';

  // Dynamic chart height: min 120px, 50px per bot row
  const chartHeight = Math.max(120, chartData.length * 50);

  // --------------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Risk Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
          <Skeleton className="h-40 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Error state
  // --------------------------------------------------------------------------
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Risk Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load risk snapshot.</p>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Empty state — no bots deployed
  // --------------------------------------------------------------------------
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Risk Snapshot
          </CardTitle>
          <CardDescription>Volatility · VaR · Trend strength</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No active bots — deploy a bot to see live risk metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Main render
  // --------------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Risk Snapshot
        </CardTitle>
        <CardDescription>
          Fleet volatility, VaR, and trend environment per bot
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] font-mono-data font-semibold"
            style={{ borderColor: regimeColor, color: regimeColor }}
          >
            {regimeLabel}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            <RefreshCw className="inline h-3 w-3 mr-0.5" />
            {formatRelativeTimeFromISOString(data.computed_at)}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Stat boxes ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBox
            label="Fleet Vol (Ann.)"
            value={`${(data.fleet_volatility_annualized * 100).toFixed(1)}%`}
            sub="annualised σ"
          />
          <StatBox
            label="VaR 95%"
            value={`${(data.fleet_var_95_pct * 100).toFixed(2)}%`}
            sub="1-day 95th pctile"
            highlight={data.fleet_var_95_pct > 0.05}
          />
          <StatBox
            label="VaR 99%"
            value={`${(data.fleet_var_99_pct * 100).toFixed(2)}%`}
            sub="1-day 99th pctile"
            highlight={data.fleet_var_99_pct > 0.08}
          />
          <StatBox
            label="CVaR 95%"
            value={`${(data.fleet_cvar_95_pct * 100).toFixed(2)}%`}
            sub="expected tail loss"
            highlight={data.fleet_cvar_95_pct > 0.07}
          />
        </div>

        {/* ── ADX bar chart ────────────────────────────────────────────── */}
        {chartData.length > 0 ? (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Bot Trend Environment (Mean Wilder ADX · 14-period)
                </p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" /> Bullish
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" /> Bearish
                  </span>
                  <span className="flex items-center gap-1">
                    <Minus className="h-3 w-3 text-warning" /> Neutral
                  </span>
                </div>
              </div>

              <div style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 60]}
                      tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => String(v)}
                    />
                    {/*
                      Y-axis: bot name as primary label (bold), top tickers as
                      compact sub-label so the trader knows which instruments
                      are driving the ADX reading.
                    */}
                    <YAxis
                      type="category"
                      dataKey="botName"
                      tick={(props) => {
                        const { x, y, payload } = props as {
                          x: number;
                          y: number;
                          payload: { value: string };
                        };
                        const entry = chartData.find((d) => d.botName === payload.value);
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={-6}
                              y={0}
                              dy={entry?.tickerSummary ? -4 : 4}
                              textAnchor="end"
                              fill="var(--color-foreground)"
                              fontSize={11}
                              fontWeight={600}
                            >
                              {entry?.displayName ?? payload.value}
                            </text>
                            {entry?.tickerSummary && (
                              <text
                                x={-6}
                                y={0}
                                dy={9}
                                textAnchor="end"
                                fill="var(--color-muted-foreground)"
                                fontSize={8}
                              >
                                {entry.tickerSummary}
                              </text>
                            )}
                          </g>
                        );
                      }}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip
                      content={<BotADXTooltip />}
                      cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.4 }}
                    />

                    {/* WEAK → TRENDING threshold */}
                    <ReferenceLine
                      x={20}
                      stroke="var(--color-muted-foreground)"
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      label={{
                        value: 'Trending',
                        position: 'top',
                        fontSize: 9,
                        fill: 'var(--color-muted-foreground)',
                      }}
                    />
                    {/* TRENDING → STRONG threshold */}
                    <ReferenceLine
                      x={40}
                      stroke="var(--color-muted-foreground)"
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      label={{
                        value: 'Strong',
                        position: 'top',
                        fontSize: 9,
                        fill: 'var(--color-muted-foreground)',
                      }}
                    />

                    <Bar dataKey="meanAdx" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.botName}
                          fill={directionColor(entry.dominantDirection)}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Summary row ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Avg ADX{' '}
                <span className="font-mono-data font-semibold text-foreground">
                  {data.avg_adx.toFixed(1)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Trending tickers{' '}
                <span className="font-mono-data font-semibold text-foreground">
                  {data.trending_ticker_count} / {data.total_ticker_count}
                </span>
              </span>
              <div className="flex gap-1.5">
                {chartData.slice(0, 4).map((entry) => (
                  <Badge
                    key={entry.botName}
                    variant={strengthBadgeVariant(
                      entry.tickers[0]?.trend_strength_label ?? 'WEAK',
                    )}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    {entry.displayName}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-4">
            No active bots — trend data appears once bots are trading.
          </p>
        )}
        {/* AI Insight */}
        <FleetPanelInsightCard panelKey="risk_snapshot" className="mt-1" />
      </CardContent>
    </Card>
  );
}
