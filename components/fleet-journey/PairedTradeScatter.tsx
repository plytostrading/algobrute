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
import type { PerTradeOutcome } from '@/hooks/useFleetJourney';

interface PairedTradeScatterProps {
  trades: PerTradeOutcome[];
  height?: number;
  title?: string;
}

/**
 * Shadow vs live paired-trade scatter. Each trade plotted as
 * (shadow_pnl, live_pnl). The diagonal line = no-platform-effect. Points
 * above diagonal = platform helped this trade; below = platform hurt.
 * Cloud shape reveals the distribution of platform effect across trades.
 */
export function PairedTradeScatter({
  trades,
  height = 320,
  title,
}: PairedTradeScatterProps) {
  const data = useMemo(
    () =>
      trades
        .filter((t) => t.shadow_pnl_pct !== null)
        .map((t) => ({
          x: t.shadow_pnl_pct as number,
          y: t.realized_pnl_pct,
          regime: t.entry_regime,
          ticker: t.ticker,
          strategy: t.strategy_id,
        })),
    [trades],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title
          ? `${title}: no paired trades`
          : 'No trades with shadow counterfactual'}
      </div>
    );
  }

  const allValues = data.flatMap((d) => [d.x, d.y]);
  const lo = Math.min(...allValues) * 1.05;
  const hi = Math.max(...allValues) * 1.05;
  const aboveDiagonal = data.filter((d) => d.y > d.x).length;
  const belowDiagonal = data.length - aboveDiagonal;

  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
      )}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span>
          <span className="font-mono font-semibold text-green-600">
            {aboveDiagonal}
          </span>{' '}
          trades helped by platform
        </span>
        <span>
          <span className="font-mono font-semibold text-destructive">
            {belowDiagonal}
          </span>{' '}
          trades hurt by platform
        </span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name="Shadow P&L"
              domain={[lo, hi]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
              label={{
                value: 'Shadow P&L (what baseline would have earned)',
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Live P&L"
              domain={[lo, hi]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
              label={{
                value: 'Live P&L (what you earned)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <ZAxis range={[20, 20]} />
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
              formatter={(v: unknown) => (typeof v === 'number' ? `${v.toFixed(2)}%` : '—')}
              labelFormatter={(_value, payload) => {
                const p = payload?.[0]?.payload as { ticker?: string; strategy?: string } | undefined;
                return p ? `${p.ticker ?? ''} · ${p.strategy ?? ''}` : '';
              }}
            />
            <Scatter
              data={data}
              fill="hsl(var(--primary))"
              fillOpacity={0.4}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
