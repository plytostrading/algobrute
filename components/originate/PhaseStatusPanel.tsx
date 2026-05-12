'use client';

/**
 * PhaseStatusPanel — right-side status display for the /originate page.
 *
 * Wave 1.B (F.1.B) — enriched status surface:
 *   - Phase progression card showing all 7 phases with past / current /
 *     future tone (carried forward from Wave 1.A).
 *   - Light-backtest indicator with four lifecycle states:
 *       NOT_STARTED  →  "Awaiting validation"
 *       IN_FLIGHT    →  "Running quick validation — should complete in
 *                        ~30s" + spinner
 *       COMPLETE     →  Verdict label + Sharpe metric
 *       FAILED       →  Error icon + failure reason
 */

import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  DialoguePhase,
  LightBacktestSnapshot,
  LightBacktestStatus,
  LightBacktestVerdict,
} from '@/hooks/useDialogueSession';

interface PhaseStatusPanelProps {
  phase: DialoguePhase | null;
  lightBacktest: LightBacktestSnapshot;
}

const PHASE_ORDER: DialoguePhase[] = [
  'ENTRY',
  'EXTRACTION',
  'EXPLORATION',
  'REFINEMENT',
  'VALIDATION',
  'DEPLOYMENT_DECISION',
  'ACCOMPANIMENT',
];

const PHASE_LABELS: Record<DialoguePhase, string> = {
  ENTRY: 'Entry',
  EXTRACTION: 'Extraction',
  EXPLORATION: 'Exploration',
  REFINEMENT: 'Refinement',
  VALIDATION: 'Validation',
  DEPLOYMENT_DECISION: 'Deployment Decision',
  ACCOMPANIMENT: 'Accompaniment',
};

function backtestIcon(status: LightBacktestStatus) {
  switch (status) {
    case 'IN_FLIGHT':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case 'COMPLETE':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'EXPIRED':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'NOT_STARTED':
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function backtestPrimaryLabel(status: LightBacktestStatus): string {
  switch (status) {
    case 'NOT_STARTED':
      return 'Awaiting validation';
    case 'IN_FLIGHT':
      return 'Running quick validation';
    case 'COMPLETE':
      return 'Validation complete';
    case 'FAILED':
      return 'Validation failed';
    case 'EXPIRED':
      return 'Validation expired';
  }
}

function backtestSecondaryLabel(snapshot: LightBacktestSnapshot): string | null {
  switch (snapshot.status) {
    case 'NOT_STARTED':
      return 'A quick proof-of-concept run before committing to a full deploy.';
    case 'IN_FLIGHT':
      return 'Should complete in ~30 seconds.';
    case 'COMPLETE':
      return null;
    case 'FAILED':
      return snapshot.failureReason ?? 'See dialogue for details.';
    case 'EXPIRED':
      return 'Result is older than the expiry window — re-run for a fresh verdict.';
    default:
      return null;
  }
}

const VERDICT_LABELS: Record<LightBacktestVerdict, string> = {
  LOOKS_PROMISING: 'Looks promising',
  MIXED_SIGNALS: 'Mixed signals',
  NOT_RECOMMENDED: 'Not recommended',
  INCONCLUSIVE: 'Inconclusive',
};

function verdictBadgeClass(v: LightBacktestVerdict): string {
  switch (v) {
    case 'LOOKS_PROMISING':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300';
    case 'MIXED_SIGNALS':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300';
    case 'NOT_RECOMMENDED':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'INCONCLUSIVE':
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function VerdictRow({ snapshot }: { snapshot: LightBacktestSnapshot }) {
  if (snapshot.status !== 'COMPLETE') return null;
  const verdict = snapshot.verdict;
  return (
    <div className="space-y-2 pt-1" data-testid="light-backtest-verdict-row">
      {verdict ? (
        <Badge
          variant="outline"
          className={cn('text-[10px]', verdictBadgeClass(verdict))}
          data-testid={`light-backtest-verdict-${verdict}`}
        >
          {VERDICT_LABELS[verdict]}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-[10px]">
          <HelpCircle className="h-3 w-3" />
          Verdict not surfaced
        </Badge>
      )}
      {snapshot.sharpe !== null && snapshot.sharpe !== undefined && (
        <div className="flex items-baseline gap-2 text-xs">
          <span className="text-muted-foreground">Sharpe</span>
          <span
            className="font-mono text-sm font-semibold"
            data-testid="light-backtest-sharpe"
          >
            {snapshot.sharpe.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function PhaseStatusPanel({ phase, lightBacktest }: PhaseStatusPanelProps) {
  const activeIndex = phase ? PHASE_ORDER.indexOf(phase) : -1;
  const secondary = backtestSecondaryLabel(lightBacktest);

  return (
    <div className="flex flex-col gap-4" data-testid="originate-status-panel">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dialogue Phase</CardTitle>
          <CardDescription className="text-xs">
            Each phase shapes a different question the agents will explore with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phase === null ? (
            <Badge variant="outline" data-testid="phase-chip-idle">
              Waiting to start
            </Badge>
          ) : (
            <Badge data-testid={`phase-chip-${phase}`}>{PHASE_LABELS[phase]}</Badge>
          )}

          <ol
            className="mt-4 flex flex-col gap-1.5"
            data-testid="phase-progression-list"
          >
            {PHASE_ORDER.map((p, idx) => {
              const isActive = idx === activeIndex;
              const isPast = activeIndex >= 0 && idx < activeIndex;
              return (
                <li
                  key={p}
                  data-testid={`phase-row-${p}`}
                  data-state={
                    isActive ? 'current' : isPast ? 'past' : 'future'
                  }
                  className={cn(
                    'flex items-center gap-2 text-xs',
                    isActive && 'font-semibold text-foreground',
                    !isActive && isPast && 'text-muted-foreground',
                    !isActive && !isPast && 'text-muted-foreground/60',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-1.5 rounded-full',
                      isActive && 'bg-primary',
                      !isActive && isPast && 'bg-muted-foreground/60',
                      !isActive && !isPast && 'bg-muted-foreground/20',
                    )}
                  />
                  {PHASE_LABELS[p]}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Light Backtest</CardTitle>
          <CardDescription className="text-xs">
            A quick proof-of-concept run before we commit a full deploy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div
            className="flex items-center gap-2 text-sm font-medium"
            data-testid={`light-backtest-status-${lightBacktest.status}`}
          >
            {backtestIcon(lightBacktest.status)}
            <span>{backtestPrimaryLabel(lightBacktest.status)}</span>
          </div>
          {secondary && (
            <p
              className="text-xs text-muted-foreground leading-relaxed"
              data-testid="light-backtest-secondary"
            >
              {secondary}
            </p>
          )}
          <VerdictRow snapshot={lightBacktest} />
        </CardContent>
      </Card>
    </div>
  );
}
