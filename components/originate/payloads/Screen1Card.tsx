'use client';

/**
 * Screen1Card — strategy-classification surface.
 *
 * Renders the "Here's what we heard" framing: which strategy class the
 * platform classified the user's input into, the investor archetype it
 * framed against, and a confidence indicator.
 *
 * Wave Q.2.B (B3) — InvestorType override.  When the parent supplies
 * ``onOverrideInvestorType``, the card surfaces a "Not quite right?
 * [Change ▾]" affordance below the inferred investor-type badge.
 * Picking one of the seven canonical InvestorType values invokes the
 * callback (which buffers the override onto ``useDialogueSession`` so
 * the NEXT handshake carries ``investor_type``), and the card flips
 * into a confirmation strip ("We'll re-classify on your next message
 * as ${label}.") with a [Cancel] affordance that clears the override.
 *
 * This is the trust-building moment per the InvestorType ADR
 * (``docs/adr/2026-05-10-investor-type-system.md``): the customer's
 * declared archetype RANKS recipes + biases voice — it does NOT gate
 * strategy classes.  Honest copy explains that explicitly.
 *
 * Engine source: `types/originate.ts::Screen1Payload`.  The engine does
 * not yet emit this payload directly (Phase Q follow-on); the card is
 * exercisable today via stubbed fixtures so the renderer is ready for
 * the engine wiring.
 */

