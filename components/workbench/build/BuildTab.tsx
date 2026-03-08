'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import StrategySelector from './StrategySelector';
import type { BacktestParams } from './StrategySelector';
import ValidationSimulationCard from './ValidationSimulationCard';
import BacktestVerdict from './BacktestVerdict';
import BacktestResultsTabs from './BacktestResultsTabs';
import BacktestProgressStepper from './BacktestProgressStepper';
import {
  useRunBacktest,
  useBacktestJob,
  useBacktestExport,
  useBacktestTrades,
  useCancelBacktest,
  useBacktestList,
} from '@/hooks/useBacktestWorkflow';
import { useBacktestBackground } from '@/hooks/useBacktestBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { getBacktestDisplayLabel } from '@/lib/backtestDisplay';

type BuildState = 'idle' | 'submitting' | 'polling' | 'complete' | 'failed';

interface BuildTabProps {
  selectedStrategyId: string | null;
  onStrategyChange: (id: string) => void;
  onJobSubmitted: (jobId: string) => void;
  activeJobId: string | null;
  onReset: () => void;
}

export default function BuildTab({
  selectedStrategyId,
  onStrategyChange,
  onJobSubmitted,
  activeJobId,
  onReset,
}: BuildTabProps) {
  const { addJob, removeJob } = useBacktestBackground();

  // Initialize from parent-provided activeJobId (from localStorage restore or
  // in-session submission).  Start in 'polling' so the state machine can
  // transition to 'complete' once the first poll confirms the job is done,
  // rather than assuming 'complete' and triggering a premature export fetch.
  const [jobId, setJobId] = useState<string | null>(() => activeJobId);
  const [buildState, setBuildState] = useState<BuildState>(() =>
    activeJobId ? 'polling' : 'idle',
  );

  const runMutation = useRunBacktest();
  const cancelMutation = useCancelBacktest();
  const backtestListQuery = useBacktestList();
  const jobQuery = useBacktestJob(jobId);
  const completedBacktests = useMemo(
    () =>
      (backtestListQuery.data ?? [])
        .filter((job) => job.status === 'complete')
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
    [backtestListQuery.data],
  );
  const selectedSavedBacktest = useMemo(
    () => completedBacktests.find((job) => job.job_id === jobId) ?? null,
    [completedBacktests, jobId],
  );

  useEffect(() => {
    if (activeJobId === jobId) {
      return;
    }
    setJobId(activeJobId);
    setBuildState(
      activeJobId
        ? completedBacktests.some((job) => job.job_id === activeJobId)
          ? 'complete'
          : 'polling'
        : 'idle',
    );
  }, [activeJobId, completedBacktests, jobId]);

  const jobData = jobQuery.data as
    | {
        status?: string;
        progress_pct?: number | null;
        progress_phase?: string | null;
        error_message?: string | null;
      }
    | undefined;

  const isJobComplete = jobData?.status === 'complete';
  const isJobFailed = jobData?.status === 'failed';
  const isJobCancelled = jobData?.status === 'cancelled';

  // State machine: polling → complete | failed | cancelled
  useEffect(() => {
    if (buildState === 'polling' && isJobComplete) setBuildState('complete');
    if (buildState === 'polling' && isJobFailed) setBuildState('failed');
    if (buildState === 'polling' && isJobCancelled) setBuildState('failed');
  }, [buildState, isJobComplete, isJobFailed, isJobCancelled]);

  const exportQuery = useBacktestExport(jobId, buildState === 'complete');
  const tradesQuery = useBacktestTrades(jobId, buildState === 'complete');

  const handleSubmit = useCallback(
    async (params: BacktestParams) => {
      if (!selectedStrategyId) return;
      setBuildState('submitting');
      try {
        const result = await runMutation.mutateAsync({
          strategy_id: selectedStrategyId,
          ticker: params.ticker,
          start_date: params.startDate,
          end_date: params.endDate,
          initial_capital: params.initialCapital,
          profile: params.profile,
          validation_simulation_days: params.validationSimulationDays,
        });
        setJobId(result.job_id);
        setBuildState('polling');
        onJobSubmitted(result.job_id);
        // Register in localStorage so BacktestJobNotifier can track it if the
        // user navigates away before the job finishes.
        addJob(result.job_id, selectedStrategyId, params.ticker);
      } catch {
        setBuildState('failed');
      }
    },
    [selectedStrategyId, runMutation, onJobSubmitted, addJob],
  );


  const handleReset = useCallback(() => {
    // Remove from localStorage regardless of whether the job completed
    if (jobId) removeJob(jobId);
    setJobId(null);
    setBuildState('idle');
    onReset();
  }, [jobId, removeJob, onReset]);

  // Only grey-out/disable the form while the API call is in-flight.
  // Once the job is submitted (polling state), the form re-enables so the
  // user can queue additional backtests without waiting for this one.
  const isRunning = buildState === 'submitting';

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Backtest configuration with inline strategy details | Validation playback */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <StrategySelector
            selectedStrategyId={selectedStrategyId}
            onStrategyChange={onStrategyChange}
            onSubmit={(params) => void handleSubmit(params)}
            isSubmitting={isRunning}
            canReset={jobId !== null || buildState === 'failed'}
            onReset={handleReset}
          />
        </div>
        <div className="md:col-span-7">
          <ValidationSimulationCard
            jobId={jobId}
            jobLabel={selectedSavedBacktest ? getBacktestDisplayLabel(selectedSavedBacktest) : null}
            mode="compact"
          />
        </div>
      </div>

      {/* Submitting spinner — brief flash while the API call is in flight */}
      {buildState === 'submitting' && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium">Submitting backtest…</p>
          </CardContent>
        </Card>
      )}

      {/* Phase-by-phase progress stepper while the backtest is running */}
      {buildState === 'polling' && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <BacktestProgressStepper
                  phase={jobData?.progress_phase}
                  progressPct={jobData?.progress_pct}
                  status={jobData?.status}
                />
              </div>
              {jobId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  title="Cancel backtest"
                  disabled={cancelMutation.isPending}
                  onClick={() =>
                    cancelMutation.mutate(jobId, {
                      onSuccess: () => setBuildState('failed'),
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {buildState === 'failed' && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              {jobData?.error_message ?? runMutation.error?.message ?? 'Backtest failed. Please try again.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results — loading state while export fetches */}
      {buildState === 'complete' && exportQuery.isFetching && !exportQuery.data && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading backtest results…</p>
          </CardContent>
        </Card>
      )}

      {/* Results — error state if export fails */}
      {buildState === 'complete' && exportQuery.isError && !exportQuery.data && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              {exportQuery.error instanceof Error
                ? exportQuery.error.message
                : 'Failed to load results. Please reset and try again.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results — visible once export data is ready */}
      {buildState === 'complete' && exportQuery.data && (
        <>
          <BacktestVerdict report={exportQuery.data} />
          <BacktestResultsTabs jobId={jobId!} report={exportQuery.data} trades={tradesQuery.data ?? []} />
        </>
      )}
    </div>
  );
}
