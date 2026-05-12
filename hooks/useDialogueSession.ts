'use client';

/**
 * useDialogueSession — WebSocket lifecycle hook for the /originate page.
 *
 * Wave 1.A (F.1.A) — SKELETON implementation:
 *   - Establishes a WebSocket connection to /api/dialogue/stream (proxied
 *     through Next.js rewrites to the backend FastAPI router).
 *   - Sends the JWT-bearing handshake envelope on the first user input.
 *   - Buffers received events and surfaces them as a flat ``messages`` list
 *     with raw text rendering only.
 *   - Tracks coarse connection state + current DialoguePhase so the right-
 *     side status panel can render a phase chip and connection indicator.
 *   - Provides a single 30-second heartbeat ping while connected.
 *   - Translates the four application-private close codes (4429 / 4402 /
 *     4503 / 4410 / 4404) into user-friendly error strings.
 *
 * F.1.B will add: structured-payload routing (Screen1/2/3 dispatch),
 * light-backtest snapshot updates, phase-advance offer surfacing, and
 * per-event component rendering.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DialoguePhase =
  | 'ENTRY'
  | 'EXTRACTION'
  | 'EXPLORATION'
  | 'REFINEMENT'
  | 'VALIDATION'
  | 'DEPLOYMENT_DECISION'
  | 'ACCOMPANIMENT';

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export type LightBacktestStatus =
  | 'NOT_STARTED'
  | 'IN_FLIGHT'
  | 'COMPLETE'
  | 'FAILED';

export interface LightBacktestSnapshot {
  status: LightBacktestStatus;
  // F.1.B will add: metrics, verdict, fingerprint, etc.
}

/** A single chat-style message rendered in the transcript. */
export interface DialogueMessage {
  /** Stable client-side id; not the server's turn id. */
  id: string;
  /** Sender bucket: the user, an agent, or the system (connection events / errors). */
  role: 'user' | 'agent' | 'system';
  /** Free-form text. For Wave 1.A this is the body of every event. */
  text: string;
  /** Optional agent identifier (e.g. ``co_author``) when ``role === 'agent'``. */
  agentId?: string;
  /** Local timestamp for ordering / display. */
  createdAt: number;
}

/** First-message envelope on the WebSocket per backend handshake schema. */
interface DialogueHandshake {
  token: string;
  user_input: string;
  session_id?: string;
}

/** Discriminated union over the streaming event types the backend emits. */
type DialogueEvent =
  | { event: 'turn_started'; session_id: string; current_phase: DialoguePhase }
  | { event: 'agent_dispatched'; agent_ids: string[] }
  | { event: 'agent_response'; agent_id: string; text: string }
  | {
      event: 'turn_complete';
      session_id: string;
      output_text: string;
      current_phase: DialoguePhase;
      turn_count: number;
      structured_payload: Record<string, unknown> | null;
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
  // Wave 1.A: setter is reserved for F.1.B (when light-backtest progress
  // events start updating the snapshot). For now the state holds the
  // initial NOT_STARTED sentinel so the right-side panel renders.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const appendMessage = useCallback((msg: Omit<DialogueMessage, 'id' | 'createdAt'>) => {
    setMessages((prev) => [
      ...prev,
      { id: makeMessageId(), createdAt: Date.now(), ...msg },
    ]);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback((ws: WebSocket) => {
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
  }, [stopHeartbeat]);

  const handleEvent = useCallback(
    (raw: string) => {
      let evt: DialogueEvent;
      try {
        evt = JSON.parse(raw) as DialogueEvent;
      } catch {
        // Backend always emits JSON; a parse failure is unrecoverable.
        appendMessage({ role: 'system', text: 'Received a malformed event from the dialogue stream.' });
        return;
      }

      switch (evt.event) {
        case 'turn_started':
          sessionIdRef.current = evt.session_id;
          setSessionId(evt.session_id);
          setPhase(evt.current_phase);
          break;
        case 'agent_dispatched':
          // Wave 1.A: surface as a lightweight system note so the user sees activity.
          appendMessage({
            role: 'system',
            text: `Dispatching agents: ${evt.agent_ids.join(', ')}`,
          });
          break;
        case 'agent_response':
          appendMessage({
            role: 'agent',
            text: evt.text,
            agentId: evt.agent_id,
          });
          break;
        case 'turn_complete':
          setPhase(evt.current_phase);
          // Wave 1.A: render the final output_text as a plain agent message.
          // F.1.B will instead route structured_payload through dedicated
          // Screen1/2/3 renderers and surface phase_advance_offer as a CTA.
          if (evt.output_text) {
            appendMessage({ role: 'agent', text: evt.output_text });
          }
          break;
        case 'error':
          setErrorDetail(evt.detail);
          appendMessage({ role: 'system', text: `Error: ${evt.detail}` });
          break;
      }
    },
    [appendMessage],
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

      setConnectionState((prev) => (prev === 'reconnecting' ? 'reconnecting' : 'connecting'));
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
