'use client';

/**
 * PreMortemCard — Pre-Mortem Guide failure-scenarios renderer.
 *
 * Renders each surfaced failure scenario as an expandable accordion row
 * with name + description + probability + impact rating.  Picked
 * scenarios are flagged with a "Picked" badge.
 *
 * Engine source: `agents/structured_payload.py::PreMortemPayload`.
 */

import { useState } from 'react';
import { AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { PreMortemPayload, PreMortemScenario } from '@/types/originate';
import { cn } from '@/lib/utils';

interface PreMortemCardProps {
  payload: PreMortemPayload;
}

function scenarioLabel(s: PreMortemScenario): string {
  if (s.name) return s.name;
  // Fall back to the scenario id with underscores swapped for spaces +
  // title-case so a raw id like `regime_shift_unwind` reads OK in the UI.
  return s.id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function probabilityLabel(p: PreMortemScenario['probability']): string | null {
  if (p === undefined) return null;
  if (typeof p === 'number') return `${Math.round(p * 100)}%`;
  return p;
}

function ratingClassName(level: 'low' | 'medium' | 'high' | string | undefined): string {
  switch (level) {
    case 'high':
      return 'border-destructive/30 text-destructive bg-destructive/10';
    case 'medium':
      return 'border-amber-500/30 text-amber-700 bg-amber-500/10 dark:text-amber-300';
    case 'low':
      return 'border-emerald-500/30 text-emerald-700 bg-emerald-500/10 dark:text-emerald-300';
    default:
      return 'border-muted text-muted-foreground';
  }
}

interface ScenarioRowProps {
  scenario: PreMortemScenario;
  isPicked: boolean;
}

function ScenarioRow({ scenario, isPicked }: ScenarioRowProps) {
  const [open, setOpen] = useState(false);
  const probLabel = probabilityLabel(scenario.probability);

  return (
    <li
      className={cn(
        'rounded-md border bg-card overflow-hidden',
        isPicked && 'border-primary/60 bg-primary/5',
      )}
      data-testid="pre-mortem-scenario"
      data-scenario-id={scenario.id}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
      >
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs font-medium flex-1 min-w-0 truncate">
          {scenarioLabel(scenario)}
        </span>
        {isPicked && (
          <Badge
            variant="default"
            className="text-[10px] shrink-0"
            data-testid="pre-mortem-picked"
          >
            Picked
          </Badge>
        )}
        {probLabel && (
          <Badge
            variant="outline"
            className="text-[10px] shrink-0 font-mono"
            data-testid="pre-mortem-probability"
          >
            {probLabel}
          </Badge>
        )}
        {scenario.impact && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] shrink-0',
              ratingClassName(scenario.impact),
            )}
            data-testid="pre-mortem-impact"
          >
            Impact: {scenario.impact}
          </Badge>
        )}
      </button>

      {open && (
        <div className="border-t px-3 py-2.5 text-xs leading-relaxed space-y-2">
          {scenario.description ? (
            <p>{scenario.description}</p>
          ) : (
            <p className="italic text-muted-foreground">
              No description supplied — engine emits scenario id only.
            </p>
          )}
          <p className="text-[10px] font-mono text-muted-foreground">id: {scenario.id}</p>
        </div>
      )}
    </li>
  );
}

export default function PreMortemCard({ payload }: PreMortemCardProps) {
  if (payload.scenarios_surfaced.length === 0) return null;

  const pickedSet = new Set(payload.scenarios_picked);
  const pickedCount = pickedSet.size;

  return (
    <Card
      data-testid="payload-pre-mortem"
      data-kind="pre_mortem"
      className="border-l-2 border-l-rose-500/60"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            Pre-mortem scenarios
          </CardTitle>
          {pickedCount > 0 && (
            <Badge
              variant="default"
              className="text-[10px] shrink-0"
              data-testid="pre-mortem-picked-count"
            >
              {pickedCount} picked
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ul
          className="flex flex-col gap-1.5"
          data-testid="pre-mortem-scenario-list"
        >
          {payload.scenarios_surfaced.map((s) => (
            <ScenarioRow
              key={s.id}
              scenario={s}
              isPicked={pickedSet.has(s.id)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
