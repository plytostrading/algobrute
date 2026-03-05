'use client';

import { useMemo, useState } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useStrategies } from '@/hooks/useStrategies';
import { useFleetRecommendations } from '@/hooks/useFleetRecommendations';
import { getRecommendationLabel } from '@/lib/regimeLabel';

interface DiscoverTabProps {
  onSelectStrategy: (strategyId: string) => void;
}

export default function DiscoverTab({ onSelectStrategy }: DiscoverTabProps) {
  const { data: strategies, isLoading, isError } = useStrategies();
  const {
    data: recommendations,
    isLoading: recsLoading,
    isError: recsError,
  } = useFleetRecommendations();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (strategies ?? []).filter((s) => s.is_active);
    if (!q) return list;
    return list.filter((s) => (s.name + ' ' + s.description + ' ' + s.strategy_id).toLowerCase().includes(q));
  }, [strategies, query]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search strategies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Live Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fleet Alerts</CardTitle>
            <CardDescription>Live recommendations from the analytics pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {recsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recsError ? (
              <p className="text-sm text-destructive">Failed to load fleet alerts.</p>
            ) : (recommendations ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No active alerts right now.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(recommendations ?? []).slice(0, 5).map((rec, idx) => {
                  const isRiskOff =
                    rec.recommendation_type === 'kill' ||
                    rec.recommendation_type === 'pause' ||
                    rec.recommendation_type === 'reduce';

                  return (
                    <div
                      key={`${rec.recommendation_type}-${rec.bot_id ?? idx}`}
                      className="flex items-center justify-between rounded-md border bg-background p-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isRiskOff ? (
                          <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-success shrink-0" />
                        )}
                        <span className="font-mono-data text-sm font-bold truncate">
                          {rec.bot_name ?? 'Fleet'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {rec.reason}
                        </span>
                      </div>
                      <Badge
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}
                        className="text-[10px] shrink-0"
                      >
                        {getRecommendationLabel(rec.recommendation_type)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strategies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Strategies</CardTitle>
            <CardDescription>Choose a strategy and start a backtest</CardDescription>
          </CardHeader>
          <CardContent>
            {isError && (
              <p className="text-sm text-destructive">Failed to load strategies.</p>
            )}

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((s) => (
                  <div key={s.strategy_id} className="rounded-md border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{s.name}</span>
                          <Badge variant="secondary" className="font-mono-data text-[10px]">
                            {s.strategy_id}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => onSelectStrategy(s.strategy_id)}>
                        Backtest →
                      </Button>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground">No strategies match your search.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
