'use client';

/**
 * BotActivityMonitor
 *
 * Renders three live monitoring signals as a compact rolling sparkline chart,
 * giving the user a visceral sense that the bot's decision engine is running.
 *
 * The three signals are real computed values from the monitoring harness — not
 * decorative animations — so the chart reflects actual bot "cognitive" state:
 *
 *   SPRT LLR        (blue)   — evidence accumulator: climbs as skill is proven,
 *                              drifts negative when no edge is detectable.
 *   CUSUM score     (amber)  — drift detector: near-zero = stable, climbing =
 *                              performance deteriorating.
 *   Win-rate belief (violet) — Bayesian posterior mean, centered at 0.5.
 *                              Converges toward truth as trades accumulate.
 *
 * The chart buffers the last MAX_BUFFER polling snapshots (one per 60-second
 * interval). When the component first mounts with a report, the buffer is seeded
 * with 5 copies of the current values so the chart is never empty.
 *
 * When no monitoring harness exists yet (no trades), an extremely subtle idle
 * sine wave is rendered at low opacity with "awaiting first trades" messaging.
 */

import { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  type TooltipProps,
} from 'recharts';
import { Zap } from 'lucide-react';
import { useMonitoringReport } from '@/hooks/useMonitoringReport';
import type { MonitoringBotReport } from '@/types/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of polling snapshots retained in the rolling buffer. */
const MAX_BUFFER = 24;

/** SPRT LLR soft-cap for normalization (typical range ±3). */
const LLR_SCALE = 3;

/** CUSUM soft-cap for normalization (typical alert range 0–5). */
const CUSUM_SCALE = 5;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface SignalPoint {
  idx: number;
  /** SPRT LLR normalized to [-1, 1]. */
  llr: number;
  /** CUSUM sum normalized to [-1, 0] (inverted: high drift → negative). */
  cusum: number;
  /** Win-rate posterior mean centered around 0 via (posterior - 0.5) × 2. */
  posterior: number;
  /** Raw values stored for tooltip display. */
  raw_llr: number;
  raw_cusum: number;
  raw_posterior: number;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

function normLLR(v: number): number {
  return Math.max(-1, Math.min(1, v / LLR_SCALE));
}

/** Inverted: high cusum (deterioration) maps to negative chart value. */
function normCUSUM(v: number): number {
  return -Math.max(-1, Math.min(1, v / CUSUM_SCALE));
}

/** Centers 0–1 posterior around 0. */
function normPosterior(v: number): number {
  return (v - 0.5) * 2;
}

function toFixed3(v: number): number {
  return parseFloat(v.toFixed(3));
}

// ---------------------------------------------------------------------------
// Idle wave (rendered when no real data is available yet)
// ---------------------------------------------------------------------------

/**
 * Derives a stable per-bot seed from the first 8 chars of bot_id so the idle
 * wave is unique per bot but deterministic across renders.
 */
function botSeed(botId: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(botId.length, 8); i++) {
    h = (h * 31 + botId.charCodeAt(i)) & 0x7fffffff;
  }
  return h / 0x7fffffff; // normalize to [0, 1]
}

function getIdleData(botId: string): SignalPoint[] {
  const s = botSeed(botId);
  return Array.from({ length: MAX_BUFFER }, (_, i) => ({
    idx: i,
    llr: Math.sin(i * 0.45 + s * 6.2) * 0.07,
    cusum: Math.sin(i * 0.31 + s * 4.1 + 1.1) * 0.04,
    posterior: Math.sin(i * 0.52 + s * 5.3 + 2.3) * 0.06,
    raw_llr: 0,
    raw_cusum: 0,
    raw_posterior: 0.5,
  }));
}

// ---------------------------------------------------------------------------
// Status line
// ---------------------------------------------------------------------------

interface StatusLine {
  text: string;
  cls: string;
}

