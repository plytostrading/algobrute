'use client';

import { Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BacktestExportMonteCarlo, BacktestExportBootstrap } from '@/types/api';

interface MonteCarloTabProps {
  mc: BacktestExportMonteCarlo | null;
  bootstrap: BacktestExportBootstrap | null;
}

export default function MonteCarloTab({ mc, bootstrap }: MonteCarloTabProps) {
  if (!mc && !bootstrap) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Monte Carlo analysis not available for this backtest.</p>;
  }

  const variants = mc ? Object.values(mc.variants) : [];

  return (
    <div className="flex flex-col gap-3">
      {mc && (
        <>
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
            <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-foreground">
              Monte Carlo permutation test with {mc.n_simulations.toLocaleString()} simulations.
              Overall p-value: <span className="font-mono-data font-semibold">{mc.overall_p_value.toFixed(3)}</span> —
              {mc.significant_at_95pct ? ' significant at 95% confidence (strategy shows real edge).' : ' not significant at 95% confidence (possible overfitting).'}
            </p>
          </div>

          {/* Variant significance table */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Variant</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Real Sharpe</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Null Mean</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">p-value</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sig. 95%</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.variant_code} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 text-xs">{v.variant_name}</td>
                    <td className="px-3 py-2 text-right font-mono-data text-xs font-semibold">{v.real_sharpe.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono-data text-xs text-muted-foreground">{v.null_sharpe_mean.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono-data text-xs">{v.p_value.toFixed(3)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={v.significant_at_95pct ? 'default' : 'secondary'} className="text-[10px]">
                        {v.significant_at_95pct ? '\u2713 Yes' : '\u2717 No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Bootstrap CI */}
      {bootstrap && (
        <div className="rounded-md border p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Stationary Bootstrap Sharpe CI ({(bootstrap.confidence_level * 100).toFixed(0)}%, {bootstrap.n_replicates.toLocaleString()} replicates)
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Observed Sharpe</span>
              <span className="font-mono-data font-bold text-sm">{bootstrap.observed_sharpe.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">CI Range</span>
              <span className="font-mono-data font-bold text-sm">[{bootstrap.ci_lower.toFixed(3)}, {bootstrap.ci_upper.toFixed(3)}]</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Excludes Zero</span>
              <span className={`font-mono-data font-bold text-sm ${bootstrap.ci_excludes_zero ? 'text-success' : 'text-warning'}`}>
                {bootstrap.ci_excludes_zero ? '\u2713 Yes' : '\u2717 No'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
