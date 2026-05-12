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
 * F.1.C will add: Accept-Strategy mutation wiring, light-backtest fingerprint
 * detection, and phase-advance-offer surfacing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/api';
import {
  tagPayload,
} from '@/components/originate/payloads/discriminate';
import type {
  DialoguePhase,
  LightBacktestStatus,
  LightBacktestVerdict,
  RawStructuredPayload,
  TaggedStructuredPayload,
} from '@/types/originate';

// Re-export the public type aliases so call sites that imported them from
// this hook in Wave 1.A keep working without changing imports.
export type {
  DialoguePhase,
  LightBacktestStatus,
  LightBacktestVerdict,
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
}

/** First-message envelope on the WebSocket per backend handshake schema. */
interface DialogueHandshake {
  token: string;
  user_input: string;
  session_id?: string;
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
      phase_advance_offer: Record<string, unknown> | null;
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
  /** Send a user message. Opens the socket on first send if needed. */
  sendUserInput: (input: string) => void;
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

  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const pendingInputRef = useRef<string | null>(null);
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
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      appendMessage({ role: 'user', text: trimmed });

      // Phase L.1 design: one socket = one turn. Always open a fresh socket
      // per user input, sending the handshake (which carries user_input) on
      // open. session_id is preserved across turns via sessionIdRef so the
      // backend can resume the conversation.
      pendingInputRef.current = trimmed;
      openSocket(trimmed);
    },
    [appendMessage, openSocket],
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
  };
}
