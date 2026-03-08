'use client';

import { useMemo } from 'react';
import { ActivitySquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBacktestList } from '@/hooks/useBacktestWorkflow';
import { formatBacktestComputeTime, getBacktestDisplayLabel } from '@/lib/backtestDisplay';
import ValidationSimulationCard from './ValidationSimulationCard';

interface TradeSimulationTabProps {
  activeJobId: string | null;
  onActiveJobChange: (jobId: string | null) => void;
  onStrategyChange: (strategyId: string) => void;
}

export default function TradeSimulationTab({
  activeJobId,
  onActiveJobChange,
  onStrategyChange,
}: TradeSimulationTabProps) {
  const backtestListQuery = useBacktestList();
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
    () => completedBacktests.find((job) => job.job_id === activeJobId) ?? null,
    [activeJobId, completedBacktests],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md border bg-muted/30 p-2">
              <ActivitySquare className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Trade Simulation Workspace</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Load a completed backtest, launch or pin a validation run, and inspect the full
                holdout replay with the saved discovery baseline.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="grid gap-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Saved backtest</p>
            <Select
              value={selectedSavedBacktest?.job_id ?? undefined}
              onValueChange={(jobId) => {
                const job = completedBacktests.find((item) => item.job_id === jobId);
                onActiveJobChange(jobId);
                if (job) {
                  onStrategyChange(job.strategy_id);
                }
              }}
              disabled={completedBacktests.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a completed backtest…" />
              </SelectTrigger>
              <SelectContent>
                {completedBacktests.map((job) => {
                  const computeTime = formatBacktestComputeTime(job.compute_wall_seconds);
                  return (
                    <SelectItem key={job.job_id} value={job.job_id}>
                      {getBacktestDisplayLabel(job)}
                      {computeTime ? ` · ${computeTime}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border bg-muted/10 p-3 text-xs text-muted-foreground">
            {selectedSavedBacktest ? (
              <>
                <p className="font-medium text-foreground">
                  {getBacktestDisplayLabel(selectedSavedBacktest)}
                </p>
                <p className="mt-1">
                  Holdout reservation:{' '}
                  {selectedSavedBacktest.validation_window
                    ? `${selectedSavedBacktest.validation_window.days} days (${selectedSavedBacktest.validation_window.validation_start_date} → ${selectedSavedBacktest.validation_window.validation_end_date})`
                    : 'none'}
                </p>
              </>
            ) : activeJobId ? (
              <p>
                The current Build job is selected. Once it completes, it can also be recalled from
                the saved-backtest picker here.
              </p>
            ) : (
              <p>
                Select a completed backtest with a reserved holdout window to open the full trade
                simulation workspace.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ValidationSimulationCard
        jobId={activeJobId}
        jobLabel={selectedSavedBacktest ? getBacktestDisplayLabel(selectedSavedBacktest) : null}
        mode="full"
      />
    </div>
  );
}