import { useCallback } from 'react';
import { ChevronDown, Info, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { InvestorType, Screen1Payload } from '@/types/originate';
import { cn } from '@/lib/utils';

interface Screen1CardProps {
  payload: Screen1Payload;
  /** Wave Q.2.B (B3) — when supplied, the card renders the "Not quite
   *  right? [Change ▾]" override affordance + confirmation strip.
   *  Invoked with the customer's selection so the parent (typically
   *  via ``useDialogueSession.setInvestorTypeOverride``) can buffer
   *  the value for attachment on the next handshake. */
  onOverrideInvestorType?: (investor_type: InvestorType) => void;
  /** Wave Q.2.B (B3) — the override the parent has currently buffered.
   *  When non-null, the card renders the confirmation strip instead of
   *  the [Change ▾] trigger.  ``null`` once the override has been
   *  drained into a handshake (the parent resets this from
   *  ``useDialogueSession``'s state). */
  pendingOverride?: InvestorType | null;
}

/** Map the lowercase wire-class value to a customer-readable label. */
function classLabel(cls: string): string {
  return cls
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function investorLabel(t: Screen1Payload['investor_type']): string {
  switch (t) {
    case 'long_term_investor':
      return 'Long-term Investor';
    case 'value_investor':
      return 'Value Investor';
    case 'growth_investor':
      return 'Growth Investor';
    case 'income_investor':
      return 'Income Investor';
    case 'swing_trader':
      return 'Swing Trader';
    case 'options_strategy_player':
      return 'Options Strategist';
    case 'undeclared':
    default:
      return 'Investor (undeclared)';
  }
}

/** Wave Q.2.B (B3) — canonical InvestorType pick-list rendered in the
 *  override DropdownMenu.  The order is deliberate: long-horizon first
 *  (the platform's primary retail population per ADR
 *  ``2026-05-10-investor-type-system.md``), trading-style next,
 *  ``undeclared`` last as the soft opt-out.  The descriptions are the
 *  ones surfaced in the task spec — they are the customer's
 *  trust-building copy, not derived from any backend enum. */
const INVESTOR_TYPE_OPTIONS: ReadonlyArray<{
  value: InvestorType;
  label: string;
  description: string;
}> = [
  {
    value: 'long_term_investor',
    label: 'Long-term Investor',
    description: 'Buy-and-hold, multi-year horizon, low turnover',
  },
  {
    value: 'value_investor',
    label: 'Value Investor',
    description: 'Fundamental contrarian, margin-of-safety, patience',
  },
  {
    value: 'growth_investor',
    label: 'Growth Investor',
    description: 'Quality compounding, fundamental + momentum',
  },
  {
    value: 'income_investor',
    label: 'Income Investor',
    description: 'Yield/dividend focus, possibly options-for-income',
  },
  {
    value: 'swing_trader',
    label: 'Swing Trader',
    description: 'Technical setups, regime-aware, days-to-weeks holds',
  },
  {
    value: 'options_strategy_player',
    label: 'Options Strategist',
    description: 'Premium-selling, vol-aware, defined risk',
  },
  {
    value: 'undeclared',
    label: 'Investor (undeclared)',
    description: "I'd rather not specify",
  },
];

function confidenceBucket(c: number): { label: string; tone: string } {
  if (c >= 0.75) return { label: 'High confidence', tone: 'text-emerald-600 dark:text-emerald-400' };
  if (c >= 0.5) return { label: 'Moderate confidence', tone: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Low confidence', tone: 'text-muted-foreground' };
}

export default function Screen1Card({
  payload,
  onOverrideInvestorType,
  pendingOverride,
}: Screen1CardProps) {
  const confidence = confidenceBucket(payload.classified_confidence);
  const pct = Math.round(payload.classified_confidence * 100);

  // The override the card surfaces — driven entirely by the parent's
  // ``pendingOverride`` so the confirmation strip mirrors the
  // authoritative hook state (clears when the override drains into
  // the next handshake, re-fills if the customer picks again before
  // sending).  Keeping the card stateless w.r.t. the override avoids
  // the local-stale-vs-parent-cleared race we'd hit with mirrored
  // useState here.
  const effectiveOverride = pendingOverride ?? null;
  const overrideLabel = effectiveOverride
    ? investorLabel(effectiveOverride)
    : null;

  // Only render the override affordance when the parent passed a
  // callback — the card stays as a pure display when no override sink
  // is wired (e.g. tests / static previews).
  const overrideEnabled = typeof onOverrideInvestorType === 'function';

  const handleSelect = useCallback(
    (value: InvestorType) => {
      onOverrideInvestorType?.(value);
    },
    [onOverrideInvestorType],
  );

  const handleCancel = useCallback(() => {
    // Reset the parent's buffered override by calling back with the
    // engine's originally inferred type so the next handshake doesn't
    // carry a stale override.  This matches the "Cancel reverts" copy
    // surfaced on the confirmation strip — the engine has already
    // inferred ``payload.investor_type`` for this turn, so re-asserting
    // it is a no-op from the engine's perspective but it cleanly
    // clears the buffered override on the hook side.
    onOverrideInvestorType?.(payload.investor_type);
  }, [onOverrideInvestorType, payload.investor_type]);

  return (
    <Card
      data-testid="payload-screen1"
      data-kind="screen1"
      className="border-l-2 border-l-primary/40"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Here&rsquo;s what we heard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" data-testid="screen1-strategy-class">
            {classLabel(payload.strategy_class)}
          </Badge>
          <Badge variant="secondary" data-testid="screen1-investor-type">
            {investorLabel(payload.investor_type)}
          </Badge>
          {payload.ticker && (
            <Badge variant="outline" className="font-mono">
              {payload.ticker}
            </Badge>
          )}
        </div>

        {overrideEnabled && (
          <div
            className="flex items-center gap-2 text-xs"
            data-testid="screen1-override-region"
          >
            {effectiveOverride === null ? (
              <>
                <span className="text-muted-foreground">
                  Not quite right?
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      data-testid="screen1-investor-override-trigger"
                    >
                      Change
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-72"
                    data-testid="screen1-investor-override-menu"
                  >
                    <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Set my investor type
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {INVESTOR_TYPE_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        data-testid={`screen1-investor-override-option-${opt.value}`}
                        data-value={opt.value}
                        onSelect={() => handleSelect(opt.value)}
                        className="flex flex-col items-start gap-0.5 py-2"
                      >
                        <span className="text-sm font-medium">
                          {opt.label}
                        </span>
                        <span className="text-[11px] leading-snug text-muted-foreground">
                          {opt.description}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Why does my investor type matter?"
                      data-testid="screen1-investor-override-info"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs text-[11px] leading-relaxed"
                    data-testid="screen1-investor-override-info-content"
                  >
                    Your investor type shapes which strategy recipes we
                    surface first and the tone our agents use. You can
                    change this anytime.
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <div
                className="flex flex-1 flex-wrap items-center gap-2"
                data-testid="screen1-investor-override-confirmation"
                data-override-value={effectiveOverride}
              >
                <span className="text-muted-foreground">
                  We&apos;ll re-classify on your next message as{' '}
                  <span className="font-medium text-foreground">
                    {overrideLabel}
                  </span>
                  .
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleCancel}
                  data-testid="screen1-investor-override-cancel"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {payload.summary && (
          <p className="text-sm leading-relaxed text-foreground">{payload.summary}</p>
        )}

        <div
          className="flex items-center gap-2 text-xs"
          data-testid="screen1-confidence"
        >
          <span className="text-muted-foreground">Classification:</span>
          <span className={cn('font-medium', confidence.tone)}>
            {confidence.label} ({pct}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
