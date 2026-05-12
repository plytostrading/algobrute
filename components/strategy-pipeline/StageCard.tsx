'use client';

/**
 * StageCard — generic per-stage container for the strategy-pipeline
 * timeline view (F.2).
 *
 * Each row on the timeline is a single :type:`StageCard` with:
 *   - a left rail accent + status-colored icon
 *   - a header (title + status pill)
 *   - a free-form content body slot
 *
 * The status drives the entire visual tone:
 *
 *   complete    → emerald accent + CheckCircle2 icon.
 *   in_progress → blue accent + animated spinner.
 *   pending     → muted accent + Clock icon.
 *   failed      → destructive accent + AlertTriangle icon.
 *
 * Kept presentation-only — the per-stage cards
 * (OriginationStageCard / LightBacktestStageCard / ...) decide which
 * status applies and feed it down.
 */

import type { ReactNode } from 'react';
import { CheckCircle2, Clock, Loader2, AlertTriangle, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StageStatus = 'complete' | 'in_progress' | 'pending' | 'failed' | 'skipped';

interface StageCardProps {
  title: string;
  subtitle?: string;
  status: StageStatus;
  /** Optional stage number, e.g. 1 / 2 / 3 — drives the badge prefix. */
  stageNumber?: number;
  /** Right-aligned status label override (default: title-cased status). */
  statusLabel?: string;
  /** Body content rendered inside CardContent. */
  children?: ReactNode;
  testId?: string;
}

interface StatusStyle {
  Icon: typeof CheckCircle2;
  iconClass: string;
  borderClass: string;
  pillVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  pillClass: string;
  defaultLabel: string;
  animate?: boolean;
}

function statusStyle(status: StageStatus): StatusStyle {
  switch (status) {
    case 'complete':
      return {
        Icon: CheckCircle2,
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: 'border-l-4 border-l-emerald-500',
        pillVariant: 'outline',
        pillClass:
          'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        defaultLabel: 'Complete',
      };
    case 'in_progress':
      return {
        Icon: Loader2,
        iconClass: 'text-blue-600 dark:text-blue-400 animate-spin',
        borderClass: 'border-l-4 border-l-blue-500',
        pillVariant: 'outline',
        pillClass:
          'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300',
        defaultLabel: 'In progress',
        animate: true,
      };
    case 'failed':
      return {
        Icon: AlertTriangle,
        iconClass: 'text-destructive',
        borderClass: 'border-l-4 border-l-destructive',
        pillVariant: 'outline',
        pillClass: 'bg-destructive/15 text-destructive border-destructive/30',
        defaultLabel: 'Failed',
      };
    case 'skipped':
      return {
        Icon: Circle,
        iconClass: 'text-muted-foreground/60',
        borderClass: 'border-l-4 border-l-muted-foreground/30',
        pillVariant: 'outline',
        pillClass: 'bg-muted text-muted-foreground border-border',
        defaultLabel: 'Skipped',
      };
    case 'pending':
    default:
      return {
        Icon: Clock,
        iconClass: 'text-muted-foreground/60',
        borderClass: 'border-l-4 border-l-muted-foreground/30',
        pillVariant: 'outline',
        pillClass: 'bg-muted text-muted-foreground border-border',
        defaultLabel: 'Pending',
      };
  }
}

export default function StageCard({
  title,
  subtitle,
  status,
  stageNumber,
  statusLabel,
  children,
  testId,
}: StageCardProps) {
  const style = statusStyle(status);
  const { Icon } = style;
  return (
    <Card
      className={cn('overflow-hidden', style.borderClass)}
      data-testid={testId}
      data-stage-status={status}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Status icon — top-aligned so it stays anchored to the
              header even when the body grows. */}
          <div className="shrink-0 pt-0.5">
            <Icon className={cn('h-5 w-5', style.iconClass)} aria-hidden />
          </div>

          {/* Header + body — flex-1 so we eat all remaining width. */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-tight">
                  {stageNumber !== undefined && (
                    <span className="mr-1.5 text-xs text-muted-foreground font-mono">
                      {stageNumber}.
                    </span>
                  )}
                  {title}
                </h3>
                {subtitle && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
              <Badge
                variant={style.pillVariant}
                className={cn('shrink-0 text-[10px] uppercase tracking-wide', style.pillClass)}
                data-testid={testId ? `${testId}-status` : undefined}
              >
                {statusLabel ?? style.defaultLabel}
              </Badge>
            </div>

            {children !== undefined && (
              <div className="mt-3 text-sm">{children}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
