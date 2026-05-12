'use client';

/**
 * DeploymentStageCard — fourth row of the F.2 timeline.
 *
 * Three mutually-exclusive states drive the layout:
 *
 *   1. Bot not yet deployed + deep approved
 *      → pending status, "Deploy as Paper Bot" CTA opens DeployBotModal.
 *   2. Bot not yet deployed + deep NOT approved
 *      → skipped status, "Deployment not authorized" copy.
 *   3. Bot deployed
 *      → complete status, bot state badge + trading mode + deployed_at +
 *        "View Bot Details" link to /operations?bot=${bot_id}.
 *
 * The "Deploy" CTA only fires when deep validation approved the
 * passport — the engine's seven-gate policy blocks anything else.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Rocket, ExternalLink, ShieldOff } from 'lucide-react';
import StageCard, { type StageStatus } from './StageCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DeployBotModal from './DeployBotModal';
import { cn } from '@/lib/utils';
import type { StrategyLifecycleView } from '@/types/api';

interface DeploymentStageCardProps {
  view: StrategyLifecycleView;
}

interface DerivedState {
  status: StageStatus;
  statusLabel: string;
  variant: 'awaiting_approval' | 'ready_to_deploy' | 'not_authorized' | 'deployed';
}

export function deriveDeploymentState(view: StrategyLifecycleView): DerivedState {
  if (view.bot_id !== null) {
    return { status: 'complete', statusLabel: 'Deployed', variant: 'deployed' };
  }
  if (view.deep_passport_deployment_approved === true) {
    return { status: 'pending', statusLabel: 'Ready', variant: 'ready_to_deploy' };
  }
  if (view.deep_passport_deployment_approved === false) {
    return { status: 'skipped', statusLabel: 'Not authorized', variant: 'not_authorized' };
  }
  // No deep result yet — show a soft pending state since deployment
  // cannot proceed until deep validation completes.
  return { status: 'pending', statusLabel: 'Awaiting deep', variant: 'awaiting_approval' };
}

function botStateBadgeClass(state: string | null): string {
  switch (state) {
    case 'active':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300';
    case 'ramping':
      return 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300';
    case 'paused_user':
    case 'paused_regime':
    case 'paused_monitoring':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300';
    case 'circuit_breaker':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'stopped':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function DeploymentStageCard({ view }: DeploymentStageCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const state = deriveDeploymentState(view);

  return (
    <>
      <StageCard
        stageNumber={4}
        title="Bot deployment"
        subtitle={
          state.variant === 'deployed'
            ? 'Paper bot live and ramping'
            : state.variant === 'ready_to_deploy'
              ? 'Ready to deploy as paper bot'
              : state.variant === 'not_authorized'
                ? 'Deployment blocked by deep validation'
                : 'Awaiting deep validation result'
        }
        status={state.status}
        statusLabel={state.statusLabel}
        testId="stage-deployment"
      >
        {state.variant === 'ready_to_deploy' && (
          <div className="space-y-3" data-testid="deployment-state-ready">
            <p className="text-sm text-muted-foreground">
              Deep validation approved this passport.  Spin up a paper bot
              to start recording live trade evidence — no real capital at
              risk.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              data-testid="deployment-deploy-cta"
            >
              <Rocket className="h-4 w-4" />
              Deploy as Paper Bot
            </Button>
          </div>
        )}

        {state.variant === 'not_authorized' && (
          <div className="space-y-3" data-testid="deployment-state-not-authorized">
            <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <ShieldOff className="h-4 w-4" />
              Deployment not authorized by deep validation.
            </p>
            <p className="text-xs text-muted-foreground">
              The deep passport flagged blocking reasons that prevent
              paper-bot promotion.  See stage 3 above for the list of
              findings.
            </p>
          </div>
        )}

        {state.variant === 'awaiting_approval' && (
          <p className="text-xs text-muted-foreground" data-testid="deployment-state-awaiting">
            Deployment unlocks once deep validation completes with an
            approval verdict.
          </p>
        )}

        {state.variant === 'deployed' && view.bot_id && (
          <div className="space-y-3" data-testid="deployment-state-deployed">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-[10px] uppercase', botStateBadgeClass(view.bot_state))}
                data-testid="deployment-bot-state"
              >
                {view.bot_state ?? 'unknown'}
              </Badge>
              {view.bot_trading_mode && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {view.bot_trading_mode}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                deployed {formatDateTime(view.bot_deployed_at)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-md border bg-card p-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Bot ID
                </span>
                <p className="font-mono text-xs mt-0.5 break-all">
                  {view.bot_id.slice(0, 8)}…
                </p>
              </div>
              {view.bot_initial_capital !== null && (
                <div className="rounded-md border bg-card p-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Initial capital
                  </span>
                  <p className="font-mono text-xs mt-0.5">
                    ${view.bot_initial_capital.toLocaleString()}
                  </p>
                </div>
              )}
              {view.bot_capital_allocation_pct !== null && (
                <div className="rounded-md border bg-card p-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Fleet allocation
                  </span>
                  <p className="font-mono text-xs mt-0.5">
                    {(view.bot_capital_allocation_pct * 100).toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
            <Link
              href={`/operations?bot=${view.bot_id}`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              data-testid="deployment-view-bot-link"
            >
              View Bot Details
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </StageCard>

      <DeployBotModal view={view} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
