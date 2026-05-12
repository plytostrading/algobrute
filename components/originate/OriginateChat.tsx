'use client';

/**
 * OriginateChat — chat-style transcript + composer for the /originate page.
 *
 * Wave 1.B (F.1.B) — structured-payload aware:
 *   - Renders the message history from useDialogueSession() with both the
 *     conversational text AND any structured payloads attached to the
 *     message (Screen1 / Screen2 / Screen3 / Challenge / PreMortem /
 *     DoctorAlert) via ``PayloadRouter``.
 *   - Visual hierarchy: text bubble → structured card(s) → next message,
 *     with breathing room between each pair.
 *   - Composer: textarea + send button (Enter to send, Shift+Enter for
 *     newline).  Connection state surfaced inline.
 *   - Auto-scrolls to the latest message on any new content (text OR
 *     payload deltas).
 */

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PayloadRouter from '@/components/originate/payloads/PayloadRouter';
import type {
  ConnectionState,
  DialogueMessage,
  UseDialogueSessionReturn,
} from '@/hooks/useDialogueSession';

interface OriginateChatProps {
  /** Active dialogue session — owned by the page (single useDialogueSession() instance). */
  session: UseDialogueSessionReturn;
}

function connectionLabel(state: ConnectionState): string | null {
  switch (state) {
    case 'connecting':
      return 'Connecting…';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'error':
      return 'Connection error';
    default:
      return null;
  }
}

function MessageRow({ message }: { message: DialogueMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const payloads = message.structured_payloads ?? [];
  const hasText = message.text.trim().length > 0;

  // Agent rows with structured payloads render full-width (so the cards
  // breathe), even though the text bubble stays capped at 80%.  User
  // rows never carry payloads; system rows are kept narrow.
  return (
    <div
      data-testid={`originate-message-${message.role}`}
      data-message-id={message.id}
      data-has-payloads={payloads.length > 0 ? 'true' : 'false'}
      className={cn(
        'flex w-full flex-col gap-2',
        isUser ? 'items-end' : 'items-start',
      )}
    >
      {hasText && (
        <div
          className={cn(
            'max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed',
            isUser && 'bg-primary text-primary-foreground',
            !isUser && !isSystem && 'bg-muted',
            isSystem && 'border border-dashed border-muted-foreground/30 bg-transparent text-muted-foreground italic',
          )}
        >
          {!isUser && message.agentId && (
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
              {message.agentId}
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">{message.text}</div>
        </div>
      )}

      {payloads.length > 0 && (
        <div
          className="w-full max-w-2xl flex flex-col gap-2"
          data-testid="originate-message-payloads"
        >
          {payloads.map((p, idx) => (
            <PayloadRouter key={`${message.id}-payload-${idx}`} payload={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OriginateChat({ session }: OriginateChatProps) {
  const { messages, sendUserInput, connectionState } = session;

  const [input, setInput] = useState('');
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message OR new payload delta (a `turn_complete`
  // can attach payloads to an existing message without growing the
  // length, so we also watch the payload-count fingerprint).
  const payloadFingerprint = messages.reduce(
    (acc, m) => acc + (m.structured_payloads?.length ?? 0),
    0,
  );
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, payloadFingerprint]);

  const isBusy = connectionState === 'connecting' || connectionState === 'reconnecting';
  const status = connectionLabel(connectionState);

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    sendUserInput(value);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-[480px] flex-col" data-testid="originate-chat">
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto rounded-md border bg-background/50 p-4"
        data-testid="originate-transcript"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center text-sm text-muted-foreground">
              Tell us about a strategy idea you have in mind. We&rsquo;ll ask a few
              clarifying questions, run a quick light backtest, and let you know
              whether it looks promising before you commit to a full deploy.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      {status !== null && (
        <div
          className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
          data-testid="originate-connection-status"
        >
          {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>{status}</span>
        </div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          aria-label="Describe your strategy idea"
          placeholder="Describe your strategy idea…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          data-testid="originate-input"
          className={cn(
            'flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none',
            'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isBusy}
          data-testid="originate-send"
        >
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
