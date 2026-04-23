'use client';

import {
  Activity,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { StoryChapter } from '../StoryChapter';
import { InfoCallout } from '../InfoCallout';
import { PlatformBaselineDelta } from '../PlatformBaselineDelta';
import { SmallMultiplesGrid, type MultiplePanel } from '../SmallMultiplesGrid';
import { FleetRoster } from '../FleetRoster';
import type { JourneyResponse } from '@/hooks/useFleetJourney';

function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

function tone(n: number | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (n === null || n === undefined || Math.abs(n) < 1e-9) return 'neutral';
  return n > 0 ? 'positive' : 'negative';
}

function labelForRegime(r: string | null): string {
  const m: Record<string, string> = {
    '1': 'NORMAL',
    '2': 'LOW_VOL',
    '3': 'ELEVATED_VOL',
    '4': 'CRISIS',
  };
  if (!r) return '—';
  return m[r] ?? r;
}

export function Ch1MeetYourFleet({ data }: { data: JourneyResponse }) {
  const { hero, lift, bots, per_bot_sparklines } = data;
  const nActive = bots.filter((b) => b.n_trades > 0).length;
  const nDormant = bots.length - nActive;

  const panels: MultiplePanel[] = per_bot_sparklines.map((s) => ({
    key: s.bot_id,
    label: s.ticker,
    sublabel: s.strategy_id.replace(/_/g, ' '),
    values: s.points.map((p) => p.cum_pnl_pct),
    accent: s.delta_30d_pct >= 0 ? '#10b981' : '#ef4444',
  }));

  return (
    <StoryChapter
      number={1}
      title="Meet your fleet"
      kicker={`${bots.length} bots across ${new Set(bots.map((b) => b.ticker)).size} tickers · ${nActive} actively trading · ${nDormant} dormant`}
    >
      {/* Platform / Baseline / Δ tiles */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <PlatformBaselineDelta
          label="Cumulative P&L"
          platform={fmtPct(lift.live_total_pnl_pct, 2)}
          baseline={fmtPct(lift.shadow_total_pnl_pct, 2)}
          delta={fmtPct(lift.pnl_lift_pct, 2)}
          deltaTone={tone(lift.pnl_lift_pct)}
          icon={<Sparkles className="h-3.5 w-3.5" />}
          helpText="Platform = your live fleet. Baseline = shadow counterfactual without platform risk-management."
        />
        <PlatformBaselineDelta
          label="Max drawdown"
          platform={fmtPct(-lift.live_max_dd_pct, 2)}
          baseline={fmtPct(-lift.shadow_max_dd_pct, 2)}
          delta={fmtPct(lift.dd_protection_pct, 2)}
          deltaTone={lift.dd_protection_pct > 0 ? 'positive' : lift.dd_protection_pct < 0 ? 'negative' : 'neutral'}
          icon={<Shield className="h-3.5 w-3.5" />}
          helpText="Positive Δ means platform held drawdown tighter than the unmanaged baseline."
        />
        <PlatformBaselineDelta
          label="Volatility"
          platform={lift.live_vol_pct !== null ? fmtPct(lift.live_vol_pct, 2) : '—'}
          baseline={lift.shadow_vol_pct !== null ? fmtPct(lift.shadow_vol_pct, 2) : '—'}
          delta={lift.vol_reduction_pct !== null ? fmtPct(lift.vol_reduction_pct, 1) : '—'}
          deltaTone={tone(lift.vol_reduction_pct)}
          icon={<Activity className="h-3.5 w-3.5" />}
          helpText="Positive Δ = platform reduced vol vs. baseline."
        />
        <PlatformBaselineDelta
          label="Current regime"
          platform={labelForRegime(hero.current_regime)}
          baseline={`×${(hero.fleet_multiplier * 100).toFixed(0)}%`}
          delta={`${hero.n_interventions} actions`}
          deltaTone="neutral"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          helpText="Baseline column shows current fleet multiplier; Δ shows action count."
        />
      </div>

      {panels.length > 0 && (
        <>
          <InfoCallout title="Last 30 days per bot" icon={<Users className="h-3.5 w-3.5" />}>
            Each panel is one bot&apos;s cumulative P&L trajectory over the last
            30 days. Compare shapes across bots to spot winners, laggards,
            and bots that flatlined.
          </InfoCallout>
          <SmallMultiplesGrid
            panels={panels}
            columns={4}
            panelHeight={52}
          />
        </>
      )}

      <FleetRoster bots={bots} />
    </StoryChapter>
  );
}
