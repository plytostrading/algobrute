'use client';

import { useMemo } from 'react';
import type { PerTradeOutcome } from '@/hooks/useFleetJourney';

interface TradeLevelRugPlotProps {
  trades: PerTradeOutcome[];
  height?: number;
  title?: string;
}

/**
 * Dense per-trade scatter. X = entry date, Y = holding period (days),
 * color = win/loss, size ∝ |realized_pnl_pct|. Shows temporal clustering
 * of good/bad outcomes, and whether the fleet holds winners vs cuts losers.
 */
export function TradeLevelRugPlot({
  trades,
  height = 280,
  title,
}: TradeLevelRugPlotProps) {
  const { data, xMin, xMax, yMax, sizeScale } = useMemo(() => {
    if (trades.length === 0) {
      return { data: [], xMin: 0, xMax: 1, yMax: 1, sizeScale: 1 };
    }
    const dates = trades.map((t) => new Date(t.entry_date).getTime());
    const xMin = Math.min(...dates);
    const xMax = Math.max(...dates);
    const yMax = Math.max(1, ...trades.map((t) => t.holding_days));
    const pnls = trades.map((t) => Math.abs(t.realized_pnl_pct));
    const maxPnl = Math.max(1, ...pnls);
    return {
      data: trades,
      xMin,
      xMax,
      yMax,
      sizeScale: maxPnl,
    };
  }, [trades]);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title ? `${title}: no trades` : 'No trades in window'}
      </div>
    );
  }

  const paddingL = 50;
  const paddingR = 10;
  const paddingT = 10;
  const paddingB = 30;
  const width = 800;
  const plotW = width - paddingL - paddingR;
  const plotH = height - paddingT - paddingB;
  const xSpan = Math.max(1, xMax - xMin);
  const toX = (ms: number) => paddingL + ((ms - xMin) / xSpan) * plotW;
  const toY = (d: number) => paddingT + (1 - d / yMax) * plotH;

  const firstDate = new Date(xMin).toISOString().slice(0, 10);
  const lastDate = new Date(xMax).toISOString().slice(0, 10);

  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
      )}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <text x={paddingL} y={12} fontSize={10} fill="hsl(var(--muted-foreground))">
          Holding period (days)
        </text>
        {/* axes */}
        <line
          x1={paddingL}
          y1={paddingT}
          x2={paddingL}
          y2={paddingT + plotH}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={0.5}
        />
        <line
          x1={paddingL}
          y1={paddingT + plotH}
          x2={width - paddingR}
          y2={paddingT + plotH}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={0.5}
        />
        {/* Y axis ticks */}
        {[0, Math.round(yMax / 4), Math.round(yMax / 2), Math.round((3 * yMax) / 4), yMax].map(
          (d) => (
            <g key={d}>
              <line
                x1={paddingL - 3}
                x2={paddingL}
                y1={toY(d)}
                y2={toY(d)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={0.5}
              />
              <text
                x={paddingL - 6}
                y={toY(d) + 3}
                fontSize={9}
                textAnchor="end"
                fill="hsl(var(--muted-foreground))"
              >
                {d}d
              </text>
            </g>
          ),
        )}
        {/* X axis endpoints */}
        <text
          x={paddingL}
          y={paddingT + plotH + 14}
          fontSize={9}
          fill="hsl(var(--muted-foreground))"
        >
          {firstDate}
        </text>
        <text
          x={width - paddingR}
          y={paddingT + plotH + 14}
          fontSize={9}
          textAnchor="end"
          fill="hsl(var(--muted-foreground))"
        >
          {lastDate}
        </text>
        {data.map((t, i) => {
          const cx = toX(new Date(t.entry_date).getTime());
          const cy = toY(t.holding_days);
          const r = Math.max(
            1.5,
            Math.min(6, 1.5 + (Math.abs(t.realized_pnl_pct) / sizeScale) * 4),
          );
          const color = t.win ? '#10b981' : '#ef4444';
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              fillOpacity={0.6}
              stroke={color}
              strokeWidth={0.5}
            >
              <title>
                {t.ticker} · {t.strategy_id} · {t.entry_date}→{t.exit_date} ·{' '}
                {t.realized_pnl_pct.toFixed(2)}%
              </title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
