'use client';

/**
 * BacktestProgressStepper
 *
 * Shows the 8 pipeline stages of a running backtest with visual state:
 *   - Completed stages: green checkmark, struck-through label
 *   - Current stage:    animated spinner, bold label
 *   - Upcoming stages:  muted circle, muted label
 *
 * Phase identifiers mirror PHASE_ORDER / PHASE_LABELS / PHASE_PROGRESS from
 * src/algobrute/services/backtest_phases.py — kept in sync manually since
 * the backend exposes them through JobStatus.progress_phase.
 *
 * The progress bar uses `progress_pct` from the server when available, with
 * a fallback to the start-of-phase estimate if the server field is null.
 */

import { CheckCircle2, Loader2, Circle, Clock } from 'lucide-react';

// ---------------------------------------------------------------------------
// Phase constants — mirror of backtest_phases.py (kept in sync manually)
// ---------------------------------------------------------------------------

const PHASE_ORDER = [
  'loading_data',
  'regime_labeling',
  'cpcv',
  'monte_carlo',
  'bootstrap',
  'sensitivity_analysis',
  'risk_rules_and_stats',
  'assembling_passport',
] as const;

type PhaseId = (typeof PHASE_ORDER)[number];

const PHASE_LABELS: Record<string, string> = {
  loading_data: 'Loading market data',
  regime_labeling: 'Walk-forward regime labeling',
  cpcv: 'CPCV path validation',
  monte_carlo: 'Monte Carlo simulation',
  bootstrap: 'Stationary bootstrap CI',
  sensitivity_analysis: 'Sensitivity analysis',
  risk_rules_and_stats: 'Statistical validation & risk rules',
  assembling_passport: 'Assembling strategy passport',
};

/**
 * Approximate completion % at the START of each phase.
 * Used as fallback when server-side progress_pct is null.
 */
const PHASE_PROGRESS_FALLBACK: Record<string, number> = {
  loading_data: 5,
  regime_labeling: 20,
  cpcv: 40,
  monte_carlo: 65,
  bootstrap: 75,
  sensitivity_analysis: 78,
  risk_rules_and_stats: 88,
  assembling_passport: 96,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface BacktestProgressStepperProps {
  /** Current pipeline phase identifier from JobStatus.progress_phase */
  phase: string | null | undefined;
  /** Server-computed completion percentage from JobStatus.progress_pct */
  progressPct: number | null | undefined;
  /** Job status string from JobStatus.status (e.g. 'pending', 'running', 'complete') */
  status?: string | null;
}

export default function BacktestProgressStepper({
  phase,
  progressPct,
  status,
}: BacktestProgressStepperProps) {
  // ── Queued state: job is waiting for a worker, no phase has started yet ──
  if (status === 'pending' && phase == null) {
    return (
      <div className="flex flex-col gap-3 py-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Queued — waiting for worker…</span>
          <span className="text-xs tabular-nums text-muted-foreground">0%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-muted-foreground/30"
            style={{ width: '0%' }}
          />
        </div>
        <div className="mt-1 flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0 animate-pulse" />
          <span className="text-xs">
            Your backtest is queued and will start shortly.
          </span>
        </div>
      </div>
    );
  }

  const currentIdx =
    phase != null ? PHASE_ORDER.indexOf(phase as PhaseId) : -1;

  // Prefer server-provided pct; fall back to start-of-phase estimate; default 2%
  const displayPct =
    progressPct ??
    (phase != null ? (PHASE_PROGRESS_FALLBACK[phase] ?? 2) : 2);

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Header row: label + percentage */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Running backtest…</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.round(displayPct)}%
        </span>
      </div>

      {/* Smooth progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${displayPct}%` }}
        />
      </div>

      {/* Phase steps */}
      <ol className="mt-1 flex flex-col gap-1.5">
        {PHASE_ORDER.map((phaseId, idx) => {
          const isCompleted = currentIdx > idx;
          const isCurrent = currentIdx === idx;
          const label = PHASE_LABELS[phaseId];

          return (
            <li key={phaseId} className="flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
              )}
              <span
                className={
                  isCompleted
                    ? 'text-xs text-muted-foreground line-through'
                    : isCurrent
                      ? 'text-xs font-medium text-foreground'
                      : 'text-xs text-muted-foreground/50'
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
