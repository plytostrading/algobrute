# UI-P1 — v3 Scaffold Implementation Notes

**Branch:** `nextjs-v2-redesign`
**Date:** 2026-05-15
**Scope:** Port v3 visual design into the existing Next.js 15 + TanStack Query
frontend without breaking any wired functionality. Mock data only — no new
backend endpoints wired in this pass.

---

## What landed

A self-contained `v3` route tree at `/v3/*` that mounts the new
"Infographic" visual language alongside the existing `(app)` screens. The
old screens (`/`, `/operations`, `/workbench`, `/insights`, `/settings`,
`/portfolio`, …) are completely untouched — owners can flip the cutover
later by editing `components/layout/AppSidebar.tsx` to point at the
`/v3/*` URLs (or by promoting `/v3/command` to `/`).

### Routes

| Route                          | Status                | Source of design              |
|--------------------------------|-----------------------|-------------------------------|
| `/v3` → redirect → `/v3/command` | done                | n/a (next/navigation redirect) |
| `/v3/command`                  | scaffolded, MOCKED    | `v3/app.jsx` (CommandCenter)  |
| `/v3/operations`               | scaffolded, MOCKED    | `v3/app.jsx` (Operations)     |
| `/v3/operations/[botId]`       | scaffolded, MOCKED    | `v3/app.jsx` (BotDetail)      |
| `/v3/workbench`                | scaffolded, MOCKED    | `v3/app.jsx` (Workbench)      |
| `/v3/validation`               | scaffolded, MOCKED    | `v3/validation.jsx` (frame)   |
| `/v3/insights`                 | scaffolded, MOCKED    | `v3/app.jsx` (Insights)       |
| `/v3/portfolio`                | scaffolded, MOCKED    | `v3/app.jsx` (Portfolio)      |
| `/v3/settings`                 | scaffolded, **LIVE-WIRED** | `v3/settings.jsx` visuals + wired backend mirroring `app/(app)/settings/page.tsx` |

### File layout added

```
app/v3/
  theme.css                       # v3 visual tokens (scoped under .v3-root)
  layout.tsx                      # v3 sidebar shell — does NOT mount AppShell
  page.tsx                        # redirect → /v3/command
  command/page.tsx
  operations/page.tsx
  operations/[botId]/page.tsx
  workbench/page.tsx
  insights/page.tsx
  portfolio/page.tsx
  validation/page.tsx
  settings/page.tsx               # v3 visual + LIVE backend wiring

components/v3/
  atoms/index.tsx                 # Card · Pill · KPI · SectionHeader · Hairline
  charts/index.tsx                # DotMatrix · Picto · Bullet · Donut · RadialBars · CalHeatmap · Beeswarm · Ridge · Sparkline · EquityChart · ScaleBar · RegimePolar · Waterfall
  screens/
    Sidebar.tsx                   # v3 left nav, links to /v3/*
    CommandCenter.tsx
    Operations.tsx
    Workbench.tsx
    Insights.tsx
    Portfolio.tsx
    Validation.tsx
    BotDetail.tsx
```

### Other production-ready changes

- `next.config.ts` — adds `output: 'standalone'` for Cloud Run; supports
  `NEXT_PUBLIC_API_URL` env var (falls back to legacy `BACKEND_URL`, then
  `http://localhost:4001`).
- `Dockerfile` — multi-stage `node:20-alpine`, runs as non-root, listens
  on `$PORT` (Cloud Run convention, default 8080).
- `.dockerignore` — excludes `_design/`, `e2e*`, `node_modules`, etc.

---

## Settings W7 — Untouched + Re-Skinned (Both Available)

The owner explicitly required that the wired Settings screen (W7) must
continue to function.

**Two implementations exist side-by-side:**

1. **Canonical (untouched):** `app/(app)/settings/page.tsx`
   - The original wired W7 page, served at `/settings`.
   - Untouched in this commit — no JSX changes, no logic changes, no
     dependency changes. Tests, e2e, and runtime behaviour identical.

2. **v3 visual variant (wired):** `app/v3/settings/page.tsx`
   - New file. Mirrors the canonical page's API calls 1-for-1:
     - `GET  /api/user/profile` (TanStack Query, `queryKeys.user.profile`)
     - `PATCH /api/user/profile`
     - `GET  /api/user/alpaca/status` (`queryKeys.user.alpacaStatus`)
     - `POST /api/user/alpaca/connect` (mode-aware: `paper` / `live`)
     - `DELETE /api/user/alpaca/disconnect` (mode-aware)
   - Renders with v3 visuals (`.v3-card`, `.settings-form`, Instrument Serif
     headers, mint accents, paper/live tab strip).
   - Same `apiFetch`, same `queryKeys`, same type imports
     (`UserProfile`, `AlpacaConnectionStatus`, `AlpacaMode`).
   - **Same mutation invalidation** — both screens listen to the same
     query keys, so editing risk profile through one is visible in the
     other on next refetch.

