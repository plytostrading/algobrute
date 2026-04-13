/**
 * design-tokens.ts — AlgoBrute Design System
 *
 * Canonical token reference for the algobrute Next.js application.
 *
 * Architecture note: this app uses Tailwind CSS v4 + shadcn/ui CSS custom
 * properties. Components should prefer Tailwind semantic classes
 * (bg-background, text-foreground, text-muted-foreground, bg-card, etc.).
 *
 * Use the raw hex constants below ONLY in:
 *   - Recharts <Line stroke={}>, <Bar fill={}>, <Area fill={}>
 *   - SVG attributes (stroke, fill)
 *   - Canvas drawing calls
 *   - Inline styles that cannot use CSS variables
 *
 * For everything else: bg-warning, text-success, text-destructive, etc.
 *
 * Source of truth: DESIGN_SYSTEM.md in algobrute-website (main branch).
 * These values must stay in sync with ThemeContext.tsx DARK_TOKENS there.
 */

// ─── Raw accent hex values (dark mode = chart/SVG default) ────────────────────

/** Primary brand accent. CTA buttons, badge highlights, AMBER regime. */
export const DS_AMBER  = '#f59e0b';

/** Informational / Normal regime / links. */
export const DS_BLUE   = '#3b82f6';

/** Positive states / LOW_VOL regime / protected equity paths. */
export const DS_GREEN  = '#10b981';

/** Danger / CRISIS regime / error states / loss paths. */
export const DS_RED    = '#ef4444';

/** Decorative / TRANSITION regime / fleet correlation alerts. */
export const DS_PURPLE = '#a78bfa';

// ─── Regime hex map ────────────────────────────────────────────────────────────
export const DS_REGIME_HEX: Record<number, string> = {
  0: DS_BLUE,   // LOW_VOL
  1: DS_GREEN,  // NORMAL
  2: DS_AMBER,  // ELEVATED_VOL
  3: DS_RED,    // CRISIS
};

// ─── Surface hex values (dark mode) ──────────────────────────────────────────
export const DS_BG      = '#0c0f18';
export const DS_CARD    = '#131821';
export const DS_BORDER  = '#1d2339';
export const DS_BORDER2 = '#263048';

/** Terminal/sidebar header strip — always darkest element in any theme. */
export const DS_TERMINAL_HEADER = '#0e1220';

// ─── Text scale hex values (dark mode) ───────────────────────────────────────
export const DS_T1 = '#f1f5f9'; // headings / primary  → text-foreground
export const DS_T2 = '#d0e0ed'; // body                → use opacity variant
export const DS_T3 = '#a0b8d0'; // secondary labels    → text-muted-foreground
export const DS_T4 = '#6b8fa5'; // hints / meta        → text-muted-foreground/70

// ─── Alpha hex suffixes ───────────────────────────────────────────────────────
// Usage: DS_AMBER + DS_ALPHA.iconBg === '#f59e0b15'
// Prefer Tailwind opacity modifiers (bg-warning/10) when possible.
export const DS_ALPHA = {
  glow:         '07',
  wash:         '08',
  successBg:    '0a',
  chartArea:    '0d',
  cardTint:     '12',
  hoverBg:      '14',
  iconBg:       '15',
  badgeBg:      '18',
  whileHoverBg: '1a',
  activeBg:     '22',
  selectedCard: '28',
  borderSubtle: '30',
  borderMid:    '35',
  rail:         '40',
  borderMedium: '45',
  pillBorder:   '50',
  termPill:     '52',
  borderActive: '55',
  whileHoverBd: '70',
  dimmed:       '80',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const DS_FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const DS_FONT_MONO = "'JetBrains Mono', 'SF Mono', 'Monaco', monospace";

// ─── LogoMark bar proportions ─────────────────────────────────────────────────
export const DS_LOGO_BAR_HEIGHTS = [0.45, 0.65, 1, 0.7, 0.9] as const;
export const DS_LOGO_BAR_WIDTH   = '3px';
export const DS_LOGO_BAR_GAP     = '2.5px';

// ─── Semantic status map ──────────────────────────────────────────────────────
export const DS_STATUS = {
  CALM:       DS_GREEN,
  NORMAL:     DS_BLUE,
  ELEVATED:   DS_AMBER,
  CRISIS:     DS_RED,
  TRANSITION: DS_PURPLE,
} as const;
