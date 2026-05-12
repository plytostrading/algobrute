'use client';

/**
 * OriginateChat — chat-style transcript + composer for the /originate page.
 *
 * Wave 1.A (F.1.A) — SKELETON renderer:
 *   - Renders the message history from useDialogueSession() as plain text
 *     rows grouped by sender.
 *   - Exposes a textarea + send button for user input (Enter to send,
 *     Shift+Enter for newline).
 *   - Shows the current connection state inline ("Reconnecting…", etc.).
 *
 * F.1.B will replace the plain-text agent rows with structured renderers
 * (Screen1 = clarifying-questions, Screen2 = light-backtest progress,
 * Screen3 = verdict + disclosures + Accept CTA).
 */

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

  return (
    <div
      data-testid={`originate-message-${message.role}`}
      data-message-id={message.id}
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
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
    </div>
  );
}

export default function OriginateChat({ session }: OriginateChatProps) {
  const { messages, sendUserInput, connectionState } = session;

  const [input, setInput] = useState('');
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

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
