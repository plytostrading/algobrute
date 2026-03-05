'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import FleetWeatherBanner from '@/components/operations/FleetWeatherBanner';
import BotListRow from '@/components/operations/BotListRow';
import BotDetailDrawer from '@/components/operations/BotDetailDrawer';
import FleetAnalyticsSidebar from '@/components/operations/FleetAnalyticsSidebar';
import HighCorrelationBanner from '@/components/operations/HighCorrelationBanner';
// FleetManagement and RiskDashboard are superseded by this layout but preserved as files.
import { useFleetState } from '@/hooks/useFleetState';
import { useFleetWeather } from '@/hooks/useFleetWeather';
import { useFleetRecommendations } from '@/hooks/useFleetRecommendations';
import { useFleetCorrelation } from '@/hooks/useFleetCorrelation';
import type { BotSnapshot } from '@/types/api';

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

const BOT_STATE_SORT_ORDER: Record<string, number> = {
  circuit_breaker: 0,
  paused_monitoring: 1,
  paused_user: 2,
  paused_regime: 3,
  ramping: 4,
  active: 5,
  stopped: 6,
};

function sortBots(bots: BotSnapshot[]): BotSnapshot[] {
  return [...bots].sort(
    (a, b) =>
      (BOT_STATE_SORT_ORDER[a.state] ?? 99) - (BOT_STATE_SORT_ORDER[b.state] ?? 99),
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OperationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: fleetState, isLoading: stateLoading, isError: stateError } = useFleetState();
  const { data: weather, isLoading: weatherLoading } = useFleetWeather();
  const { data: recommendations } = useFleetRecommendations();
  // Derive regime from weather for the correlation endpoint
  const { data: correlation } = useFleetCorrelation(weather?.current_regime);

  // One-at-a-time accordion: the expanded bot row id
  const [expandedBotId, setExpandedBotId] = useState<string | null>(null);
  // Detail drawer: which bot's full detail is shown
  const [drawerBotId, setDrawerBotId] = useState<string | null>(null);

  // On mount, read ?bot= param and open drawer + expand that row
  useEffect(() => {
    const botParam = searchParams.get('bot');
    if (botParam) {
      setExpandedBotId(botParam);
      setDrawerBotId(botParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggleRow(botId: string) {
    setExpandedBotId((prev) => (prev === botId ? null : botId));
  }

  function handleOpenDrawer(botId: string) {
    setDrawerBotId(botId);
    router.replace(`/operations?bot=${botId}`, { scroll: false });
  }

  function handleCloseDrawer() {
    setDrawerBotId(null);
    router.replace('/operations', { scroll: false });
  }

  const bots = sortBots(fleetState?.bot_snapshots ?? []);

  return (
    <div className="flex flex-col gap-4">
      {/* Page heading */}
      <div>
        <h2 className="text-lg font-semibold">Operations</h2>
        <p className="text-sm text-muted-foreground">Monitor and manage your live trading fleet</p>
      </div>

      {/* Fleet weather context banner */}
      {weatherLoading && <Skeleton className="h-14 w-full rounded-lg" />}
      {weather && !weatherLoading && <FleetWeatherBanner weather={weather} />}

      {/* High correlation alert — only when pairs exist */}
      {correlation && weather && (
        <HighCorrelationBanner
          pairs={correlation.highly_correlated_pairs}
          regime={weather.current_regime}
        />
      )}

      {/* Main layout: bot list + analytics sidebar (sidebar added in Batch 8) */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-2">
          {stateLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
          )}

          {stateError && (
            <p className="text-sm text-destructive py-4">
              Failed to load fleet data. Is the backend running?
            </p>
          )}

          {!stateLoading && !stateError && bots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No bots deployed yet.
            </p>
          )}

          {!stateLoading &&
            !stateError &&
            bots.map((bot) => (
              <BotListRow
                key={bot.bot_id}
                bot={bot}
                isExpanded={expandedBotId === bot.bot_id}
                onToggle={() => handleToggleRow(bot.bot_id)}
                onOpenDrawer={() => handleOpenDrawer(bot.bot_id)}
                recommendations={recommendations ?? []}
              />
            ))}
        </div>

        {/* FleetAnalyticsSidebar — hidden below xl to avoid crowding the bot list */}
        <div className="hidden xl:block">
          <FleetAnalyticsSidebar weather={weather} />
        </div>
      </div>

      {/* Bot detail drawer */}
      <BotDetailDrawer
        botId={drawerBotId}
        bots={fleetState?.bot_snapshots ?? []}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
