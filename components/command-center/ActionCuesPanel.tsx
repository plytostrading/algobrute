'use client';

import { useState } from 'react';
import { X, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import TerminalLabel from '@/components/common/TerminalLabel';
import type { RootState } from '@/store/store';
import { dismissCue } from '@/store/slices/portfolioSlice';
import type { CueSeverity } from '@/types';

const severityConfig: Record<CueSeverity, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: 'rgb(239, 68, 68)', bg: 'bg-red-50 dark:bg-red-950/20' },
  warning: { icon: AlertTriangle, color: 'rgb(245, 158, 11)', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  info: { icon: Info, color: 'rgb(6, 182, 212)', bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
};

export default function ActionCuesPanel() {
  const actionCues = useSelector((state: RootState) => state.portfolio.actionCues);
  const dispatch = useDispatch();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (actionCues.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <TerminalLabel icon="⚡" className="mb-3">NEEDS_ATTENTION</TerminalLabel>
        <div className="flex flex-col gap-2">
          {actionCues.map((cue) => {
            const config = severityConfig[cue.severity];
            const Icon = config.icon;
            const isExpanded = expandedId === cue.id;
            return (
              <div key={cue.id} className={`rounded-md border-l-4 p-3 ${config.bg}`} style={{ borderLeftColor: config.color }}>
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: config.color }} />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm leading-relaxed">{cue.message}</p>
                    {cue.historicalContext && (
                      <>
                        <button className="flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => setExpandedId(isExpanded ? null : cue.id)}>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? 'Hide context' : 'Show historical context'}
                        </button>
                        {isExpanded && (
                          <div className="space-y-1 pl-2 pt-1">
                            <p className="text-sm italic leading-relaxed text-muted-foreground">{cue.historicalContext}</p>
                            {cue.occurrenceCount > 0 && (
                              <p className="text-xs text-muted-foreground/60">Occurred {cue.occurrenceCount}x before · Avg recovery: {cue.avgRecoveryDays} days</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {cue.action && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs">{cue.action}</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => dispatch(dismissCue(cue.id))}>Dismiss</Button>
                      </div>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => dispatch(dismissCue(cue.id))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Dismiss</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
