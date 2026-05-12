'use client';

/**
 * useDialogueSession — WebSocket lifecycle hook for the /originate page.
 *
 * Wave 1.B (F.1.B) — structured-payload routing:
 *   - Connection lifecycle + handshake (carried over from Wave 1.A).
 *   - Messages now carry an optional ``structured_payloads`` array — when a
 *     ``turn_complete`` event arrives with a non-null ``structured_payload``,
 *     the hook attaches it to the in-flight assistant message so the
 *     ``OriginateChat`` renders the matching card alongside the text.
 *   - Per-agent payloads — if a future engine version attaches a
 *     ``structured_payload`` on ``agent_response`` events, the hook appends
 *     each as its own message (one card per agent).  Today, the engine
 *     emits only ``{ event, agent_id, text }`` on ``agent_response``; the
 *     hook tolerates the field's absence.
 *   - Phase translation — the engine emits ``DialoguePhase`` as lowercase
 *     wire values (``"entry"``, ``"validation"``).  The hook normalises to
 *     the UPPERCASE TypeScript variant used by existing UI components.
 *   - Light-backtest snapshot updates from DoctorAlertPayload-style events
 *     (``failure_mode_materialized`` triggers + emerging metrics) feed the
 *     existing ``lightBacktest`` setter.
 *
 * Wave Q.2.B (B2) — phase-advance-offer surfacing.  ``turn_complete`` events
 * carry a ``phase_advance_offer`` whose shape mirrors the engine
 * :class:`algobrute.origination.dialogue.state.PhaseAdvanceOffer` 1:1.  The
 * hook exposes the latest offer + a ``confirmAdvance(target_phase)`` action
 * that buffers the customer's confirmation into the next handshake's
 * ``confirm_advance_to`` field, plus a ``dismissAdvanceOffer()`` action for
 * the "Not yet" path.  Before this work landed, the engine emitted the
 * proposal payload but no UI affordance let the customer act on it, so
 * phase progression silently stalled — see Bug B2 in the Phase Q.2 audit.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/api';
import {
  tagPayload,
} from '@/components/originate/payloads/discriminate';
import type {
  DialoguePhase,
  InvestorType,
  LightBacktestStatus,
  LightBacktestVerdict,
  PhaseAdvanceOffer,
  RawStructuredPayload,
  TaggedStructuredPayload,
} from '@/types/originate';

// Re-export the public type aliases so call sites that imported them from
// this hook in Wave 1.A keep working without changing imports.
export type {
  DialoguePhase,
  LightBacktestStatus,
  LightBacktestVerdict,
  PhaseAdvanceOffer,
} from '@/types/originate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface LightBacktestSnapshot {
  status: LightBacktestStatus;
  /** Optional verdict once the backtest completes. */
  verdict?: LightBacktestVerdict;
  /** Headline Sharpe surfaced from Screen3Payload.metrics.sharpe (when present). */
  sharpe?: number | null;
  /** Optional human-readable failure reason. */
  failureReason?: string;
}

/** A single chat-style message rendered in the transcript. */
export interface DialogueMessage {
  /** Stable client-side id; not the server's turn id. */
  id: string;
  /** Sender bucket: the user, an agent, or the system (connection events / errors). */
  role: 'user' | 'agent' | 'system';
  /** Free-form text. */
  text: string;
  /** Optional agent identifier (e.g. ``co_author``) when ``role === 'agent'``. */
  agentId?: string;
  /** Local timestamp for ordering / display. */
  createdAt: number;
  /** Optional structured payloads attached to this message — rendered as cards below the text. */
  structured_payloads?: TaggedStructuredPayload[];
  /** Wave Q.2.B (B4) — when the user attached an artifact alongside this
   *  message, the metadata is preserved so the message bubble can render
   *  a "Attached: filename (size)" badge after send.  Populated on user
   *  rows only (the engine never echoes the artifact back). */
  attachment_meta?: DialogueAttachmentMeta;
}

