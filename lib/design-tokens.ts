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
// These match DARK_TOKENS in ThemeContext.tsx and are wired into globals.css
// as --warning, --info, --success, --destructive, and --purple respectively.

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

// ─── Regime hex map (aligned with REGIME_HEX in lib/colors.ts) ───────────────
// Use DS_* constants above; this map is a convenience alias.
export const DS_REGIME_HEX: Record<number, string> = {
  0: DS_BLUE,   // LOW_VOL
  1: DS_GREEN,  // NORMAL
  2: DS_AMBER,  // ELEVATED_VOL
  3: DS_RED,    // CRISIS
};

// ─── Surface hex values (dark mode) ──────────────────────────────────────────
// Tailwind: bg-background, bg-card, border-border
export const DS_BG      = '#0c0f18';
export const DS_CARD    = '#131821';
export const DS_BORDER  = '#1d2339';
export const DS_BORDER2 = '#263048';

/** Terminal/sidebar header strip — always darkest element in any theme. */
export const DS_TERMINAL_HEADER = '#0e1220';

// ─── Text scale hex values (dark mode) ───────────────────────────────────────
// Tailwind: text-foreground, text-muted-foreground
export const DS_T1 = '#f1f5f9'; // headings / primary  → text-foreground
export const DS_T2 = '#d0e0ed'; // body                → (use opacity variant)
export const DS_T3 = '#a0b8d0'; // secondary labels    → text-muted-foreground
export const DS_T4 = '#6b8fa5'; // hints / meta        → text-muted-foreground/70

// ─── Alpha hex suffixes ───────────────────────────────────────────────────────
// Usage: DS_AMBER + DS_ALPHA.iconBg === '#f59e0b15'
// Prefer Tailwind opacity modifiers (bg-warning/10) when possible.
export const DS_ALPHA = {
  glow:         '07',  // 2.7%  ambient bg blob
  wash:         '08',  // 3.1%  lightest bg wash
  successBg:    '0a',  // 3.9%  success state / hover start
  chartArea:    '0d',  // 5.1%  chart area fills
  cardTint:     '12',  // 7.1%  standard card tint
  hoverBg:      '14',  // 7.8%  hover bg
  iconBg:       '15',  // 8.2%  icon container bg
  badgeBg:      '18',  // 9.4%  featured badge bg
  whileHoverBg: '1a',  // 10.2% motion whileHover bg
  activeBg:     '22',  // 13.3% active node / selected cell
  selectedCard: '28',  // 15.7% selected card (dark)
  borderSubtle: '30',  // 18.8% subtle accent border
  borderMid:    '35',  // 20.8% medium accent border
  rail:         '40',  // 25.1% connector rails
  borderMedium: '45',  // 27.1% medium accent border
  pillBorder:   '50',  // 31.4% status pill border
  termPill:     '52',  // 32.2% terminal pill border
  borderActive: '55',  // 33.3% active / selected border
  whileHoverBd: '70',  // 43.9% motion whileHover border
  dimmed:       '80',  // 50.2% dimmed accent
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const DS_FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const DS_FONT_MONO = "'JetBrains Mono', 'SF Mono', 'Monaco', monospace";

// ─── LogoMark bar proportions ─────────────────────────────────────────────────
// Five vertical bars at DS_AMBER, base height 16px.
export const DS_LOGO_BAR_HEIGHTS = [0.45, 0.65, 1, 0.7, 0.9] as const;
export const DS_LOGO_BAR_WIDTH   = '3px';
export const DS_LOGO_BAR_GAP     = '2.5px';

// ─── Semantic status map ──────────────────────────────────────────────────────
export const DS_STATUS = {
  CALM:       DS_GREEN,   // Low vol / clear skies
  NORMAL:     DS_BLUE,    // Average conditions
  ELEVATED:   DS_AMBER,   // Heightened uncertainty
  CRISIS:     DS_RED,     // Extreme stress
  TRANSITION: DS_PURPLE,  // Ambiguous / sideways
} as const;
