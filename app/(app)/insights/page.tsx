'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, BarChart3, PieChart, FlaskConical } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JournalTab from '@/components/insights/JournalTab';
import AnalyticsTab from '@/components/insights/AnalyticsTab';
import AttributionTab from '@/components/insights/AttributionTab';
import BacktestAnalysisTab from '@/components/insights/BacktestAnalysisTab';
import { useBacktestList } from '@/hooks/useBacktestWorkflow';

export default function InsightsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const jobParam = searchParams.get('job');
  const { data: backtests = [], isLoading: backtestsLoading } = useBacktestList();

  const completedJobs = useMemo(
    () =>
      backtests
        .filter((j) => j.status === 'complete')
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
    [backtests],
  );

  const hasValidJobParam = !!jobParam && completedJobs.some((j) => j.job_id === jobParam);
  const selectedJobId = hasValidJobParam ? jobParam : completedJobs[0]?.job_id ?? null;

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);

    if (completedJobs.length === 0) {
      if (params.has('job')) {
        params.delete('job');
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }
      return;
    }

    if (hasValidJobParam) return;

    params.set('job', completedJobs[0].job_id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [completedJobs, hasValidJobParam, pathname, router, searchParamsString]);

  function handleJobChange(value: string) {
    const nextJobId = value || null;
    const params = new URLSearchParams(searchParamsString);
    if (nextJobId) {
      params.set('job', nextJobId);
    } else {
      params.delete('job');
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
        <h2 className="text-lg font-semibold">Insights</h2>
          <p className="text-sm text-muted-foreground">Trade journal, analytics, performance attribution, and backtest analysis</p>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="job-select" className="text-sm whitespace-nowrap">Backtest</Label>
          <Select value={selectedJobId ?? ''} onValueChange={handleJobChange}>
            <SelectTrigger
              id="job-select"
              className="w-[260px] font-mono-data text-xs"
              disabled={backtestsLoading || completedJobs.length === 0}
            >
              <SelectValue placeholder="Select a completed backtest" />
            </SelectTrigger>
            <SelectContent>
              {backtestsLoading ? (
                <SelectItem value="__loading" disabled className="text-xs">
                  Loading completed backtests...
                </SelectItem>
              ) : completedJobs.length === 0 ? (
                <SelectItem value="__none" disabled className="text-xs">
                  No completed backtests available
                </SelectItem>
              ) : (
                completedJobs.map((j) => (
                  <SelectItem key={j.job_id} value={j.job_id} className="font-mono-data text-xs">
                    {j.ticker} · {j.start_date.slice(0, 10)} → {j.end_date.slice(0, 10)}
                    {j.sharpe_ratio != null ? ` · SR ${j.sharpe_ratio.toFixed(2)}` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!backtestsLoading && completedJobs.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No completed backtests yet.{' '}
          <Link href="/workbench" className="text-primary underline-offset-4 hover:underline">
            Run one in Workbench
          </Link>{' '}
          to unlock Journal, Analytics, and Attribution.
        </p>
      )}

      <Tabs defaultValue="journal" className="w-full">
        <TabsList>
          <TabsTrigger value="journal" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="attribution" className="gap-2">
            <PieChart className="h-4 w-4" />
            Attribution
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Backtest Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-6">
          <JournalTab jobId={selectedJobId} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab jobId={selectedJobId} />
        </TabsContent>
        <TabsContent value="attribution" className="mt-6">
          <AttributionTab jobId={selectedJobId} />
        </TabsContent>
        <TabsContent value="analysis" className="mt-6">
          <BacktestAnalysisTab jobId={selectedJobId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
