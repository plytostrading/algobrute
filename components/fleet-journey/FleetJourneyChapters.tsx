'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  useFleetJourney,
  type JourneyQuery,
} from '@/hooks/useFleetJourney';
import { JourneyWelcome } from './JourneyWelcome';
import { SetupActions } from './FleetJourneySections';
import { Ch1MeetYourFleet } from './chapters/Ch1MeetYourFleet';
import { Ch2WhatYoureRunning } from './chapters/Ch2WhatYoureRunning';
import { Ch3MarketConditions } from './chapters/Ch3MarketConditions';
import { Ch4FleetInRealTime } from './chapters/Ch4FleetInRealTime';
import { Ch5FinalOutcomes } from './chapters/Ch5FinalOutcomes';
import { Ch6HowToJudgeSuccess } from './chapters/Ch6HowToJudgeSuccess';

/**
 * 6-chapter Fleet Journey orchestrator — the redesigned Fleet Journey
 * view. Replaces the flat 17-section FleetJourneySections with a narrative-
 * scaffolded, density-boosted dashboard composed of ~24 panels across
 * 6 StoryChapters.
 */
export function FleetJourneyChapters({ userId }: { userId?: string | null }) {
  const [params, setParams] = useState<JourneyQuery>({
    window_days: 365,
    precision_window_days: 5,
    regime_scope: 'current',
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, isLoading, error } = useFleetJourney(params);

  if (isLoading) return <LoadingSkeleton />;
  if (error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn&apos;t load your Fleet Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  if (!data) return null;

  // Zero-activity welcome card: if there are no trades, no interventions,
  // no bot activity, collapse to a single welcoming onboarding view.
  const hasActivity =
    data.bots.some((b) => b.n_trades > 0) ||
    data.timeline.interventions.length > 0 ||
    data.per_trade_outcomes.length > 0;

  if (!hasActivity) {
    return (
      <div className="space-y-6">
        <JourneyWelcome data={data} />
        <SetupActions />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Top bar with window controls + setup drawer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Fleet Journey
          </span>
          <span className="text-sm text-muted-foreground">
            The single-narrative risk-management-effectiveness dashboard ·
            data as of {new Date(data.as_of).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <WindowSelect
            value={params.window_days ?? 365}
            onChange={(v) => setParams((p) => ({ ...p, window_days: v }))}
          />
          <PrecisionSelect
            value={params.precision_window_days ?? 5}
            onChange={(v) => setParams((p) => ({ ...p, precision_window_days: v }))}
          />
          <ScopeSelect
            value={params.regime_scope ?? 'current'}
            onChange={(v) => setParams((p) => ({ ...p, regime_scope: v }))}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen((d) => !d)}
          >
            <Settings className="mr-1 h-3 w-3" />
            Setup
          </Button>
        </div>
      </div>

      {drawerOpen && (
        <div className="rounded-md border bg-card/40 p-4">
          <SetupActions />
        </div>
      )}

      <Ch1MeetYourFleet data={data} />
      <Ch2WhatYoureRunning data={data} />
      <Ch3MarketConditions data={data} />
      <Ch4FleetInRealTime data={data} />
      <Ch5FinalOutcomes data={data} />
      <Ch6HowToJudgeSuccess data={data} />
    </div>
  );
}

function WindowSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Window</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded border bg-background px-2 py-1 text-xs text-foreground"
      >
        <option value={30}>30d</option>
        <option value={90}>90d</option>
        <option value={180}>180d</option>
        <option value={365}>365d</option>
        <option value={730}>730d</option>
      </select>
    </label>
  );
}

function PrecisionSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Precision window</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded border bg-background px-2 py-1 text-xs text-foreground"
      >
        <option value={1}>1d</option>
        <option value={3}>3d</option>
        <option value={5}>5d</option>
        <option value={10}>10d</option>
        <option value={20}>20d</option>
      </select>
    </label>
  );
}

function ScopeSelect({
  value,
  onChange,
}: {
  value: 'current' | 'all';
  onChange: (v: 'current' | 'all') => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Regime scope</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'current' | 'all')}
        className="rounded border bg-background px-2 py-1 text-xs text-foreground"
      >
        <option value="current">Current regime</option>
        <option value="all">All regimes</option>
      </select>
    </label>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
