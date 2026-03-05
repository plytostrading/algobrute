'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getRecommendationLabel } from '@/lib/regimeLabel';
import { trackUnsupportedRecommendationAction } from '@/lib/telemetry';
import { usePauseBot, useRetireBot, useUpdateBot } from '@/hooks/useBots';

function evidenceNumber(
  evidence: Record<string, number | string>,
  key: string,
): number | null {
  const raw = evidence[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizePct(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value <= 1 ? value * 100 : value;
}

interface RecommendationActionButtonProps {
  recommendationType: string;
  botId?: string | null;
  botName?: string | null;
  reason?: string;
  evidence?: Record<string, number | string>;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  addHref?: string;
}

export default function RecommendationActionButton({
  recommendationType,
  botId,
  botName,
  reason,
  evidence,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  className,
  addHref = '/workbench',
}: RecommendationActionButtonProps) {
  const pauseBot = usePauseBot();
  const retireBot = useRetireBot();
  const updateBot = useUpdateBot();

  const [confirmRetire, setConfirmRetire] = useState(false);
  const [openAllocation, setOpenAllocation] = useState(false);
  const [targetAllocationPct, setTargetAllocationPct] = useState('');

  const isAllocationType =
    recommendationType === 'reduce' ||
    recommendationType === 'increase' ||
    recommendationType === 'rebalance';
  const hasDirectAction =
    (recommendationType === 'pause' && !!botId) ||
    (recommendationType === 'kill' && !!botId) ||
    (isAllocationType && !!botId) ||
    recommendationType === 'add';
  const unsupportedReportedKey = useRef<string | null>(null);

  useEffect(() => {
    if (hasDirectAction) return;
    const key = `${recommendationType}:${botId ?? 'none'}`;
    if (unsupportedReportedKey.current === key) return;
    trackUnsupportedRecommendationAction({
      recommendationType,
      botId,
      botName,
      source: 'recommendation-action-button',
    });
    unsupportedReportedKey.current = key;
  }, [botId, botName, hasDirectAction, recommendationType]);

  if (recommendationType === 'pause' && botId) {
    return (
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        disabled={pauseBot.isPending}
        onClick={() => {
          pauseBot.mutate(botId, {
            onSuccess: () => toast.success(`${botName ?? 'Bot'} paused`),
            onError: (err) => toast.error(`Pause failed: ${err.message}`),
          });
        }}
      >
        {getRecommendationLabel(recommendationType)}
      </Button>
    );
  }

  if (recommendationType === 'kill' && botId) {
    return (
      <>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={className}
          onClick={() => setConfirmRetire(true)}
        >
          {getRecommendationLabel(recommendationType)}
        </Button>
        <AlertDialog open={confirmRetire} onOpenChange={setConfirmRetire}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retire this bot?</AlertDialogTitle>
              <AlertDialogDescription>
                This will soft-stop the bot and close all open positions. This action cannot be undone automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={retireBot.isPending}
                onClick={() => {
                  retireBot.mutate(botId, {
                    onSuccess: () => toast.success('Bot retired'),
                    onError: (err) => toast.error(`Retire failed: ${err.message}`),
                  });
                }}
              >
                {retireBot.isPending ? 'Retiring…' : 'Retire'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (isAllocationType && botId) {
    return (
      <>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={className}
          onClick={() => {
            const target = normalizePct(
              evidence ? evidenceNumber(evidence, 'target_allocation_pct') : null,
            );
            const current = normalizePct(
              evidence ? evidenceNumber(evidence, 'allocation_pct') : null,
            );
            const initial = target ?? current;
            setTargetAllocationPct(initial != null ? String(Number(initial.toFixed(2))) : '');
            setOpenAllocation(true);
          }}
        >
          Adjust Allocation
        </Button>

        <AlertDialog open={openAllocation} onOpenChange={setOpenAllocation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Adjust bot allocation?</AlertDialogTitle>
              <AlertDialogDescription>
                {botName ?? 'Selected bot'}
                {reason ? `: ${reason}` : '.'}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <Label htmlFor="recommendation-target-allocation" className="text-xs">
                Target allocation (%)
              </Label>
              <Input
                id="recommendation-target-allocation"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={targetAllocationPct}
                onChange={(e) => setTargetAllocationPct(e.target.value)}
                className="font-mono-data"
                placeholder="e.g. 15"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={updateBot.isPending}
                onClick={(e) => {
                  const pct = Number(targetAllocationPct);
                  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
                    e.preventDefault();
                    toast.error('Enter a target allocation between 0 and 100%.');
                    return;
                  }
                  updateBot.mutate(
                    {
                      botId,
                      updates: { capital_allocation_pct: pct / 100 },
                    },
                    {
                      onSuccess: () => toast.success('Bot allocation updated'),
                      onError: (err) => toast.error(`Update failed: ${err.message}`),
                    },
                  );
                  setOpenAllocation(false);
                }}
              >
                {updateBot.isPending ? 'Updating…' : 'Confirm Update'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (recommendationType === 'add') {
    return (
      <Button variant={buttonVariant} size={buttonSize} className={className} asChild>
        <Link href={addHref}>Add Strategy</Link>
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize} className={className} disabled>
            {getRecommendationLabel(recommendationType)}
          </Button>
        </TooltipTrigger>
        <TooltipContent>No direct API action is available for this recommendation type yet.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
