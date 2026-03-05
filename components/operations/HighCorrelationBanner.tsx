'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRegimeLabel } from '@/lib/regimeLabel';
import type { CorrelatedPair, Regime } from '@/types/api';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HighCorrelationBannerProps {
  /** All highly-correlated pairs from the correlation analysis. */
  pairs: CorrelatedPair[];
  /** Current regime — used for contextual label in the message. */
  regime: Regime;
}

/**
 * Amber warning banner shown when any bot pair has correlation > 0.8.
 * Session-dismissible (local state — reappears on page reload if condition persists).
 * Returns null from the DOM when no high-corr pairs exist or after dismissal.
 */
export default function HighCorrelationBanner({ pairs, regime }: HighCorrelationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const highCorrPairs = pairs.filter((p) => p.correlation > 0.8);
  if (highCorrPairs.length === 0 || dismissed) return null;

  const topPair = highCorrPairs[0];
  const extraCount = highCorrPairs.length - 1;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          High correlation alert
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          {topPair.bot_a} ↔ {topPair.bot_b} ({(topPair.correlation * 100).toFixed(0)}%
          correlated) in {getRegimeLabel(regime)} regime
          {extraCount > 0 && ` + ${extraCount} more pair${extraCount > 1 ? 's' : ''}`}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
