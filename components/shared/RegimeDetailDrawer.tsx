'use client';

import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRegimeLabel } from '@/lib/regimeLabel';
import type { FleetWeatherReport } from '@/types/api';

// ---------------------------------------------------------------------------
// Interpretation helpers
// ---------------------------------------------------------------------------

const REGIME_DESCRIPTIONS: Record<number, string> = {
  0: 'Low volatility environment. Momentum and trend strategies typically outperform. Capital deployment can be more aggressive with tighter spreads.',
  1: 'Normal market conditions. Balanced risk-return profile. Most strategies operate within expected parameters.',
  2: 'Elevated volatility. Risk controls are more likely to activate. Conservative position sizing is recommended.',
  3: 'Crisis conditions. Significant drawdown risk. Defensive posture strongly advised — review all open positions.',
};

function convictionDescription(conviction: string): string {
  switch (conviction) {
    case 'high':
      return 'High confidence — multiple signals align. The current regime is likely to persist for at least several sessions.';
    case 'moderate':
      return 'Moderate confidence — signals generally agree but with some uncertainty. Monitor for developing transitions.';
    case 'low':
      return 'Low confidence — signals are mixed. Regime conditions are uncertain and may shift with limited warning.';
    default:
      return conviction;
  }
}

function convictionDotCount(conviction: string): number {
  if (conviction === 'high') return 3;
  if (conviction === 'moderate') return 2;
  return 1;
}

function transitionInterpretation(
  prob: number,
): { label: string; description: string; colorClass: string } {
  if (prob >= 1.0)
    return {
      label: 'Confirmed',
      description: 'A regime shift has been confirmed by the model. Expect strategy performance changes.',
      colorClass: 'text-green-600 dark:text-green-400',
    };
  if (prob > 0.5)
    return {
      label: 'Pending',
      description: 'Conditions strongly suggest an imminent regime shift. Risk controls may activate soon.',
      colorClass: 'text-orange-600 dark:text-orange-400',
    };
  if (prob > 0.2)
    return {
      label: 'Early Warning',
      description: 'Early signals of a potential regime transition. Stay alert and review exposure.',
      colorClass: 'text-amber-600 dark:text-amber-400',
    };
  return {
    label: 'Stable',
    description: 'No transition signals detected. Current regime expected to continue.',
    colorClass: 'text-muted-foreground',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RegimeDetailDrawerProps {
  weather: FleetWeatherReport;
  open: boolean;
  onClose: () => void;
}

/**
 * Right-side drawer with regime context: name + description, conviction
 * level with interpretation, and transition probability + target regime.
 *
 * Data is sourced entirely from FleetWeatherReport — no additional network
 * request. The backend does not expose a separate regime voter endpoint.
 */
export default function RegimeDetailDrawer({
  weather,
  open,
  onClose,
}: RegimeDetailDrawerProps) {
  const regimeLabel = getRegimeLabel(weather.current_regime);
  const targetLabel = getRegimeLabel(weather.top_transition_target);
  const dotCount = convictionDotCount(weather.regime_conviction);
  const transition = transitionInterpretation(weather.top_transition_probability);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] sm:max-w-[480px] p-0 gap-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="text-sm font-semibold">{regimeLabel} Regime</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {weather.regime_conviction} conviction
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-6">
            {/* ── Current Regime ── */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Current Regime
              </h3>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-semibold">{regimeLabel}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {REGIME_DESCRIPTIONS[weather.current_regime] ?? ''}
                </p>
              </div>
            </section>

            {/* ── Conviction ── */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Conviction
              </h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold capitalize">{weather.regime_conviction}</p>
                  {/* Conviction dot indicators */}
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${
                          i < dotCount ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {convictionDescription(weather.regime_conviction)}
                </p>
              </div>
            </section>

            {/* ── Transition Status ── */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Transition Status
              </h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${transition.colorClass}`}>
                    {transition.label}
                  </p>
                  <span className="font-mono-data text-xs text-muted-foreground">
                    {(weather.top_transition_probability * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {transition.description}
                </p>
                {weather.top_transition_probability > 0.2 && (
                  <p className="text-xs text-muted-foreground">
                    Most likely target:{' '}
                    <span className="font-semibold text-foreground">{targetLabel}</span>
                  </p>
                )}
              </div>
            </section>

            {/* Timestamp */}
            <p className="text-[10px] text-muted-foreground">
              Last updated: {new Date(weather.timestamp).toLocaleString()}
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