/** Wave Q.2.B (B4) — user-attached artifact metadata.
 *
 * Mirrors the subset of the engine's ``DialogueStreamHandshake``
 * ``artifact_content`` + ``artifact_source_type`` that's safe to keep
 * in client memory after send.  The full ``content`` field is held
 * transiently while preparing the handshake; only ``label`` + ``size`` +
 * ``sourceType`` survive into the rendered message badge.
 *
 * The five ``sourceType`` values mirror the engine's
 * :class:`algobrute.origination.tool_sanitization.ArtifactSourceType`
 * enum:
 *   - ``pinescript`` — TradingView Pine code paste.
 *   - ``pdf`` — research paper / book PDF upload (base64-encoded).
 *   - ``chart_annotation`` — chart screenshot (base64-encoded image).
 *   - ``video_transcript`` — reference URL (research / video link).
 *   - ``generic`` — Composer JSON or other free-form artifacts.
 */
export interface DialogueAttachmentMeta {
  /** Human-readable label — filename for file uploads, "PineScript paste"
   *  / "Reference URL" for text-input attachments. */
  label: string;
  /** Byte/character size for the badge subtitle. */
  size: number;
  /** Engine-facing source type, fed verbatim as ``artifact_source_type``. */
  sourceType: string;
}

/** Wave Q.2.B (B4) — payload of a one-shot attachment passed alongside a
 *  user input.  When ``content`` exceeds 200_000 characters, the hook
 *  rejects the send with an error (mirrors the engine's
 *  ``max_length=200_000`` Pydantic constraint).  The optional ``label``
 *  is rendered in the user-message badge after send. */
export interface DialogueAttachmentPayload {
  /** Sanitisation-bound text (may be base64 for binary artifacts). */
  content: string;
  /** Engine-facing ``artifact_source_type``; one of the
   *  ``ArtifactSourceType`` values (``pinescript`` / ``pdf`` /
   *  ``chart_annotation`` / ``video_transcript`` / ``generic``). */
  sourceType: string;
  /** Optional human-readable label for the post-send badge. */
  label?: string;
}

/** Wave Q.2.B (B4) — maximum artifact size in characters.  Mirrors the
 *  engine's ``DialogueStreamHandshake.artifact_content`` Pydantic
 *  ``max_length`` constraint (src/algobrute/api/routers/dialogue_stream.py:168).
 */
export const ARTIFACT_CONTENT_MAX_CHARS = 200_000;

/** First-message envelope on the WebSocket per backend handshake schema.
 *
 * Wave Q.2.B foundation — the engine's ``DialogueStreamHandshake``
 * Pydantic class (src/algobrute/api/routers/dialogue_stream.py) accepts
 * the optional fields below.  Each one unlocks a customer-facing
 * surface that subsequent Wave Q.2.B sub-agents own:
 *   - ``confirm_advance_to`` — B2 phase-advance confirmation flow
 *     (agent-proposes / user-confirms phase progression).
 *   - ``investor_type`` — B3 InvestorType override UI (the customer
 *     can confirm or correct the engine's inferred archetype).
 *   - ``artifact_content`` + ``artifact_source_type`` — B4 artifact
 *     attachment surface (PineScript paste, paper PDF upload, chart
 *     screenshot, Composer JSON).
 *
 * All fields are optional with omitted-defaults so existing handshake
 * callers keep working unchanged; B2/B3/B4 sub-agents add the UI
 * surfaces that populate them as the customer interacts.
 */
interface DialogueHandshake {
  token: string;
  user_input: string;
  session_id?: string;
  confirm_advance_to?: string;
  investor_type?: string;
  artifact_content?: string;
  artifact_source_type?: string;
}

