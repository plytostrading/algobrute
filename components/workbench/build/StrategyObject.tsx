'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStrategyDetail } from '@/hooks/useStrategies';

const REGIME_LABELS: Record<string, string> = {
  LOW_VOL: 'Low Vol',
  NORMAL: 'Normal',
  ELEVATED_VOL: 'Elevated Vol',
  CRISIS: 'Crisis',
  '0': 'Low Vol',
  '1': 'Normal',
  '2': 'Elevated Vol',
  '3': 'Crisis',
};

interface StrategyObjectProps {
  selectedStrategyId: string | null;
}

export default function StrategyObject({ selectedStrategyId }: StrategyObjectProps) {
  const { data: strategy, isLoading } = useStrategyDetail(selectedStrategyId);

  if (!selectedStrategyId) {
    return (
      <Card className="flex h-full flex-col opacity-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Strategy Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground">Select a strategy to see details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col border-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {isLoading ? <Skeleton className="h-4 w-40" /> : strategy?.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : strategy ? (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">{strategy.description}</p>

            {/* Parameters */}
            {Object.keys(strategy.parameters).length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Parameters
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-2 text-xs">
                  {Object.entries(strategy.parameters).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-mono-data font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regime Qualifications */}
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
        ) : null}
      </CardContent>
    </Card>
  );
}
