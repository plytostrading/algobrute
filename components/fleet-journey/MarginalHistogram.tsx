'use client';

import type { ReactNode } from 'react';

interface MarginalHistogramProps {
  xValues: number[];
  yValues: number[];
  bins?: number;
  children: ReactNode;
  topBarFill?: string;
  rightBarFill?: string;
}

/**
 * Wraps a scatter plot with top (x-axis) and right (y-axis) marginal
 * histograms. Layout: a CSS grid with a 40px strip at the top and a
 * 40px strip on the right; children render in the main cell.
 *
 * Boosts information density on scatter plots by ~3x without taking
 * meaningful extra horizontal space.
 */
export function MarginalHistogram({
  xValues,
  yValues,
  bins = 20,
  children,
  topBarFill = 'hsl(var(--primary))',
  rightBarFill = 'hsl(var(--primary))',
}: MarginalHistogramProps) {
  const xBins = histogram(xValues, bins);
  const yBins = histogram(yValues, bins);
  const xMax = Math.max(1, ...xBins.map((b) => b.count));
  const yMax = Math.max(1, ...yBins.map((b) => b.count));

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: '1fr 40px',
        gridTemplateRows: '40px 1fr',
        gap: '4px',
      }}
    >
      {/* top strip: x distribution */}
      <div className="h-10 opacity-60">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox={`0 0 ${xBins.length} ${xMax}`}>
          {xBins.map((b, i) => (
            <rect
              key={i}
              x={i + 0.05}
              y={xMax - b.count}
              width={0.9}
              height={b.count}
              fill={topBarFill}
            />
          ))}
        </svg>
      </div>
      {/* top-right corner */}
      <div />
      {/* main scatter */}
      <div>{children}</div>
      {/* right strip: y distribution */}
      <div className="w-10 opacity-60">
        <svg
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          viewBox={`0 0 ${yMax} ${yBins.length}`}
        >
          {yBins.map((b, i) => (
            <rect
              key={i}
              x={0}
              // Y-axis histogram is drawn top-to-bottom matching scatter's Y direction
              y={yBins.length - 1 - i + 0.05}
              width={b.count}
              height={0.9}
              fill={rightBarFill}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function histogram(values: number[], bins: number): { count: number }[] {
  if (values.length === 0) return Array.from({ length: bins }, () => ({ count: 0 }));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = span / bins;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    let b = Math.floor((v - min) / width);
    if (b >= bins) b = bins - 1;
    if (b < 0) b = 0;
    counts[b] += 1;
  }
  return counts.map((c) => ({ count: c }));
}
