'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTimeFromISOString } from '@/utils/formatters';
import type { FleetNarrative } from '@/types/api';

interface FleetNarrativeCardProps {
  narrative: FleetNarrative | null | undefined;
  /** ISO 8601 timestamp used to compute narrative staleness. */
  weatherTimestamp: string | null | undefined;
}

export default function FleetNarrativeCard({
  narrative,
  weatherTimestamp,
}: FleetNarrativeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute minutes elapsed since last update for staleness coloring.
  // Uses weatherTimestamp as a proxy for narrative freshness (both update
  // on the same analysis cycle).
  const minutesOld = useMemo(() => {
    if (!weatherTimestamp) return null;
    const ts = new Date(weatherTimestamp).getTime();
    if (!Number.isFinite(ts)) return null;
    return Math.floor((Date.now() - ts) / 60_000);
  }, [weatherTimestamp]);

  const staleClass =
    minutesOld == null
      ? 'text-muted-foreground'
      : minutesOld > 60
        ? 'text-destructive'
        : minutesOld > 30
          ? 'text-warning'
          : 'text-muted-foreground';

  // Loading/unavailable state — show a compact skeleton rather than
  // nothing, so the card's position in the layout is reserved consistently.
  if (!narrative) {
    return (
      <Card>
        <CardContent className="py-3">
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  const hasUrgency = narrative.urgency && narrative.urgency.trim() !== '';

  // Only show the expand toggle if there is substance to reveal.
  const hasExpandableContent = !!(
    narrative.briefing ||
    narrative.next_step ||
    Object.keys(narrative.source_metrics ?? {}).length > 0
  );

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        {/* ── Always visible: headline + expand toggle ── */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug flex-1">
            {narrative.headline}
          </p>
          {hasExpandableContent && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1"
              onClick={() => setIsExpanded((v) => !v)}
            >
              {isExpanded ? (
                <>
                  Hide <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Read briefing <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* ── Urgency callout — always visible when non-empty ── */}
        {hasUrgency && (
          <div className="mt-2 flex items-start gap-2 rounded-r-md border-l-4 border-warning bg-warning/5 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-warning font-medium leading-snug">
              {narrative.urgency}
            </p>
          </div>
        )}

        {/* ── Expanded content ── */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Full briefing paragraph */}
            {narrative.briefing && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {narrative.briefing}
              </p>
            )}

            {/* Next step */}
            {narrative.next_step && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider mt-0.5 shrink-0">
                  Next
                </span>
                <p className="text-xs text-foreground/80 leading-snug">
                  {narrative.next_step}
                </p>
              </div>
            )}

            {/* Sources disclosure — nested expand inside expanded view */}
            {Object.keys(narrative.source_metrics ?? {}).length > 0 && (
              <details className="group">
                <summary className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground list-none select-none">
                  <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                  Sources
                </summary>
                <div className="mt-1.5 space-y-0.5 pl-4">
                  {Object.entries(narrative.source_metrics).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between text-xs text-muted-foreground"
                    >
                      <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-mono-data">
                        {typeof v === 'number' ? v.toFixed(2) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Staleness indicator */}
            {weatherTimestamp && (
              <p className={`text-xs ${staleClass}`}>
                Updated {formatRelativeTimeFromISOString(weatherTimestamp)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
