'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Rocket,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useStrategies } from '@/hooks/useStrategies';
import { useDeployBot } from '@/hooks/useBots';
import { usePromoteToPassport, usePassportForJob } from '@/hooks/useBacktestWorkflow';
import type { PassportPromotionResponse } from '@/types/api';
import StrategyDNA from '@/components/portfolio/StrategyDNA';

// ---------------------------------------------------------------------------
// No-backtest guide
// ---------------------------------------------------------------------------

function NoBacktestGuide() {
  return (
    <div className="max-w-2xl">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-12 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium">No backtest result yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run a backtest in the{' '}
            <strong>Build &amp; Test</strong> tab first, then return here to generate a
            Strategy Passport and deploy.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5">1</span> Build &amp; Test
            <ArrowRight className="h-3 w-3" />
            <span className="rounded bg-muted px-1.5 py-0.5">2</span> Generate Passport
            <ArrowRight className="h-3 w-3" />
            <span className="rounded bg-muted px-1.5 py-0.5">3</span> Deploy
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PassportSection sub-component
// ---------------------------------------------------------------------------

interface PassportSectionProps {
  passport: PassportPromotionResponse | undefined;
  isPending: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  onGenerate: () => void;
}

function PassportSection({
  passport,
  isPending,
  isError,
  errorMessage,
  onGenerate,
}: PassportSectionProps) {
  if (passport) {
    const approved = passport.deployment_approved;
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          {approved ? (
            <ShieldCheck className="h-5 w-5 text-success" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-warning" />
          )}
          <span className="text-sm font-semibold">Strategy Passport</span>
          <Badge variant="outline" className="font-mono-data text-[10px]">
            v{passport.passport_version}
          </Badge>
          {approved ? (
            <Badge className="border-success/30 bg-success/10 text-[10px] text-success">
              Deployment Approved
            </Badge>
          ) : (
            <Badge className="border-warning/30 bg-warning/10 text-[10px] text-warning">
              Not Approved
            </Badge>
          )}
        </div>
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <p className="truncate font-mono-data text-[10px] text-muted-foreground">
            {passport.passport_id}
          </p>
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Reliability
              </span>
              <span
                className={`font-mono-data text-sm font-bold ${
                  passport.reliability_overall >= 0.7
                    ? 'text-success'
                    : passport.reliability_overall >= 0.4
                      ? 'text-warning'
                      : 'text-destructive'
                }`}
              >
                {(passport.reliability_overall * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ticker
              </span>
              <span className="font-mono-data text-sm font-bold">{passport.ticker}</span>
            </div>
          </div>
          {passport.deployment_notes && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {passport.deployment_notes}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-semibold">Strategy Passport</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Generate an immutable, versioned record of this strategy&apos;s statistical validation,
        risk rules, and deployment approval decision.
      </p>
      {isError && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorMessage ?? 'Passport generation failed. Please try again.'}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={onGenerate} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Generating…
          </>
        ) : isError ? (
          <>
            <RefreshCcw className="mr-2 h-3.5 w-3.5" />
            Retry Passport
          </>
        ) : (
          <>
            <Shield className="mr-2 h-3.5 w-3.5" />
            Generate Strategy Passport
          </>
        )}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeployTab
// ---------------------------------------------------------------------------

interface DeployTabProps {
  selectedStrategyId: string | null;
  activeJobId: string | null;
}

export default function DeployTab({ selectedStrategyId, activeJobId }: DeployTabProps) {
  const [strategyId, setStrategyId] = useState(selectedStrategyId ?? '');
  const [ticker, setTicker] = useState('SPY');
  const [capitalPct, setCapitalPct] = useState('25');
  const [initialCapital, setInitialCapital] = useState('50000');

  // Sync strategy from parent Build tab selection
  useEffect(() => {
    if (selectedStrategyId) setStrategyId(selectedStrategyId);
  }, [selectedStrategyId]);

  const promoteMutation = usePromoteToPassport();
  const passportQuery = usePassportForJob(activeJobId);
  const passport = passportQuery.data;

  // Auto-fill strategy + ticker from passport once on first availability.
  // A ref prevents overwriting manual user edits on subsequent re-renders.
  const passportSyncedRef = useRef(false);
  useEffect(() => {
    passportSyncedRef.current = false;
  }, [activeJobId]);
  useEffect(() => {
    if (passport && !passportSyncedRef.current) {
      passportSyncedRef.current = true;
      if (passport.strategy_id) setStrategyId(passport.strategy_id);
      if (passport.ticker) setTicker(passport.ticker);
    }
  }, [passport]);

  const { data: strategies = [] } = useStrategies();
  const deployBot = useDeployBot();

  const handleLaunch = useCallback(() => {
    if (!strategyId || !passport?.passport_id) return;
    deployBot.mutate({
      strategy_id: strategyId,
      ticker,
      capital_allocation_pct: Number(capitalPct) / 100,
      initial_capital: Number(initialCapital),
      passport_id: passport.passport_id,
    });
  }, [strategyId, ticker, capitalPct, initialCapital, passport, deployBot]);

  const isReady = !!strategyId && !!ticker && Number(capitalPct) > 0 && Number(initialCapital) > 0;
  const canLaunch = isReady && !!passport?.passport_id;
  const deploymentNotApproved = passport !== undefined && !passport.deployment_approved;

  if (!activeJobId) return <NoBacktestGuide />;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Strategy DNA — always expanded in Deploy context; shows reliability before user commits */}
      <StrategyDNA jobId={activeJobId} compact={false} />

      <Card>
        <CardHeader>
          <CardTitle>Deploy Strategy</CardTitle>
          <CardDescription>
            {activeJobId
              ? 'Backtest validated — generate a passport, then launch a live bot.'
              : 'Configure and launch a live bot.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Passport — only shown when a backtest job is active */}
          {activeJobId && (
            <>
              <PassportSection
                passport={passport}
                isPending={promoteMutation.isPending}
                isError={promoteMutation.isError}
                errorMessage={promoteMutation.error?.message}
                onGenerate={() => promoteMutation.mutate(activeJobId)}
              />
              <Separator />
            </>
          )}

          {/* Strategy & Ticker */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger id="strategy">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s.strategy_id} value={s.strategy_id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="font-mono-data uppercase"
                placeholder="SPY"
              />
            </div>
          </div>

          {/* Capital */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="capital">Initial Capital ($)</Label>
              <Input
                id="capital"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="font-mono-data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capital-pct">Capital Allocation (%)</Label>
              <Input
                id="capital-pct"
                type="number"
                value={capitalPct}
                onChange={(e) => setCapitalPct(e.target.value)}
                min="1"
                max="100"
                step="1"
                className="font-mono-data"
              />
            </div>
          </div>

          <Separator />

          {/* Not-approved passport warning — shown above the launch button */}
          {deploymentNotApproved && (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                This strategy was <strong>not deployment-approved</strong> by the passport
                analysis. Launching will override the safety recommendation.
              </span>
            </div>
          )}

          {/* Bot launch feedback */}
          {deployBot.isSuccess && (
            <div className="flex items-center justify-between rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Passport-backed deployment launched successfully!
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1 text-xs text-success hover:bg-success/20 hover:text-success"
                asChild
              >
                <Link href="/operations">
                  View Fleet <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}
          {deployBot.isError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {deployBot.error?.message ?? 'Deployment failed. Please try again.'}
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="lg"
                className="w-full bg-success text-white hover:bg-success/90"
                disabled={!canLaunch || deployBot.isPending}
              >
                <Rocket className="mr-2 h-4 w-4" />
                {deployBot.isPending ? 'Launching…' : 'Launch Deployment'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Launch live deployment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deploy <strong>{strategyId}</strong> on <strong>{ticker}</strong> with{' '}
                  <strong>${Number(initialCapital).toLocaleString()}</strong> initial capital at{' '}
                  <strong>{capitalPct}%</strong> allocation. Real funds will be committed
                  immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-success text-white hover:bg-success/90"
                  onClick={handleLaunch}
                >
                  Confirm Launch
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
