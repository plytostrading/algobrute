'use client';

/**
 * Screen2Card — "Here's what I think you mean" structured surface.
 *
 * Renders the strategy summary, the 4-bullet build description
 * (trigger / entry / exit / regime), the 3 default assumptions, and
 * the trade-idea spec details (side bias / horizon / regimes / signal
 * families / risk preferences) when present.  Surfaces an
 * "LLM authored" vs "stub fallback" provenance badge per Phase O
 * Wave 1A.
 *
 * Engine source: `agents/structured_payload.py::Screen2Payload`.
 */

import { ListChecks, Lightbulb, Settings2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Screen2Payload, TradeIdeaSpec } from '@/types/originate';
import { cn } from '@/lib/utils';

interface Screen2CardProps {
  payload: Screen2Payload;
}

const BUILD_LABELS = ['Trigger', 'Entry', 'Exit', 'Regime'] as const;

function provenanceBadge(p: Screen2Payload['trade_idea_spec_provenance']) {
  switch (p) {
    case 'llm_authored':
      return {
        label: 'LLM authored',
        variant: 'default' as const,
        tone: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'parse_failed':
      return {
        label: 'Parse failed',
        variant: 'destructive' as const,
        tone: 'text-destructive',
      };
    case 'stub_fallback':
    default:
      return {
        label: 'Stub fallback',
        variant: 'secondary' as const,
        tone: 'text-muted-foreground',
      };
  }
}

function TradeIdeaDetails({ spec }: { spec: TradeIdeaSpec }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Trade idea spec
        </span>
      </div>

      <dl
        className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-xs"
        data-testid="screen2-trade-idea-spec"
      >
        <dt className="text-muted-foreground">Side bias</dt>
        <dd className="font-mono">{spec.side_bias}</dd>

        <dt className="text-muted-foreground">Holding horizon</dt>
        <dd className="font-mono">{spec.holding_horizon}</dd>

        {spec.preferred_regimes.length > 0 && (
          <>
            <dt className="text-muted-foreground">Preferred regimes</dt>
            <dd className="flex flex-wrap gap-1">
              {spec.preferred_regimes.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px]">
                  {r}
                </Badge>
              ))}
            </dd>
          </>
        )}

        {spec.forbidden_regimes.length > 0 && (
          <>
            <dt className="text-muted-foreground">Forbidden regimes</dt>
            <dd className="flex flex-wrap gap-1">
              {spec.forbidden_regimes.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px]">
                  {r}
                </Badge>
              ))}
            </dd>
          </>
        )}

        {spec.preferred_signal_families.length > 0 && (
          <>
            <dt className="text-muted-foreground">Signal families</dt>
            <dd className="flex flex-wrap gap-1">
              {spec.preferred_signal_families.map((f) => (
                <Badge key={f} variant="secondary" className="text-[10px]">
                  {f}
                </Badge>
              ))}
            </dd>
          </>
        )}

        {Object.keys(spec.risk_preferences).length > 0 && (
          <>
            <dt className="text-muted-foreground">Risk preferences</dt>
            <dd className="flex flex-col gap-0.5">
              {Object.entries(spec.risk_preferences).map(([k, v]) => (
                <span key={k} className="font-mono">
                  {k}: <span className="text-foreground">{String(v)}</span>
                </span>
              ))}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

export default function Screen2Card({ payload }: Screen2CardProps) {
  const prov = provenanceBadge(payload.trade_idea_spec_provenance);
  const summary = payload.strategy_summary ?? payload.class_summary;

  return (
    <Card
      data-testid="payload-screen2"
      data-kind="screen2"
      className="border-l-2 border-l-primary/40"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className="h-4 w-4 text-primary" />
            Here&rsquo;s what I think you mean
          </CardTitle>
          <Badge
            variant={prov.variant}
            className="text-[10px] shrink-0"
            data-testid="screen2-provenance"
            data-provenance={payload.trade_idea_spec_provenance}
          >
            {prov.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <p
            className="text-sm leading-relaxed text-foreground"
            data-testid="screen2-summary"
          >
            {summary}
          </p>
        )}

        {/* Build description — 4 ordered bullets. */}
        <div className="space-y-1.5" data-testid="screen2-build-description">
          {payload.build_description.map((bullet, idx) => (
            <div key={BUILD_LABELS[idx]} className="flex items-start gap-2 text-xs">
              <span className="w-16 shrink-0 font-semibold uppercase tracking-wide text-muted-foreground">
                {BUILD_LABELS[idx]}
              </span>
              <span className="flex-1 leading-relaxed">{bullet}</span>
            </div>
          ))}
        </div>

        {/* Default assumptions. */}
        {payload.default_assumptions.some((a) => a.length > 0) && (
          <div className="rounded-lg border border-dashed bg-muted/20 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Default assumptions
              </span>
            </div>
            <ul
              className="flex flex-col gap-1 text-xs"
              data-testid="screen2-default-assumptions"
            >
              {payload.default_assumptions.map((a, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-muted-foreground">&bull;</span>
                  <span className="flex-1">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trade-idea spec details when an LLM-authored or stub spec is present. */}
        {payload.trade_idea_spec ? (
          <TradeIdeaDetails spec={payload.trade_idea_spec} />
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
            <AlertTriangle
              className={cn(
                'h-3.5 w-3.5 shrink-0 mt-0.5',
                payload.trade_idea_spec_provenance === 'parse_failed'
                  ? 'text-destructive'
                  : 'text-amber-500',
              )}
            />
            <span className="text-muted-foreground">
              No structured spec authored yet
              {payload.trade_idea_spec_provenance === 'parse_failed'
                ? ' — the LLM output failed to parse.  Continue the dialogue to clarify.'
                : ' — continue the dialogue to refine into a backtestable spec.'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