/** Discriminated union over the streaming event types the backend emits. */
type DialogueEvent =
  | { event: 'turn_started'; session_id: string; current_phase: string }
  | { event: 'agent_dispatched'; agent_ids: string[] }
  | {
      event: 'agent_response';
      agent_id: string;
      text: string;
      /** Reserved — future engine versions may attach per-agent payloads. */
      structured_payload?: RawStructuredPayload | null;
    }
  | {
      event: 'turn_complete';
      session_id: string;
      output_text: string;
      current_phase: string;
      turn_count: number;
      structured_payload: RawStructuredPayload | null;
      // Wave Q.2.B (B2) — tightened from ``Record<string, unknown> | null``
      // to the mirrored engine Pydantic shape so the hook + consuming
      // UI can rely on the field names rather than untyped key access.
      phase_advance_offer: PhaseAdvanceOffer | null;
    }
  | { event: 'error'; detail: string };

export interface UseDialogueSessionReturn {
  sessionId: string | null;
  phase: DialoguePhase | null;
  lightBacktest: LightBacktestSnapshot;
  messages: DialogueMessage[];
  connectionState: ConnectionState;
  /** Last error message surfaced from the backend (close codes, etc.). */
  errorDetail: string | null;
  /** Send a user message. Opens the socket on first send if needed.
   *
   *  Wave Q.2.B (B4) — accepts an optional one-shot ``attachment`` that
   *  is forwarded as ``artifact_content`` + ``artifact_source_type``
   *  on the next handshake.  Attachments are NOT remembered across
   *  sends — every subsequent ``sendUserInput`` call carries no
   *  artifact unless the caller passes a fresh attachment.  A content
   *  string longer than ``ARTIFACT_CONTENT_MAX_CHARS`` rejects the
   *  send and surfaces an error on the session.
   */
  sendUserInput: (input: string, attachment?: DialogueAttachmentPayload) => void;
  /** Wave Q.2.B (B2) — the most recent phase-advance offer surfaced by
   *  the engine on a ``turn_complete`` event.  ``null`` when no offer is
   *  in flight (either the engine never proposed one this turn, or the
   *  customer has dismissed / confirmed the previous one).  Consumed by
   *  the ``PhaseAdvanceCard`` UI affordance. */
  phaseAdvanceOffer: PhaseAdvanceOffer | null;
  /** Wave Q.2.B (B2) — confirm an advance to the supplied phase.  The
   *  target_phase value is populated as ``confirm_advance_to`` on the
   *  NEXT handshake the hook sends (i.e. on the customer's next user
   *  input).  The offer is cleared from local state immediately so the
   *  card disappears as soon as the confirm button is pressed.
   *
   *  ``target_phase`` is the lowercase ``DialoguePhase.value`` wire
   *  string (e.g. ``"validation"``) as carried by
   *  ``phaseAdvanceOffer.proposed_phase``. */
  confirmAdvance: (target_phase: string) => void;
  /** Wave Q.2.B (B2) — dismiss the in-flight offer without confirming.
   *  The card disappears until the next ``turn_complete`` carries a
   *  fresh offer.  Mirrors the "Not yet" path of the agent-proposes /
   *  user-confirms flow. */
  dismissAdvanceOffer: () => void;
  /** Wave Q.2.B (B3) — pending one-shot ``investor_type`` override.  When
   *  non-null, the value is buffered for attachment to the NEXT
   *  handshake's ``investor_type`` field.  ``null`` once the override
   *  has been drained into the handshake (one-shot — the engine
   *  persists the corrected InvestorType into ``DialogueState`` so
   *  subsequent turns don't need to re-send it). */
  investorTypeOverride: InvestorType | null;
  /** Wave Q.2.B (B3) — record an investor-type override.  Buffered into
   *  ``pendingInvestorTypeOverrideRef`` and surfaced on
   *  ``investorTypeOverride`` so the UI can render a "We'll re-classify
   *  on your next message as ${label}" confirmation.  The buffered
   *  value lands on the NEXT handshake's ``investor_type`` field
   *  (drained inside ``ws.onopen``) and is cleared after a single use
   *  — subsequent ``sendUserInput`` calls carry no ``investor_type``
   *  unless the customer overrides again. */
  setInvestorTypeOverride: (investor_type: InvestorType) => void;
}

// ---------------------------------------------------------------------------
// Wire-value → TypeScript-enum translation
// ---------------------------------------------------------------------------

