'use client';

/**
 * v3 chart primitives — small, composable, mostly SVG.
 *
 * Ported from `_design/v3-bundle/project/v3/charts.jsx`. All charts are
 * deterministic when seeded — they use a tiny LCG so layouts are stable.
 */

import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Deterministic PRNG
// ---------------------------------------------------------------------------

function rnd(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

export function genWalk(n: number, drift = 1, vol = 0.5, seed = 7): number[] {
  const r = rnd(seed);
  let v = 100;
  return Array.from({ length: n }, () => {
    v += (r() - 0.45) * vol + drift * 0.05;
    return v;
  });
}

export function genSeries(n: number, mean = 0.5, std = 0.2, seed = 9): number[] {
  const r = rnd(seed);
  return Array.from({ length: n }, () => mean + (r() - 0.5) * std * 2);
}

// ---------------------------------------------------------------------------
// DotMatrix
// ---------------------------------------------------------------------------

export interface DotMatrixProps {
  value: number;
  total: number;
  cols?: number;
  tone?: 'on' | 'warn' | 'alert';
  size?: number;
  gap?: number;
  dimRest?: boolean;
}

export function DotMatrix({
  value,
  total,
  cols = 10,
  tone = 'on',
  size = 10,
  gap = 3,
  dimRest = true,
}: DotMatrixProps) {
  const rows = Math.ceil(total / cols);
  const dots = Array.from({ length: rows * cols });
  return (
    <div
      className="dot-matrix"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap,
        width: cols * size + (cols - 1) * gap,
      }}
    >
      {dots.map((_, i) => {
        const filled = i < value;
        const oob = i >= total;
        return (
          <span
            key={i}
            className={'dot ' + (filled ? tone : oob ? '' : dimRest ? 'dim' : '')}
            style={{ visibility: oob ? 'hidden' : 'visible' }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Picto (1-D pictogram row)
// ---------------------------------------------------------------------------

export function Picto({
  value,
  total,
  tone = 'on',
}: {
  value: number;
  total: number;
  tone?: 'on' | 'warn';
}) {
  return (
    <div className="picto-row">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < value ? tone : ''} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bullet
// ---------------------------------------------------------------------------

export interface BulletProps {
  value: number;
  target?: number;
  max?: number;
  q1?: number;
  q2?: number;
  color?: string;
}

export function Bullet({ value, target, max = 100, q1 = 33, q2 = 66, color = 'var(--mint)' }: BulletProps) {
  const pct = (n: number) => Math.max(0, Math.min(100, (n / max) * 100));
  return (
    <div className="bullet">
      <div className="qual q1" style={{ left: 0, width: `${q1}%` }} />
      <div className="qual q2" style={{ left: `${q1}%`, width: `${q2 - q1}%` }} />
      <div className="qual q3" style={{ left: `${q2}%`, width: `${100 - q2}%` }} />
      <div className="bar" style={{ width: `${pct(value)}%`, background: color }} />
      {target != null && <div className="target" style={{ left: `${pct(target)}%` }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut
// ---------------------------------------------------------------------------

export interface DonutSlice {
  value: number;
  color?: string;
}

export interface DonutProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  label?: ReactNode;
  sub?: ReactNode;
  color?: string;
}

export function Donut({
  slices,
  size = 120,
  thickness = 14,
  label,
  sub,
  color = 'var(--mint)',
}: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={thickness}
        />
        {slices.map((s, i) => {
          const len = (s.value / 100) * c;
          const dasharray = `${len} ${c - len}`;
          const dashoffset = -off;
          off += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color || color}
              strokeWidth={thickness}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="donut-center">
        {label != null && (
          <div className="num-lg" style={{ color: 'var(--text)' }}>
            {label}
          </div>
        )}
        {sub != null && <div className="micro">{sub}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RadialBars
// ---------------------------------------------------------------------------

export interface RadialBarsRow {
  value: number;
  color?: string;
}

export function RadialBars({
  rows,
  size = 180,
  thickness = 8,
  gap = 3,
}: {
  rows: RadialBarsRow[];
  size?: number;
  thickness?: number;
  gap?: number;
}) {
  const cx = size / 2,
    cy = size / 2;
  const c = (r: number) => 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {rows.map((row, i) => {
        const r = size / 2 - 6 - i * (thickness + gap);
        if (r < 12) return null;
        const cc = c(r);
        const len = (row.value / 100) * cc * 0.85;
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth={thickness}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={row.color || 'var(--mint)'}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${cc}`}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CalHeatmap
// ---------------------------------------------------------------------------

export function CalHeatmap({ data, weeks = 26 }: { data: number[]; weeks?: number }) {
  return (
    <div className="cal" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
      {data.map((v, i) => {
        if (v == null) return <span key={i} className="day" />;
        const intensity = Math.min(1, Math.abs(v));
        const color =
          v >= 0
            ? `color-mix(in oklch, var(--mint) ${intensity * 80 + 10}%, var(--surface-3))`
            : `color-mix(in oklch, var(--alert) ${intensity * 80 + 10}%, var(--surface-3))`;
        return <span key={i} className="day" style={{ background: color }} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Beeswarm
// ---------------------------------------------------------------------------

export function Beeswarm({
  values,
  width = 360,
  height = 60,
  color = 'mint',
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: 'mint' | 'warn' | 'alt' | 'dim';
}) {
  const points = useMemo(() => {
    if (values.length === 0) return [];
    const min = Math.min(...values),
      max = Math.max(...values);
    const r = rnd(values.length * 7 + 13);
    return values.map((v) => {
      const x = ((v - min) / (max - min || 1)) * (width - 12) + 6;
      const y = height / 2 + (r() - 0.5) * (height - 14);
      return { x, y };
    });
  }, [values, width, height]);

  const cls =
    'swarm-dot ' +
    (color === 'mint' ? '' : color === 'alt' ? 'alt' : color === 'warn' ? 'warn' : 'dim');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      <line
        x1={0}
        x2={width}
        y1={height / 2}
        y2={height / 2}
        stroke="var(--hairline-strong)"
        strokeWidth={1}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" className={cls} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Ridge
// ---------------------------------------------------------------------------

export interface RidgeRow {
  label: string;
  color: string;
  values: number[];
}

export function Ridge({
  rows,
  width = 560,
  height = 200,
  gap = 6,
}: {
  rows: RidgeRow[];
  width?: number;
  height?: number;
  gap?: number;
}) {
  const laneH = (height - rows.length * gap) / rows.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      {rows.map((row, i) => {
        const y0 = i * (laneH + gap);
        const max = Math.max(...row.values, 0.1);
        const pts = row.values
          .map((v, j) => {
            const x = (j / (row.values.length - 1)) * width;
            const y = y0 + laneH - (v / max) * (laneH - 2);
            return `${x},${y}`;
          })
          .join(' ');
        return (
          <g key={i}>
            <polyline
              points={`0,${y0 + laneH} ${pts} ${width},${y0 + laneH}`}
              fill={`${row.color}28`}
              stroke={row.color}
              strokeWidth="1.2"
            />
            <text x={6} y={y0 + 11} fontFamily="var(--f-mono)" fontSize="9.5" fill="var(--text-3)">
              {row.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

export function Sparkline({
  values,
  width = 140,
  height = 44,
  color = 'var(--mint)',
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values),
    min = Math.min(...values);
  const pts = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * width},${height - ((v - min) / (max - min || 1)) * (height - 4) - 2}`,
    )
    .join(' ');
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={fillPts} fill={color} fillOpacity="0.12" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// EquityChart
// ---------------------------------------------------------------------------

export function EquityChart({
  benchmark,
  strategy,
  oosAt = 0.7,
  height = 180,
  width = 760,
}: {
  benchmark: number[];
  strategy: number[];
  oosAt?: number;
  height?: number;
  width?: number;
}) {
  const all = [...benchmark, ...strategy];
  if (all.length === 0) return null;
  const min = Math.min(...all),
    max = Math.max(...all);
  const path = (data: number[]) =>
    data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / (max - min)) * (height - 6) - 3;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      <g className="grid-h">
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1="0" x2={width} y1={height * t} y2={height * t} />
        ))}
      </g>
      <line
        x1={width * oosAt}
        x2={width * oosAt}
        y1="0"
        y2={height}
        stroke="rgba(255,255,255,0.22)"
        strokeDasharray="3,4"
      />
      <text
        x={width * oosAt + 4}
        y={12}
        fontFamily="var(--f-mono)"
        fontSize="9.5"
        fill="var(--text-3)"
      >
        OOS START
      </text>
      <path d={path(benchmark)} fill="none" stroke="var(--pink)" strokeWidth="1.6" />
      <path d={path(strategy)} fill="none" stroke="var(--mint)" strokeWidth="1.9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ScaleBar
// ---------------------------------------------------------------------------

export interface ScaleThreshold {
  at: number;
  label: string;
  color?: string;
}

export function ScaleBar({
  value,
  min = 0,
  max = 100,
  markers = [],
  thresholds = [],
  color = 'var(--mint)',
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  markers?: string[];
  thresholds?: ScaleThreshold[];
  color?: string;
  label?: string;
}) {
  const pct = (n: number) => Math.max(0, Math.min(100, ((n - min) / (max - min)) * 100));
  return (
    <div style={{ position: 'relative', padding: '20px 0 22px' }}>
      <div
        style={{
          position: 'relative',
          height: 6,
          background: 'var(--surface-3)',
          borderRadius: 999,
        }}
      >
        {thresholds.map((th, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${pct(th.at)}%`,
              top: -6,
              bottom: -6,
              width: 1,
              background: th.color || 'var(--warn)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -16,
                left: -20,
                width: 40,
                textAlign: 'center',
                fontFamily: 'var(--f-mono)',
                fontSize: 9.5,
                color: th.color || 'var(--warn)',
              }}
            >
              {th.label}
            </div>
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct(value)}%`,
            background: color,
            borderRadius: 999,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${pct(value)}% - 6px)`,
            top: -3,
            width: 12,
            height: 12,
            borderRadius: 999,
            background: color,
            border: '2px solid var(--bg)',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontFamily: 'var(--f-mono)',
          fontSize: 10,
          color: 'var(--text-3)',
        }}
      >
        {markers.length > 0 ? (
          markers.map((m, i) => <span key={i}>{m}</span>)
        ) : (
          <>
            <span>{min}</span>
            <span>{max}</span>
          </>
        )}
      </div>
      {label && (
        <div
          style={{
            position: 'absolute',
            left: `calc(${pct(value)}% - 24px)`,
            bottom: -2,
            width: 48,
            textAlign: 'center',
            fontFamily: 'var(--f-mono)',
            fontSize: 10,
            color,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RegimePolar
// ---------------------------------------------------------------------------

export function RegimePolar({ value, size = 130 }: { value: number[]; size?: number }) {
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 4;
  const rings = 4,
    slices = 4;
  return (
    <svg width={size} height={size}>
      {Array.from({ length: rings }).map((_, ri) =>
        Array.from({ length: slices }).map((__, si) => {
          const a0 = (si / slices) * Math.PI * 2 - Math.PI / 2;
          const a1 = ((si + 1) / slices) * Math.PI * 2 - Math.PI / 2;
          const r0 = (ri / rings) * r;
          const r1 = ((ri + 1) / rings) * r;
          const x0 = cx + Math.cos(a0) * r0,
            y0 = cy + Math.sin(a0) * r0;
          const x1 = cx + Math.cos(a1) * r0,
            y1 = cy + Math.sin(a1) * r0;
          const x2 = cx + Math.cos(a1) * r1,
            y2 = cy + Math.sin(a1) * r1;
          const x3 = cx + Math.cos(a0) * r1,
            y3 = cy + Math.sin(a0) * r1;
          const v = value[ri * slices + si] ?? 0;
          const fill =
            v > 0
              ? `color-mix(in oklch, var(--mint) ${v * 80 + 8}%, var(--surface-3))`
              : 'var(--surface-3)';
          return (
            <path
              key={`${ri}-${si}`}
              d={`M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`}
              fill={fill}
              stroke="var(--bg)"
              strokeWidth="0.8"
            />
          );
        }),
      )}
      <circle cx={cx} cy={cy} r="4" fill="var(--bg)" stroke="var(--text-3)" strokeWidth="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Waterfall (P&L attribution)
// ---------------------------------------------------------------------------

export interface WaterfallRow {
  label: string;
  val: number;
}

export function Waterfall({ rows }: { rows: WaterfallRow[]; width?: number }) {
  if (rows.length === 0) return null;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.val)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {rows.map((r, i) => {
        const pct = (Math.abs(r.val) / maxAbs) * 45;
        const pos = r.val >= 0;
        const barStyle: CSSProperties = {
          position: 'absolute',
          top: 2,
          bottom: 2,
          width: `${pct}%`,
          background: pos ? 'var(--mint)' : 'var(--alert)',
          borderRadius: 2,
        };
        if (pos) {
          barStyle.left = '50%';
        } else {
          barStyle.right = '50%';
        }
        return (
          <div key={i} className="waterfall-row">
            <span className="label">{r.label}</span>
            <div
              style={{
                position: 'relative',
                height: 14,
                background: 'var(--surface-2)',
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'var(--hairline-strong)',
                }}
              />
              <div style={barStyle} />
            </div>
            <span className="val" style={{ color: pos ? 'var(--mint)' : 'var(--alert)' }}>
              {pos ? '+' : '−'}${Math.abs(r.val).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
