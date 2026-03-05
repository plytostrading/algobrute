'use client';

import { useState } from 'react';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetRecommendations } from '@/hooks/useFleetRecommendations';
import RecommendationActionButton from '@/components/recommendations/RecommendationActionButton';
import type { RecommendationPriority } from '@/types/api';

type SeverityKey = 'high' | 'medium' | 'low';

const severityConfig: Record<SeverityKey, { icon: typeof AlertTriangle; color: string; bgColor: string; badgeVariant: 'default' | 'secondary' | 'destructive' }> = {
  high:   { icon: AlertCircle,  color: 'text-destructive', bgColor: 'bg-destructive/5 border-destructive/20', badgeVariant: 'destructive' },
  medium: { icon: AlertTriangle, color: 'text-warning',    bgColor: 'bg-warning/5 border-warning/20',         badgeVariant: 'secondary'   },
  low:    { icon: Info,          color: 'text-info',        bgColor: 'bg-info/5 border-info/20',               badgeVariant: 'default'     },
};

function toSeverityKey(priority: RecommendationPriority): SeverityKey {
  return priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low';
}

export default function ActionCuesPanel() {
  const { data: recommendations, isLoading } = useFleetRecommendations();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = (recommendations ?? []).filter((_, i) => !dismissed.has(i));

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (visible.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Action Required
          <Badge variant="secondary" className="text-xs font-normal">{visible.length}</Badge>
        </CardTitle>
        <CardDescription>Priority recommendations for your fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visible.map((rec, i) => {
            const sev = toSeverityKey(rec.priority);
            const config = severityConfig[sev];
            const Icon = config.icon;
            const globalIdx = (recommendations ?? []).indexOf(rec);

            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 ${config.bgColor}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {rec.bot_name ? `${rec.bot_name}: ` : ''}{rec.reason}
                  </p>
                  {rec.estimated_impact && (
                    <p className="text-xs text-muted-foreground mt-1">{rec.estimated_impact}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confidence: {rec.confidence}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RecommendationActionButton
                    recommendationType={rec.recommendation_type}
                    botId={rec.bot_id}
                    botName={rec.bot_name}
                    reason={rec.reason}
                    evidence={rec.evidence}
                    buttonVariant="outline"
                    buttonSize="sm"
                    className="h-7 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDismissed((prev) => new Set([...prev, globalIdx]))}
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
