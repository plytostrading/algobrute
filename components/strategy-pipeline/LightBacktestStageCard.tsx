'use client';

/**
 * LightBacktestStageCard — second row of the F.2 timeline.
 *
 * Always renders in the "complete" status because the lifecycle
 * envelope only exists once the light-backtest passport has been
 * produced.  The card surfaces:
 *
 *   - Verdict pill (LOOKS_PROMISING / MIXED_SIGNALS / NOT_RECOMMENDED /
 *     INCONCLUSIVE) — colour-matches the Screen3Card style.
 *   - The 4 headline metrics (Sharpe / Max DD / Win Rate / Total Return).
 *   - Trade count + small-sample disclaimer.
 *   - Expandable disclosures (biases / sample caveats / next step).
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import StageCard from './StageCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StrategyLifecycleView } from '@/types/api';

interface LightBacktestStageCardProps {
  view: StrategyLifecycleView;
}

interface VerdictStyle {
  label: string;
  className: string;
}

/**
 * Normalise the verdict casing — the engine emits lowercase enum
 * values (``"looks_promising"``) while the legacy frontend rendered
 * uppercase strings (``"LOOKS_PROMISING"``).  Match by upper-case to
 * stay tolerant of either source.
 */
function verdictStyle(verdict: string): VerdictStyle {
  const v = verdict.toUpperCase();
  switch (v) {
    case 'LOOKS_PROMISING':
      return {
        label: 'Looks promising',
        className:
          'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
      };
    case 'MIXED_SIGNALS':
      return {
        label: 'Mixed signals',
        className:
          'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
      };
    case 'NOT_RECOMMENDED':
      return {
        label: 'Not recommended',
        className: 'bg-destructive/15 text-destructive border-destructive/30',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'Inconclusive',
        className: 'bg-muted text-muted-foreground border-border',
      };
  }
}

function formatMetric(value: number | null | undefined, format: 'percent' | 'ratio'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
  }
}

function metricTone(
  value: number | null | undefined,
  tone: 'positive_good' | 'negative_good' | 'neutral',
): string {
  if (value === null || value === undefined || tone === 'neutral') return '';
  if (tone === 'positive_good') {
    return value >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-destructive';
  }
  return value >= -0.1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
}

interface MetricChipProps {
  label: string;
  value: number | null | undefined;
  format: 'percent' | 'ratio';
  tone: 'positive_good' | 'negative_good' | 'neutral';
}

function MetricChip({ label, value, format, tone }: MetricChipProps) {
  return (
    <div
      className="rounded-md border bg-card p-3 flex flex-col gap-1"
      data-testid={`light-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn('font-mono text-lg font-semibold', metricTone(value, tone))}>
        {formatMetric(value, format)}
      </span>
    </div>
  );
}

export default function LightBacktestStageCard({ view }: LightBacktestStageCardProps) {
  const [open, setOpen] = useState(false);
  const verdict = verdictStyle(view.light_verdict);
  const isSmallSample = view.light_trade_count < 30;

  const biases = view.light_disclosures?.biases_not_controlled ?? [];
  const caveats = view.light_disclosures?.sample_caveats ?? [];
  const nextStep = view.light_disclosures?.next_step ?? '';
  const hasDisclosures = biases.length > 0 || caveats.length > 0 || Boolean(nextStep);

  return (
    <StageCard
      stageNumber={2}
      title="Light backtest"
      subtitle="Quick verdict against the class-conditional quality bar"
      status="complete"
      statusLabel={verdict.label}
      testId="stage-light-backtest"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', verdict.className)} data-testid="light-verdict-badge">
            {verdict.label}
          </Badge>
        </div>

        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          data-testid="light-metrics-grid"
        >
          <MetricChip
            label="Sharpe"
            value={view.light_metrics?.sharpe ?? null}
            format="ratio"
            tone="positive_good"
          />
          <MetricChip
            label="Max DD"
            value={view.light_metrics?.max_drawdown ?? null}
            format="percent"
            tone="negative_good"
          />
          <MetricChip
            label="Win Rate"
            value={view.light_metrics?.win_rate ?? null}
            format="percent"
            tone="neutral"
          />
          <MetricChip
            label="Total Return"
            value={view.light_metrics?.total_return ?? null}
            format="percent"
            tone="positive_good"
          />
        </div>

        <div
          className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs"
          data-testid="light-trade-count"
        >
          <span className="text-muted-foreground">
            Computed across{' '}
            <span className="font-mono font-semibold text-foreground">
              {view.light_trade_count}
            </span>{' '}
            trades
          </span>
          {isSmallSample && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Small sample — interpret with caution
            </span>
          )}
        </div>

        {hasDisclosures && (
          <div className="rounded-lg border bg-card">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors rounded-lg"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              data-testid="light-disclosures-toggle"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Disclosures &amp; caveats
              </span>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {open && (
              <div
                className="border-t px-3 py-3 space-y-3 text-xs"
                data-testid="light-disclosures-body"
              >
                {biases.length > 0 && (
                  <div data-testid="light-disclosures-biases">
                    <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Biases not controlled
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {biases.map((bias) => (
                        <li key={bias}>
                          <Badge variant="outline" className="text-[10px]">
                            {bias.replace(/_/g, ' ')}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {caveats.length > 0 && (
                  <div data-testid="light-disclosures-caveats">
                    <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Sample caveats
                    </div>
                    <ul className="flex flex-col gap-1">
                      {caveats.map((caveat, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span className="leading-relaxed">{caveat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {nextStep && (
                  <div data-testid="light-disclosures-next-step">
                    <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Next step
                    </div>
                    <p className="leading-relaxed">{nextStep}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </StageCard>
  );
}
