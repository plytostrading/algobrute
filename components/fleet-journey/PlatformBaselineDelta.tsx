'use client';

import type { ReactNode } from 'react';

interface PlatformBaselineDeltaProps {
  label: string;
  platform: string | number;
  baseline: string | number;
  delta: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  helpText?: string;
}

/**
 * Three-column metric tile: Platform | Baseline | Δ.
 * Used wherever we're comparing the platform's result to the
 * counterfactual (shadow) baseline. The delta column is colored by
 * tone — positive = green, negative = red, neutral = muted.
 */
export function PlatformBaselineDelta({
  label,
  platform,
  baseline,
  delta,
  deltaTone = 'neutral',
  icon,
  helpText,
}: PlatformBaselineDeltaProps) {
  const deltaClass =
    deltaTone === 'positive'
      ? 'text-green-600'
      : deltaTone === 'negative'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <div className="rounded-lg border bg-card/60 p-3" title={helpText}>
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Col label="Platform" value={platform} strong />
        <Col label="Baseline" value={baseline} />
        <Col label="Δ" value={delta} tone={deltaClass} strong />
      </div>
    </div>
  );
}

function Col({
  label,
  value,
  strong = false,
  tone = 'text-foreground',
}: {
  label: string;
  value: string | number;
  strong?: boolean;
  tone?: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-mono ${strong ? 'text-base font-semibold' : 'text-sm'} ${tone}`}
      >
        {value}
      </div>
    </div>
  );
}
