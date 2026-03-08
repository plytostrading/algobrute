'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { StrategyDetail } from '@/types/api';

export const REGIME_LABELS: Record<string, string> = {
  LOW_VOL: 'Low Vol',
  NORMAL: 'Normal',
  ELEVATED_VOL: 'Elevated Vol',
  CRISIS: 'Crisis',
  '0': 'Low Vol',
  '1': 'Normal',
  '2': 'Elevated Vol',
  '3': 'Crisis',
};

interface StrategyDetailsContentProps {
  strategy: StrategyDetail | null | undefined;
  isLoading: boolean;
}

export default function StrategyDetailsContent({
  strategy,
  isLoading,
}: StrategyDetailsContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (!strategy) {
    return null;
  }

  return (
    <>
      <p className="text-xs leading-relaxed text-muted-foreground">{strategy.description}</p>

      {Object.keys(strategy.parameters).length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Parameters
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-md border p-2 text-xs">
            {Object.entries(strategy.parameters).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</span>
                <span className="font-mono-data font-bold">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(strategy.regime_qualifications).length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Regime Qualifications
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(strategy.regime_qualifications).map(([regime, qualified]) => (
              <Badge
                key={regime}
                variant={qualified ? 'default' : 'secondary'}
                className="text-[10px]"
              >
                {qualified ? '\u2713' : '\u2717'} {REGIME_LABELS[regime] ?? regime}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
