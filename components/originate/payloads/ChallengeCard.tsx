'use client';

/**
 * ChallengeCard — Cross-Examiner structured-payload renderer.
 *
 * Renders the adversarial challenges as inline-quoted concerns, each
 * tagged with its canonical category (regime_fragility / capacity /
 * mechanism / lookahead / sample / behavioral) and an optional severity
 * chip.
 *
 * Engine source: `agents/structured_payload.py::ChallengePayload`.
 */

import { Gavel } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  Challenge,
  ChallengeCategory,
  ChallengePayload,
} from '@/types/originate';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  payload: ChallengePayload;
}

function categoryLabel(c: ChallengeCategory): string {
  switch (c) {
    case 'regime_fragility':
      return 'Regime fragility';
    case 'capacity':
      return 'Capacity';
    case 'mechanism':
      return 'Mechanism';
    case 'lookahead':
      return 'Look-ahead';
    case 'sample':
      return 'Sample';
    case 'behavioral':
      return 'Behavioral';
  }
}

function severityClassName(s: Challenge['severity']): string {
  switch (s) {
    case 'high':
      return 'border-destructive/30 text-destructive bg-destructive/10';
    case 'medium':
      return 'border-amber-500/30 text-amber-700 bg-amber-500/10 dark:text-amber-300';
    case 'low':
      return 'border-emerald-500/30 text-emerald-700 bg-emerald-500/10 dark:text-emerald-300';
    default:
      return 'border-muted text-muted-foreground';
  }
}

export default function ChallengeCard({ payload }: ChallengeCardProps) {
  if (payload.challenges.length === 0) return null;

  return (
    <Card
      data-testid="payload-challenge"
      data-kind="challenge"
      className="border-l-2 border-l-amber-500/60"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gavel className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Cross-Examiner challenges
          </CardTitle>
          {payload.evidence_count > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] shrink-0"
              data-testid="challenge-evidence-count"
            >
              {payload.evidence_count} detector{payload.evidence_count === 1 ? '' : 's'} fired
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <ul
          className="flex flex-col gap-2"
          data-testid="challenge-list"
        >
          {payload.challenges.map((ch, idx) => (
            <li
              key={idx}
              className="rounded-md border bg-muted/30 px-3 py-2 text-xs"
              data-testid="challenge-item"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                {ch.category ? (
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                    data-testid="challenge-category"
                  >
                    {categoryLabel(ch.category)}
                  </Badge>
                ) : (
                  <span />
                )}
                {ch.severity && (
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', severityClassName(ch.severity))}
                    data-testid="challenge-severity"
                    data-severity={ch.severity}
                  >
                    {ch.severity}
                  </Badge>
                )}
              </div>
              <p className="leading-relaxed">{ch.text}</p>
            </li>
          ))}
        </ul>

        {payload.categories_engaged.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Categories engaged:
            </span>
            {payload.categories_engaged.map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">
                {categoryLabel(c)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
