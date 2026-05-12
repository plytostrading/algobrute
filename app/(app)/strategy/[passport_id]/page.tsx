'use client';

/**
 * /strategy/[passport_id] — Phase Q Wave 1.C F.2.
 *
 * Per-strategy lifecycle timeline view backed by the engine's E.3
 * unified-lifecycle endpoint.  Renders five vertical stages
 * (dialogue → light → deep → deploy → live) from a single fetch.
 *
 * Polling cadence is governed by ``useStrategyLifecycle`` — active
 * deep jobs poll at 5s; everything else is on-demand.  See
 * :file:`hooks/useStrategyLifecycle.ts` for the predicate.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import StrategyHeader from '@/components/strategy-pipeline/StrategyHeader';
import OriginationStageCard from '@/components/strategy-pipeline/OriginationStageCard';
import LightBacktestStageCard from '@/components/strategy-pipeline/LightBacktestStageCard';
import DeepBacktestStageCard from '@/components/strategy-pipeline/DeepBacktestStageCard';
import DeploymentStageCard from '@/components/strategy-pipeline/DeploymentStageCard';
import LiveOperationStageCard from '@/components/strategy-pipeline/LiveOperationStageCard';
import { useStrategyLifecycle } from '@/hooks/useStrategyLifecycle';

export default function StrategyLifecyclePage() {
  const params = useParams();
  const rawPassportId = params?.passport_id;
  const passportId = Array.isArray(rawPassportId)
    ? rawPassportId[0]
    : rawPassportId;

  const { data, isLoading, isError, error } = useStrategyLifecycle(passportId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" data-testid="strategy-page-loading">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card data-testid="strategy-page-error">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium">Couldn&apos;t load this strategy</p>
          <p className="text-xs text-muted-foreground">
            {error?.message ?? 'Unexpected error while loading the lifecycle.'}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portfolio">
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="strategy-page-empty">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Strategy not found</p>
          <p className="max-w-md text-xs text-muted-foreground">
            No light-backtest passport matches{' '}
            <span className="font-mono">{passportId?.slice(0, 8) ?? '—'}…</span>{' '}
            for this account.  The passport may have been retired, or it may
            belong to a different user.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portfolio">
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="strategy-page">
      <StrategyHeader view={data} />
      <div className="flex flex-col gap-3" data-testid="strategy-timeline">
        <OriginationStageCard view={data} />
        <LightBacktestStageCard view={data} />
        <DeepBacktestStageCard view={data} />
        <DeploymentStageCard view={data} />
        <LiveOperationStageCard view={data} />
      </div>
    </div>
  );
}
