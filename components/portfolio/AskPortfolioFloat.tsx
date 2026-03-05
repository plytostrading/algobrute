'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAskPortfolio } from '@/hooks/useAskPortfolio';

// Pages where the floater is visible
const FLOAT_PATHS = ['/portfolio', '/operations', '/insights'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Sticky bottom-right "Ask Your Portfolio" conversational panel.
 *
 * - Only rendered on /portfolio, /operations, /insights.
 * - Collapsed state: circular FAB (MessageCircle icon).
 * - Expanded state: 360px-wide card with message history + input.
 * - Conversation history lives in local state (not persisted).
 * - Questions are POSTed via useAskPortfolio → /api/fleet/question.
 */
export default function AskPortfolioFloat() {
  const pathname = usePathname();
  const isVisible = FLOAT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = useAskPortfolio();

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, ask.isPending]);

  if (!isVisible) return null;

  const handleSend = () => {
    const q = input.trim();
    if (!q || ask.isPending) return;

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');

    ask.mutate(q, {
      onSuccess: (data) => {
        const parts: string[] = [data.headline];
        if (data.explanation) parts.push(data.explanation);
        if (data.action) parts.push(`→ ${data.action}`);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: parts.join('\n\n') },
        ]);
      },
      onError: (e) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${e.message}` },
        ]);
      },
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded panel */}
      {open && (
        <div className="w-[360px] rounded-xl border bg-popover shadow-xl flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40 shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Ask Your Portfolio</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Message history */}
          <ScrollArea className="max-h-[340px]">
            <div className="flex flex-col gap-3 p-4">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Ask anything about your portfolio, bots, or strategy
                  performance.
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[88%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'self-end bg-primary text-primary-foreground'
                      : 'self-start bg-muted text-foreground',
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {ask.isPending && (
                <div className="self-start flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input row */}
          <div className="flex items-center gap-2 px-3 py-3 border-t shrink-0">
            <Input
              className="h-8 text-xs"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={ask.isPending}
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || ask.isPending}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      )}

      {/* FAB toggle */}
      <Button
        size="icon"
        className={cn(
          'h-12 w-12 rounded-full shadow-lg transition-colors',
          open
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
        <span className="sr-only">{open ? 'Close' : 'Ask Your Portfolio'}</span>
      </Button>
    </div>
  );
}
