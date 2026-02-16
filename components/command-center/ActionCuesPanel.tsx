'use client';

import { useSelector, useDispatch } from 'react-redux';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RootState } from '@/store/store';
import { dismissCue } from '@/store/slices/portfolioSlice';
import type { CueSeverity } from '@/types';

const severityConfig: Record<CueSeverity, { icon: typeof AlertTriangle; color: string; bgColor: string; badgeVariant: 'default' | 'secondary' | 'destructive' }> = {
  critical: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/5 border-destructive/20', badgeVariant: 'destructive' },
  warning: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/5 border-warning/20', badgeVariant: 'secondary' },
  info: { icon: Info, color: 'text-info', bgColor: 'bg-info/5 border-info/20', badgeVariant: 'default' },
};

export default function ActionCuesPanel() {
  const dispatch = useDispatch();
  const cues = useSelector((state: RootState) => state.portfolio.actionCues);

  if (cues.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Action Required
          <Badge variant="secondary" className="text-xs font-normal">{cues.length}</Badge>
        </CardTitle>
        <CardDescription>Priority alerts and notifications for your fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cues.map((cue) => {
            const config = severityConfig[cue.severity];
            const Icon = config.icon;

            return (
              <div
                key={cue.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${config.bgColor}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cue.message}</p>
                  {cue.historicalContext && (
                    <p className="text-xs text-muted-foreground mt-1">{cue.historicalContext}</p>
                  )}
                  {cue.occurrenceCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Occurred {cue.occurrenceCount}× before · Avg recovery: {cue.avgRecoveryDays} days
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cue.action && (
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      {cue.action}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => dispatch(dismissCue(cue.id))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
