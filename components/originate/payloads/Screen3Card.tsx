'use client';

/**
 * Screen3Card — LARGE light-backtest verdict card.
 *
 * Renders the class-conditional verdict (colour-coded), the 4 headline
 * metrics (Sharpe / Max DD / Win Rate / Total Return), trade count with
 * sample-size disclaimer, the expandable disclosures section (biases not
 * controlled + sample caveats + next step), and the "Accept Strategy"
 * CTA skeleton.
 *
 * The CTA is a SKELETON in Wave 1.B — the click handler logs the
 * intent and surfaces a toast.  Full wiring (mutation to
 * `/api/origination/strategies/{passport_id}/promote-to-deep`) lands in
 * Wave 1.C / F.1.C.
 *
 * Engine source: `dialogue/state.py::Screen3Payload` (the
 * light-backtest-result variant, NOT the agent-side "final draft"
 * Screen3 — see types/originate.ts for the rationale).
 */

import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { LightBacktestVerdict, Screen3Payload } from '@/types/originate';
import { cn } from '@/lib/utils';

interface Screen3CardProps {
  payload: Screen3Payload;
}

interface VerdictStyle {
  label: string;
  description: string;
  Icon: typeof CheckCircle2;
  badgeClassName: string;
  borderClassName: string;
}

function verdictStyle(verdict: LightBacktestVerdict): VerdictStyle {
  switch (verdict) {
    case 'LOOKS_PROMISING':
      return {
        label: 'Looks promising',
        description:
          'The result clears the class-conditional quality bar.  Disclosures below.',
        Icon: CheckCircle2,
        badgeClassName:
          'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        borderClassName: 'border-l-emerald-500',
      };
    case 'MIXED_SIGNALS':
      return {
        label: 'Mixed signals',
        description:
          'Passes basic sanity, but has class-conditional concerns.  Weigh trade-offs below.',
        Icon: AlertTriangle,
        badgeClassName:
          'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
        borderClassName: 'border-l-amber-500',
      };
    case 'NOT_RECOMMENDED':
      return {
        label: 'Not recommended',
        description:
          'Fails the class-conditional quality bar in the tested window.',
        Icon: XCircle,
        badgeClassName:
          'bg-destructive/15 text-destructive border-destructive/30',
        borderClassName: 'border-l-destructive',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'Inconclusive',
        description:
          'Sample too small for an honest verdict.  See next step below.',
        Icon: HelpCircle,
        badgeClassName:
          'bg-muted text-muted-foreground border-border',
        borderClassName: 'border-l-muted-foreground/40',
      };
  }
}

interface MetricChipProps {
  label: string;
  value: number | null | undefined;
  format: 'percent' | 'ratio' | 'count';
  tone?: 'positive_good' | 'negative_good' | 'neutral';
}

function formatMetric(value: number | null | undefined, format: MetricChipProps['format']): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'count':
      return value.toFixed(0);
  }
}

function metricTone(
  value: number | null | undefined,
  tone: MetricChipProps['tone'],
): string {
  if (value === null || value === undefined || tone === 'neutral' || !tone) {
    return 'text-foreground';
  }
  const isPositive = value >= 0;
  if (tone === 'positive_good') {
    return isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-destructive';
  }
  // negative_good (e.g., max drawdown — closer to 0 is better)
  return value >= -0.1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
}

