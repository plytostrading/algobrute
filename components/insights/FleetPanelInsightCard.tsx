'use client';

/**
 * FleetPanelInsightCard
 *
 * Renders a live LLM-generated insight for one of the three fleet command-centre
 * panels: risk_snapshot, fear_greed, or sensitivity.
 *
 * Uses the same visual language as SectionInsightCard (left-border accent,
 * sentiment badge, Sparkles icon) but fetches from GET /api/fleet/insight/{panelKey}
 * via useFleetPanelInsight.  Results are NOT cached server-side and have a 5-minute
 * client-side stale window.
 *
 * Silently renders nothing on 404 / 503 / LLM unavailable — the panel below is
 * always fully functional without the insight card.
 */

import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetPanelInsight, type FleetPanelKey } from '@/hooks/useFleetPanelInsight';

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
  neutral: 'Neutral',
  caution: 'Caution',
  warning: 'Warning',
};

interface FleetPanelInsightCardProps {
  panelKey: FleetPanelKey;
  /** Optional extra className on the outer wrapper for spacing control. */
  className?: string;
}

export default function FleetPanelInsightCard({
  panelKey,
  className = '',
}: FleetPanelInsightCardProps) {
  const { data, isLoading, isError } = useFleetPanelInsight(panelKey);

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

  if (isError || !data) return null;

  const style = SENTIMENT_STYLES[data.sentiment] ?? SENTIMENT_STYLES.neutral;
  const sentimentLabel = SENTIMENT_LABELS[data.sentiment] ?? 'Insight';

  return (
    <div
      className={`rounded-md border bg-muted/20 p-3 ${style.border} ${className}`}
      role="note"
      aria-label={`AI insight: ${sentimentLabel}`}
    >
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
      <p className="text-xs leading-relaxed text-foreground/90">{data.summary}</p>
    </div>
  );
}
