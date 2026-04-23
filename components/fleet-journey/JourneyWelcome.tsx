'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowRight,
  Rocket,
  ShieldCheck,
  Activity,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { JourneyResponse } from '@/hooks/useFleetJourney';
import { useLinkPaperPassports } from '@/hooks/useDashboard';

/**
 * Zero-data-welcome card — shown when the user hasn't yet deployed bots
 * or accumulated trades/interventions. Replaces the 12+ stacked
 * "no data" skeletons with a single confident onboarding story.
 *
 * The card still surfaces the real signals we DO have (regime context,
 * current fleet posture) instead of pretending we know nothing.
 */
export function JourneyWelcome({ data }: { data: JourneyResponse }) {
  const regimeLabel = data.hero.current_regime
    ? labelForRegime(data.hero.current_regime)
    : 'UNKNOWN';
  const regimeDays =
    data.regime_effectiveness.reduce((s, r) => s + r.days_in_regime, 0);
  const regimeMix = data.regime_effectiveness
    .sort((a, b) => b.days_in_regime - a.days_in_regime)
    .slice(0, 3);

  return (
    <div className="rounded-xl border bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Rocket className="h-3.5 w-3.5" />
            Your fleet hasn&apos;t started trading yet
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            The platform is watching — just waiting for your bots to close
            their first trades.
          </h2>
          <p className="text-base text-muted-foreground">
            This page becomes the risk-management audit trail of everything
            the platform does for you. It&apos;s designed to answer one
            question: <span className="font-semibold text-foreground">is the platform actually managing my risk, and is it doing it well?</span>
          </p>
        </div>

        {/* What we already know */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            What the platform already knows about your environment
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Tile
              label="Current regime"
              value={regimeLabel}
              sub={`${regimeDays} days of history`}
              icon={<Activity className="h-4 w-4" />}
            />
            <Tile
              label="Fleet posture"
              value={`${(data.hero.fleet_multiplier * 100).toFixed(0)}%`}
              sub="sizing multiplier (neutral)"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <Tile
              label="Regime mix (90d)"
              value={regimeMix.map((r) => r.regime_label).join(' · ') || '—'}
              sub={
                regimeMix.length > 0
                  ? regimeMix
                      .map((r) => `${labelForRegime(r.regime)} ${r.days_in_regime}d`)
                      .join(', ')
                  : ''
              }
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* What lights up + when */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            What each section below paints — once you&apos;re trading
          </div>
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            <Bullet>Journey timeline with regime bands, dual equity lines, and every intervention pinned to when it happened</Bullet>
            <Bullet>Fleet exposure over time — the protection you see when the platform damps sizing in adverse regimes</Bullet>
            <Bullet>Intervention ledger by mechanism, with precision (did the intervention actually pre-empt a shadow loss?)</Bullet>
            <Bullet>Drawdown and P&amp;L distributions comparing your live fleet to the no-platform shadow baseline</Bullet>
            <Bullet>Per-bot Sharpe and outcome scatter — see which bots are stars and which are drags</Bullet>
            <Bullet>Regime × strategy attribution heatmap: where each strategy earns its keep</Bullet>
          </ul>
        </div>

        {/* Next steps */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Badge variant="outline" className="gap-1 text-xs">
            Next
          </Badge>
          <Link
            href="/workbench"
            className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
          >
            Deploy bots from your Workbench backtests
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <span className="text-xs text-muted-foreground">·</span>
          <Link
            href="/portfolio"
            className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
          >
            Inspect your existing bots
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <span className="text-xs text-muted-foreground">·</span>
          <LinkPaperPassportsButton />
        </div>
      </div>
    </div>
  );
}

function LinkPaperPassportsButton() {
  const [confirming, setConfirming] = useState(false);
  const link = useLinkPaperPassports();

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setConfirming(false);
    link.mutate(
      { overwrite: false, dry_run: false },
      {
        onSuccess: (data) => {
          toast.success(
            `Linked ${data.n_linked} paper bots (skipped ${data.n_skipped}, errored ${data.n_errored}).`,
          );
        },
        onError: (err) => toast.error(err.message || 'Link failed'),
      },
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant={confirming ? 'destructive' : 'outline'}
          className="h-7 gap-1 text-xs"
          onClick={handleClick}
          disabled={link.isPending}
        >
          <Zap className="h-3 w-3" />
          {link.isPending
            ? 'Linking…'
            : confirming
              ? 'Click to confirm (bypasses admission)'
              : 'Enable true-auto (link paper passports)'}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        Links each paper bot to its most-recent matching-strategy
        passport, BYPASSING the deployment-admission gates. Paper bots
        only — live bots are refused. Once linked, the production
        strategy-evaluation pipeline will route real regime-conditioned
        signals to them. Every link is audit-logged as{' '}
        <code>paper_passport_link_admission_bypassed</code>.
      </TooltipContent>
    </Tooltip>
  );
}

function Tile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-xl font-semibold">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

function labelForRegime(regime: string): string {
  const m: Record<string, string> = {
    '1': 'NORMAL',
    '2': 'LOW_VOL',
    '3': 'ELEVATED_VOL',
    '4': 'CRISIS',
  };
  return m[regime] ?? regime;
}
