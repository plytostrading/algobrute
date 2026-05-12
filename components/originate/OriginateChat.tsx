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
 *
 * Wave Q.2.B (B2) — phase-advance offer affordance.  When the engine
 * surfaces a ``phase_advance_offer`` on ``turn_complete``, ``PhaseAdvanceCard``
 * is rendered sticky at the top of the chat panel; [Confirm advance]
 * threads ``confirm_advance_to`` onto the next handshake (one-shot per
 * customer click).  [Not yet] dismisses the card locally until the
 * engine re-surfaces it on a subsequent turn.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PayloadRouter from '@/components/originate/payloads/PayloadRouter';
import PhaseAdvanceCard from '@/components/originate/PhaseAdvanceCard';
// Wave Q.2.B (B4) — artifact attachment surface (PineScript / Paper /
// Chart / Composer / URL).  Mounted between the textarea and Send
// button; pending attachment is held in this component and forwarded
// on next send.
import AttachmentButton from '@/components/originate/AttachmentButton';
import type {
  ConnectionState,
  DialogueAttachmentPayload,
  DialogueMessage,
  UseDialogueSessionReturn,
} from '@/hooks/useDialogueSession';
import type { InvestorType } from '@/types/originate';

/** Wave Q.2.B (B4) — humanise the post-send attachment size for the
 *  user-message badge.  Mirrors the byte-counter inside
 *  AttachmentButton so the same convention is used pre-send (composer
 *  sheet) and post-send (transcript badge). */
function formatAttachmentSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

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

interface MessageRowProps {
  message: DialogueMessage;
  /** Wave Q.2.B (B3) — forwarded to ``PayloadRouter`` so Screen1Card
   *  can surface the InvestorType override affordance. */
  onOverrideInvestorType?: (investor_type: InvestorType) => void;
  /** Wave Q.2.B (B3) — buffered override from
   *  ``useDialogueSession.investorTypeOverride``. */
  investorTypeOverride?: InvestorType | null;
}

function MessageRow({
  message,
  onOverrideInvestorType,
  investorTypeOverride,
}: MessageRowProps) {
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
          {/* Wave Q.2.B (B4) — attached-artifact badge on user rows.
              Rendered inside the bubble so the badge inherits the
              user-message tint and stays anchored to the relevant
              turn even when the transcript scrolls. */}
          {isUser && message.attachment_meta && (
            <div
              data-testid="originate-message-attachment-badge"
              data-source-type={message.attachment_meta.sourceType}
              className="mt-1 flex items-center gap-1.5 text-[11px] opacity-80"
            >
              <Paperclip className="h-3 w-3" />
              <span className="truncate">
                Attached: {message.attachment_meta.label}
              </span>
              <span className="opacity-75">
                ({formatAttachmentSize(message.attachment_meta.size)})
              </span>
            </div>
          )}
        </div>
      )}

      {payloads.length > 0 && (
        <div
          className="w-full max-w-2xl flex flex-col gap-2"
          data-testid="originate-message-payloads"
        >
          {payloads.map((p, idx) => (
            <PayloadRouter
              key={`${message.id}-payload-${idx}`}
              payload={p}
              onOverrideInvestorType={onOverrideInvestorType}
              investorTypeOverride={investorTypeOverride}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OriginateChat({ session }: OriginateChatProps) {
  const {
    messages,
    sendUserInput,
    connectionState,
    // Wave Q.2.B (B2) — phase-advance-offer surface.
    phaseAdvanceOffer,
    confirmAdvance,
    dismissAdvanceOffer,
    // Wave Q.2.B (B3) — InvestorType override surface.
    investorTypeOverride,
    setInvestorTypeOverride,
  } = session;

  const [input, setInput] = useState('');
  /** Wave Q.2.B (B4) — pending attachment held in composer state until
   *  the send button fires.  Single-attachment-at-a-time: the
   *  ``AttachmentButton`` surfaces a preview chip + remove control
   *  while the attachment is staged; ``handleSend`` clears it on send. */
  const [pendingAttachment, setPendingAttachment] =
    useState<DialogueAttachmentPayload | null>(null);
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
    // Wave Q.2.B (B4) — forward the pending attachment alongside the
    // text input.  The hook is responsible for size validation; we
    // clear the local pending state regardless so the next turn starts
    // with a clean composer (the size-reject error surfaces via the
    // session ``errorDetail`` + a system message in the transcript).
    sendUserInput(value, pendingAttachment ?? undefined);
    setInput('');
    setPendingAttachment(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-[480px] flex-col" data-testid="originate-chat">
      {/* Wave Q.2.B (B2) — phase-advance offer affordance, sticky at the
          top of the chat panel.  Renders only while an offer is in flight;
          the card itself returns null when ``offer === null`` so the
          surrounding layout flexes naturally. */}
      {phaseAdvanceOffer !== null && (
        <div className="mb-3" data-testid="phase-advance-slot">
          <PhaseAdvanceCard
            offer={phaseAdvanceOffer}
            onConfirm={confirmAdvance}
            onDismiss={dismissAdvanceOffer}
          />
        </div>
      )}
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
              <MessageRow
                key={m.id}
                message={m}
                onOverrideInvestorType={setInvestorTypeOverride}
                investorTypeOverride={investorTypeOverride}
              />
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
        {/* Wave Q.2.B (B4) — artifact attachment composer surface,
            anchored between the textarea and the Send button so the
            paperclip sits in a familiar place for customers used to
            chat clients.  Pending attachment is forwarded on send. */}
        <AttachmentButton
          attachment={pendingAttachment}
          onChange={setPendingAttachment}
          disabled={isBusy}
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
