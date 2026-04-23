'use client';

import { Sparkline } from './Sparkline';

export interface MultiplePanel {
  key: string;
  label: string;
  values: number[];
  accent?: string;
  sublabel?: string;
}

interface SmallMultiplesGridProps {
  panels: MultiplePanel[];
  columns?: number;
  panelHeight?: number;
  title?: string;
  showLastValue?: boolean;
  fillArea?: boolean;
}

/**
 * Grid of small mini-chart panels, one per series. Each panel has its
 * own y-scale (values normalized independently) so comparing shapes
 * is easy even when absolute scales differ wildly.
 *
 * Use this instead of a single chart with overlapping lines whenever
 * there are > 5 series. Small multiples are Tufte's recommended form
 * for comparing many trends at once.
 */
export function SmallMultiplesGrid({
  panels,
  columns = 3,
  panelHeight = 48,
  title,
  showLastValue = true,
  fillArea = true,
}: SmallMultiplesGridProps) {
  if (panels.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {title ? `${title}: no data` : 'No data'}
      </div>
    );
  }

  const gridClass =
    columns === 2
      ? 'grid grid-cols-2 gap-3'
      : columns === 3
        ? 'grid grid-cols-2 gap-3 md:grid-cols-3'
        : columns === 4
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'
          : 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';

  return (
    <div className="space-y-3">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
      )}
      <div className={gridClass}>
        {panels.map((p) => {
          const last = p.values.length > 0 ? p.values[p.values.length - 1] : null;
          const first = p.values.length > 0 ? p.values[0] : null;
          const delta = last !== null && first !== null ? last - first : null;
          const toneClass =
            delta === null || Math.abs(delta) < 1e-9
              ? 'text-muted-foreground'
              : delta > 0
                ? 'text-green-600'
                : 'text-destructive';
          return (
            <div
              key={p.key}
              className="rounded-md border bg-card/40 p-2 text-xs"
            >
              <div className="mb-1 flex items-baseline justify-between gap-1">
                <span className="truncate font-mono font-semibold text-foreground">
                  {p.label}
                </span>
                {showLastValue && last !== null && (
                  <span className={`font-mono text-[10px] ${toneClass}`}>
                    {last >= 0 ? '+' : ''}
                    {last.toFixed(2)}%
                  </span>
                )}
              </div>
              <div style={{ color: p.accent ?? 'hsl(var(--primary))' }}>
                <Sparkline
                  values={p.values}
                  width={160}
                  height={panelHeight}
                  stroke="currentColor"
                  fillArea={fillArea}
                  showZeroLine
                />
              </div>
              {p.sublabel && (
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {p.sublabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
