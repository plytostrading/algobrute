'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { MonitoringBotReport } from '@/types/api';

// ---------------------------------------------------------------------------
// Plain-language interpretation helpers
// ---------------------------------------------------------------------------

function sprtInterpretation(decision: string): { label: string; colorClass: string } {
  switch (decision) {
    case 'reject_h0':
      return { label: 'Skill confirmed — win rate above threshold', colorClass: 'text-green-600 dark:text-green-400' };
    case 'reject_h1':
      return { label: 'No skill detected — win rate below threshold', colorClass: 'text-destructive' };
    default:
      return { label: 'Testing in progress — inconclusive', colorClass: 'text-muted-foreground' };
  }
}

function cusumInterpretation(status: string): { label: string; colorClass: string } {
  switch (status) {
    case 'stable':
      return { label: 'Performance stable', colorClass: 'text-green-600 dark:text-green-400' };
    case 'elevated':
      return { label: 'Drift warning — monitor closely', colorClass: 'text-amber-600 dark:text-amber-400' };
    case 'deteriorating':
      return { label: 'Significant deterioration detected', colorClass: 'text-destructive' };
    default:
      return { label: status, colorClass: 'text-muted-foreground' };
  }
}

function bayesianInterpretation(mean: number): { label: string; colorClass: string } {
  if (mean > 0.55)
    return { label: `${(mean * 100).toFixed(1)}% — statistically favorable`, colorClass: 'text-green-600 dark:text-green-400' };
  if (mean < 0.45)
    return { label: `${(mean * 100).toFixed(1)}% — below expectation`, colorClass: 'text-destructive' };
  return { label: `${(mean * 100).toFixed(1)}% — neutral / inconclusive`, colorClass: 'text-muted-foreground' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MonitoringPanelProps {
  report: MonitoringBotReport | undefined;
  isLoading: boolean;
}

export default function MonitoringPanel({ report, isLoading }: MonitoringPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!report) {
    return (
      <p className="text-xs text-muted-foreground">
        No monitoring report available for this bot.
      </p>
    );
  }

  const sprt = sprtInterpretation(report.sprt_win_rate_decision);
  const cusum = cusumInterpretation(report.cusum_status);
  const bayesian = bayesianInterpretation(report.win_rate_posterior_mean);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* SPRT */}
      <div className="rounded-lg border p-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          SPRT Win Rate
        </p>
        <p className="text-xs font-mono font-semibold capitalize">
          {report.sprt_win_rate_decision.replace(/_/g, ' ')}
        </p>
        <p className={`text-[11px] leading-snug ${sprt.colorClass}`}>{sprt.label}</p>
      </div>

      {/* CUSUM */}
      <div className="rounded-lg border p-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          CUSUM
        </p>
        <p className="text-xs font-mono font-semibold capitalize">
          {report.cusum_status}
        </p>
        <p className={`text-[11px] leading-snug ${cusum.colorClass}`}>{cusum.label}</p>
      </div>

      {/* Bayesian */}
      <div className="rounded-lg border p-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Bayesian Win Rate
        </p>
        <p className={`text-xs font-mono font-semibold ${bayesian.colorClass}`}>
          {(report.win_rate_posterior_mean * 100).toFixed(1)}%
        </p>
        <p className={`text-[11px] leading-snug ${bayesian.colorClass}`}>{bayesian.label}</p>
      </div>
    </div>
  );
}
