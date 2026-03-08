'use client';

/**
 * SectionInsightCard
 *
 * A self-contained LLM-generated insight callout rendered at the top of a
 * dashboard section, giving users a plain-language verdict → evidence →
 * posture reading of the quantitative data below.
 *
 * Design decisions
 * ----------------
 * - Sentiment drives the left-border accent color:
 *     positive  → success (green)
 *     neutral   → primary (blue)
 *     caution   → warning (amber)
 *     warning   → destructive (red)
 * - Loading: shows a compact skeleton so layout doesn't shift when data arrives.
 * - Error / unavailable: renders nothing — the section below is still fully
 *   functional without the insight card.
 * - No Regenerate button in this iteration: summaries are cached permanently
 *   server-side (backtest results are immutable).
 */

import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBacktestInsight } from '@/hooks/useBacktestWorkflow';

// Sentiment → Tailwind left-border + text classes
const SENTIMENT_STYLES: Record<string, { border: string; badge: string; badgeText: string }> = {
  positive: {
    border: 'border-l-[3px] border-l-success',
    badge: 'bg-success/10',
    badgeText: 'text-success',
  },
  neutral: {
    border: 'border-l-[3px] border-l-primary',
    badge: 'bg-primary/10',
    badgeText: 'text-primary',
  },
  caution: {
    border: 'border-l-[3px] border-l-warning',
    badge: 'bg-warning/10',
    badgeText: 'text-warning',
  },
  warning: {
    border: 'border-l-[3px] border-l-destructive',
    badge: 'bg-destructive/10',
    badgeText: 'text-destructive',
  },
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral:  'Neutral',
  caution:  'Caution',
  warning:  'Warning',
};

interface SectionInsightCardProps {
  jobId: string | null | undefined;
  sectionKey: string;
  /** Optional extra className on the outer wrapper for spacing control. */
  className?: string;
}

export default function SectionInsightCard({
  jobId,
  sectionKey,
  className = '',
}: SectionInsightCardProps) {
  const { data, isLoading, isError } = useBacktestInsight(jobId, sectionKey);

  // Loading skeleton — compact, same height as one line of text
  if (isLoading) {
    return (
      <div className={`rounded-md border bg-muted/20 p-3 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-[92%] mb-1" />
        <Skeleton className="h-3 w-[75%]" />
      </div>
    );
  }

  // Any error (503 = Anthropic not configured, 404 = LLM call failed, etc.)
  // → render a persistent, subtle indicator so the card area doesn't vanish
  // after the loading skeleton appeared.  Parent components are responsible
  // for not mounting this card when the underlying section data is absent;
  // any error reaching here means the AI genuinely failed.
  //
  // Deliberately NOT returning null — a card that disappears after a visible
  // skeleton is more disorienting than a quiet "unavailable" note.
  if (isError) {
    return (
      <div
        className={`rounded-md border border-dashed bg-muted/10 p-3 ${className}`}
        role="note"
        aria-label="AI insight unavailable"
      >
        <div className="flex items-center gap-1.5 opacity-40">
          <Sparkles className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            AI Insight unavailable
          </span>
        </div>
      </div>
    );
  }

  // Silently hide when data hasn’t arrived yet (should not reach here in normal flow
  // since isLoading is handled above, but guards against unexpected state).
  if (!data) return null;

  const style = SENTIMENT_STYLES[data.sentiment] ?? SENTIMENT_STYLES.neutral;
  const sentimentLabel = SENTIMENT_LABELS[data.sentiment] ?? 'Insight';

  return (
    <div
      className={`rounded-md border bg-muted/20 p-3 ${style.border} ${className}`}
      role="note"
      aria-label={`AI insight: ${sentimentLabel}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            AI Insight
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge} ${style.badgeText}`}
        >
          {sentimentLabel}
        </span>
      </div>

      {/* Summary prose */}
      <p className="text-xs leading-relaxed text-foreground/90">
        {data.summary}
      </p>
    </div>
  );
}
