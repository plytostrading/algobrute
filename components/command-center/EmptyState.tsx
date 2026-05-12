'use client';

import Link from 'next/link';
import {
  Sparkles,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
  Activity,
  TrendingUp,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlpacaStatus } from '@/hooks/useAlpacaStatus';

/**
 * Command Center empty-state — shown to new beta testers who have no bots
 * deployed. Routes them to either:
 *   - /originate (dialogue-driven origination with 14 agents + light backtest)
 *   - /workbench (parameter-driven Build tab with full backtest)
 *
 * Phase Q Wave 1.C — F.3.
 */
export default function EmptyState() {
  const { data: alpacaStatus } = useAlpacaStatus();
  // Beta is paper-only — fall back to the legacy `connected` flag only when the
  // mode-aware field is missing (older backends pre-E.4.B).
  const paperConnected =
    alpacaStatus?.paper_connected ?? alpacaStatus?.connected ?? false;

  return (
    <div className="flex flex-col gap-6" data-testid="onboarding-empty-state">
      {/* Hero */}
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to AlgoBrute</h1>
          <p className="text-base text-muted-foreground">
            Let&apos;s create your first trading bot.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            AlgoBrute helps you discover, validate, and deploy algorithmic trading
            strategies. Our agents talk through your ideas, run quantitative
            validation, and only let strategies through that meet rigorous
            statistical bars.
          </p>
        </CardContent>
      </Card>

      {/* CTA cards — stacked on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Card 1 — Originate via dialogue */}
        <Card className="flex flex-col" data-testid="onboarding-cta-originate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg">Originate via dialogue</CardTitle>
            </div>
            <CardDescription className="pt-2">
              Chat with our 14 specialized agents to refine your strategy idea.
              Light backtest validation happens automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Best for:</span>{' '}
              I have an idea but want help shaping it.
            </p>
            <Button asChild data-testid="onboarding-originate-button">
              <Link href="/originate">
                Start a dialogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card 2 — Build from parameters */}
        <Card className="flex flex-col" data-testid="onboarding-cta-workbench">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">
                <FlaskConical className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg">Build from parameters</CardTitle>
            </div>
            <CardDescription className="pt-2">
              Configure a strategy from scratch with the Workbench&apos;s
              parameter-driven builder. Full backtest runs on submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Best for:</span>{' '}
              I know exactly what I want to test.
            </p>
            <Button asChild variant="secondary" data-testid="onboarding-workbench-button">
              <Link href="/workbench">
                Open the Workbench
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* What you'll get — value proposition bullets */}
      <Card data-testid="onboarding-value-list">
        <CardHeader>
          <CardTitle className="text-base">What you&apos;ll get</CardTitle>
          <CardDescription>
            Every strategy that ships on AlgoBrute clears the same bar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">
                Regime-aware backtests across CPCV folds + Monte Carlo paths
              </span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">
                Class-conditional verdicts that account for strategy-type metric
                profiles
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">
                Paper-trade deployment with real Alpaca paper sandbox
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">
                Live monitoring with regime weather + circuit breakers
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Alpaca-not-connected callout */}
      {!paperConnected && (
        <Card
          className="border-amber-500/30 bg-amber-500/5"
          data-testid="onboarding-alpaca-callout"
        >
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Set up Alpaca first</p>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll need to connect your Alpaca paper account before
                  deploying bots.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              data-testid="onboarding-alpaca-link"
            >
              <Link href="/settings">
                Open Settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
