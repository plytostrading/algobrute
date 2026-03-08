'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFearGreed } from '@/hooks/useFearGreed';
import FleetPanelInsightCard from '@/components/insights/FleetPanelInsightCard';
import type { FearGreedComponent } from '@/types/api';

// ---------------------------------------------------------------------------
// SVG gauge constants
// ---------------------------------------------------------------------------

const CX = 110;     // center x
const CY = 95;      // center y (at the chord of the arc)
const R_OUTER = 72; // outer radius
const R_INNER = 52; // inner radius
const SVG_W = 220;
const SVG_H = 105;

const BANDS = [
  { s1: 0, s2: 20, color: '#ef4444', label: 'Extreme Fear' },
  { s1: 20, s2: 40, color: '#f97316', label: 'Fear' },
  { s1: 40, s2: 60, color: '#eab308', label: 'Neutral' },
  { s1: 60, s2: 80, color: '#84cc16', label: 'Greed' },
  { s1: 80, s2: 100, color: '#22c55e', label: 'Extreme Greed' },
] as const;

/** Convert a 0–100 score to a radian angle for the upper semicircle.
 *  score=0  → π   (left)
 *  score=50 → π/2 (top)
 *  score=100 → 0  (right)
 */
function scoreToAngle(score: number): number {
  return (1 - score / 100) * Math.PI;
}

/** Polar → Cartesian in SVG coords (y-axis inverted). */
function polarXY(angleDeg: number, r: number): [number, number] {
  return [CX + r * Math.cos(angleDeg), CY - r * Math.sin(angleDeg)];
}

/** SVG path for a donut sector spanning scores [s1, s2]. */
function sectorPath(s1: number, s2: number): string {
  const θ1 = scoreToAngle(s1);
  const θ2 = scoreToAngle(s2);
  const [x1o, y1o] = polarXY(θ1, R_OUTER);
  const [x2o, y2o] = polarXY(θ2, R_OUTER);
  const [x1i, y1i] = polarXY(θ1, R_INNER);
  const [x2i, y2i] = polarXY(θ2, R_INNER);
  // Each band spans 20 pts = 36° < 180°, so large-arc-flag = 0
  return [
    `M ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 0 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)}`,
    `L ${x2i.toFixed(2)} ${y2i.toFixed(2)}`,
    `A ${R_INNER} ${R_INNER} 0 0 0 ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function needleColor(score: number): string {
  if (score < 20) return '#ef4444';
  if (score < 40) return '#f97316';
  if (score < 60) return '#eab308';
  if (score < 80) return '#84cc16';
  return '#22c55e';
}

// ---------------------------------------------------------------------------
// Single gauge SVG
// ---------------------------------------------------------------------------

interface GaugeProps {
  score: number | null;
  label: string | null;
  title: string;
}

function Gauge({ score, label, title }: GaugeProps) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="overflow-visible">
        {/* Colored arc sectors */}
        {BANDS.map((b) => (
          <path key={b.s1} d={sectorPath(b.s1, b.s2)} fill={b.color} opacity={0.85} />
        ))}

        {score === null ? (
          <text x={CX} y={CY - 8} textAnchor="middle" fontSize="11" fill="#888">
            Unavailable
          </text>
        ) : (
          <>
            {/* Needle line */}
            {(() => {
              const angle = scoreToAngle(score);
              const [nx, ny] = polarXY(angle, R_OUTER - 6);
              const color = needleColor(score);
              return (
                <>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={nx.toFixed(2)}
                    y2={ny.toFixed(2)}
                    stroke={color}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  {/* Needle pivot */}
                  <circle cx={CX} cy={CY} r={5} fill={color} />
                </>
              );
            })()}
            {/* Score number */}
            <text
              x={CX}
              y={CY - 10}
              textAnchor="middle"
              fontSize="20"
              fontWeight="bold"
              fill="currentColor"
              fontFamily="var(--font-mono)"
            >
              {score.toFixed(0)}
            </text>
            {/* Label below score */}
            {label && (
              <text x={CX} y={CY + 5} textAnchor="middle" fontSize="9" fill="#888">
                {label}
              </text>
            )}
          </>
        )}

        {/* Axis labels */}
        <text
          x={CX - R_OUTER - 2}
          y={CY + 5}
          textAnchor="end"
          fontSize="8"
          fill="#ef4444"
          fontWeight="600"
        >
          Fear
        </text>
        <text
          x={CX + R_OUTER + 2}
          y={CY + 5}
          textAnchor="start"
          fontSize="8"
          fill="#22c55e"
          fontWeight="600"
        >
          Greed
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Divergence banner styling
// ---------------------------------------------------------------------------

function divergenceBannerClass(label: string): string {
  if (label === 'Significant Divergence') {
    return 'bg-destructive/10 border-destructive/30 text-destructive';
  }
  if (label === 'Moderate Divergence') {
    return 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
  }
  return 'bg-muted/40 border-border text-muted-foreground';
}

// ---------------------------------------------------------------------------
// Component breakdown row
// ---------------------------------------------------------------------------

function ComponentRow({ component }: { component: FearGreedComponent }) {
  const textColor =
    component.direction === 'Fear'
      ? 'text-destructive'
      : component.direction === 'Greed'
      ? 'text-success'
      : 'text-muted-foreground';

  const barColor =
    component.direction === 'Fear'
      ? '#ef4444'
      : component.direction === 'Greed'
      ? '#22c55e'
      : '#eab308';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-muted-foreground">{component.name}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        {component.score !== null && (
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${component.score}%`, background: barColor }}
          />
        )}
      </div>
      <span className={`font-mono text-right shrink-0 w-8 ${textColor}`}>
        {component.score !== null ? component.score.toFixed(0) : 'N/A'}
      </span>
      <span className="text-[10px] text-muted-foreground shrink-0 w-14 text-right">
        {(component.weight * 100).toFixed(0)}% wt
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

