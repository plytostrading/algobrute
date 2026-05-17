'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  CircleDot,
  LineChart as LineChartIcon,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBots } from '@/hooks/useBots';
import {
  useBotPerformance,
  type BotPerformanceResponse,
  type EquityPoint,
  type ShadowEquityPoint,
} from '@/hooks/useDashboard';
import type { BotSnapshot } from '@/types/api';

// ── Color palette for regime bands (neutral/honest, not doom-and-gloom)
const REGIME_COLORS: Record<string, string> = {
  '1': 'rgba(34,197,94,0.08)', // calm
  '2': 'rgba(59,130,246,0.08)', // normal
  '3': 'rgba(234,179,8,0.12)', // elevated
  '4': 'rgba(239,68,68,0.14)', // crisis
  default: 'rgba(156,163,175,0.08)',
};

export function BotPerformancePanel() {
  const { data: bots, isLoading: botsLoading } = useBots();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  const activeBotId =
    selectedBotId ?? (bots && bots.length > 0 ? bots[0].bot_id : null);
  const { data, isLoading, isError, error } = useBotPerformance(activeBotId, 365);

  if (botsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            Bot performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!bots || bots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            Bot performance
          </CardTitle>
          <CardDescription>
            Per-bot equity curve with shadow-fleet counterfactual overlay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
            <Activity className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">No bots deployed yet</div>
            <div className="max-w-sm text-xs text-muted-foreground">
              Deploy approved passports as paper bots from the Backtest evidence
              panel above to start populating your performance history.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            Bot performance
          </CardTitle>
          <CardDescription>
            Live equity curve vs shadow-fleet counterfactual. The gap between
            the two lines is the platform&apos;s realised contribution on this
            bot; regime bands shade the environment each trade closed in.
          </CardDescription>
        </div>
        <BotSelector
          bots={bots}
          activeBotId={activeBotId}
          onSelect={setSelectedBotId}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Failed to load bot performance.'}
          </p>
        ) : data ? (
          <BotPerformanceBody data={data} />
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Bot selector ────────────────────────────────────────────────────

function BotSelector({
  bots,
  activeBotId,
  onSelect,
}: {
  bots: BotSnapshot[];
  activeBotId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Select value={activeBotId ?? undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a bot" />
      </SelectTrigger>
      <SelectContent>
        {bots.map((b) => (
          <SelectItem key={b.bot_id} value={b.bot_id}>
            <span className="font-mono">{b.ticker}</span>
            <span className="ml-2 text-muted-foreground">{b.strategy_id}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Body (summary strip + chart + sh-events list) ───────────────────

function BotPerformanceBody({ data }: { data: BotPerformanceResponse }) {
  const summary = data.summary;
  const chartData = useMemo(() => buildChartSeries(data), [data]);
  const regimeBands = useMemo(() => collapseRegimeBands(data.regime_timeline), [data.regime_timeline]);

  const totalPnl = summary.total_pnl_pct;
  const shadowPnl = summary.platform_alpha_vs_shadow_pct !== null && shadowTotal(data) !== null
    ? shadowTotal(data)!
    : null;
  const alpha = summary.platform_alpha_vs_shadow_pct;

  return (
    <>
      {/* Summary strip */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatTile
          label="Live P&L"
          value={formatPct(totalPnl)}
          tone={totalPnl > 0 ? 'good' : totalPnl < 0 ? 'bad' : 'neutral'}
          icon={
            totalPnl > 0 ? <TrendingUp className="h-4 w-4" /> : totalPnl < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />
          }
          sub={`${summary.n_trades_closed} closed / ${summary.n_trades_open} open`}
        />
        <StatTile
          label="Shadow P&L"
          value={shadowPnl !== null ? formatPct(shadowPnl) : '—'}
          sub={
            summary.shadow_trades_available
              ? 'counterfactual (no-platform baseline)'
              : 'awaiting shadow trades'
          }
          tone="neutral"
          icon={<LineChartIcon className="h-4 w-4" />}
        />
        <StatTile
          label="Platform alpha"
          value={alpha !== null ? (alpha >= 0 ? `+${formatPct(alpha)}` : formatPct(alpha)) : '—'}
          tone={alpha !== null ? (alpha >= 0 ? 'good' : 'bad') : 'neutral'}
          icon={<CircleDot className="h-4 w-4" />}
          sub="live minus shadow"
        />
        <StatTile
          label="Win rate"
          value={summary.win_rate !== null ? `${(summary.win_rate * 100).toFixed(0)}%` : '—'}
          sub={`${summary.ticker} · ${summary.strategy_id}`}
          tone="neutral"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Chart */}
      <div className="h-80 rounded-md border bg-background p-2">
        {chartData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <LineChartIcon className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">
              No closed trades in this window yet
            </div>
            <div className="max-w-sm text-xs text-muted-foreground">
              Equity curve will populate once your {summary.ticker} bot closes
              its first trade. Regime context below remains visible meanwhile.
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
              />
              {/* Regime background bands */}
              {regimeBands.map((band, idx) => (
                <ReferenceArea
                  key={`regime-${idx}`}
                  x1={band.x1}
                  x2={band.x2}
                  fill={REGIME_COLORS[band.regime] ?? REGIME_COLORS.default}
                  fillOpacity={1}
                  stroke="none"
                />
              ))}
              {/* Zero baseline */}
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              {/* SH event pins */}
              {data.sh_events.map((ev) => (
                <ReferenceLine
                  key={ev.event_id}
                  x={dateKey(new Date(ev.timestamp))}
                  stroke="#f97316"
                  strokeDasharray="2 4"
                  label={{
                    value: ev.event_type.replace(/_/g, ' '),
                    position: 'insideTop',
                    fill: '#f97316',
                    fontSize: 10,
                  }}
                />
              ))}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? `${value.toFixed(2)}%` : String(value),
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="live"
                name="Live P&L"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="shadow"
                name="Shadow P&L"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* SH events list */}
      {data.sh_events.length > 0 && (
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Self-healing events ({data.sh_events.length})
          </div>
          <ul className="space-y-1 text-sm">
            {data.sh_events.slice(-8).map((ev) => (
              <li key={ev.event_id} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {ev.event_type.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(ev.timestamp).toLocaleString()}
                </span>
                <span className="truncate">{ev.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function shadowTotal(data: BotPerformanceResponse): number | null {
  const last = data.shadow_equity[data.shadow_equity.length - 1];
  return last ? last.cumulative_pnl_pct : null;
}

interface ChartRow {
  date: string;
  live?: number;
  shadow?: number;
}

function buildChartSeries(data: BotPerformanceResponse): ChartRow[] {
  const byDate = new Map<string, ChartRow>();
  const upsert = (date: string): ChartRow => {
    let row = byDate.get(date);
    if (!row) {
      row = { date };
      byDate.set(date, row);
    }
    return row;
  };
  let liveRunning = 0;
  data.live_equity.forEach((p: EquityPoint) => {
    liveRunning = p.cumulative_pnl_pct;
    upsert(p.date).live = liveRunning;
  });
  let shadowRunning = 0;
  data.shadow_equity.forEach((p: ShadowEquityPoint) => {
    shadowRunning = p.cumulative_pnl_pct;
    upsert(p.date).shadow = shadowRunning;
  });
  const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  // Forward-fill so both series remain visible between sparse points.
  let lastLive: number | undefined;
  let lastShadow: number | undefined;
  rows.forEach((r) => {
    if (r.live !== undefined) lastLive = r.live;
    else if (lastLive !== undefined) r.live = lastLive;
    if (r.shadow !== undefined) lastShadow = r.shadow;
    else if (lastShadow !== undefined) r.shadow = lastShadow;
  });
  return rows;
}

interface RegimeBand {
  x1: string;
  x2: string;
  regime: string;
}

function collapseRegimeBands(
  points: { label_date: string; regime: string }[],
): RegimeBand[] {
  if (points.length === 0) return [];
  const bands: RegimeBand[] = [];
  let start = points[0].label_date;
  let current = points[0].regime;
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].regime !== current) {
      bands.push({ x1: start, x2: points[i].label_date, regime: current });
      start = points[i].label_date;
      current = points[i].regime;
    }
  }
  bands.push({ x1: start, x2: points[points.length - 1].label_date, regime: current });
  return bands;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatPct(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function StatTile({
  label,
  value,
  sub,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'good' | 'neutral' | 'bad';
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === 'good'
      ? 'text-green-600'
      : tone === 'bad'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground truncate" title={sub}>
        {sub}
      </div>
    </div>
  );
}
