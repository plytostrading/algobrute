'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pause, Play, Send } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  useAskValidationSimulationQuestion,
  useValidationSimulationInsight,
} from '@/hooks/useBacktestWorkflow';
import type {
  CPCVChartData,
  ValidationSimulationComparison,
  ValidationSimulationDaySummary,
  ValidationSimulationQuestionAnswer,
  ValidationSimulationSectionInsight,
  ValidationSimulationTimeline,
  ValidationSimulationTimelinePoint,
  ValidationSimulationTradeMarker,
  ValidationSimulationTradeSummary,
} from '@/types/api';

interface ValidationPlaybackPanelProps {
  jobId: string;
  runId: string;
  timeline: ValidationSimulationTimeline;
  trades: ValidationSimulationTradeSummary[];
  comparison?: ValidationSimulationComparison | null;
  chartData?: CPCVChartData | null;
  isLive: boolean;
  isComplete: boolean;
  mode?: 'compact' | 'full';
}

interface PricePathPoint {
  label: string;
  tradeDate: string;
  closePrice: number | null;
  segment: 'discovery' | 'holdout';
}

interface MarkerPoint {
  label: string;
  tradeDate: string;
  price: number;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }
  return `${value.toFixed(2)}%`;
}

function formatDecimal(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }
  return value.toFixed(2);
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'Awaiting timestamp';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function metricVariant(
  value: number | boolean | null | undefined,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (typeof value === 'boolean') {
    return value ? 'default' : 'destructive';
  }
  if (typeof value === 'number') {
    if (value > 0) {
      return 'default';
    }
    if (value < 0) {
      return 'destructive';
    }
  }
  return 'secondary';
}

function buildCombinedPricePath(
  discoveryCurve: CPCVChartData['market_price_curve'] | undefined,
  daySummaries: ValidationSimulationDaySummary[],
): PricePathPoint[] {
  const holdoutStartDate = daySummaries[0]?.trade_date ?? null;
  const discoveryPoints = (discoveryCurve ?? [])
    .filter((point) => !holdoutStartDate || point.date < holdoutStartDate)
    .slice(-90)
    .map((point) => ({
      label: point.date,
      tradeDate: point.date,
      closePrice: point.close,
      segment: 'discovery' as const,
    }));
  const holdoutPoints = daySummaries.map((day) => ({
    label: day.trade_date,
    tradeDate: day.trade_date,
    closePrice: day.close_price,
    segment: 'holdout' as const,
  }));
  return [...discoveryPoints, ...holdoutPoints];
}

function buildMarkerPoints(
  markers: ValidationSimulationTradeMarker[],
  pricesByDate: Map<string, number | null>,
  currentTradeDate: string | null,
  isLive: boolean,
  markerType: 'entry' | 'exit',
): MarkerPoint[] {
  if (!isLive && currentTradeDate === null) {
    return [];
  }
  return markers
    .filter((marker) => marker.marker_type === markerType)
    .filter((marker) => isLive || marker.trade_date <= currentTradeDate!)
    .map((marker) => ({
      label: marker.trade_date,
      tradeDate: marker.trade_date,
      price: marker.price ?? pricesByDate.get(marker.trade_date) ?? 0,
    }))
    .filter((marker) => marker.price > 0);
}

function buildCapitalTimeline(daySummaries: ValidationSimulationDaySummary[]) {
  return daySummaries.map((day) => ({
    date: day.trade_date,
    portfolioValue: day.portfolio_value,
    cash: day.cash,
    grossExposure: day.gross_exposure,
  }));
}

function buildRealizedPnlTimeline(
  daySummaries: ValidationSimulationDaySummary[],
  trades: ValidationSimulationTradeSummary[],
) {
  let cumulativePnl = 0;
  return daySummaries.map((day) => {
    cumulativePnl += trades
      .filter((trade) => trade.exit_date === day.trade_date)
      .reduce((sum, trade) => sum + (trade.realized_pnl ?? 0), 0);
    return {
      date: day.trade_date,
      cumulativePnl,
    };
  });
}

