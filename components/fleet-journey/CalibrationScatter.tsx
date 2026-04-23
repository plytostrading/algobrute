'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { BotCalibrationRow } from '@/hooks/useDashboard';

interface CalibrationScatterProps {
  rows: BotCalibrationRow[];
  axis?: 'sharpe' | 'winRate' | 'totalReturn';
  title?: string;
  height?: number;
}

/**
 * Predicted (backtest) vs realized (live) metric scatter. One point per
 * bot; diagonal = perfectly calibrated. Points below diagonal = over-
 * optimistic predictions. Color by trust_band from the calibration
 * response.
 */
export function CalibrationScatter({
  rows,
  axis = 'sharpe',
  title,
  height = 320,
}: CalibrationScatterProps) {
  const data = useMemo(() => {
    return rows
      .map((r) => {
        if (axis === 'sharpe') {
          return {
            x: r.predicted_sharpe,
            y: r.realized_sharpe,
            trust: r.trust_band,
            ticker: r.ticker,
            strategy: r.strategy_id,
          };
        }
        if (axis === 'winRate') {
          return {
            x: r.predicted_win_rate,
            y: r.realized_win_rate,
            trust: r.trust_band,
            ticker: r.ticker,
            strategy: r.strategy_id,
          };
        }
        return {
          x: r.predicted_total_return_pct,
          y: r.realized_total_return_pct,
          trust: r.trust_band,
          ticker: r.ticker,
          strategy: r.strategy_id,
        };
      })
      .filter((p): p is { x: number; y: number; trust: BotCalibrationRow['trust_band']; ticker: string; strategy: string } =>
        p.x !== null && p.y !== null,
      );
  }, [rows, axis]);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title ? `${title}: no calibration data` : 'No calibrated bots yet'}
      </div>
    );
  }

  const bounds = data.flatMap((p) => [p.x, p.y]);
  const lo = Math.min(...bounds) * 1.05;
  const hi = Math.max(...bounds) * 1.05;
  const byTrust = {
    calibrated: data.filter((d) => d.trust === 'calibrated'),
    accumulating: data.filter((d) => d.trust === 'accumulating'),
    drift: data.filter((d) => d.trust === 'drift'),
    no_evidence: data.filter((d) => d.trust === 'no_evidence'),
  };

  const axisLabel =
    axis === 'sharpe'
      ? 'Sharpe'
      : axis === 'winRate'
        ? 'Win rate'
        : 'Total return %';

  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name={`Predicted ${axisLabel}`}
              domain={[lo, hi]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{
                value: `Predicted ${axisLabel}`,
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={`Realized ${axisLabel}`}
              domain={[lo, hi]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{
                value: `Realized ${axisLabel}`,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <ZAxis range={[60, 60]} />
            <ReferenceLine
              segment={[
                { x: lo, y: lo },
                { x: hi, y: hi },
              ]}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                fontSize: 12,
              }}
              formatter={(v: unknown) => (typeof v === 'number' ? v.toFixed(2) : '—')}
              labelFormatter={(_value, payload) => {
                const p = payload?.[0]?.payload as { ticker?: string; strategy?: string } | undefined;
                return p ? `${p.ticker ?? ''} · ${p.strategy ?? ''}` : '';
              }}
            />
            <Scatter
              name="Calibrated"
              data={byTrust.calibrated}
              fill="#10b981"
              isAnimationActive={false}
            />
            <Scatter
              name="Accumulating"
              data={byTrust.accumulating}
              fill="#f59e0b"
              isAnimationActive={false}
            />
            <Scatter
              name="Drift"
              data={byTrust.drift}
              fill="#ef4444"
              isAnimationActive={false}
            />
            <Scatter
              name="No evidence"
              data={byTrust.no_evidence}
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.5}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