const PHASE_WIRE_TO_TS: Record<string, DialoguePhase> = {
  entry: 'ENTRY',
  extraction: 'EXTRACTION',
  exploration: 'EXPLORATION',
  refinement: 'REFINEMENT',
  validation: 'VALIDATION',
  deployment_decision: 'DEPLOYMENT_DECISION',
  accompaniment: 'ACCOMPANIMENT',
};

function normalisePhase(wire: string | null | undefined): DialoguePhase | null {
  if (!wire) return null;
  // Tolerate already-uppercase inputs (e.g. test stubs / future contracts).
  if (Object.values(PHASE_WIRE_TO_TS).includes(wire as DialoguePhase)) {
    return wire as DialoguePhase;
  }
  return PHASE_WIRE_TO_TS[wire.toLowerCase()] ?? null;
}

// ---------------------------------------------------------------------------
// Close-code → user-message translation
// ---------------------------------------------------------------------------

const CLOSE_CODE_MESSAGES: Record<number, string> = {
  4001: 'Your session has expired. Please sign in again.',
  4003: 'You do not have access to this dialogue session.',
  4400: 'The request to start a dialogue was malformed. Please reload and try again.',
  4404: 'Dialogue session not found.',
  4410: 'This dialogue session has been archived and is no longer available.',
  4429: 'You are sending messages too quickly. Please wait a moment and try again.',
  4402: 'You have reached your monthly LLM cost budget. Try again next billing cycle.',
  4503: 'The dialogue service is overloaded. Please retry in a few seconds.',
  4500: 'The dialogue service encountered an internal error. Please try again.',
};

function describeCloseCode(code: number, reason: string): string {
  const friendly = CLOSE_CODE_MESSAGES[code];
  if (friendly) return friendly;
  if (reason) return `Dialogue connection closed (${code}): ${reason}`;
  return `Dialogue connection closed unexpectedly (code ${code}).`;
}

// ---------------------------------------------------------------------------
// WebSocket URL builder
// ---------------------------------------------------------------------------

function buildWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/dialogue/stream`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const HEARTBEAT_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 1_500;
const MAX_RECONNECT_ATTEMPTS = 1;

function makeMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useDialogueSession(): UseDialogueSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<DialoguePhase | null>(null);
  const [lightBacktest, setLightBacktest] = useState<LightBacktestSnapshot>({
    status: 'NOT_STARTED',
  });
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  /** Wave Q.2.B (B2) — the latest phase-advance offer the engine has
   *  surfaced on a ``turn_complete`` event.  ``null`` when no offer is
   *  currently in flight. */
  const [phaseAdvanceOffer, setPhaseAdvanceOffer] =
    useState<PhaseAdvanceOffer | null>(null);
  /** Wave Q.2.B (B3) — the pending investor-type override surfaced to
   *  the UI for confirmation ("We'll re-classify on your next message
   *  as ${label}").  Mirrored by ``pendingInvestorTypeOverrideRef``;
   *  the state is what UI consumers read, the ref is what
   *  ``ws.onopen`` drains. */
  const [investorTypeOverride, setInvestorTypeOverrideState] =
    useState<InvestorType | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const pendingInputRef = useRef<string | null>(null);
  /** Wave Q.2.B (B4) — one-shot attachment buffered by ``sendUserInput``
   *  for the next handshake send.  Cleared after a single use so
   *  subsequent ``sendUserInput`` calls without an attachment do not
   *  re-send the previous artifact. */
  const pendingAttachmentRef = useRef<DialogueAttachmentPayload | null>(null);
  /** Wave Q.2.B (B2) — one-shot ``confirm_advance_to`` populated by the
   *  user clicking [Confirm advance] in ``PhaseAdvanceCard``.  Drained
   *  into the next handshake on ``ws.onopen`` and cleared so it doesn't
   *  re-fire on subsequent turns. */
  const pendingConfirmAdvanceToRef = useRef<string | null>(null);
  /** Wave Q.2.B (B3) — one-shot ``investor_type`` override populated by
   *  ``setInvestorTypeOverride`` when the customer corrects the engine's
   *  inferred archetype on a ``Screen1Payload``.  Drained into the next
   *  handshake on ``ws.onopen`` and cleared so a transient reconnect
   *  doesn't re-fire the override on a subsequent turn (the engine
   *  persists the corrected ``InvestorType`` into ``DialogueState``
   *  so the override is intentionally one-shot per click). */
  const pendingInvestorTypeOverrideRef = useRef<InvestorType | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  /** Tracks the id of the most-recent agent message so per-agent
   *  payload events can attach to it without creating a phantom row. */
  const lastAgentMessageIdRef = useRef<string | null>(null);

  const appendMessage = useCallback(
    (msg: Omit<DialogueMessage, 'id' | 'createdAt'>) => {
      const id = makeMessageId();
      setMessages((prev) => [
        ...prev,
        { id, createdAt: Date.now(), ...msg },
      ]);
      if (msg.role === 'agent') {
        lastAgentMessageIdRef.current = id;
      }
      return id;
    },
    [],
  );

  /** Attach a structured payload to the most-recent agent message, or
   *  emit a fresh placeholder agent message when none exists yet.  Used
   *  by `agent_response` events that carry a per-agent payload. */
  const attachPayloadToLastAgent = useCallback(
    (payload: TaggedStructuredPayload, agentId?: string) => {
      const lastId = lastAgentMessageIdRef.current;
      if (!lastId) {
        // No agent message in flight — attach to a fresh placeholder so
        // the card still renders.
        const id = makeMessageId();
        setMessages((prev) => [
          ...prev,
          {
            id,
            createdAt: Date.now(),
            role: 'agent',
            text: '',
            agentId,
            structured_payloads: [payload],
          },
        ]);
        lastAgentMessageIdRef.current = id;
        return;
      }
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== lastId) return m;
          return {
            ...m,
            structured_payloads: [...(m.structured_payloads ?? []), payload],
          };
        }),
      );
    },
    [],
  );

  /** Fold a tagged payload into the light-backtest snapshot when it
   *  carries lifecycle info (Screen3 verdict + metrics; DoctorAlert
   *  failure_mode_materialized → FAILED transition). */
  const foldPayloadIntoBacktest = useCallback(
    (payload: TaggedStructuredPayload) => {
      if (payload.kind === 'screen3') {
        const sharpe = payload.metrics.sharpe;
        setLightBacktest({
          status: 'COMPLETE',
          verdict: payload.verdict,
          sharpe: sharpe ?? null,
        });
        return;
      }
      if (payload.kind === 'doctor_alert') {
        // A Doctor alert tagged `failure_mode_materialized` is the
        // engine's "light backtest failed" surrogate per F.1.B spec.
        if (payload.trigger === 'failure_mode_materialized') {
          setLightBacktest({
            status: 'FAILED',
            failureReason: payload.message ?? 'Failure mode materialised.',
          });
        }
      }
    },
    [],
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(
    (ws: WebSocket) => {
      stopHeartbeat();
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ event: 'ping' }));
          } catch {
            // Best-effort; if the send fails the close handler will fire shortly.
          }
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    [stopHeartbeat],
  );

  const handleEvent = useCallback(
    (raw: string) => {
      let evt: DialogueEvent;
      try {
        evt = JSON.parse(raw) as DialogueEvent;
      } catch {
        appendMessage({
          role: 'system',
          text: 'Received a malformed event from the dialogue stream.',
        });
        return;
      }

      switch (evt.event) {
        case 'turn_started': {
          sessionIdRef.current = evt.session_id;
          setSessionId(evt.session_id);
          const ph = normalisePhase(evt.current_phase);
          if (ph) setPhase(ph);
          // Reset the per-turn light-backtest in-flight indicator when
          // a fresh turn begins so the right-side panel reflects the
          // session's new state.  Only flip if we're currently
          // NOT_STARTED — established results carry through.
          setLightBacktest((prev) => {
            if (
              prev.status === 'COMPLETE' ||
              prev.status === 'FAILED' ||
              prev.status === 'IN_FLIGHT'
            ) {
              return prev;
            }
            return prev;
          });
          break;
        }
        case 'agent_dispatched':
          appendMessage({
            role: 'system',
            text: `Dispatching agents: ${evt.agent_ids.join(', ')}`,
          });
          // If the VALIDATION-phase reviewers (cross_examiner +
          // pre_mortem_guide) are being dispatched, the engine is
          // about to fire a light backtest — mark IN_FLIGHT so the
          // status panel shows the spinner.
          if (
            evt.agent_ids.includes('cross_examiner') ||
            evt.agent_ids.includes('pre_mortem_guide')
          ) {
            setLightBacktest((prev) =>
              prev.status === 'COMPLETE' || prev.status === 'FAILED'
                ? prev
                : { status: 'IN_FLIGHT' },
            );
          }
          break;
        case 'agent_response': {
          const msgId = makeMessageId();
          // Per-agent payload — tagged if present.
          const tagged = evt.structured_payload
            ? tagPayload(evt.structured_payload)
            : null;
          setMessages((prev) => [
            ...prev,
            {
              id: msgId,
              createdAt: Date.now(),
              role: 'agent',
              text: evt.text,
              agentId: evt.agent_id,
              structured_payloads: tagged ? [tagged] : undefined,
            },
          ]);
          lastAgentMessageIdRef.current = msgId;
          if (tagged) foldPayloadIntoBacktest(tagged);
          break;
        }
        case 'turn_complete': {
          const ph = normalisePhase(evt.current_phase);
          if (ph) setPhase(ph);
          const tagged = evt.structured_payload
            ? tagPayload(evt.structured_payload)
            : null;

          if (evt.output_text) {
            const msgId = makeMessageId();
            setMessages((prev) => [
              ...prev,
              {
                id: msgId,
                createdAt: Date.now(),
                role: 'agent',
                text: evt.output_text,
                structured_payloads: tagged ? [tagged] : undefined,
              },
            ]);
            lastAgentMessageIdRef.current = msgId;
          } else if (tagged) {
            // No text but a payload — render the card on its own.
            attachPayloadToLastAgent(tagged);
          }
          if (tagged) foldPayloadIntoBacktest(tagged);
          // Wave Q.2.B (B2) — surface the phase-advance offer when the
          // engine emits one; clear a stale offer when no offer is
          // surfaced this turn (e.g. the user already confirmed and
          // the engine acknowledged by advancing).  Setting to the new
          // offer or to null is a single assignment so the
          // PhaseAdvanceCard re-renders cleanly between turns.
          setPhaseAdvanceOffer((prev) => {
            if (evt.phase_advance_offer) {
              return evt.phase_advance_offer;
            }
            if (prev !== null) {
              return null;
            }
            return prev;
          });
          break;
        }
        case 'error':
          setErrorDetail(evt.detail);
          appendMessage({ role: 'system', text: `Error: ${evt.detail}` });
          break;
      }
    },
    [appendMessage, attachPayloadToLastAgent, foldPayloadIntoBacktest],
  );

  const openSocket = useCallback(
    (userInput: string) => {
      const token = getAccessToken();
      if (!token) {
        setErrorDetail('Not authenticated — please sign in to start a dialogue.');
        setConnectionState('error');
        return;
      }

      const url = buildWsUrl();
      if (!url) return;

      setConnectionState((prev) =>
        prev === 'reconnecting' ? 'reconnecting' : 'connecting',
      );
      setErrorDetail(null);

      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        const handshake: DialogueHandshake = {
          token,
          user_input: userInput,
        };
        const currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
          handshake.session_id = currentSessionId;
        }
        // Wave Q.2.B (B2) — drain the one-shot pending confirm-advance
        // into the handshake's ``confirm_advance_to``.  Cleared after
        // draining so a transient reconnect doesn't double-confirm an
        // already-accepted offer (the reconnect path replays
        // ``pendingInputRef`` text but B2 confirms are intentionally
        // one-shot per send).
        const pendingConfirm = pendingConfirmAdvanceToRef.current;
        if (pendingConfirm) {
          handshake.confirm_advance_to = pendingConfirm;
          pendingConfirmAdvanceToRef.current = null;
        }
        // Wave Q.2.B (B4) — drain the one-shot pending attachment into
        // the handshake.  After draining the ref is cleared so an
        // auto-reconnect after a transient close does not re-attach an
        // already-consumed artifact (the reconnect path only replays
        // ``pendingInputRef`` text; artifact-bearing turns are
        // intentionally one-shot per send).
        const pendingAttachment = pendingAttachmentRef.current;
        if (pendingAttachment) {
          handshake.artifact_content = pendingAttachment.content;
          handshake.artifact_source_type = pendingAttachment.sourceType;
          pendingAttachmentRef.current = null;
        }
        // Wave Q.2.B (B3) — drain the one-shot pending InvestorType
        // override into the handshake's ``investor_type``.  Cleared
        // after draining + the public ``investorTypeOverride`` state
        // resets to null so the UI confirmation strip disappears once
        // the override has been sent.  The engine persists the
        // corrected InvestorType into DialogueState, so subsequent
        // turns don't need to re-send it (one-shot per explicit
        // customer action — not on every handshake).
        const pendingInvestorTypeOverride =
          pendingInvestorTypeOverrideRef.current;
        if (pendingInvestorTypeOverride) {
          handshake.investor_type = pendingInvestorTypeOverride;
          pendingInvestorTypeOverrideRef.current = null;
          setInvestorTypeOverrideState(null);
        }
        try {
          ws.send(JSON.stringify(handshake));
        } catch {
          setErrorDetail('Failed to send dialogue handshake.');
        }
        startHeartbeat(ws);
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        handleEvent(event.data);
      };

      ws.onerror = () => {
        // Browsers intentionally don't expose error details; we surface a
        // generic message and rely on the subsequent ``close`` event for the
        // real reason (close code + reason string).
        setConnectionState('error');
      };

      ws.onclose = (event: CloseEvent) => {
        stopHeartbeat();
        socketRef.current = null;

        // Normal close after a turn completes (code 1000, no error).
        if (event.code === 1000 || event.code === 1005) {
          setConnectionState('disconnected');
          return;
        }

        const detail = describeCloseCode(event.code, event.reason);
        setErrorDetail(detail);
        appendMessage({ role: 'system', text: detail });

        // Don't retry on policy-violation close codes — they're terminal
        // for this user/session and a retry will be rejected the same way.
        const terminalCodes = new Set([4001, 4003, 4404, 4410, 4402]);
        if (terminalCodes.has(event.code)) {
          setConnectionState('error');
          return;
        }

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionState('error');
          return;
        }
        reconnectAttemptsRef.current += 1;
        setConnectionState('reconnecting');

        // Only auto-retry if we have an input to resend; otherwise wait for
        // the next user-initiated send.
        const queued = pendingInputRef.current;
        pendingInputRef.current = null;
        if (queued) {
          setTimeout(() => {
            openSocket(queued);
          }, RECONNECT_DELAY_MS);
        } else {
          setConnectionState('disconnected');
        }
      };
    },
    [appendMessage, handleEvent, startHeartbeat, stopHeartbeat],
  );

  const sendUserInput = useCallback(
    (input: string, attachment?: DialogueAttachmentPayload) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Wave Q.2.B (B4) — validate the attachment size before doing any
      // state work.  A rejected send surfaces an error and skips the
      // socket entirely; the user message is not appended so the
      // transcript stays clean of half-sent turns.
      if (attachment) {
        if (attachment.content.length > ARTIFACT_CONTENT_MAX_CHARS) {
          setErrorDetail(
            `Attachment too large — ${attachment.content.length.toLocaleString()} ` +
              `characters exceeds the ${ARTIFACT_CONTENT_MAX_CHARS.toLocaleString()} ` +
              `character limit.  Trim or split the artifact and try again.`,
          );
          appendMessage({
            role: 'system',
            text:
              `Attachment rejected — ${attachment.content.length.toLocaleString()} ` +
              `characters exceeds the ${ARTIFACT_CONTENT_MAX_CHARS.toLocaleString()} ` +
              `character limit.`,
          });
          return;
        }
      }

      // Wave Q.2.B (B4) — derive the post-send badge meta from the
      // attachment payload.  The full ``content`` itself is held only
      // long enough to ride the handshake; the message bubble keeps a
      // lightweight ``{label, size, sourceType}`` triple for the badge.
      const attachmentMeta: DialogueAttachmentMeta | undefined = attachment
        ? {
            label: attachment.label ?? 'Attached artifact',
            size: attachment.content.length,
            sourceType: attachment.sourceType,
          }
        : undefined;

      appendMessage({
        role: 'user',
        text: trimmed,
        attachment_meta: attachmentMeta,
      });

      // Phase L.1 design: one socket = one turn. Always open a fresh socket
      // per user input, sending the handshake (which carries user_input) on
      // open. session_id is preserved across turns via sessionIdRef so the
      // backend can resume the conversation.
      //
      // Wave Q.2.B (B4) — when an attachment is supplied, stash it in
      // the one-shot ref so the next ``onopen`` drains it into the
      // handshake.  The ref is cleared inside ``onopen`` so subsequent
      // ``sendUserInput`` calls without a fresh attachment will not
      // re-send the previous artifact.
      pendingInputRef.current = trimmed;
      pendingAttachmentRef.current = attachment ?? null;
      openSocket(trimmed);
    },
    [appendMessage, openSocket],
  );

  /** Wave Q.2.B (B2) — confirm the in-flight phase-advance offer.  The
   *  target_phase string is buffered into ``pendingConfirmAdvanceToRef``
   *  so it lands on the NEXT handshake (when the user types their next
   *  message + ``sendUserInput`` opens a fresh socket).  The local
   *  ``phaseAdvanceOffer`` state is cleared immediately so the card
   *  disappears the moment the customer clicks Confirm. */
  const confirmAdvance = useCallback((target_phase: string) => {
    if (!target_phase) return;
    pendingConfirmAdvanceToRef.current = target_phase;
    setPhaseAdvanceOffer(null);
  }, []);

  /** Wave Q.2.B (B2) — dismiss the in-flight phase-advance offer without
   *  confirming.  The next offer to arrive on a ``turn_complete`` will
   *  re-surface the card; the engine continues to drive the offer
   *  lifecycle independently of the dismiss action. */
  const dismissAdvanceOffer = useCallback(() => {
    setPhaseAdvanceOffer(null);
  }, []);

  /** Wave Q.2.B (B3) — record an InvestorType override.  Buffers the
   *  selected type into ``pendingInvestorTypeOverrideRef`` so the next
   *  ``sendUserInput`` call's handshake carries ``investor_type`` and
   *  mirrors it on ``investorTypeOverride`` so the Screen1Card UI can
   *  render its "We'll re-classify on your next message as ${label}"
   *  confirmation strip.  Cleared from both ref + state after the
   *  override drains into the handshake (one-shot semantics — engine
   *  persists into DialogueState; subsequent turns don't re-send). */
  const setInvestorTypeOverride = useCallback(
    (investor_type: InvestorType) => {
      pendingInvestorTypeOverrideRef.current = investor_type;
      setInvestorTypeOverrideState(investor_type);
    },
    [],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, 'unmount');
        } catch {
          // No-op; socket already closed.
        }
        socketRef.current = null;
      }
    };
  }, [stopHeartbeat]);

  return {
    sessionId,
    phase,
    lightBacktest,
    messages,
    connectionState,
    errorDetail,
    sendUserInput,
    // Wave Q.2.B (B2) — phase-advance-offer surface.
    phaseAdvanceOffer,
    confirmAdvance,
    dismissAdvanceOffer,
    // Wave Q.2.B (B3) — InvestorType override surface.
    investorTypeOverride,
    setInvestorTypeOverride,
  };
}
