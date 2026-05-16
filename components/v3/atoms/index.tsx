'use client';

/**
 * v3 design-system atoms.
 *
 * Ported from `_design/v3-bundle/project/v3/app.jsx` (the inline declarations
 * at the top of that file). Pure presentational components — no state, no
 * data fetching. They consume the v3 theme via the CSS class names defined
 * in `app/v3/theme.css`.
 */

import type { CSSProperties, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export interface CardProps {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  dense?: boolean;
  style?: CSSProperties;
}

export function Card({
  title,
  eyebrow,
  action,
  sub,
  children,
  padded = true,
  dense = false,
  style,
}: CardProps) {
  const showHead = title || eyebrow || action;
  return (
    <section className={'v3-card' + (dense ? ' dense' : '')} style={style}>
      {showHead && (
        <header className="v3-card-head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <div className="card-title">{title}</div>}
            {sub && <div className="card-sub">{sub}</div>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? 'v3-card-body' : 'v3-card-body flush'}>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pill
// ---------------------------------------------------------------------------

export type PillTone = 'neutral' | 'mint' | 'warn' | 'alert';

export interface PillProps {
  tone?: PillTone;
  mono?: boolean;
  children: ReactNode;
}

export function Pill({ tone = 'neutral', mono = true, children }: PillProps) {
  return <span className={'v3-pill ' + tone + (mono ? ' mono' : '')}>{children}</span>;
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

export interface KPIProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'mint' | 'alert' | 'warn' | '';
  big?: boolean;
}

export function KPI({ label, value, sub, tone = 'mint', big = false }: KPIProps) {
  return (
    <div className="v3-kpi">
      <div className="lbl">{label}</div>
      <div className={'val ' + tone + (big ? ' big' : '')}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------

export interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}

export function SectionHeader({ eyebrow, title, sub, right }: SectionHeaderProps) {
  return (
    <div className="v3-section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="v3-h2">{title}</h2>
        {sub && <div className="v3-h2-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hairline divider
// ---------------------------------------------------------------------------

export function Hairline({ vertical = false }: { vertical?: boolean }) {
  return <div className={'v3-hair ' + (vertical ? 'v' : 'h')} />;
}