Both pages are kept; the owner decides cutover.

---

## Out of scope (UI-P2 / UI-P3)

The following intentionally **not** done in UI-P1, per the brief:

- No new backend endpoints — `B4`, `B5`, `B7`–`B10` remain unbuilt.
- No TanStack Query wiring for Command Center, Operations, Workbench,
  Insights, Portfolio, Validation, BotDetail v3 screens. All consume
  mock/synthetic data.
- No deletion of legacy `(app)` screens. Cutover is later.
- No Cloud Run deploy — Dockerfile + standalone config are ready;
  deployment is owner-gated.
- The full `v3/validation.jsx` ValidationReplay (60+ lines of scrubber +
  decision-state inspector + event log + ask-this-validation dock) was
  not fully ported — UI-P1 ships the visual frame (paired-metrics strip,
  EquityChart, reliability ScaleBar, regime-transition list). The
  interactive scrubber is deferred.
- The Sankey `FlowDiagram` from `_design/v3-bundle/project/v3/charts.jsx`
  was not ported — Portfolio shows allocation Donut + holdings table
  instead. Material visual gap vs prototype, but functionally complete.
- Workbench-detail receipts table simplified vs prototype (templates +
  verdict + ledger present; the 90-day "sanity-check" inline SVG chart
  in WBConcept was dropped because it carried too much inline state for
  the ~time budget — can be re-added in UI-P2).

---

## Theme integration notes

- v3 fonts are loaded via `@import` in `app/v3/theme.css`:
  - Instrument Serif (display, italic 400)
  - DM Sans (sans, 400/500/700)
  - JetBrains Mono (mono, 400/500/700)
- All v3 styles are **scoped under `.v3-root`** (set on `app/v3/layout.tsx`),
  so they do not bleed into the legacy `(app)` screens. The legacy MUI iOS
  theme + Tailwind + shadcn primitives in `app/globals.css` are untouched.
- v3 uses dark-only colors via OKLCH. There is no light-mode v3 variant
  yet — owner deferred that decision.

---

## How to verify locally

```bash
cd /media/smalik/data/github/algobrute
npm install                   # if needed (no new deps were added)
npm run build                 # must succeed (it does — 22 routes prerender)
npm run dev                   # http://localhost:5173

# In another terminal, after authenticating:
open http://localhost:5173/v3/command
open http://localhost:5173/v3/operations
open http://localhost:5173/v3/workbench
open http://localhost:5173/v3/insights
open http://localhost:5173/v3/portfolio
open http://localhost:5173/v3/validation
open http://localhost:5173/v3/settings

# Verify the canonical Settings still works:
open http://localhost:5173/settings
```

Build output from this commit:

```
Route (app)                         Size  First Load JS
├ ○ /settings                      15 kB         237 kB       <- canonical, untouched
├ ○ /v3                              0 B         156 kB       <- redirect
├ ○ /v3/command                  6.26 kB         162 kB
├ ○ /v3/insights                  4.8 kB         161 kB
├ ○ /v3/operations               5.52 kB         162 kB
├ ƒ /v3/operations/[botId]       4.68 kB         161 kB
├ ○ /v3/portfolio                4.55 kB         161 kB
├ ○ /v3/settings                 8.96 kB         165 kB       <- v3 visual + LIVE-wired
├ ○ /v3/validation               4.28 kB         160 kB
└ ○ /v3/workbench                 7.4 kB         163 kB
```

22/22 static pages generated. Typecheck green. Build green.

---

## Next steps (UI-P2 candidates)

1. Wire `/v3/command` to `useFleetWeather` / `useFleetNarrative` /
   `useFleetRecommendations` / `useBots` (existing hooks). Replace mock
   `regime` / `weather` arrays. Map the v3 `BotGroup` accordion to the
   real `bots` query data.
2. Wire `/v3/operations` to `useFleetState` + the existing
   `useFleetCorrelation` hook. Replace `OPS_ROWS` with the live bot
   snapshots.
3. Wire `/v3/insights` regime / attribution / corr tabs to the existing
   `useFleetAnalytics` hook. Port the calendar heatmap to real journal data.
4. Port the full ValidationReplay surface (scrubber + event log + ask dock)
   and wire to live backtest/validation endpoints once they exist.
5. Decide the cutover: replace `app/(app)/page.tsx` content with v3
   CommandCenter (rewire the production sidebar), OR keep v3 as a
   separate visual variant for stakeholder review.
