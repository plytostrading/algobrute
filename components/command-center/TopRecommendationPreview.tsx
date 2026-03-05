'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import RecommendationActionButton from '@/components/recommendations/RecommendationActionButton';
import type { Recommendation, RecommendationType, RecommendationPriority } from '@/types/api';

// ── Type badge styling ──────────────────────────────────────────────────────
// kill/pause → red  |  reduce → amber  |  increase/add → green  |  rebalance → blue
const TYPE_COLORS: Record<RecommendationType, string> = {
  kill:      'bg-destructive/10 text-destructive border border-destructive/30',
  pause:     'bg-destructive/10 text-destructive border border-destructive/30',
  reduce:    'bg-warning/10 text-warning border border-warning/30',
  increase:  'bg-success/10 text-success border border-success/30',
  add:       'bg-success/10 text-success border border-success/30',
  rebalance: 'bg-info/10 text-info border border-info/30',
};

const TYPE_LABELS: Record<RecommendationType, string> = {
  kill:      'Kill',
  pause:     'Pause',
  reduce:    'Reduce',
  increase:  'Increase',
  add:       'Add',
  rebalance: 'Rebalance',
};

// ── Priority badge variant ──────────────────────────────────────────────────
const PRIORITY_VARIANT: Record<
  RecommendationPriority,
  'destructive' | 'secondary' | 'outline'
> = {
  high:   'destructive',
  medium: 'secondary',
  low:    'outline',
};

interface TopRecommendationPreviewProps {
  /** The highest-priority recommendation, or null when none exist. */
  recommendation: Recommendation | null | undefined;
  /** Total number of active recommendations (used for the "View all N →" link). */
  totalCount: number;
}

export default function TopRecommendationPreview({
  recommendation,
  totalCount,
}: TopRecommendationPreviewProps) {
  // Empty state — no card chrome, per spec.
  if (!recommendation || totalCount === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recommendations at this time.
      </p>
    );
  }

  const typeColors =
    TYPE_COLORS[recommendation.recommendation_type] ??
    'bg-muted text-muted-foreground border border-border';

  const typeLabel =
    TYPE_LABELS[recommendation.recommendation_type] ??
    recommendation.recommendation_type;

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        {/* ── Header row: type badge + priority badge + optional bot name ── */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeColors}`}
          >
            {typeLabel}
          </span>
          <Badge
            variant={PRIORITY_VARIANT[recommendation.priority]}
            className="text-[10px] h-5 capitalize"
          >
            {recommendation.priority} priority
          </Badge>
          {recommendation.bot_name && (
            <span className="text-xs text-muted-foreground">
              {recommendation.bot_name}
            </span>
          )}
        </div>

        {/* ── Primary instruction (suggested_action) ── */}
        <p className="text-sm font-medium leading-snug">
          {recommendation.suggested_action}
        </p>

        {/* ── Estimated impact ── */}
        {recommendation.estimated_impact && (
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            {recommendation.estimated_impact}
          </p>
        )}

        {/* ── Footer: action button + "view all" link ── */}
        <div className="mt-3 pt-2 border-t flex items-center justify-between gap-2">
          <RecommendationActionButton
            recommendationType={recommendation.recommendation_type}
            botId={recommendation.bot_id}
            botName={recommendation.bot_name}
            reason={recommendation.reason}
            evidence={recommendation.evidence}
            buttonVariant="outline"
            buttonSize="sm"
            className="h-7 text-xs"
          />
          {totalCount > 1 && (
            <Link
              href="/operations"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              View all {totalCount} recommendations →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
