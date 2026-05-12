'use client';

/**
 * PhaseAdvanceCard — agent-proposes / user-confirms phase-advance surface.
 *
 * Wave Q.2.B (B2) — wires the customer-facing side of the engine's
 * phase-advance lifecycle.  The dialogue uses an agent-proposes /
 * user-confirms progression model: agents emit ``phase_advance_proposal``
 * decisions when their per-phase exit criteria are satisfied; the
 * orchestrator aggregates proposals against the per-phase quorum rule
 * (``any`` or ``all``) and, when met, surfaces a :class:`PhaseAdvanceOffer`
 * on the next ``turn_complete`` event.  Before this card landed, the
 * frontend dropped that offer on the floor — the engine emitted the
 * proposal payload but no UI affordance let the customer act on it, so
 * phase progression silently stalled.
 *
 * Lifecycle:
 *   1. ``useDialogueSession`` populates ``phaseAdvanceOffer`` from the
 *      ``turn_complete`` event.
 *   2. The page renders this card sticky at the top of the chat panel
 *      while an offer is in flight.
 *   3. The customer clicks [Confirm advance]:
 *      - The hook buffers ``proposed_phase`` in
 *        ``pendingConfirmAdvanceToRef`` so the NEXT handshake carries
 *        ``confirm_advance_to``.
 *      - Local offer state clears immediately so the card disappears.
 *      - The engine sees the confirm on the next user input, applies the
 *        transition, and the dialogue continues in the new phase.
 *   4. OR the customer clicks [Not yet]:
 *      - Local offer state clears so the card disappears.
 *      - The engine continues to drive offers independently; if it
 *        re-surfaces an offer next turn, the card reappears.
 *
 * Visual language: matches the existing ``Screen3Card`` / ``PhaseStatusPanel``
 * shadcn primitives — bordered ``Card`` with a coloured left edge, an
 * icon + title + body, and two CTAs.  Uses the primary button variant for
 * Confirm (the affirmative path) and ghost for Not yet (the dismissal path).
 */

import { useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { PhaseAdvanceOffer } from '@/types/originate';
import { cn } from '@/lib/utils';

interface PhaseAdvanceCardProps {
  /** The in-flight offer surfaced by the hook.  Pass ``null`` when no
   *  offer is in flight — the component returns ``null`` in that case
   *  so callers can keep the JSX flat without a guard. */
  offer: PhaseAdvanceOffer | null;
  /** Fires the confirm path — the hook buffers the target phase into
   *  the next handshake and clears local offer state. */
  onConfirm: (targetPhase: string) => void;
  /** Fires the dismiss path — the hook clears local offer state; the
   *  engine will re-surface an offer next turn if appropriate. */
  onDismiss: () => void;
}

/** Map the lowercase wire value of ``DialoguePhase`` to a customer-facing
 *  Title Case label.  Mirrors the labels used in ``PhaseStatusPanel`` so
 *  the affordance reads the same way the right-side phase chip does. */
const PHASE_LABELS: Record<string, string> = {
  entry: 'Entry',
  extraction: 'Extraction',
  exploration: 'Exploration',
  refinement: 'Refinement',
  validation: 'Validation',
  deployment_decision: 'Deployment Decision',
  accompaniment: 'Accompaniment',
};

function formatPhase(wire: string): string {
  return PHASE_LABELS[wire.toLowerCase()] ?? wire;
}

/** Compose the "{agents} have signaled this phase is complete" copy.
 *  Splits between single-agent ("co_author has signaled...") and
 *  multi-agent ("co_author, detective have signaled...") phrasings so
 *  the grammar reads cleanly regardless of quorum size. */
function formatSupportingAgents(agents: readonly string[]): string {
  if (agents.length === 0) {
    return 'Agents have signaled this phase is complete.';
  }
  const joined = agents.join(', ');
  const verb = agents.length === 1 ? 'has' : 'have';
  return `${joined} ${verb} signaled this phase is complete.`;
}

export default function PhaseAdvanceCard({
  offer,
  onConfirm,
  onDismiss,
}: PhaseAdvanceCardProps) {
  const handleConfirm = useCallback(() => {
    if (!offer) return;
    onConfirm(offer.proposed_phase);
  }, [offer, onConfirm]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  if (offer === null) return null;

  const phaseLabel = formatPhase(offer.proposed_phase);
  const supportingCopy = formatSupportingAgents(offer.proposed_by);

  return (
    <Card
      data-testid="phase-advance-card"
      data-target-phase={offer.proposed_phase}
      className={cn('border-l-4 border-l-primary')}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <ArrowRight className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
          <div className="space-y-1">
            <CardTitle
              className="text-base"
              data-testid="phase-advance-title"
            >
              Ready to advance to {phaseLabel}?
            </CardTitle>
            <p
              className="text-xs text-muted-foreground"
              data-testid="phase-advance-supporting-agents"
            >
              {supportingCopy}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {offer.rationale && (
          <p
            className="text-sm leading-relaxed text-muted-foreground"
            data-testid="phase-advance-rationale"
          >
            {offer.rationale}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleConfirm}
            data-testid="phase-advance-confirm"
          >
            Confirm advance
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDismiss}
            data-testid="phase-advance-dismiss"
          >
            Not yet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
