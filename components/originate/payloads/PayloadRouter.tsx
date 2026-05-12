'use client';

/**
 * PayloadRouter — discriminator + dispatch for structured payloads.
 *
 * Accepts either a raw wire-shape dict (from the WebSocket stream) or
 * a pre-tagged variant.  Routes to the matching renderer.  Returns
 * `null` when the shape can't be discriminated — the chat is the
 * source of truth for the conversational text, so a missing renderer
 * never blocks the dialogue.
 */

import type {
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

export default function PayloadRouter({ payload }: PayloadRouterProps) {
  const tagged: TaggedStructuredPayload | null = isTagged(payload)
    ? payload
    : tagPayload(payload);
  if (!tagged) return null;

  switch (tagged.kind) {
    case 'screen1':
      return <Screen1Card payload={tagged} />;
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
