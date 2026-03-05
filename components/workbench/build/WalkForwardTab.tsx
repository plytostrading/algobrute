'use client';

import { Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BacktestExportCPCV } from '@/types/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface WalkForwardTabProps {
  cpcv: BacktestExportCPCV | null;
}

export default function WalkForwardTab({ cpcv }: WalkForwardTabProps) {
  if (!cpcv) {
    return <p className="text-xs text-muted-foreground py-4 text-center">CPCV analysis not available for this backtest.</p>;
  }

  const chartData = cpcv.path_sharpes.map((s, i) => ({ path: i + 1, sharpe: parseFloat(s.toFixed(3)) }));
  const positivePaths = cpcv.path_sharpes.filter((s) => s > 0).length;

  const narrative = `Combinatorial Purged Cross-Validation across ${cpcv.n_paths} paths (${cpcv.n_splits} splits, ${cpcv.n_test_groups} test groups). Mean Sharpe ${cpcv.mean_sharpe.toFixed(2)} with ${(cpcv.path_consistency * 100).toFixed(0)}% path consistency. Overfit probability (PBO) ${(cpcv.pbo_probability * 100).toFixed(0)}% — ${cpcv.pbo_probability < 0.3 ? 'low overfit risk' : cpcv.pbo_probability < 0.5 ? 'moderate overfit risk' : 'high overfit risk'}.`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed text-foreground">{narrative}</p>
      </div>

      {/* Bar chart of path sharpes */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="path"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false} axisLine={false}
              label={{ value: 'Path #', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: 'var(--color-muted-foreground)' } }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false} axisLine={false}
              tickFormatter={(v: number) => v.toFixed(1)}
              domain={['auto', 'auto']}
              width={40}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '13px' }}
              formatter={(v: number) => [v.toFixed(3), 'Sharpe']}
              labelFormatter={(l: number) => `Path ${l}`}
            />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeDasharray="4 2" strokeWidth={0.75} />
            <Bar
              dataKey="sharpe"
              radius={[3, 3, 0, 0]}
              fill="var(--color-chart-2)"
              // individual bar coloring handled via CSS var fallback
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x rounded-md border">
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Mean Sharpe</span>
          <span className={`font-mono-data text-sm font-bold ${cpcv.mean_sharpe >= 1 ? 'text-success' : cpcv.mean_sharpe >= 0 ? '' : 'text-destructive'}`}>{cpcv.mean_sharpe.toFixed(2)}</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Path Consistency</span>
          <span className={`font-mono-data text-sm font-bold ${cpcv.path_consistency >= 0.7 ? 'text-success' : cpcv.path_consistency >= 0.5 ? 'text-warning' : 'text-destructive'}`}>{(cpcv.path_consistency * 100).toFixed(0)}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Overfit Risk (PBO)</span>
          <span className={`font-mono-data text-sm font-bold ${cpcv.pbo_probability < 0.3 ? 'text-success' : cpcv.pbo_probability < 0.5 ? 'text-warning' : 'text-destructive'}`}>{(cpcv.pbo_probability * 100).toFixed(0)}%</span>
        </div>
        <div className="px-3 py-2.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Min Sharpe</span>
          <span className={`font-mono-data text-sm font-bold ${cpcv.min_sharpe >= 0 ? '' : 'text-destructive'}`}>{cpcv.min_sharpe.toFixed(2)}</span>
        </div>
      </div>

      {/* Percentile row */}
      {cpcv.positive_paths_pct != null && (
        <p className="px-1 text-[11px] italic text-muted-foreground">
          {positivePaths}/{cpcv.n_paths} paths profitable ({cpcv.positive_paths_pct != null ? (cpcv.positive_paths_pct * 100).toFixed(0) : positivePaths}%) \u00b7
          P5/P50/P95: <span className="font-mono-data">{cpcv.sharpe_pct_5?.toFixed(2) ?? '\u2014'} / {cpcv.sharpe_pct_50?.toFixed(2) ?? '\u2014'} / {cpcv.sharpe_pct_95?.toFixed(2) ?? '\u2014'}</span> \u00b7
          Purge {cpcv.purge_days}d · Embargo {cpcv.embargo_days}d
        </p>
      )}

      {/* Regime badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">Regime source: {cpcv.regime_label_source}</Badge>
      </div>
    </div>
  );
}