function buildTradeOutcomeSeries(trades: ValidationSimulationTradeSummary[]) {
  return trades
    .filter((trade) => trade.exit_date !== null)
    .map((trade, index) => ({
      tradeLabel: `T${index + 1}`,
      realizedPnlPct: trade.realized_pnl_pct,
      mfePct: trade.mfe_pct,
      maePct: trade.mae_pct != null ? Math.abs(trade.mae_pct) : null,
    }));
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono-data text-lg font-semibold">{value}</p>
      {detail ? <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function insightVariant(
  sentiment: ValidationSimulationSectionInsight['sentiment'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (sentiment === 'positive') {
    return 'default';
  }
  if (sentiment === 'warning') {
    return 'destructive';
  }
  if (sentiment === 'caution') {
    return 'outline';
  }
  return 'secondary';
}

function ValidationInsightCard({
  title,
  insight,
  isLoading,
  error,
}: {
  title: string;
  insight: ValidationSimulationSectionInsight | null | undefined;
  isLoading: boolean;
  error?: string | null;
}) {
  if (!isLoading && !insight && !error) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        {insight ? (
          <div className="flex items-center gap-2">
            {insight.cached ? (
              <Badge variant="outline" className="text-[10px]">
                Cached
              </Badge>
            ) : null}
            <Badge variant={insightVariant(insight.sentiment)}>{insight.sentiment}</Badge>
          </div>
        ) : null}
      </div>
      {isLoading ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Building grounded validation insight…
        </div>
      ) : error ? (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      ) : insight ? (
        <p className="mt-3 text-sm leading-6 text-foreground">{insight.summary}</p>
      ) : null}
    </div>
  );
}

function renderAdditionalSectionValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function ValidationAnswerCard({
  answer,
}: {
  answer: ValidationSimulationQuestionAnswer;
}) {
  return (
    <div className="rounded-md border bg-muted/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{answer.headline}</p>
        <div className="flex items-center gap-2">
          {answer.cached ? (
            <Badge variant="outline" className="text-[10px]">
              Cached
            </Badge>
          ) : null}
          <Badge variant={answer.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
            {answer.severity}
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground">{answer.explanation}</p>
      {answer.action ? (
        <p className="mt-3 text-xs font-medium text-primary">Next: {answer.action}</p>
      ) : null}
      {Object.keys(answer.additional_sections).length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(answer.additional_sections).map(([key, value]) => (
            <div key={key} className="rounded-md bg-background/80 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {formatEventType(key)}
              </p>
              <p className="mt-1 text-xs text-foreground">
                {renderAdditionalSectionValue(value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EventFeed({
  events,
}: {
  events: ValidationSimulationTimelinePoint[];
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        Waiting for persisted telemetry events.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={`${event.sequence_no}-${event.event_type}`}
          className="rounded-md border bg-muted/20 p-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium">{formatEventType(event.event_type)}</p>
            <span className="font-mono-data text-[11px] text-muted-foreground">
              #{event.sequence_no}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatTimestamp(event.event_time)}
          </p>
          {event.ticker ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {event.ticker}
              {event.price != null ? ` · ${event.price.toFixed(2)}` : ''}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function ValidationPlaybackPanel({
  jobId,
  runId,
  timeline,
  trades,
  comparison,
  chartData,
  isLive,
  isComplete,
  mode = 'compact',
}: ValidationPlaybackPanelProps) {
  const isFullMode = mode === 'full';
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(isFullMode ? 1 : 2.5);
  const [questionInput, setQuestionInput] = useState('');
  const [latestAnswer, setLatestAnswer] =
    useState<ValidationSimulationQuestionAnswer | null>(null);

  const insightEnabled = isFullMode && isComplete;
  const overviewInsightQuery = useValidationSimulationInsight(
    jobId,
    runId,
    'playback_overview',
    insightEnabled,
  );
  const decisionInsightQuery = useValidationSimulationInsight(
    jobId,
    runId,
    'decision_state',
    insightEnabled,
  );
  const comparisonInsightQuery = useValidationSimulationInsight(
    jobId,
    runId,
    'comparison',
    insightEnabled,
  );
  const askValidationQuestion = useAskValidationSimulationQuestion();

  const maxIndex = Math.max(timeline.timeline_points.length - 1, 0);

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackSpeed(isFullMode ? 1 : 2.5);
    setPlaybackIndex(isLive ? maxIndex : 0);
  }, [isFullMode, isLive, maxIndex, timeline.run_id]);

  useEffect(() => {
    if (isLive) {
      setPlaybackIndex(maxIndex);
    } else {
      setPlaybackIndex((current) => Math.min(current, maxIndex));
    }
  }, [isLive, maxIndex]);

  useEffect(() => {
    if (isLive || !isPlaying || maxIndex === 0) {
      return undefined;
    }
    const intervalMs = Math.max(120, Math.round(900 / playbackSpeed));
    const timer = window.setInterval(() => {
      setPlaybackIndex((current) => {
        if (current >= maxIndex) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isLive, isPlaying, maxIndex, playbackSpeed]);

  useEffect(() => {
    if (!isLive && playbackIndex >= maxIndex) {
      setIsPlaying(false);
    }
  }, [isLive, maxIndex, playbackIndex]);

  useEffect(() => {
    setQuestionInput('');
    setLatestAnswer(null);
  }, [runId]);

  const currentPoint =
    timeline.timeline_points[Math.min(playbackIndex, timeline.timeline_points.length - 1)] ?? null;
  const currentSequenceNo = currentPoint?.sequence_no ?? 0;

  const visibleDaySummaries = useMemo(
    () =>
      isLive
        ? timeline.day_summaries
        : timeline.day_summaries.filter((day) => day.sequence_no <= currentSequenceNo),
    [currentSequenceNo, isLive, timeline.day_summaries],
  );
  const currentDay = visibleDaySummaries[visibleDaySummaries.length - 1] ?? null;
  const currentTradeDate = currentDay?.trade_date ?? null;
  const currentRiskState = currentPoint?.risk_state ?? timeline.latest_risk_state;

  const pricePath = useMemo(
    () => buildCombinedPricePath(chartData?.market_price_curve, visibleDaySummaries),
    [chartData?.market_price_curve, visibleDaySummaries],
  );
  const pricesByDate = useMemo(
    () => new Map(pricePath.map((point) => [point.tradeDate, point.closePrice])),
    [pricePath],
  );
  const entryMarkers = useMemo(
    () =>
      buildMarkerPoints(
        timeline.trade_markers,
        pricesByDate,
        currentTradeDate,
        isLive,
        'entry',
      ),
    [currentTradeDate, isLive, pricesByDate, timeline.trade_markers],
  );
  const exitMarkers = useMemo(
    () =>
      buildMarkerPoints(
        timeline.trade_markers,
        pricesByDate,
        currentTradeDate,
        isLive,
        'exit',
      ),
    [currentTradeDate, isLive, pricesByDate, timeline.trade_markers],
  );

  const visibleTrades = useMemo(
    () =>
      isLive
        ? trades
        : currentTradeDate === null
          ? []
          : trades.filter((trade) => trade.entry_date <= currentTradeDate),
    [currentTradeDate, isLive, trades],
  );
  const closedVisibleTrades = useMemo(
    () =>
      visibleTrades.filter(
        (trade) =>
          trade.exit_date !== null &&
          (currentTradeDate === null || trade.exit_date <= currentTradeDate),
      ),
    [currentTradeDate, visibleTrades],
  );
  const realizedPnl = useMemo(
    () => closedVisibleTrades.reduce((sum, trade) => sum + (trade.realized_pnl ?? 0), 0),
    [closedVisibleTrades],
  );
  const recentEvents = useMemo(() => {
    const endIndex = isLive ? timeline.timeline_points.length : playbackIndex + 1;
    return timeline.timeline_points.slice(0, endIndex).slice(-5).reverse();
  }, [isLive, playbackIndex, timeline.timeline_points]);

  const comparisonHeadline = comparison?.headline_metrics ?? {};
  const comparisonDeltas = comparison?.metric_deltas ?? {};
  const baselineReturn = asNumber(comparisonHeadline.baseline_total_return_pct);
  const validationReturn = asNumber(comparisonHeadline.validation_total_return_pct);
  const sharpeDelta = asNumber(comparisonDeltas.sharpe_ratio_delta);
  const tradeDelta = asNumber(comparisonDeltas.n_trades_delta);
  const currentPortfolioValue =
    currentDay?.portfolio_value ??
    asNumber(currentRiskState?.additional_state?.portfolio_value) ??
    timeline.result?.final_portfolio_value ??
    null;
  const currentCash =
    currentDay?.cash ??
    asNumber(currentRiskState?.additional_state?.cash) ??
    timeline.result?.final_cash ??
    null;
  const grossExposure =
    currentDay?.gross_exposure ??
    asNumber(currentRiskState?.additional_state?.gross_exposure) ??
    timeline.result?.gross_exposure ??
    null;
  const currentRegime =
    currentDay?.regime ?? asString(currentRiskState?.additional_state?.regime) ?? 'Unknown';
  const qualificationActive = currentRiskState?.qualification_active ?? null;
  const signalStrength = currentRiskState?.signal_strength ?? null;
  const activePosition = asObject(currentRiskState?.additional_state?.active_position);
  const botState = asString(currentRiskState?.additional_state?.bot_state);
  const openPositionCount =
    currentDay?.n_open_positions ??
    asNumber(currentRiskState?.additional_state?.n_open_positions) ??
    timeline.result?.n_open_positions ??
    null;
  const positionSizePct =
    currentRiskState?.position_size_pct ??
    asNumber(activePosition?.position_size_pct) ??
    null;
  const currentStopPrice =
    asNumber(activePosition?.current_stop_price) ??
    asNumber(currentRiskState?.additional_state?.stop_price) ??
    null;
  const currentTargetPrice =
    asNumber(activePosition?.target_price) ?? currentRiskState?.target_price ?? null;
  const activeQuantity = asNumber(activePosition?.quantity);
  const activeBarsHeld = asNumber(activePosition?.bars_held);
  const activeUnrealizedPct = asNumber(activePosition?.unrealized_pct);
  const capitalTimeline = useMemo(
    () => buildCapitalTimeline(visibleDaySummaries),
    [visibleDaySummaries],
  );
  const realizedPnlTimeline = useMemo(
    () => buildRealizedPnlTimeline(visibleDaySummaries, closedVisibleTrades),
    [closedVisibleTrades, visibleDaySummaries],
  );
  const tradeOutcomeSeries = useMemo(
    () => buildTradeOutcomeSeries(closedVisibleTrades),
    [closedVisibleTrades],
  );
  const holdoutStartDate = visibleDaySummaries[0]?.trade_date ?? null;
  const discoveryContinuationAvailable =
    (chartData?.market_price_curve?.length ?? 0) > 0 && pricePath.some((point) => point.segment === 'discovery');
  const insightError = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const handleQuestionSubmit = () => {
    const question = questionInput.trim();
    if (!question || !isComplete || askValidationQuestion.isPending) {
      return;
    }
    askValidationQuestion.mutate(
      { jobId, runId, question },
      {
        onSuccess: (data) => {
          setLatestAnswer(data);
          setQuestionInput('');
        },
      },
    );
  };

  const handleTogglePlayback = () => {
    if (maxIndex === 0) {
      return;
    }
    if (!isPlaying && playbackIndex >= maxIndex) {
      setPlaybackIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((current) => !current);
  };

  return (
    <div className={isFullMode ? 'space-y-5' : 'space-y-4'}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isLive ? 'default' : 'outline'}>
          {isLive ? 'Live Validation Telemetry' : isFullMode ? 'Replay Mode' : 'Build Preview'}
        </Badge>
        <Badge variant="secondary">
          {timeline.timeline_points.length} event{timeline.timeline_points.length === 1 ? '' : 's'}
        </Badge>
        <Badge variant={metricVariant(qualificationActive)}>
          Qualification{' '}
          {qualificationActive ? 'active' : qualificationActive === false ? 'inactive' : 'unknown'}
        </Badge>
        <Badge variant="secondary">Regime {currentRegime}</Badge>
        {botState ? <Badge variant="outline">Bot {formatEventType(botState)}</Badge> : null}
      </div>

      {isFullMode && isComplete ? (
        <ValidationInsightCard
          title="Playback Overview Insight"
          insight={overviewInsightQuery.data}
          isLoading={overviewInsightQuery.isLoading}
          error={
            overviewInsightQuery.isError
              ? insightError(
                  overviewInsightQuery.error,
                  'Failed to load playback overview insight.',
                )
              : null
          }
        />
      ) : null}

      {!isLive && timeline.timeline_points.length > 0 ? (
        <div className="space-y-2 rounded-md border bg-muted/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium">Playback Position</p>
              <p className="text-[11px] text-muted-foreground">
                Event {Math.min(playbackIndex + 1, timeline.timeline_points.length)} of{' '}
                {timeline.timeline_points.length}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isFullMode ? (
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((speed) => (
                    <Button
                      key={speed}
                      type="button"
                      variant={playbackSpeed === speed ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              ) : (
                <Badge variant="outline">Fixed 2.5x preview</Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleTogglePlayback} disabled={maxIndex === 0}>
                {isPlaying ? (
                  <Pause className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isPlaying ? 'Pause' : playbackIndex >= maxIndex ? 'Replay' : 'Play'}
              </Button>
            </div>
          </div>
          <Slider
            min={0}
            max={maxIndex}
            step={1}
            value={[playbackIndex]}
            onValueChange={(value) => {
              setIsPlaying(false);
              setPlaybackIndex(value[0] ?? 0);
            }}
          />
        </div>
      ) : null}

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">
              {discoveryContinuationAvailable
                ? 'Discovery to Holdout Price Replay'
                : 'Holdout Price Path'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {discoveryContinuationAvailable
                ? 'The chart begins with the final 90 discovery sessions, then continues into the holdout replay using persisted backtest and validation artifacts.'
                : 'Trade markers appear as telemetry arrives; the worker remains the execution source of truth.'}
            </p>
          </div>
          {currentTradeDate ? (
            <Badge variant="outline">Current session {currentTradeDate}</Badge>
          ) : null}
        </div>
        {pricePath.length > 0 ? (
          <div className={isFullMode ? 'h-[360px] w-full' : 'h-[240px] w-full'}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pricePath} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => value.toFixed(0)}
                  width={48}
                  domain={['auto', 'auto']}
                />
                <Tooltip />
                {holdoutStartDate && discoveryContinuationAvailable ? (
                  <ReferenceLine
                    x={holdoutStartDate}
                    stroke="var(--color-chart-2)"
                    strokeDasharray="4 3"
                  />
                ) : null}
                {currentTradeDate ? (
                  <ReferenceLine
                    x={currentTradeDate}
                    stroke="var(--color-chart-5)"
                    strokeDasharray="4 3"
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="closePrice"
                  name="Close"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Scatter
                  data={entryMarkers}
                  dataKey="price"
                  name="Entries"
                  fill="var(--color-chart-2)"
                  isAnimationActive={false}
                />
                <Scatter
                  data={exitMarkers}
                  dataKey="price"
                  name="Exits"
                  fill="var(--color-chart-5)"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Awaiting day-complete telemetry snapshots for chart playback.
          </div>
        )}
      </div>

      <div className={`grid gap-3 ${isFullMode ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2'}`}>
        <MetricCard
          label="Portfolio Value"
          value={formatCurrency(currentPortfolioValue)}
          detail={timeline.result ? `Final ${formatPct(timeline.result.total_return_pct)}` : undefined}
        />
        <MetricCard
          label="Cash"
          value={formatCurrency(currentCash)}
          detail={`Gross exposure ${formatCurrency(grossExposure)}`}
        />
        <MetricCard
          label="Observed Trades"
          value={String(visibleTrades.length)}
          detail={`${closedVisibleTrades.length} closed · ${timeline.timeline_points.length} events`}
        />
        <MetricCard
          label="Realized P&L"
          value={formatCurrency(realizedPnl)}
          detail={signalStrength != null ? `Signal strength ${signalStrength.toFixed(2)}` : undefined}
        />
      </div>

      {!isFullMode ? (
        <div className="rounded-md border bg-muted/10 p-3 text-xs text-muted-foreground">
          Open the `Trade Simulation` tab for the full event feed, decision-state inspection,
          comparison artifact, and validation Q&A.
        </div>
      ) : null}

      {isFullMode ? (
        <>
          <div className="grid gap-3 xl:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Validation Capital Path</p>
              <p className="text-[11px] text-muted-foreground">
                Portfolio value, cash, and exposure across the visible holdout replay.
              </p>
              {capitalTimeline.length > 0 ? (
                <div className="mt-3 h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={capitalTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={28}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                        width={52}
                      />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="portfolioValue" name="Portfolio" stroke="var(--color-chart-1)" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="cash" name="Cash" stroke="var(--color-chart-2)" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="grossExposure" name="Exposure" stroke="var(--color-chart-5)" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                  Capital telemetry will appear once day-complete snapshots are available.
                </div>
              )}
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Cumulative Realized P&L</p>
              <p className="text-[11px] text-muted-foreground">
                Closed-trade profit and loss accumulated through the visible holdout replay.
              </p>
              {realizedPnlTimeline.length > 0 ? (
                <div className="mt-3 h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realizedPnlTimeline}>
                      <defs>
                        <linearGradient id="validationRealizedPnl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={28}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                        width={52}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="cumulativePnl"
                        name="Cumulative realized P&L"
                        stroke="var(--color-chart-2)"
                        fill="url(#validationRealizedPnl)"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                  No closed trades are visible yet in this portion of the replay.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">Trade Outcome Profile</p>
            <p className="text-[11px] text-muted-foreground">
              Realized return by closed trade, with excursion context from MFE and MAE.
            </p>
            {tradeOutcomeSeries.length > 0 ? (
              <div className="mt-3 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tradeOutcomeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="tradeLabel"
                      tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                      width={48}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="realizedPnlPct" name="Realized %" fill="var(--color-chart-1)" isAnimationActive={false} />
                    <Line type="monotone" dataKey="mfePct" name="MFE %" stroke="var(--color-chart-2)" dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="maePct" name="MAE |%|" stroke="var(--color-chart-5)" dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                This replay window has not closed any holdout trades yet.
              </div>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              {isComplete ? (
                <ValidationInsightCard
                  title="Decision State Insight"
                  insight={decisionInsightQuery.data}
                  isLoading={decisionInsightQuery.isLoading}
                  error={
                    decisionInsightQuery.isError
                      ? insightError(
                          decisionInsightQuery.error,
                          'Failed to load decision-state insight.',
                        )
                      : null
                  }
                />
              ) : null}
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Current Decision State</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={metricVariant(qualificationActive)}>
                    Qualification {qualificationActive ? 'on' : qualificationActive === false ? 'off' : 'unknown'}
                  </Badge>
                  <Badge variant="secondary">Regime {currentRegime}</Badge>
                  {signalStrength != null ? (
                    <Badge variant="outline">Signal {signalStrength.toFixed(2)}</Badge>
                  ) : null}
                  {currentRiskState?.kelly_fraction != null ? (
                    <Badge variant="outline">Kelly {formatDecimal(currentRiskState.kelly_fraction)}</Badge>
                  ) : null}
                  {positionSizePct != null ? (
                    <Badge variant="outline">Size {formatPct(positionSizePct)}</Badge>
                  ) : null}
                  {currentRiskState?.initial_stop_pct != null ? (
                    <Badge variant="outline">Stop {formatPct(currentRiskState.initial_stop_pct)}</Badge>
                  ) : null}
                  {openPositionCount != null ? (
                    <Badge variant="outline">Open positions {openPositionCount.toFixed(0)}</Badge>
                  ) : null}
                </div>
                <Separator className="my-3" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    label="Active Stop"
                    value={formatCurrency(currentStopPrice)}
                    detail={activeBarsHeld != null ? `${activeBarsHeld.toFixed(0)} bars held` : undefined}
                  />
                  <MetricCard
                    label="Active Target"
                    value={formatCurrency(currentTargetPrice)}
                    detail={activeQuantity != null ? `${activeQuantity.toFixed(0)} shares` : undefined}
                  />
                  <MetricCard
                    label="Position Size"
                    value={formatPct(positionSizePct)}
                    detail={botState ? `Bot ${formatEventType(botState)}` : undefined}
                  />
                  <MetricCard
                    label="Unrealized P&L"
                    value={formatPct(activeUnrealizedPct)}
                    detail={openPositionCount === 0 ? 'No open position' : undefined}
                  />
                </div>
                <Separator className="my-3" />
                <p className="text-[11px] text-muted-foreground">
                  {currentPoint
                    ? `${formatEventType(currentPoint.event_type)} at ${formatTimestamp(currentPoint.event_time)}`
                    : 'No current event selected yet.'}
                </p>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Recent Event Feed</p>
              <div className="mt-3">
                <EventFeed events={recentEvents} />
              </div>
            </div>
          </div>

          {comparison ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Discovery vs Holdout Comparison</p>
                  <p className="text-[11px] text-muted-foreground">
                    Uses the same persisted validation run artifacts the playback panel is rendering.
                  </p>
                </div>
                {comparisonHeadline.validation_fill_policy ? (
                  <Badge variant="outline">
                    {String(comparisonHeadline.validation_fill_policy)}
                  </Badge>
                ) : null}
              </div>

              {isComplete ? (
                <ValidationInsightCard
                  title="Comparison Insight"
                  insight={comparisonInsightQuery.data}
                  isLoading={comparisonInsightQuery.isLoading}
                  error={
                    comparisonInsightQuery.isError
                      ? insightError(
                          comparisonInsightQuery.error,
                          'Failed to load comparison insight.',
                        )
                      : null
                  }
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Baseline Return"
                  value={formatPct(baselineReturn)}
                  detail={`Validation ${formatPct(validationReturn)}`}
                />
                <MetricCard
                  label="Sharpe Delta"
                  value={formatDecimal(sharpeDelta)}
                  detail="Holdout minus discovery"
                />
                <MetricCard
                  label="Trade Count Delta"
                  value={tradeDelta == null ? '—' : tradeDelta.toFixed(0)}
                  detail="Holdout minus discovery"
                />
              </div>

              <div className="grid gap-2">
                {Object.entries(comparison.narrative_drivers).map(([key, value]) => (
                  <div key={key} className="rounded-md bg-muted/20 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatEventType(key)}
                    </p>
                    <p className="mt-1 text-xs text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isComplete ? (
            <div className="space-y-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Ask This Validation Run</p>
                <p className="text-[11px] text-muted-foreground">
                  Questions are answered from the persisted playback and comparison artifacts for the
                  pinned run.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Ask a question about this validation run…"
                  value={questionInput}
                  onChange={(event) => setQuestionInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleQuestionSubmit();
                    }
                  }}
                  disabled={askValidationQuestion.isPending}
                />
                <Button
                  onClick={handleQuestionSubmit}
                  disabled={!questionInput.trim() || askValidationQuestion.isPending}
                >
                  {askValidationQuestion.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Ask
                </Button>
              </div>
              {askValidationQuestion.isError ? (
                <p className="text-xs text-destructive">
                  {insightError(
                    askValidationQuestion.error,
                    'Failed to answer validation question.',
                  )}
                </p>
              ) : null}
              {latestAnswer ? <ValidationAnswerCard answer={latestAnswer} /> : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
