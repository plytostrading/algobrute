'use client';

import { FleetJourneyChapters } from '@/components/fleet-journey/FleetJourneyChapters';

export default function FleetJourneyPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fleet Journey</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Your fleet&apos;s path through regimes, and every risk-management
          action the platform has taken on your behalf. The redesigned view
          below walks you through six chapters — meet your fleet, what
          you&apos;re running, market conditions, the fleet in real time,
          final outcomes, and how to judge success — with distributional
          detail at every level.
        </p>
      </div>

      <FleetJourneyChapters />
    </div>
  );
}
