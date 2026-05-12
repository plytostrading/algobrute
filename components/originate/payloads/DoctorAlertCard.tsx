'use client';

/**
 * DoctorAlertCard — Doctor monitoring-alert renderer.
 *
 * Renders the trigger type, severity (colour-coded), action-required
 * flag, and any free-form message.  The whole card is dismissable via
 * the `X` button — dismissal is local state only in Wave 1.B (no
 * server round-trip).
 *
 * Engine source: `agents/structured_payload.py::DoctorAlertPayload`.
 */

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X as XIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type {
  DoctorAlertPayload,
  DoctorSeverity,
  DoctorTrigger,
} from '@/types/originate';
import { cn } from '@/lib/utils';

interface DoctorAlertCardProps {
  payload: DoctorAlertPayload;
}

interface SeverityStyle {
  Icon: typeof AlertCircle;
  variant: 'default' | 'destructive';
  containerClassName: string;
  iconClassName: string;
  badgeClassName: string;
}

function severityStyle(s: DoctorSeverity): SeverityStyle {
  switch (s) {
    case 'high':
      return {
        Icon: AlertCircle,
        variant: 'destructive',
        containerClassName: 'border-destructive/40',
        iconClassName: 'text-destructive',
        badgeClassName:
          'bg-destructive/15 text-destructive border-destructive/30',
      };
    case 'medium':
      return {
        Icon: AlertCircle,
        variant: 'default',
        containerClassName: 'border-amber-500/40 bg-amber-500/5',
        iconClassName: 'text-amber-600 dark:text-amber-400',
        badgeClassName:
          'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
      };
    case 'low':
    default:
      return {
        Icon: Info,
        variant: 'default',
        containerClassName: 'border-blue-500/30 bg-blue-500/5',
        iconClassName: 'text-blue-600 dark:text-blue-400',
        badgeClassName:
          'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300',
      };
  }
}

function triggerLabel(t: DoctorTrigger): string {
  switch (t) {
    case 'anomaly_detected':
      return 'Anomaly detected';
    case 'scheduled_checkin':
      return 'Scheduled check-in';
    case 'user_initiated':
      return 'User-initiated';
    case 'failure_mode_materialized':
      return 'Failure mode materialised';
    default:
      return t
        .toString()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
  }
}

export default function DoctorAlertCard({ payload }: DoctorAlertCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const style = severityStyle(payload.severity);
  const { Icon } = style;

  if (dismissed) return null;

  return (
    <Alert
      variant={style.variant}
      className={cn(style.containerClassName)}
      data-testid="payload-doctor-alert"
      data-kind="doctor_alert"
      data-severity={payload.severity}
    >
      <Icon className={style.iconClassName} />
      <AlertTitle className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          Doctor: {triggerLabel(payload.trigger)}
          <Badge
            variant="outline"
            className={cn('text-[10px]', style.badgeClassName)}
            data-testid="doctor-severity"
          >
            {payload.severity}
          </Badge>
          {payload.action_required && (
            <Badge variant="default" className="text-[10px]" data-testid="doctor-action-required">
              Action required
            </Badge>
          )}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          aria-label="Dismiss alert"
          data-testid="doctor-dismiss"
          onClick={() => setDismissed(true)}
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        {payload.message ? (
          <p data-testid="doctor-message">{payload.message}</p>
        ) : (
          <p className="text-muted-foreground italic">
            No additional message supplied.
          </p>
        )}
        {payload.detector_evidence_count > 0 && (
          <p className="text-[10px] mt-1 flex items-center gap-1 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            {payload.detector_evidence_count} failure-mode detector
            {payload.detector_evidence_count === 1 ? '' : 's'} fired
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