function deriveStatus(report: MonitoringBotReport): StatusLine {
  if (report.alerts.length > 0) {
    const n = report.alerts.length;
    return {
      text: `⚠ ${n} alert${n > 1 ? 's' : ''} — attention required`,
      cls: 'text-destructive',
    };
  }
  if (report.cusum_status === 'deteriorating') {
    return { text: 'Drift detected — harness elevated', cls: 'text-warning' };
  }
  if (report.cusum_status === 'elevated') {
    return { text: 'Minor drift — watchdog active', cls: 'text-warning' };
  }
  if (report.sprt_win_rate_decision === 'reject_h0') {
    return { text: 'Edge confirmed — strategy performing as expected', cls: 'text-success' };
  }
  if (report.sprt_win_rate_decision === 'reject_h1') {
    return { text: 'No statistical edge detected — evaluation ongoing', cls: 'text-destructive' };
  }
  return { text: 'Accumulating evidence — evaluation in progress…', cls: 'text-muted-foreground' };
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function SignalTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const pt = (payload[0] as { payload: SignalPoint }).payload;
  if (!pt || pt.raw_llr === 0 && pt.raw_cusum === 0 && pt.raw_posterior === 0.5) {
    // idle data — don't show tooltip
    return null;
  }

  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 shadow-md space-y-1">
      <div className="flex items-center justify-between gap-5">
        <span className="text-[10px]" style={{ color: 'var(--color-chart-1)' }}>SPRT LLR</span>
        <span className="font-mono-data text-[10px]">{pt.raw_llr.toFixed(3)}</span>
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-[10px]" style={{ color: 'var(--color-warning)' }}>CUSUM</span>
        <span className="font-mono-data text-[10px]">{pt.raw_cusum.toFixed(3)}</span>
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-[10px]" style={{ color: 'var(--color-chart-5)' }}>Win rate</span>
        <span className="font-mono-data text-[10px]">{(pt.raw_posterior * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend dot
// ---------------------------------------------------------------------------

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-[2px] w-4 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BotActivityMonitorProps {
  botId: string;
  /** True when bot.state is 'active' or 'ramping' — controls pulsing dot. */
  isActive: boolean;
  /** Show a legend row beneath the chart. Default false for compact accordion view. */
  showLegend?: boolean;
}

export default function BotActivityMonitor({
  botId,
  isActive,
  showLegend = false,
}: BotActivityMonitorProps) {
  const { data: report, dataUpdatedAt } = useMonitoringReport(botId);

  const [buffer, setBuffer] = useState<SignalPoint[]>([]);
  const initializedRef = useRef(false);
  const prevReportRef = useRef<MonitoringBotReport | undefined>(undefined);

  // ── Seed the buffer on first report arrival ─────────────────────────────
  // Seeding with 5 identical points creates a flat baseline that the subsequent
  // live points then deviate from — so the chart is never "empty" on mount.
  useEffect(() => {
    if (!report || initializedRef.current) return;
    initializedRef.current = true;

    const seed: SignalPoint[] = Array.from({ length: 5 }, (_, i) => ({
      idx: i,
      llr: toFixed3(normLLR(report.sprt_win_rate_llr)),
      cusum: toFixed3(normCUSUM(report.cusum_sum)),
      posterior: toFixed3(normPosterior(report.win_rate_posterior_mean)),
      raw_llr: report.sprt_win_rate_llr,
      raw_cusum: report.cusum_sum,
      raw_posterior: report.win_rate_posterior_mean,
    }));
    setBuffer(seed);
  }, [report]);

  // ── Append a new point each time the polling interval delivers fresh data ─
  useEffect(() => {
    if (!report || !initializedRef.current) return;
    if (report === prevReportRef.current) return;
    prevReportRef.current = report;

    setBuffer((prev) => {
      const next: SignalPoint[] = [
        ...prev,
        {
          idx: prev.length,
          llr: toFixed3(normLLR(report.sprt_win_rate_llr)),
          cusum: toFixed3(normCUSUM(report.cusum_sum)),
          posterior: toFixed3(normPosterior(report.win_rate_posterior_mean)),
          raw_llr: report.sprt_win_rate_llr,
          raw_cusum: report.cusum_sum,
          raw_posterior: report.win_rate_posterior_mean,
        },
      ];
      // Keep the tail, reindex sequentially
      return next.slice(-MAX_BUFFER).map((p, i) => ({ ...p, idx: i }));
    });
  }, [report]);

  // ── Derived display values ───────────────────────────────────────────────
  const hasData = buffer.length >= 2;
  const chartData: SignalPoint[] = hasData ? buffer : getIdleData(botId);
  const isIdle = !hasData;

  const secondsAgo =
    dataUpdatedAt != null ? Math.round((Date.now() - dataUpdatedAt) / 1000) : null;

  const status = report ? deriveStatus(report) : null;

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Live pulse — only shown for active bots with real data */}
          {isActive && !isIdle && (
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-35" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
          <Zap
            className={`h-3 w-3 shrink-0 ${
              isIdle ? 'text-muted-foreground/50' : 'text-primary'
            }`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Decision Engine
          </span>
        </div>

        <div className="flex items-center gap-3">
          {showLegend && (
            <div className="flex items-center gap-3">
              <LegendItem color="var(--color-chart-1)" label="SPRT" />
              <LegendItem color="var(--color-warning)" label="Drift" />
              <LegendItem color="var(--color-chart-5)" label="Win belief" />
            </div>
          )}
          {secondsAgo != null && (
            <span className="text-[10px] tabular-nums text-muted-foreground/60">
              {secondsAgo < 60
                ? `${secondsAgo}s`
                : `${Math.round(secondsAgo / 60)}m`}
            </span>
          )}
        </div>
      </div>

      {/* ── Chart ── */}
      <div
        className={`w-full h-24 transition-opacity duration-500 ${
          isIdle ? 'opacity-20' : 'opacity-100'
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 6, right: 2, left: 2, bottom: 6 }}
          >
            {/* Baseline */}
            <ReferenceLine
              y={0}
              stroke="var(--color-border)"
              strokeDasharray="3 2"
              strokeOpacity={0.7}
            />

            <Tooltip
              content={<SignalTooltip />}
              cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
            />

            {/* SPRT LLR — blue */}
            <Line
              type="monotone"
              dataKey="llr"
              stroke="var(--color-chart-1)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* CUSUM — amber */}
            <Line
              type="monotone"
              dataKey="cusum"
              stroke="var(--color-warning)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* Win-rate posterior — violet */}
            <Line
              type="monotone"
              dataKey="posterior"
              stroke="var(--color-chart-5)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Status / idle message ── */}
      {isIdle ? (
        <p className="text-[10px] italic text-muted-foreground/60">
          Monitoring harness active — awaiting first trades
        </p>
      ) : status ? (
        <p className={`text-[10px] leading-snug ${status.cls}`}>{status.text}</p>
      ) : null}
    </div>
  );
}
