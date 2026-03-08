'use client';

/**
 * BacktestAnalysisTab
 *
 * Renders the full set of backtest results that appear in the Workbench
 * Build & Test tab once a pipeline finishes — verdict card, CPCV equity fan,
 * detailed metrics, CPCV path distribution, and Monte Carlo analysis.
 *
 * All data is fetched here (export report + trade records) so this tab is
 * self-contained and can be loaded for any completed backtest selected via
 * the Insights page job selector.
 */

import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BacktestVerdict from '@/components/workbench/build/BacktestVerdict';
import BacktestResultsTabs from '@/components/workbench/build/BacktestResultsTabs';
import RegimeDistributionCharts from '@/components/insights/RegimeDistributionCharts';
import SectionInsightCard from '@/components/insights/SectionInsightCard';
import { useBacktestExport, useBacktestTrades } from '@/hooks/useBacktestWorkflow';

interface BacktestAnalysisTabProps {
  jobId: string | null;
}

export default function BacktestAnalysisTab({ jobId }: BacktestAnalysisTabProps) {
  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
    error: reportErrorObj,
  } = useBacktestExport(jobId, !!jobId);

  const {
    data: trades = [],
    isLoading: tradesLoading,
  } = useBacktestTrades(jobId, !!jobId);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!jobId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-sm text-muted-foreground">
            Select a completed backtest above to view the full analysis.
          </p>
          <Link
            href="/workbench"
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Run a backtest in the Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (reportLoading || tradesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading backtest analysis…</p>
        </CardContent>
      </Card>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (reportError || !report) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {(reportErrorObj as Error | null)?.message ?? 'Failed to load analysis.'}
          </p>
          <Link
            href="/workbench"
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Open Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <BacktestVerdict report={report} />
      <BacktestResultsTabs jobId={jobId} report={report} trades={trades} />

      {/* Distribution Charts — only when we have enough trade records and
            by_regime trade analytics are populated (required by the insight
            payload builder; if absent the LLM call would have no data). */}
      {trades.length >= 4 && (
        <Card className="py-0 overflow-hidden">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-sm font-semibold">Regime Distribution Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {report.trade_analytics?.by_regime &&
              Object.keys(report.trade_analytics.by_regime).length > 0 && (
                <SectionInsightCard jobId={jobId} sectionKey="regime_distribution" className="mb-4" />
            )}
            <RegimeDistributionCharts trades={trades} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
