'use client';

/**
 * OriginationStageCard — first row of the F.2 timeline.
 *
 * The originating dialogue stage is always complete by the time the
 * passport exists (the passport is itself the artefact of dialogue
 * completion).  So this card always renders in the "complete"
 * status, with the turn count + phases visited as the body content.
 *
 * Visualises the phase progression as an arrow-separated chain:
 *
 *   ENTRY → EXTRACTION → EXPLORATION → VALIDATION → DEPLOYMENT_DECISION ✓
 *
 * The optional "View Origination Replay" link below points back to
 * the `/originate` page with the `session=` query param set so the
 * customer can replay the conversation.
 */

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import StageCard from './StageCard';
import type { StrategyLifecycleView } from '@/types/api';

interface OriginationStageCardProps {
  view: StrategyLifecycleView;
}

function humanisePhase(phase: string): string {
  return phase.replace(/_/g, ' ').toUpperCase();
}

export default function OriginationStageCard({ view }: OriginationStageCardProps) {
  const phases = view.dialogue_completed_phases ?? [];
  return (
    <StageCard
      stageNumber={1}
      title="Originated via dialogue"
      subtitle="The conversation that produced this strategy"
      status="complete"
      testId="stage-origination"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>
            <span
              className="font-mono font-semibold text-foreground"
              data-testid="origination-turn-count"
            >
              {view.dialogue_turn_count}
            </span>
            {' '}
            {view.dialogue_turn_count === 1 ? 'turn' : 'turns'} ·{' '}
            <span className="font-mono font-semibold text-foreground">
              {phases.length}
            </span>
            {' '}
            {phases.length === 1 ? 'phase' : 'phases'} visited
          </span>
        </div>

        {phases.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3" data-testid="origination-phases">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono">
              {phases.map((phase, idx) => (
                <span key={`${phase}-${idx}`} className="flex items-center gap-2">
                  <span className="rounded bg-card px-2 py-0.5">
                    {humanisePhase(phase)}
                  </span>
                  {idx < phases.length - 1 && (
                    <span className="text-muted-foreground" aria-hidden>
                      →
                    </span>
                  )}
                  {idx === phases.length - 1 && (
                    <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>
                      ✓
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs">
          <Link
            href={`/originate?session=${encodeURIComponent(view.session_id)}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
            data-testid="origination-replay-link"
          >
            View Origination Replay →
          </Link>
        </div>
      </div>
    </StageCard>
  );
}
