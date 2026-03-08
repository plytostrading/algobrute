'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Play, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useBacktestChartData } from '@/hooks/useBacktestChartData';
import {
  useCancelValidationSimulation,
  useRunValidationSimulation,
  useValidationSimulationComparison,
  useValidationSimulationOverview,
  useValidationSimulationRuns,
  useValidationSimulationTimeline,
  useValidationSimulationTrades,
} from '@/hooks/useBacktestWorkflow';
import ValidationPlaybackPanel from './ValidationPlaybackPanel';

interface ValidationSimulationCardProps {
  jobId: string | null;
  jobLabel?: string | null;
  mode?: 'compact' | 'full';
}

function formatRunStatus(status: string | null | undefined): string {
  if (!status) {
    return 'Not started';
  }
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRunOptionLabel(createdAt: string, status: string): string {
  const created = new Date(createdAt);
  const createdLabel = Number.isNaN(created.getTime())
    ? createdAt
    : created.toLocaleString();
  return `${createdLabel} · ${formatRunStatus(status)}`;
}

export default function ValidationSimulationCard({
  jobId,
  jobLabel,
  mode = 'compact',
}: ValidationSimulationCardProps) {
  const isFullMode = mode === 'full';
  const overviewQuery = useValidationSimulationOverview(jobId, !!jobId);
  const runsQuery = useValidationSimulationRuns(jobId, !!jobId);
  const runMutation = useRunValidationSimulation();
  const cancelMutation = useCancelValidationSimulation();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const overview = overviewQuery.data;
  const latestRun = overview?.latest_run ?? null;
  const runs = useMemo(() => runsQuery.data?.runs ?? [], [runsQuery.data?.runs]);
  const latestRunMutable =
    latestRun?.status === 'pending' || latestRun?.status === 'running';
  const latestRunPrepared = latestRun?.status === 'prepared';

  useEffect(() => {
    if (!jobId) {
      setSelectedRunId(null);
      return;
    }
    if (latestRunMutable || latestRunPrepared) {
      setSelectedRunId(latestRun?.run_id ?? null);
      return;
    }
    if (runMutation.data?.run_id) {
      setSelectedRunId(runMutation.data.run_id);
      return;
    }
    if (selectedRunId && runs.some((run) => run.run_id === selectedRunId)) {
      return;
    }
    setSelectedRunId(latestRun?.run_id ?? runs[0]?.run_id ?? null);
  }, [
    jobId,
    latestRun?.run_id,
    latestRunMutable,
    latestRunPrepared,
    runMutation.data?.run_id,
    runs,
    selectedRunId,
  ]);

  const selectedRun = useMemo(() => {
    if ((latestRunMutable || latestRunPrepared) && latestRun) {
      return latestRun;
    }
    return runs.find((run) => run.run_id === selectedRunId) ?? latestRun ?? null;
  }, [latestRun, latestRunMutable, latestRunPrepared, runs, selectedRunId]);

  const runId = selectedRun?.run_id ?? null;
  const isActive =
    selectedRun?.status === 'pending' || selectedRun?.status === 'running';
  const isPrepared = selectedRun?.status === 'prepared';
  const hasTimelineArtifact =
    selectedRun?.timeline_available === true || selectedRun?.status === 'complete';

  const chartDataQuery = useBacktestChartData(jobId, overview?.validation_ready ?? false);
  const timelineQuery = useValidationSimulationTimeline(jobId, runId, {
    enabled: hasTimelineArtifact,
    live: isActive,
  });
  const tradesQuery = useValidationSimulationTrades(jobId, runId, {
    enabled: hasTimelineArtifact,
    live: isActive,
  });
  const comparisonQuery = useValidationSimulationComparison(
    jobId,
    runId,
    selectedRun?.status === 'complete',
  );

  const title = isFullMode ? 'Trade Simulation' : 'Validation Simulation';

  if (!jobId) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="max-w-xl text-center text-xs text-muted-foreground">
            Run or load a backtest with a reserved validation holdout to unlock the replay,
            decision telemetry, and discovery-versus-holdout simulation workspace.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (overviewQuery.isLoading && !overview) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Validation metadata is unavailable for this backtest.
          </p>
        </CardContent>
      </Card>
    );
  }

  const canLaunch =
    overview.validation_ready &&
    !latestRunMutable &&
    !latestRunPrepared &&
    !runMutation.isPending;

  let statusText = 'This backtest did not reserve a validation holdout window.';
  if (overview.validation_window && selectedRun === null) {
    statusText = overview.validation_ready
      ? 'Backtest discovery is complete. Launch the holdout simulation to hydrate replay, comparison, and validation telemetry artifacts.'
      : 'The holdout window is reserved; validation will unlock automatically when the discovery backtest completes.';
  } else if (selectedRun?.status === 'pending') {
    statusText = 'Validation run queued and waiting for worker pickup.';
  } else if (selectedRun?.status === 'running') {
    statusText = `Validation run is actively emitting telemetry (${selectedRun.progress_phase ?? 'running'}).`;
  } else if (selectedRun?.status === 'prepared') {
    statusText =
      'Validation lifecycle setup is staged. Playback artifacts will appear after worker execution begins.';
  } else if (selectedRun?.status === 'complete') {
    statusText =
      'Validation playback artifacts are complete and can be inspected alongside the discovery baseline.';
  } else if (selectedRun?.status === 'failed') {
    statusText = selectedRun.error_message ?? 'Validation run failed.';
  } else if (selectedRun?.status === 'cancelled') {
    statusText = 'Validation run cancelled.';
  }

  const showArtifactLoading =
    selectedRun !== null &&
    hasTimelineArtifact &&
    ((timelineQuery.isLoading && !timelineQuery.data) ||
      (tradesQuery.isLoading && !tradesQuery.data));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className={isFullMode ? 'pb-3' : 'pb-2'}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className={isFullMode ? 'text-base font-semibold' : 'text-sm font-medium'}>
              {title}
            </CardTitle>
            {jobLabel ? (
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{jobLabel}</p>
            ) : null}
            {overview.validation_window ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Reserved window: {overview.validation_window.days} days (
                {overview.validation_window.validation_start_date} →{' '}
                {overview.validation_window.validation_end_date})
              </p>
            ) : null}
          </div>
          {selectedRun ? (
            <Badge variant={isActive ? 'default' : 'outline'}>
              {formatRunStatus(selectedRun.status)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={isFullMode ? 'space-y-5' : 'space-y-4'}>
        <p className="text-sm text-muted-foreground">{statusText}</p>

        <div className="flex flex-wrap items-center gap-2">
          {selectedRun?.progress_phase ? (
            <Badge variant="secondary">{formatRunStatus(selectedRun.progress_phase)}</Badge>
          ) : null}
          {selectedRun?.latest_event_sequence != null ? (
            <Badge variant="secondary">
              {selectedRun.latest_event_sequence} persisted event
              {selectedRun.latest_event_sequence === 1 ? '' : 's'}
            </Badge>
          ) : null}
          {selectedRun?.comparison_available ? (
            <Badge variant="outline">Comparison persisted</Badge>
          ) : null}
          {chartDataQuery.data?.market_price_curve?.length ? (
            <Badge variant="outline">Discovery price history persisted</Badge>
          ) : null}
        </div>

        {runs.length > 0 ? (
          <div className={`grid gap-1.5 ${isFullMode ? 'lg:max-w-md' : 'sm:max-w-md'}`}>
            <p className="text-[11px] font-medium text-muted-foreground">Pinned run</p>
            <Select
              value={runId ?? undefined}
              onValueChange={(value) => setSelectedRunId(value)}
              disabled={latestRunMutable || latestRunPrepared || runs.length <= 1}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a validation run" />
              </SelectTrigger>
              <SelectContent>
                {runs.map((run) => (
                  <SelectItem key={run.run_id} value={run.run_id}>
                    {formatRunOptionLabel(run.created_at, run.status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {latestRunMutable || latestRunPrepared ? (
              <p className="text-[11px] text-muted-foreground">
                Playback is pinned to the active run until that lifecycle reaches a terminal state.
              </p>
            ) : null}
          </div>
        ) : null}

        {selectedRun?.error_message && selectedRun.status === 'failed' ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">{selectedRun.error_message}</p>
          </div>
        ) : null}

        {runsQuery.isError ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">
              {runsQuery.error instanceof Error
                ? runsQuery.error.message
                : 'Failed to load validation run history.'}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runMutation.mutate(jobId)} disabled={!canLaunch}>
            {runMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {latestRun?.status === 'failed' || latestRun?.status === 'cancelled'
              ? 'Retry Validation Run'
              : 'Launch Validation Run'}
          </Button>
          {selectedRun && (isActive || isPrepared) ? (
            <Button
              variant="outline"
              onClick={() =>
                cancelMutation.mutate({
                  jobId,
                  runId: selectedRun.run_id,
                })
              }
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              {isPrepared ? 'Discard Prepared Run' : 'Cancel Validation Run'}
            </Button>
          ) : null}
        </div>

        {overviewQuery.isError ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">
              {overviewQuery.error instanceof Error
                ? overviewQuery.error.message
                : 'Failed to load validation overview.'}
            </p>
          </div>
        ) : null}

        {showArtifactLoading ? (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Loading persisted playback artifacts for the pinned validation run.
            </p>
          </div>
        ) : null}

        {timelineQuery.isError ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">
              {timelineQuery.error instanceof Error
                ? timelineQuery.error.message
                : 'Failed to load validation playback timeline.'}
            </p>
          </div>
        ) : null}

        {tradesQuery.isError ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">
              {tradesQuery.error instanceof Error
                ? tradesQuery.error.message
                : 'Failed to load validation trade ledger.'}
            </p>
          </div>
        ) : null}

        {comparisonQuery.isError && selectedRun?.status === 'complete' ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">
              {comparisonQuery.error instanceof Error
                ? comparisonQuery.error.message
                : 'Failed to load validation comparison artifact.'}
            </p>
          </div>
        ) : null}

        {timelineQuery.data && tradesQuery.data ? (
          <ValidationPlaybackPanel
            jobId={jobId}
            runId={runId!}
            timeline={timelineQuery.data}
            trades={tradesQuery.data}
            comparison={comparisonQuery.data ?? null}
            chartData={chartDataQuery.data ?? null}
            isLive={isActive}
            isComplete={selectedRun?.status === 'complete'}
            mode={mode}
          />
        ) : selectedRun?.status === 'running' || selectedRun?.status === 'pending' ? (
          <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
            The worker has not emitted enough telemetry yet to hydrate the playback panel. This
            surface will switch into live mode automatically as soon as the first persisted
            artifacts are available.
          </div>
        ) : selectedRun?.status === 'complete' && !hasTimelineArtifact ? (
          <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
            This completed run has not produced playback artifacts yet.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