function MetricChip({ label, value, format, tone = 'neutral' }: MetricChipProps) {
  const formatted = formatMetric(value, format);
  const toneClass = metricTone(value, tone);
  return (
    <div
      className="rounded-md border bg-card p-3 flex flex-col gap-1"
      data-testid={`screen3-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn('font-mono text-lg font-semibold', toneClass)}>
        {formatted}
      </span>
    </div>
  );
}

function classLabel(cls: string): string {
  return cls
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Screen3Card({ payload }: Screen3CardProps) {
  const [disclosuresOpen, setDisclosuresOpen] = useState(true);
  const style = verdictStyle(payload.verdict);
  const { Icon } = style;
  const hasPassport = payload.passport_id !== null;

  const handleAccept = () => {
    // Wave 1.B SKELETON — surface that the click was recorded; full
    // wiring (mutation calling `/api/origination/strategies/{passport_id}/promote-to-deep`)
    // lands in Wave 1.C / F.1.C.
    toast.success('Strategy queued for deep validation', {
      description:
        hasPassport
          ? `Passport ${payload.passport_id?.slice(0, 8)}… promoted to deep backtest (wires in F.1.C).`
          : 'No passport on this verdict yet — full promotion lands in F.1.C.',
    });
  };

  const isSmallSample = payload.trade_count < 30;

  return (
    <Card
      data-testid="payload-screen3"
      data-kind="screen3"
      data-verdict={payload.verdict}
      className={cn('border-l-4', style.borderClassName)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <CardTitle className="text-base">Light-backtest verdict</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {classLabel(payload.strategy_class)} on{' '}
                <span className="font-mono">{payload.ticker}</span> &middot;{' '}
                {payload.window_description}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn('shrink-0', style.badgeClassName)}
            data-testid="screen3-verdict-badge"
          >
            {style.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {style.description}
        </p>

        {/* 4 headline metrics — grid of chips. */}
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          data-testid="screen3-metrics-grid"
        >
          <MetricChip
            label="Sharpe"
            value={payload.metrics.sharpe}
            format="ratio"
            tone="positive_good"
          />
          <MetricChip
            label="Max DD"
            value={payload.metrics.max_drawdown}
            format="percent"
            tone="negative_good"
          />
          <MetricChip
            label="Win Rate"
            value={payload.metrics.win_rate}
            format="percent"
            tone="neutral"
          />
          <MetricChip
            label="Total Return"
            value={payload.metrics.total_return}
            format="percent"
            tone="positive_good"
          />
        </div>

        {/* Trade count + sample-size disclaimer. */}
        <div
          className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs"
          data-testid="screen3-trade-count"
        >
          <span className="text-muted-foreground">
            Computed across{' '}
            <span className="font-mono font-semibold text-foreground">
              {payload.trade_count}
            </span>{' '}
            trades
          </span>
          {isSmallSample && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Small sample — interpret with caution
            </span>
          )}
        </div>

        {/* Expandable disclosures section. */}
        <div
          className="rounded-lg border bg-card"
          data-testid="screen3-disclosures"
        >
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/40 transition-colors rounded-lg"
            onClick={() => setDisclosuresOpen((open) => !open)}
            aria-expanded={disclosuresOpen}
            data-testid="screen3-disclosures-toggle"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Disclosures &amp; caveats
            </span>
            {disclosuresOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {disclosuresOpen && (
            <div className="border-t px-3 py-3 space-y-3 text-xs">
              {payload.disclosures.biases_not_controlled.length > 0 && (
                <div data-testid="screen3-biases">
                  <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Biases not controlled
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {payload.disclosures.biases_not_controlled.map((bias) => (
                      <li key={bias}>
                        <Badge variant="outline" className="text-[10px]">
                          {bias.replace(/_/g, ' ')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {payload.disclosures.sample_caveats.length > 0 && (
                <div data-testid="screen3-sample-caveats">
                  <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Sample caveats
                  </div>
                  <ul className="flex flex-col gap-1">
                    {payload.disclosures.sample_caveats.map((caveat, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-muted-foreground">&bull;</span>
                        <span className="leading-relaxed">{caveat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {payload.disclosures.next_step && (
                <div data-testid="screen3-next-step">
                  <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Next step
                  </div>
                  <p className="leading-relaxed">
                    {payload.disclosures.next_step}
                  </p>
                </div>
              )}

              {payload.disclosures.biases_not_controlled.length === 0 &&
                payload.disclosures.sample_caveats.length === 0 &&
                !payload.disclosures.next_step && (
                  <p className="italic text-muted-foreground">
                    No disclosures recorded for this result.
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Accept-Strategy CTA — SKELETON in Wave 1.B.  Disabled for
         *  NOT_RECOMMENDED + INCONCLUSIVE verdicts since the strategy
         *  has not earned a promote path. */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-muted-foreground">
            {hasPassport
              ? 'Passport generated — promotion wires in F.1.C.'
              : 'No passport on this verdict.'}
          </span>
          <Button
            type="button"
            onClick={handleAccept}
            disabled={
              payload.verdict === 'NOT_RECOMMENDED' ||
              payload.verdict === 'INCONCLUSIVE'
            }
            data-testid="screen3-accept-cta"
            size="sm"
          >
            <Award className="h-4 w-4" />
            Accept Strategy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
