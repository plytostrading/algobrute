'use client';

/**
 * PayloadRouter — discriminator + dispatch for structured payloads.
 *
 * Accepts either a raw wire-shape dict (from the WebSocket stream) or
 * a pre-tagged variant.  Routes to the matching renderer.  Returns
 * `null` when the shape can't be discriminated — the chat is the
 * source of truth for the conversational text, so a missing renderer
 * never blocks the dialogue.
 *
 * Wave Q.2.B (B3) — accepts optional ``onOverrideInvestorType`` +
 * ``investorTypeOverride`` so Screen1Card can surface the customer-
 * facing InvestorType override affordance.  The router itself is
 * stateless; it forwards these straight through to ``Screen1Card``
 * and ignores them for every other payload kind.
 */

import type {
  InvestorType,
  RawStructuredPayload,
  TaggedStructuredPayload,
} from '@/types/originate';
import { tagPayload } from './discriminate';
import Screen1Card from './Screen1Card';
import Screen2Card from './Screen2Card';
import Screen3Card from './Screen3Card';
import ChallengeCard from './ChallengeCard';
import PreMortemCard from './PreMortemCard';
import DoctorAlertCard from './DoctorAlertCard';

export interface PayloadRouterProps {
  payload: RawStructuredPayload | TaggedStructuredPayload;
  /** Wave Q.2.B (B3) — forwarded to Screen1Card so the customer can
   *  correct the engine's inferred InvestorType.  Omit to render the
   *  card without the override affordance (e.g. static previews). */
  onOverrideInvestorType?: (investor_type: InvestorType) => void;
  /** Wave Q.2.B (B3) — currently-buffered override mirrored from
   *  ``useDialogueSession.investorTypeOverride``.  When non-null,
   *  Screen1Card renders the confirmation strip instead of the
   *  [Change ▾] trigger. */
  investorTypeOverride?: InvestorType | null;
}

function isTagged(
  p: RawStructuredPayload | TaggedStructuredPayload,
): p is TaggedStructuredPayload {
  return (
    typeof p === 'object' &&
    p !== null &&
    'kind' in p &&
    typeof (p as { kind: unknown }).kind === 'string'
  );
}

export default function PayloadRouter({
  payload,
  onOverrideInvestorType,
  investorTypeOverride,
}: PayloadRouterProps) {
  const tagged: TaggedStructuredPayload | null = isTagged(payload)
    ? payload
    : tagPayload(payload);
  if (!tagged) return null;

  switch (tagged.kind) {
    case 'screen1':
      return (
        <Screen1Card
          payload={tagged}
          onOverrideInvestorType={onOverrideInvestorType}
          pendingOverride={investorTypeOverride}
        />
      );
    case 'screen2':
      return <Screen2Card payload={tagged} />;
    case 'screen3':
      return <Screen3Card payload={tagged} />;
    case 'challenge':
      return <ChallengeCard payload={tagged} />;
    case 'pre_mortem':
      return <PreMortemCard payload={tagged} />;
    case 'doctor_alert':
      return <DoctorAlertCard payload={tagged} />;
  }
}
