'use client';

/**
 * PhaseStatusPanel — right-side status display for the /originate page.
 *
 * Wave 1.A (F.1.A) — SKELETON renderer:
 *   - Phase chip showing the current DialoguePhase enum value
 *     (ENTRY → EXTRACTION → … → ACCOMPANIMENT).
 *   - Light-backtest status indicator (NOT_STARTED / IN_FLIGHT /
 *     COMPLETE / FAILED) with an inline icon.
 *
 * F.1.B will add: phase progress bar, light-backtest metric chips
 * (return, sharpe, max DD), verdict display (continue / refine / abandon),
 * disclosures, and the Accept-CTA when DEPLOYMENT_DECISION is reached.
 */

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  DialoguePhase,
  LightBacktestSnapshot,
  LightBacktestStatus,
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
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    case 'COMPLETE':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'NOT_STARTED':
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

const BACKTEST_LABELS: Record<LightBacktestStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_FLIGHT: 'Running…',
  COMPLETE: 'Complete',
  FAILED: 'Failed',
};

export default function PhaseStatusPanel({ phase, lightBacktest }: PhaseStatusPanelProps) {
  const activeIndex = phase ? PHASE_ORDER.indexOf(phase) : -1;

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

          <ol className="mt-4 flex flex-col gap-1.5">
            {PHASE_ORDER.map((p, idx) => {
              const isActive = idx === activeIndex;
              const isPast = activeIndex >= 0 && idx < activeIndex;
              return (
                <li
                  key={p}
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
        <CardContent>
          <div
            className="flex items-center gap-2 text-sm"
            data-testid={`light-backtest-status-${lightBacktest.status}`}
          >
            {backtestIcon(lightBacktest.status)}
            <span>{BACKTEST_LABELS[lightBacktest.status]}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
