'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getRegimeLabel } from '@/lib/regimeLabel';
import type { Regime, RegimeConviction } from '@/types/api';

// ---------------------------------------------------------------------------
// Static Tailwind class maps — must be static for PurgeCSS / Tailwind JIT
// ---------------------------------------------------------------------------

const REGIME_STYLES: Record<
  number,
  { bg: string; text: string; border: string; dot: string }
> = {
  0: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  1: {
    bg: 'bg-green-500/10',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-500',
  },
  2: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  3: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
  },
};

const CONVICTION_FILLED: Record<RegimeConviction, number> = {
  high: 3,
  moderate: 2,
  low: 1,
};

// ---------------------------------------------------------------------------
// Transition state derivation
// ---------------------------------------------------------------------------

type TransitionState = 'stable' | 'early_warning' | 'pending' | 'confirmed';

function deriveTransitionState(prob: number): TransitionState {
  if (prob >= 1.0) return 'confirmed';
  if (prob > 0.5) return 'pending';
  if (prob > 0.2) return 'early_warning';
  return 'stable';
}

const TRANSITION_DISPLAY: Record<
  TransitionState,
  { label: string; textClass: string }
> = {
  stable: {
    label: '\u2014 Stable',
    textClass: 'text-muted-foreground',
  },
  early_warning: {
    label: '\u26A0 Early Warning',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  pending: {
    label: '\u26A1 Pending Shift',
    textClass: 'text-orange-600 dark:text-orange-400',
  },
  confirmed: {
    label: '\u2713 Confirmed',
    textClass: 'text-green-600 dark:text-green-400',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface RegimeBadgeProps {
  regime: Regime;
  conviction: RegimeConviction;
  transitionProbability: number;
  /**
   * When provided the badge renders as a button and calls this on click,
   * replacing the "coming soon" tooltip. Used by drawers (Batch 9).
   */
  onClick?: () => void;
}

export default function RegimeBadge({
  regime,
  conviction,
  transitionProbability,
  onClick,
}: RegimeBadgeProps) {
  const styles = REGIME_STYLES[regime] ?? REGIME_STYLES[1];
  const label = getRegimeLabel(regime);
  const filledDots = CONVICTION_FILLED[conviction] ?? 1;
  const transitionState = deriveTransitionState(transitionProbability);
  const transition = TRANSITION_DISPLAY[transitionState];

  // Badge inner content — shared between both render paths
  const badgeContent = (
    <>
      {/* Row 1: regime label + conviction dots */}
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-semibold leading-none ${styles.text}`}>
          {label}
        </span>
        {/* Conviction dots — high=3 filled, moderate=2, low=1 */}
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i < filledDots ? styles.dot : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
      {/* Row 2: transition state text */}
      <span className={`text-[10px] leading-none ${transition.textClass}`}>
        {transition.label}
      </span>
    </>
  );

  const badgeClassName = [
    'inline-flex flex-col gap-0.5 rounded-lg border px-2.5 py-1.5',
    styles.bg,
    styles.border,
  ].join(' ');

  // When onClick is provided: render as button (drawer wired), no tooltip
  if (onClick) {
    return (
      <button
        type="button"
        className={`${badgeClassName} cursor-pointer hover:opacity-80 transition-opacity select-none`}
        onClick={onClick}
        aria-label={`Market regime: ${label} — click for detail`}
      >
        {badgeContent}
      </button>
    );
  }

  // Default: tooltip-only (drawer not yet wired)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`${badgeClassName} cursor-default select-none`}
            aria-label={`Market regime: ${label}`}
          >
            {badgeContent}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Regime detail \u2014 coming soon</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
