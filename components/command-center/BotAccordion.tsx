'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BotAccordionRow from './BotAccordionRow';
import type { BotSnapshot } from '@/types/api';

interface BotAccordionProps {
  bots: BotSnapshot[];
}

export default function BotAccordion({ bots }: BotAccordionProps) {
  const [inOperationOpen, setInOperationOpen] = useState(false);
  const [standingDownOpen, setStandingDownOpen] = useState(false);
  const [stoppedOpen, setStoppedOpen] = useState(false);

  // Group bots by operational urgency category
  const circuitBreakerBots = bots.filter((b) => b.state === 'circuit_breaker');
  const inOperationBots = bots.filter((b) => b.state === 'active' || b.state === 'ramping');
  const standingDownBots = bots.filter(
    (b) =>
      b.state === 'paused_user' ||
      b.state === 'paused_regime' ||
      b.state === 'paused_monitoring',
  );
  const stoppedBots = bots.filter((b) => b.state === 'stopped');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Fleet</span>
          <span className="text-xs font-normal text-muted-foreground">
            {bots.length} {bots.length === 1 ? 'bot' : 'bots'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {/* ─── Risk Controls Active ───────────────────────────────────────────
            Always expanded — never collapsible. An alert that is hidden
            defeats its purpose. Only rendered when circuit_breaker bots exist. */}
        {circuitBreakerBots.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 mb-3">
            <p className="text-sm font-semibold text-destructive leading-none mb-0.5">
              Risk Controls Active
            </p>
            <p className="text-xs text-destructive/60 italic mb-3">
              Risk controls active — system protecting capital.
            </p>
            <div className="space-y-2">
              {circuitBreakerBots.map((bot) => (
                <BotAccordionRow key={bot.bot_id} bot={bot} />
              ))}
            </div>
          </div>
        )}

        {/* ─── In Operation ───────────────────────────────────────────────────
            active + ramping bots. Collapsed by default; count is the signal. */}
        <AccordionGroup
          label="In Operation"
          count={inOperationBots.length}
          isOpen={inOperationOpen}
          onToggle={() => setInOperationOpen((v) => !v)}
        >
          {inOperationBots.length > 0 ? (
            inOperationBots.map((bot) => <BotAccordionRow key={bot.bot_id} bot={bot} />)
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">
              No bots currently in operation.
            </p>
          )}
        </AccordionGroup>

        {/* ─── Standing Down ───────────────────────────────────────────────────
            paused_* bots. Collapsed by default.
            Stopped bots hidden behind a secondary toggle — two interactions
            to reach them is intentional (they are low priority). */}
        <AccordionGroup
          label="Standing Down"
          count={standingDownBots.length}
          countSuffix={stoppedBots.length > 0 ? ` · ${stoppedBots.length} stopped` : undefined}
          isOpen={standingDownOpen}
          onToggle={() => setStandingDownOpen((v) => !v)}
        >
          {standingDownBots.length > 0 ? (
            standingDownBots.map((bot) => <BotAccordionRow key={bot.bot_id} bot={bot} />)
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">No bots standing down.</p>
          )}

          {/* Secondary stopped-bot toggle — intentionally nested two levels deep */}
          {stoppedBots.length > 0 && (
            <div className="pt-2 border-t border-border mt-2">
              <button
                onClick={() => setStoppedOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 w-full text-left"
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform duration-150 ${stoppedOpen ? 'rotate-90' : ''}`}
                />
                {stoppedOpen ? 'Hide' : 'Show'} {stoppedBots.length} stopped{' '}
                {stoppedBots.length === 1 ? 'bot' : 'bots'}
              </button>
              {stoppedOpen && (
                <div className="space-y-2 mt-2">
                  {stoppedBots.map((bot) => (
                    <BotAccordionRow key={bot.bot_id} bot={bot} />
                  ))}
                </div>
              )}
            </div>
          )}
        </AccordionGroup>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AccordionGroup — reusable collapsible section header + body
// ---------------------------------------------------------------------------

interface AccordionGroupProps {
  label: string;
  count: number;
  countSuffix?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionGroup({
  label,
  count,
  countSuffix,
  isOpen,
  onToggle,
  children,
}: AccordionGroupProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left px-1 py-2 rounded hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? 'bot' : 'bots'}
          {countSuffix}
        </span>
      </button>
      {isOpen && <div className="space-y-2 mt-1 pl-1">{children}</div>}
    </div>
  );
}
