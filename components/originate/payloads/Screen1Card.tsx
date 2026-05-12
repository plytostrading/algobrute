'use client';

/**
 * Screen1Card — strategy-classification surface.
 *
 * Renders the "Here's what we heard" framing: which strategy class the
 * platform classified the user's input into, the investor archetype it
 * framed against, and a confidence indicator.
 *
 * Engine source: `types/originate.ts::Screen1Payload`.  The engine does
 * not yet emit this payload directly (Phase Q follow-on); the card is
 * exercisable today via stubbed fixtures so the renderer is ready for
 * the engine wiring.
 */

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Screen1Payload } from '@/types/originate';
import { cn } from '@/lib/utils';

interface Screen1CardProps {
  payload: Screen1Payload;
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

function confidenceBucket(c: number): { label: string; tone: string } {
  if (c >= 0.75) return { label: 'High confidence', tone: 'text-emerald-600 dark:text-emerald-400' };
  if (c >= 0.5) return { label: 'Moderate confidence', tone: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Low confidence', tone: 'text-muted-foreground' };
}

export default function Screen1Card({ payload }: Screen1CardProps) {
  const confidence = confidenceBucket(payload.classified_confidence);
  const pct = Math.round(payload.classified_confidence * 100);

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
