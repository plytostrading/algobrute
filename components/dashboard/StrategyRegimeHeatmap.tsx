'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Grid3X3 } from 'lucide-react';
import {
  useStrategyRegimeAttribution,
  type StrategyRegimeCell,
} from '@/hooks/useDashboard';

/**
 * Strategy × regime attribution heatmap.
 *
 * One column per regime, one row per strategy. Cell intensity encodes
 * mean_pnl_pct (green = positive, red = negative, grey = no trades).
 * Cell label is n_trades — sample-size honesty so a single lucky trade
 * doesn't masquerade as edge.
 *
 * Empty-state: rendered sparse cells are labelled "—" so the chart
 * always paints even for new users with sparse attribution.
 */
export function StrategyRegimeHeatmap() {
  const { data, isLoading, isError, error } = useStrategyRegimeAttribution(365);
  const grid = useMemo(() => (data ? buildGrid(data.cells) : new Map()), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Strategy × regime performance
        </CardTitle>
        <CardDescription>
          Which of your strategies earns (or loses) in which regime. Green
          cells are positive mean P&amp;L, red are negative, grey is
          no-evidence. Numbers in each cell are trade counts — a single
          trade is noise, not signal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Failed to load attribution.'}
          </p>
        ) : !data || data.coverage_trades === 0 ? (
          <EmptyHeatmap />
        ) : (
          <HeatmapBody data={data} grid={grid} />
        )}
      </CardContent>
    </Card>
  );
}

function HeatmapBody({
  data,
  grid,
}: {
  data: NonNullable<ReturnType<typeof useStrategyRegimeAttribution>['data']>;
  grid: Map<string, StrategyRegimeCell>;
}) {
  const { strategies, regimes } = data;
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {data.coverage_trades} closed trades contributing · {data.total_strategies} strategies ·{' '}
        {data.total_regimes} regimes observed
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                Strategy \ Regime
              </th>
              {regimes.map((r) => (
                <th
                  key={r}
                  className="px-2 py-2 text-center font-medium text-xs uppercase tracking-wide text-muted-foreground"
                >
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy) => (
              <tr key={strategy} className="border-t">
                <td className="px-2 py-2 text-xs font-medium">{prettyStrategy(strategy)}</td>
                {regimes.map((regime) => {
                  const cell = grid.get(cellKey(strategy, regime));
                  return (
                    <td key={regime} className="px-1 py-1 text-center">
                      <HeatmapCell cell={cell} strategy={strategy} regime={regime} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legend />
    </div>
  );
}

function HeatmapCell({
  cell,
  strategy,
  regime,
}: {
  cell: StrategyRegimeCell | undefined;
  strategy: string;
  regime: string;
}) {
  if (!cell || cell.n_trades === 0) {
    return (
      <div className="flex h-14 w-full items-center justify-center rounded border border-dashed bg-muted/30 text-xs text-muted-foreground">
        —
      </div>
    );
  }

  const intensity = colorForMeanPnl(cell.mean_pnl_pct);
  const trustBadge = trustLevelLabel(cell.n_trades);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex h-14 w-full flex-col items-center justify-center rounded border text-xs"
          style={{ backgroundColor: intensity.bg, color: intensity.fg, borderColor: intensity.border }}
        >
          <div className="font-mono font-semibold">
            {cell.mean_pnl_pct >= 0 ? '+' : ''}
            {cell.mean_pnl_pct.toFixed(2)}%
          </div>
          <div className="text-[10px] opacity-70">
            n={cell.n_trades} · {(cell.win_rate * 100).toFixed(0)}% win
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <div className="font-semibold">
            {prettyStrategy(strategy)} × {regime}
          </div>
          <div>
            Mean P&amp;L: <span className="font-mono">{cell.mean_pnl_pct.toFixed(2)}%</span>
          </div>
          <div>
            Median P&amp;L: <span className="font-mono">{cell.median_pnl_pct.toFixed(2)}%</span>
          </div>
          <div>
            Total compounded: <span className="font-mono">{(cell.total_pnl_pct * 100).toFixed(2)}%</span>
          </div>
          <div>
            Sharpe: <span className="font-mono">{cell.sharpe_annualized.toFixed(2)}</span>
          </div>
          <div>
            Max DD: <span className="font-mono">{(cell.max_drawdown * 100).toFixed(1)}%</span>
          </div>
          <div>
            Trades: <span className="font-mono">{cell.n_trades}</span> ({cell.n_wins} wins) ·{' '}
            <span className="opacity-70">{trustBadge}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border bg-muted/20 p-2 text-xs">
      <span className="text-muted-foreground">Mean P&amp;L scale:</span>
      <div className="flex items-center gap-1">
        <span className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'hsl(0 75% 92%)' }} />
        <span>-2%</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'hsl(0 0% 94%)' }} />
        <span>0</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'hsl(142 76% 88%)' }} />
        <span>+2%</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'hsl(142 76% 70%)' }} />
        <span>+5%+</span>
      </div>
      <span className="text-muted-foreground">
        · n&lt;10 = limited sample, treat cautiously
      </span>
    </div>
  );
}

function EmptyHeatmap() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
      <Grid3X3 className="h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium">No attribution evidence yet</div>
      <div className="max-w-sm text-xs text-muted-foreground">
        Your bots haven&apos;t accumulated closed trades in this window. Once
        they do, this matrix will show which strategies are earning
        (or losing) in which regimes so you can read their edge by
        environment.
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function cellKey(strategy: string, regime: string): string {
  return `${strategy}|${regime}`;
}

function buildGrid(
  cells: StrategyRegimeCell[],
): Map<string, StrategyRegimeCell> {
  const m = new Map<string, StrategyRegimeCell>();
  cells.forEach((c) => m.set(cellKey(c.strategy_id, c.regime), c));
  return m;
}

function prettyStrategy(id: string): string {
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function trustLevelLabel(n: number): string {
  if (n < 10) return 'limited';
  if (n < 30) return 'moderate';
  return 'robust';
}

/**
 * Map mean_pnl_pct to a pastel red→grey→green colour.
 * Caps at ±5% for saturation so a single outlier doesn't wash the chart.
 */
function colorForMeanPnl(pct: number): {
  bg: string;
  fg: string;
  border: string;
} {
  const clamped = Math.max(-5, Math.min(5, pct));
  const intensity = Math.abs(clamped) / 5; // 0..1
  if (Math.abs(pct) < 0.05) {
    return {
      bg: 'hsl(0 0% 94%)',
      fg: 'hsl(0 0% 30%)',
      border: 'hsl(0 0% 85%)',
    };
  }
  if (pct > 0) {
    const lightness = 92 - 22 * intensity; // 92→70
    return {
      bg: `hsl(142 76% ${lightness}%)`,
      fg: `hsl(142 60% 22%)`,
      border: `hsl(142 50% ${lightness - 10}%)`,
    };
  }
  const lightness = 92 - 22 * intensity;
  return {
    bg: `hsl(0 75% ${lightness}%)`,
    fg: `hsl(0 60% 25%)`,
    border: `hsl(0 50% ${lightness - 10}%)`,
  };
}