export default function FearGreedCard() {
  const { data, isLoading } = useFearGreed();
  const [showComponents, setShowComponents] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Fear &amp; Greed</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const divLabel = data.divergence_label;
  const hasDivergence = divLabel !== 'Aligned' && data.divergence !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          Fear &amp; Greed Gauge
          {hasDivergence && (
            <Badge variant="outline" className="text-[9px] h-4 shrink-0">
              {divLabel}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-[11px]">
          Portfolio mood vs broad market sentiment
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dual gauges */}
        <div className="flex items-end justify-around gap-2 overflow-x-auto">
          <Gauge
            score={data.portfolio_gauge}
            label={data.portfolio_label}
            title="Portfolio"
          />
          <Gauge
            score={data.market_gauge}
            label={data.market_label}
            title="Market"
          />
        </div>

        {/* Divergence banner */}
        {data.divergence !== null && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${divergenceBannerClass(divLabel)}`}
          >
            {divLabel}
            {data.divergence !== null && (
              <span className="ml-1.5 opacity-75 font-normal">
                ({data.divergence > 0 ? '+' : ''}
                {data.divergence.toFixed(0)} pts — portfolio{' '}
                {data.divergence > 0 ? 'above' : 'below'} market)
              </span>
            )}
          </div>
        )}

        {/* Market component accordion */}
        {data.components.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowComponents((v) => !v)}
            >
              Market components
              {showComponents ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showComponents && (
              <div className="mt-2 space-y-1.5">
                {data.components.map((c) => (
                  <ComponentRow key={c.name} component={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Insight */}
        <FleetPanelInsightCard panelKey="fear_greed" />

        {/* Always-visible disclaimer */}
        <div className="flex items-start gap-1.5 rounded-md bg-muted/30 px-2.5 py-2 text-[10px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
          <span>
            Fear &amp; Greed gauges are educational market indicators and do not
            constitute investment advice. Portfolio gauge reflects fleet health
            score; market gauge uses public macro/price data.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
