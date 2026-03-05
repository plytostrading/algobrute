'use client';

import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonitoringRegime, useHarnessStatus } from '@/hooks/useMonitoring';

interface MonitoringStatusCardProps {
  selectedBotId: string | null;
}

function regimeBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ready') return 'default';
  if (status === 'failed') return 'destructive';
  if (status === 'initializing') return 'secondary';
  return 'outline';
}

export default function MonitoringStatusCard({ selectedBotId }: MonitoringStatusCardProps) {
  const regimeQuery = useMonitoringRegime();
  const harnessQuery = useHarnessStatus(selectedBotId);

  const regime = regimeQuery.data;
  const harness = harnessQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Monitoring Status
        </CardTitle>
        <CardDescription>Regime engine and harness health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Regime status */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Regime Engine</span>
            {regimeQuery.isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : regimeQuery.isError ? (
              <Badge variant="destructive">Unavailable</Badge>
            ) : (
              <Badge variant={regimeBadgeVariant(regime?.status ?? 'pending')}>
                {(regime?.status ?? 'pending').toUpperCase()}
              </Badge>
            )}
          </div>

          {!regimeQuery.isLoading && !regimeQuery.isError && regime && (
            <div className="mt-2 space-y-1">
              {regime.status === 'ready' ? (
                <p className="text-xs text-muted-foreground">
                  Regime: <span className="font-mono-data">{regime.regime ?? 'Unknown'}</span>
                  {regime.conviction ? (
                    <>
                      {' '}
                      · Conviction:{' '}
                      <span className="font-mono-data">{regime.conviction}</span>
                    </>
                  ) : null}
                </p>
              ) : regime.error ? (
                <p className="text-xs text-destructive">{regime.error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Regime model is warming up.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Harness status for selected bot */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Selected Bot Harness</span>
            {!selectedBotId ? (
              <Badge variant="outline">No Bot Selected</Badge>
            ) : harnessQuery.isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : harnessQuery.isError ? (
              <Badge variant="destructive">Unavailable</Badge>
            ) : harness?.is_monitored ? (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Inactive
              </Badge>
            )}
          </div>

          {!selectedBotId ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Select a bot to inspect harness health.
            </p>
          ) : !harnessQuery.isLoading && !harnessQuery.isError && harness && !harness.is_monitored ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Harness not created yet. This usually means no passport is assigned yet or the scheduler has not processed this bot.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
