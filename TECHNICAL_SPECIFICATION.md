# AlgoBrute: Technical Specification for Backend–UI Integration

**Version:** 2.0  
**Date:** February 16, 2026  
**Purpose:** Comprehensive blueprint connecting VectorBT-powered backend computations (treated as black boxes) to the Next.js/shadcn UI prototype, with explicit output contracts, cross-metric reasoning chains, LLM narrative intelligence specifications, and data storytelling architecture for retail algorithmic traders.

---

## How to Read This Document

This specification is organized in **7 Parts** (33 sections). Each section follows a consistent structure:

1. **Purpose & User Question** — What decision does this help the user make?
2. **Computation Boundary** — Is this computed by the backend (black box) or the UI/middleware layer?
3. **Output Contract** — Exact fields, types, units, and expected ranges the backend must return (or the UI must compute).
4. **Validation Invariants** — Rules that must hold true; violations indicate bugs.
5. **Interpretation & Thresholds** — How raw numbers map to user-facing assessments.
6. **Data Story** — How this metric connects to other metrics and drives narratives.
7. **Codebase Cross-Reference** — Which TypeScript interfaces, mock data exports, and UI components implement this.

**Architectural Principle:** The backend runs **VectorBT + custom numerical harnesses** for backtesting, Monte Carlo simulation, Walk Forward Optimization, and block bootstrapping. This spec treats those engines as **black boxes behind API endpoints**. We define what computed outputs we expect, not how they are internally calculated. The spec makes demands about the shape, semantics, and validity of outputs — the backend team decides how to produce them.

---

## Table of Contents

### Part I: Foundations
1. [Philosophy & Storytelling Architecture](#1-philosophy--storytelling-architecture)
2. [Data Flow & State Architecture](#2-data-flow--state-architecture)
3. [Regime Classification Contract](#3-regime-classification-contract)

### Part II: Individual Bot Analytics
4. [Performance Metrics Output Contract](#4-performance-metrics-output-contract)
5. [Risk Metrics & Drawdown System](#5-risk-metrics--drawdown-system)
6. [Walk Forward Optimization Contract](#6-walk-forward-optimization-contract)
7. [Monte Carlo Simulation Contract](#7-monte-carlo-simulation-contract)
8. [Backtest Verdict Engine](#8-backtest-verdict-engine)
9. [Expected Behavior Band](#9-expected-behavior-band)

### Part III: Fleet-Level Intelligence
10. [Portfolio Decomposition & Sensitivity Analysis](#10-portfolio-decomposition--sensitivity-analysis)
11. [Correlation & Concentration Risk](#11-correlation--concentration-risk)
12. [Fleet Health Composite Score](#12-fleet-health-composite-score)
13. [Action Cue Generation Engine](#13-action-cue-generation-engine)
14. [Command Center Data Story](#14-command-center-data-story)

### Part IV: Risk Intelligence System
15. [Risk Weather — Multi-Factor Model](#15-risk-weather--multi-factor-model)
16. [Risk Budget System](#16-risk-budget-system)
17. [Stress Scenario Engine](#17-stress-scenario-engine)
18. [Diversification Scoring Algorithm](#18-diversification-scoring-algorithm)
19. [Recommendation Engine — Causal DAG](#19-recommendation-engine--causal-dag)
20. [Cross-Metric Dependency Map](#20-cross-metric-dependency-map)

### Part V: LLM Narrative Intelligence
21. [Narrative Type Taxonomy](#21-narrative-type-taxonomy)
22. [Context Packet Assembly](#22-context-packet-assembly)
23. [Anticipatory Risk Narration](#23-anticipatory-risk-narration)
24. [Prompt Engineering Specification](#24-prompt-engineering-specification)
25. [Tone Adaptation Matrix](#25-tone-adaptation-matrix)

### Part VI: Platform Mechanics
26. [Circuit Breaker State Machine](#26-circuit-breaker-state-machine)
27. [Position Lifecycle State Machine](#27-position-lifecycle-state-machine)
28. [Deployment Pipeline](#28-deployment-pipeline)
29. [Insights Analytics Engine](#29-insights-analytics-engine)
30. [Discovery & Scanner Pipeline](#30-discovery--scanner-pipeline)

### Part VII: Integration
31. [API Contract v2.0](#31-api-contract-v20)
32. [Mock Data as Reference Implementation](#32-mock-data-as-reference-implementation)
33. [Implementation Roadmap](#33-implementation-roadmap)

---

# PART I: FOUNDATIONS

---

## 1. Philosophy & Storytelling Architecture

### 1.1 The Three Core Questions

Every screen, metric, and narrative in AlgoBrute exists to answer one of three questions for a retail algorithmic trader:

| # | Question | Where Answered | Primary Metrics |
|---|----------|----------------|-----------------|
| 1 | **"Is my portfolio safe right now?"** | Command Center (FleetHealthHero, Risk Intelligence) | Fleet health score, drawdown ratio, circuit breaker state, risk weather |
| 2 | **"Can I trust this strategy?"** | Workbench → Build → Backtest Results | WFO consistency, MC probability of profit, regime survival, verdict score |
| 3 | **"How does each bot help or hurt my portfolio?"** | Command Center → Portfolio Impact, Operations → Fleet Management | Sensitivity analysis, correlation risk, marginal Sharpe contribution |

These are not abstract questions. They are the exact internal monologue of a retail trader checking their platform at 9:30 AM before the market opens.

### 1.2 Decision-Support Storytelling

AlgoBrute is fundamentally a **decision-support system**. Every metric must satisfy three storytelling requirements:

**Requirement 1: Relatable Dollar Principle**

A retail trader with $50,000 capital understands "$2,500 loss" more intuitively than "5% drawdown."

*Implementation rule:* Always display **dual metrics** — absolute dollars AND relative percentage. Dollar amounts reference the user's `capitalBase` from `UserRiskProfile` (see `types/index.ts:19`).

```
✅ "Your portfolio is down $3,275 (6.5% drawdown) from its peak."
❌ "Your portfolio is down 6.5%."

✅ "If this bot stopped today, you'd lose $8,400/year in expected gains (34% of portfolio profit)."
❌ "This bot contributes 34% of returns."
```

**Requirement 2: Historical Anchoring**

Every current metric must be contextualized against its own history. Raw numbers without context create anxiety; anchored numbers create understanding.

```
✅ "Max DD of 12% is within your 15% tolerance, and better than 72% of strategies in this asset class."
✅ "This drawdown has happened 3 times in backtesting. Average recovery: 2 trading days."
❌ "Max DD: 12%."
```

Historical anchoring data comes from the backend's backtest results and is assembled into LLM context packets (see §22).

**Requirement 3: Causal Explanation**

Narratives must explain **why** something is happening, not just **what** is happening. This requires connecting multiple metrics into reasoning chains (see §23 for anticipatory narration, §21–25 for full LLM specification).

```
✅ "QQQ Momentum lost $125 today because AAPL gapped down 2% at open, 
    triggering your stop-loss. This is normal variance — similar losses 
    occurred every 6-8 weeks in backtesting and recovered within 2-5 days."

❌ "QQQ Momentum: -$125 today."
```

### 1.3 Narrative Tone Guide

The platform adapts its language based on the current risk state. This is not cosmetic — it's a deliberate UX pattern that helps users calibrate their emotional response to match the actual severity of the situation.

| Risk State | Tone | Language Style | Example Opening |
|------------|------|---------------|-----------------|
| **Low** (green) | Reassuring, factual | Short sentences, positive framing, "no action needed" | "All systems nominal." |
| **Moderate** (amber) | Measured concern | Specific observations, "worth checking," hedged language | "One area needs your attention." |
| **Elevated** (orange) | Direct, advisory | Clear recommendations, "consider doing X," specific thresholds | "Your drawdown is approaching its limit." |
| **High** (red) | Urgent, action-first | Imperative verbs, "pause now," "review immediately" | "Immediate action recommended." |

This tone guide is enforced through the LLM prompt engineering specification (§24) and the Tone Adaptation Matrix (§25).

### 1.4 User Persona: The Advanced Beginner

The primary user is an **advanced beginner retail trader** — someone who:
- Understands basic trading concepts (long/short, stop-loss, P&L)
- Does NOT intuitively understand Sharpe ratios, correlation matrices, or Monte Carlo distributions
- Needs metrics **translated** into decisions, not just displayed
- Pays for the platform because it does the **"pre-thinking"** — connecting dots they can't connect themselves
- Wants to feel **confident** that they understand their risk, even if they can't derive the math

This persona drives every design decision: we show the Sharpe ratio because quants expect it, but we always pair it with a plain-English interpretation ("Excellent risk-adjusted returns — your strategy earns significantly more than the risk it takes").

### 1.5 The Computation Boundary

This document distinguishes between two computation layers:

```
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND (BLACK BOX — VectorBT + Custom Harnesses)               │
│  ──────────────────────────────────────────────────               │
│  Computes:                                                        │
│  • Equity curves with regime tags per bar                         │
│  • Trade logs with full P&L attribution                           │
│  • Performance ratios (Sharpe, Sortino, Calmar, Profit Factor)    │
│  • Regime-conditional metrics (sharpeByRegime, sortinoByRegime)   │
│  • WFO windows (IS+OOS, chained equity, per-window metrics)      │
│  • Monte Carlo distribution (percentile time-series)              │
│  • Block bootstrap results                                        │
│  • Correlation matrices (static, rolling, tail)                   │
│  • Stress scenario historical replays                             │
│  • Regime classification + transition probabilities               │
│  • Leave-one-out sensitivity analysis results                     │
│                                                                    │
│  Rule: If VectorBT can compute it, demand it in the API response. │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  UI / MIDDLEWARE LAYER (This Spec Prescribes Fully)               │
│  ──────────────────────────────────────────────────               │
│  Computes:                                                        │
│  • Backtest Verdict (weighted scoring from WFO + MC + ratios)     │
│  • Expected Behavior Band (Bollinger envelope from backtest stats)│
│  • Fleet Health composite score (5-factor model)                  │
│  • Risk Weather grade (5-factor model with hysteresis)            │
│  • Action Cue generation & prioritization                         │
│  • Recommendation ranking (priority DAG)                          │
│  • Diversification grading                                        │
│  • LLM context packet assembly                                    │
│  • Circuit breaker state transitions                              │
│  • Narrative tone selection                                        │
│                                                                    │
│  Rule: If it's interpretation, storytelling, or user-profile-      │
│  dependent logic, compute it in the UI/middleware layer.           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow & State Architecture

### 2.1 System Architecture Overview

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Market Data │────▶│  Backend Engines      │────▶│  REST / WS API  │────▶│  Next.js App  │
│  (Feeds)     │     │  (VectorBT + Custom)  │     │  (Express/Fast) │     │  (React + RTK)│
└─────────────┘     └──────────────────────┘     └─────────────────┘     └───────────────┘
                           │                            │                        │
                    ┌──────┴──────┐              ┌──────┴──────┐          ┌──────┴──────┐
                    │ Backtester  │              │ REST APIs   │          │ Redux Store │
                    │ WFO Engine  │              │ /api/backtest│         │ portfolio   │
                    │ MC Engine   │              │ /api/deploy  │         │ deployments │
                    │ Risk Engine │              │ /api/risk    │         │ ui          │
                    │ Regime Eng. │              │ /api/portfolio│        │             │
                    └─────────────┘              │ WebSocket    │         └─────────────┘
                                                 │ /ws/live     │                │
                                                 └──────────────┘         ┌──────┴──────┐
                                                                          │ UI Components│
                                                                          │ + LLM Layer  │
                                                                          └─────────────┘
```

### 2.2 Data Freshness Strategy

| Data Type | Update Method | Frequency | Staleness Threshold |
|-----------|--------------|-----------|---------------------|
| Portfolio snapshot (equity, P&L) | WebSocket push | Real-time (1s) | 5 seconds |
| Position states | WebSocket push | Real-time (1s) | 5 seconds |
| Circuit breaker status | WebSocket push | On state change | 2 seconds |
| Regime indicator | REST poll | Every 5 minutes | 10 minutes |
| Fleet health / risk weather | REST poll + recompute | Every 5 minutes | 10 minutes |
| Backtest results | REST (on-demand) | User-triggered | N/A (immutable) |
| WFO / Monte Carlo | REST (on-demand) | User-triggered | N/A (immutable) |
| Sensitivity analysis | REST poll | Every 15 minutes | 30 minutes |
| Correlation matrix | REST poll | Every 15 minutes | 30 minutes |
| LLM narratives | REST (on-demand) | On data change | 5 minutes |
| Trade journal | REST poll | Every 1 minute | 5 minutes |

### 2.3 Redux Store → API Mapping

**Codebase reference:** `store/store.ts`, `store/slices/*.ts`

| Redux Slice | State Shape | API Source | Polling |
|-------------|-------------|-----------|---------|
| `portfolio` | `{ snapshot: PortfolioSnapshot, actionCues: ActionCue[] }` | `GET /api/portfolio/snapshot` + `GET /api/portfolio/cues` | WS push + 1m poll |
| `deployments` | `{ list: Deployment[], positions: Position[], selectedId }` | `GET /api/deployments` + `GET /api/positions` | WS push |
| `ui` | `{ activeView, sidebarOpen, selectedBotId }` | N/A (client-only) | N/A |

**Future slices to add:**

| Planned Slice | State Shape | API Source |
|---------------|-------------|-----------|
| `risk` | `{ weather: RiskWeatherData, budget: RiskBudgetData, scenarios: StressScenario[], diversification, recommendations }` | `GET /api/risk/intelligence` |
| `fleet` | `{ health: FleetHealthStatus, sensitivity: PortfolioIntelligence, correlations: BotCorrelationPair[] }` | `GET /api/fleet/health` + `GET /api/fleet/sensitivity` |
| `backtest` | `{ results: BacktestResult, isRunning: boolean }` | `POST /api/backtest/run` |
| `regime` | `{ current: RegimeIndicator, history: RegimeIndicator[] }` | `GET /api/regime/current` |

### 2.4 WebSocket Event Schema

```typescript
// Server → Client events
type WSEvent =
  | { type: 'portfolio.snapshot'; data: PortfolioSnapshot }
  | { type: 'position.update'; data: Position }
  | { type: 'position.opened'; data: Position }
  | { type: 'position.closed'; data: JournalEntry }
  | { type: 'circuit_breaker.state_change'; data: CircuitBreakerStatus }
  | { type: 'deployment.status_change'; data: { id: string; status: DeploymentStatus } }
  | { type: 'log.entry'; data: LogEntry }
  | { type: 'regime.shift'; data: RegimeIndicator }
  | { type: 'action_cue.new'; data: ActionCue };
```

---

## 3. Regime Classification Contract

### 3.1 Purpose & User Question

**"What kind of market are we in right now, and what does that mean for my bots?"**

Regime classification is the foundational context layer. Every metric in the platform is interpreted differently depending on the current regime. A Sharpe of 1.0 in a CRISIS regime is exceptional; the same Sharpe in LOW_VOL is mediocre.

### 3.2 Computation Boundary

**Backend (black box).** The backend classifies each bar/candle into a regime using its own methodology (likely ATR percentiles, RSI, VIX, trend slope — but we don't prescribe this). The spec defines what the output must look like.

### 3.3 Output Contract

```typescript
// Backend must return this with every equity curve point and as a standalone endpoint
interface RegimeIndicator {
  current: RegimeType;        // 'LOW_VOL' | 'NORMAL' | 'HIGH_VOL' | 'CRISIS'
  confidence: number;         // 0–100, how certain the classification is
  volatilityATR: number;      // Current ATR value (for display)
  trendStrength: number;      // -100 to +100, negative = bearish
}

// Extended regime data (for anticipatory narration, §23)
interface RegimeContext {
  current: RegimeIndicator;
  transitionProbabilities: {
    LOW_VOL: number;    // P(transition to LOW_VOL in next 30 days)
    NORMAL: number;
    HIGH_VOL: number;
    CRISIS: number;
  };
  currentDurationDays: number;     // How many days we've been in this regime
  historicalAvgDuration: number;   // Average duration of this regime type
  regimeHistory: {                 // Last 5 regime changes
    regime: RegimeType;
    startDate: string;
    endDate: string;
    durationDays: number;
  }[];
}
```

**Codebase reference:** `types/index.ts:72–79` (RegimeType, RegimeIndicator), `mock/mockData.ts:336` (mockRegimeIndicator)

### 3.4 Validation Invariants

- `confidence` must be between 0 and 100.
- `transitionProbabilities` must sum to 1.0 (±0.01 for rounding).
- Regime should NOT flip on a single bar of noise. **Hysteresis expectation:** A regime change should require at least 3 consecutive bars meeting the new regime's criteria, OR a confidence threshold crossover (e.g., new regime confidence > 70% for 3+ bars).
- `currentDurationDays` must be ≥ 1.

### 3.5 Regime Semantics

| Regime | Market Condition | Typical ATR | Strategy Implications |
|--------|-----------------|-------------|----------------------|
| `LOW_VOL` | Quiet, range-bound, low VIX | < 25th percentile | Mean-reversion thrives, momentum struggles |
| `NORMAL` | Average conditions, mild trends | 25th–75th percentile | Most strategies perform near backtest expectations |
| `HIGH_VOL` | Elevated volatility, choppy | 75th–95th percentile | Wider stops needed, position sizing reduced |
| `CRISIS` | Extreme vol, sustained selling, VIX > 30 | > 95th percentile | Capital preservation mode, circuit breakers likely |

### 3.6 How Regime Propagates

Regime is the **root input** that affects nearly every downstream computation:

```
Regime Classification
  ├──▶ WFO Assessment (§6): "Did the strategy survive this regime?"
  ├──▶ Monte Carlo (§7): Conditional MC ("what if next 3 months are HIGH_VOL?")
  ├──▶ Verdict (§8): Regime-adaptive verdict weights
  ├──▶ Expected Band (§9): Band width adjusts with regime volatility
  ├──▶ Fleet Health (§12): Regime favorability factor
  ├──▶ Risk Weather (§15): Regime favorability score
  ├──▶ Stress Scenarios (§17): "Which historical analogs match current regime?"
  ├──▶ Deployment Narratives: "This bot historically returns +18% in LOW_VOL"
  └──▶ Anticipatory Narration (§23): "If regime shifts to HIGH_VOL, expect..."
```

---

# PART II: INDIVIDUAL BOT ANALYTICS

---

## 4. Performance Metrics Output Contract

### 4.1 Purpose & User Question

**"Is this strategy actually good, or did it just get lucky?"**

Performance metrics quantify how well a strategy converts risk into return. They are computed by the backend (VectorBT) and must be returned in specific forms for the UI to interpret and display.

### 4.2 Computation Boundary

**Backend (black box).** VectorBT computes all ratios. The UI only interprets and displays them.

### 4.3 Output Contract

```typescript
// Part of BacktestResult — see types/index.ts:208
interface PerformanceMetrics {
  // --- Core Ratios (REQUIRED) ---
  sharpe: number;           // Annualized: daily Sharpe × √252
  sortino: number;          // Annualized: daily Sortino × √252
  calmar: number;           // annualReturn / abs(maxDrawdown)
  profitFactor: number;     // grossProfit / grossLoss

  // --- Return Metrics (REQUIRED) ---
  totalReturn: number;          // Percentage (e.g., 186.7 = 186.7%)
  totalReturnDollar: number;    // Absolute dollar P&L
  annualizedReturn: number;     // CAGR percentage

  // --- Trade Statistics (REQUIRED) ---
  winRate: number;              // Percentage (0–100)
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;               // Average winning trade in dollars
  avgLoss: number;              // Average losing trade in dollars (negative)
  bestTrade: number;            // Largest single win in dollars
  worstTrade: number;           // Largest single loss in dollars (negative)
  avgHoldingPeriod: string;     // Human-readable (e.g., "3.2 days")

  // --- Regime-Conditional Metrics (REQUIRED for storytelling) ---
  sharpeByRegime: Record<RegimeType, number>;
  sortinoByRegime: Record<RegimeType, number>;
  returnByRegime: Record<RegimeType, number>;    // Total return % per regime
  tradeCountByRegime: Record<RegimeType, number>;
}
```

### 4.4 Validation Invariants

| Invariant | Rule | Violation Indicates |
|-----------|------|---------------------|
| Sharpe sign consistency | `sign(sharpe) == sign(totalReturn)` unless risk-free rate dominates | Calculation bug |
| Sharpe sanity | `abs(sharpe) < 4.0` for any strategy | Likely lookahead bias or data error |
| Win rate bounds | `0 ≤ winRate ≤ 100` | Calculation bug |
| Win rate consistency | `winRate ≈ (winningTrades / totalTrades) × 100` | Rounding issue |
| Trade count | `winningTrades + losingTrades == totalTrades` | Missing trades |
| Profit factor | `profitFactor > 0` (undefined if no losses, set to ∞ or 999) | Division by zero |
| Annualization | Daily Sharpe must be multiplied by `√252` (trading days/year) | Using calendar days |
| Dollar consistency | `totalReturnDollar ≈ initialCapital × totalReturn / 100` | Mismatch |

### 4.5 Interpretation Tables

These tables are used by the UI to display color-coded badges and by the LLM to generate narratives.

**Sharpe Ratio Interpretation:**

| Range | Assessment | Color | Retail Explanation |
|-------|-----------|-------|--------------------|
| > 2.0 | Exceptional | 🟢 Green | "Outstanding risk-adjusted returns. For every dollar of risk, you earn more than double." |
| 1.5–2.0 | Excellent | 🟢 Green | "Excellent. Your strategy earns significantly more than the risk it takes." |
| 1.0–1.5 | Good | 🟢 Green | "Good risk-adjusted returns. Solidly above average." |
| 0.5–1.0 | Acceptable | 🟡 Yellow | "Acceptable, but there's room to improve. Your returns barely justify the volatility." |
| 0.0–0.5 | Poor | 🟠 Orange | "Below average. You're taking significant risk for modest returns." |
| < 0.0 | Negative | 🔴 Red | "Your strategy is losing money on a risk-adjusted basis." |

**Win Rate + Profit Factor Combined Interpretation:**

| Win Rate | Profit Factor | Assessment | Explanation |
|----------|--------------|-----------|-------------|
| > 55% | > 2.0 | Strong edge | "You win often AND your wins are bigger than your losses." |
| > 55% | 1.0–2.0 | Moderate edge | "You win often, but your wins and losses are similar in size." |
| 40–55% | > 2.0 | Trend-follower profile | "You lose more often than you win, but your winners are much bigger. This is normal for momentum strategies." |
| < 40% | > 3.0 | High-conviction | "Few wins, but they're large. This requires emotional discipline." |
| < 40% | < 1.5 | Weak | "Losing often with small wins. Strategy needs review." |

### 4.6 Regime-Conditional Display

The UI must show a **regime breakdown table** alongside aggregate metrics:

```
┌──────────────────────────────────────────────────────┐
│  PERFORMANCE BY MARKET REGIME                        │
│                                                      │
│  Regime     │ Sharpe │ Return │ Trades │ Assessment   │
│  ──────────────────────────────────────────────────── │
│  🔵 LOW_VOL │  2.14  │ +22.1% │   73   │ ★ Strong    │
│  🟢 NORMAL  │  1.87  │ +31.2% │   64   │ ★ Strong    │
│  🟡 HIGH_VOL│ -0.21  │  -3.2% │   41   │ ✗ Weak      │
│  🔴 CRISIS  │  0.92  │  +8.4% │   22   │ ○ Survived  │
│                                                      │
│  💡 "This strategy thrives in calm markets but        │
│      struggles when volatility rises. Current regime  │
│      (LOW_VOL) is favorable."                        │
└──────────────────────────────────────────────────────┘
```

**Codebase reference:** `types/index.ts:208–232` (BacktestResult), `mock/mockData.ts:306–320` (mockBacktestResult)

---

## 5. Risk Metrics & Drawdown System

### 5.1 Purpose & User Question

**"What's the worst that's happened, and how bad could it get?"**

Drawdown is the single most important risk metric for retail traders. It answers: "How much of my money could I lose before things recover?" Every other risk metric (VaR, CVaR, consecutive losses) feeds into the same emotional question.

### 5.2 Computation Boundary

**Backend (black box)** computes all drawdown metrics from the equity curve. **UI** converts to dollars using user's capital base and triggers circuit breaker state transitions.

### 5.3 Output Contract

```typescript
interface RiskMetrics {
  // --- Drawdown (REQUIRED) ---
  maxDrawdown: number;              // Percentage, negative (e.g., -12.4)
  maxDrawdownDollar: number;        // Absolute dollar loss at max DD
  maxDrawdownStartDate: string;     // When the peak occurred
  maxDrawdownEndDate: string;       // When the trough occurred
  maxDrawdownRecoveryDate: string | null;  // When equity made new high (null if not recovered)
  drawdownDurationDays: number;     // Trading days from peak to trough
  drawdownRecoveryDays: number | null;  // Trading days from trough to new high

  // --- Underwater Series (REQUIRED for underwater chart) ---
  underwaterSeries: {
    date: string;
    drawdownPercent: number;   // Always ≤ 0
  }[];

  // --- Value at Risk (REQUIRED) ---
  var95: number;      // 95th percentile daily loss (negative, e.g., -1.2%)
  var99: number;      // 99th percentile daily loss
  cvar95: number;     // Conditional VaR: expected loss given loss exceeds VaR95

  // --- Streak Metrics (REQUIRED) ---
  maxConsecutiveLosses: number;        // Longest losing streak in trades
  maxConsecutiveLossingDays: number;   // Longest streak of negative daily P&L
  maxConsecutiveWins: number;

  // --- Drawdown Velocity (REQUIRED for Risk Weather) ---
  drawdownVelocity: number;    // Rate of drawdown change per day (rolling 5-day)
                                // Negative = getting worse, positive = recovering
  currentDrawdown: number;     // Current drawdown from most recent peak
  currentDrawdownDollar: number;
}
```

### 5.4 Validation Invariants

| Invariant | Rule |
|-----------|------|
| Drawdown sign | `maxDrawdown ≤ 0` (always negative or zero) |
| Drawdown bounds | `maxDrawdown ≥ -100` (can't lose more than 100%) |
| Dollar consistency | `maxDrawdownDollar ≈ initialCapital × maxDrawdown / 100` |
| Underwater monotonicity | Between drawdown events, `underwaterSeries` values trend toward 0 (recovery) |
| VaR ordering | `var99 ≤ var95 ≤ 0` (99th percentile loss is worse than 95th) |
| CVaR ordering | `cvar95 ≤ var95` (expected loss beyond VaR is worse than VaR itself) |
| Duration consistency | `drawdownRecoveryDays ≥ drawdownDurationDays` (recovery takes at least as long as the fall) — this is often but not always true |
| Streak consistency | `maxConsecutiveLosses ≤ losingTrades` |

### 5.5 Interpretation for Retail Traders

**Drawdown Narrative Framing:**

```
Template: "Your worst losing streak cost {maxDrawdownDollar} ({maxDrawdown}% of capital).
           It lasted {drawdownDurationDays} trading days and took {drawdownRecoveryDays} days to recover.
           {tolerance_comparison}."

Example:  "Your worst losing streak cost $6,200 (12.4% of your $50k capital).
           It lasted 18 trading days and took 31 days to recover.
           This is within your 15% tolerance. ✓"
```

**VaR Narrative Framing (for advanced beginners):**

```
"On a typical bad day, you'd lose about ${abs(var95 × capital / 100)} (95% confidence).
 On a really bad day (once every few months), losses could reach ${abs(var99 × capital / 100)}."
```

### 5.6 Drawdown → Circuit Breaker Interaction

Drawdown metrics directly feed the circuit breaker state machine (§26):

```
currentDrawdown → compare against → circuitBreaker.maxDrawdownLimit
  If currentDrawdown ≥ 70% of limit → CircuitBreaker enters WARNING state
  If currentDrawdown ≥ 85% of limit → CircuitBreaker enters THROTTLED state
  If currentDrawdown ≥ 100% of limit → CircuitBreaker enters TRIPPED state

maxConsecutiveLosses → compare against → circuitBreaker.consecutiveLossLimit
  Same threshold logic applies
```

**Codebase reference:** `types/index.ts:263–271` (CircuitBreakerStatus), `mock/mockData.ts:346–349` (mockCircuitBreaker)

---

## 6. Walk Forward Optimization Contract

### 6.1 Purpose & User Question

**"Is this strategy genuinely profitable, or is it just memorizing past data?"**

Walk Forward Optimization (WFO) is the gold standard for detecting overfitting. It splits historical data into rolling "in-sample" (IS) windows (where parameters are optimized) and "out-of-sample" (OOS) windows (where the optimized parameters are tested on unseen data). A strategy that performs well IS but poorly OOS is **curve-fit** — it memorized noise, not signal.

**Why retail traders should care:** "Imagine studying for a test by memorizing the answers to last year's exam. You'd ace that exam, but fail a new one. WFO tests whether your strategy passes the 'new exam.'"

### 6.2 Computation Boundary

**Backend (black box)** runs the WFO engine — segmenting data, optimizing parameters, running IS and OOS backtests, and tagging each window with its regime. The UI receives the fully computed windows and renders them.

**UI layer** computes the **Robustness Score** (a composite grade from multiple WFO outputs) since it involves user-profile-dependent thresholds.

### 6.3 Output Contract

```typescript
// See types/index.ts:126–167
interface WalkForwardAnalysis {
  nWindows: number;          // Total number of OOS windows
  inSampleRatio: number;     // Fraction of data used for IS (e.g., 0.6 = 60%)

  // --- Aggregate OOS Metrics (REQUIRED) ---
  meanOosSharpe: number;     // Mean Sharpe across all OOS windows
  stdOosSharpe: number;      // Std dev of Sharpe across OOS windows
  meanOosReturn: number;     // Mean return (%) across all OOS windows
  oosConsistency: number;    // % of OOS windows that were profitable
  oosDegradation: number;    // (meanIS_Sharpe - meanOOS_Sharpe) / meanIS_Sharpe × 100
                              // Positive = OOS is worse than IS (overfitting signal)

  // --- Per-Window Data (REQUIRED) ---
  windows: WalkForwardWindow[];   // Each window defined below

  // --- Benchmark (REQUIRED) ---
  benchmarkCurve: {
    date: string;
    buyHold: number;    // SPY buy-and-hold equity
    spy: number;        // Same as buyHold (for chart label flexibility)
  }[];
}

interface WalkForwardWindow {
  windowId: number;
  windowType: 'in_sample' | 'out_of_sample';
  label: string;                    // e.g., "OOS 1", "IS 1"
  startDate: string;                // ISO date
  endDate: string;
  regimeLabel: RegimeType;          // Dominant regime during this window
  regimeConfidence: number;         // 0–100

  performance: {
    totalReturn: number;            // % return for this window
    sharpe: number;                 // Annualized Sharpe for this window
    sortino: number;
  };

  risk: {
    maxDrawdown: number;            // Max DD during this window (negative %)
    var95: number;                  // Daily VaR for this window
  };

  tradeStats: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
  };

  // Equity curve for this window (MUST chain from previous window's end)
  equityCurve: {
    date: string;
    equity: number;
    cumulativeReturn: number;
  }[];

  color: string;                    // Hex color for chart (derived from regime)
  assessment: RegimeAssessment;     // 'strong' | 'survived' | 'weak' | 'failed'
}
```

### 6.4 Validation Invariants

| Invariant | Rule | Violation Indicates |
|-----------|------|---------------------|
| Date contiguity | Window N+1 starts on or after Window N ends | Gap in test coverage |
| Equity chaining | `windows[N+1].equityCurve[0].equity ≈ windows[N].equityCurve[last].equity` | Equity curve discontinuity |
| OOS consistency | `oosConsistency == (profitable_OOS_windows / total_OOS_windows) × 100` | Miscalculation |
| Degradation sign | If `oosDegradation > 0`, OOS is worse than IS (expected) | Negative degradation means OOS outperforms IS (unusual, not necessarily wrong) |
| Assessment mapping | See assessment logic below | Incorrect grading |
| Window count | `nWindows == windows.filter(w => w.windowType == 'out_of_sample').length` | Mismatch |

### 6.5 Assessment Logic (Backend-Computed)

The backend should grade each OOS window:

```
if OOS_sharpe ≥ 1.0 AND OOS_return > 0:
    assessment = 'strong'
elif OOS_return > 0 AND OOS_sharpe ≥ 0.3:
    assessment = 'survived'
elif OOS_return > 0 AND OOS_sharpe < 0.3:
    assessment = 'weak'
else:  // OOS_return ≤ 0
    assessment = 'failed'
```

### 6.6 Robustness Score (UI-Layer Computation)

The UI computes a composite Robustness Score from WFO outputs to give a single "how trustworthy is this backtest?" number:

```
robustnessScore = (
    0.30 × normalize(oosConsistency, 0, 100) +          // 30% weight: how often profitable OOS
    0.25 × normalize(1 - abs(oosDegradation)/100, 0, 1) + // 25%: IS→OOS degradation (less = better)
    0.25 × regimeSurvivalScore +                          // 25%: did it survive diverse regimes?
    0.20 × normalize(meanOosSharpe, 0, 2.0)               // 20%: absolute OOS Sharpe quality
) × 100

regimeSurvivalScore = (
    count(windows where assessment ∈ {'strong', 'survived'})
    / total_OOS_windows
)

// Score interpretation:
// 80–100: Highly robust ("This strategy passed the test across multiple market conditions.")
// 60–79:  Moderately robust ("Mostly reliable, but showed weakness in some regimes.")
// 40–59:  Questionable ("Inconsistent results. Significant overfitting risk.")
// < 40:   Unreliable ("Failed to perform on unseen data. Do not deploy live.")
```

### 6.7 Chart Rendering Logic

The WFO chart is a **segmented equity curve** where each OOS window is drawn as a continuous line segment colored by its regime:

```
┌────────────────────────────────────────────────────────────────┐
│  WALK FORWARD ANALYSIS — Out-of-Sample Equity                  │
│                                                                │
│  $90k ─┤                                            ┌─ 🔵     │
│        │                                       ╱───╱          │
│  $80k ─┤                              ╱──────╱               │
│        │                        ╱────╱  🟡                   │
│  $70k ─┤              ╱───────╱                              │
│        │         ╱───╱  🟢                                   │
│  $60k ─┤    ╱──╱                                             │
│        │ ╱╱ 🔴                                               │
│  $50k ─┤╱  🔵                                               │
│        │                                                      │
│        └──────┬──────┬──────┬──────┬──────┬──────────────────│
│           2018   2019   2020   2021   2022   2023   2024      │
│                                                                │
│  ── SPY Buy & Hold (benchmark)                                │
│  🔵 LOW_VOL  🟢 NORMAL  🟡 HIGH_VOL  🔴 CRISIS              │
│  Vertical dividers mark regime transitions                     │
└────────────────────────────────────────────────────────────────┘
```

Each segment is a different color based on `window.regimeLabel`:
- `LOW_VOL` → `#3B82F6` (blue)
- `NORMAL` → `#22C55E` (green)
- `HIGH_VOL` → `#F59E0B` (amber)
- `CRISIS` → `#EF4444` (red)

The benchmark (SPY buy-and-hold) is rendered as a thin dashed line in neutral gray.

**Codebase reference:** `types/index.ts:126–167`, `mock/mockData.ts:106–222`, `components/workbench/build/WalkForwardTab.tsx`

---

## 7. Monte Carlo Simulation Contract

### 7.1 Purpose & User Question

**"What's the range of things that could happen to my money? What are the odds I actually make money?"**

Monte Carlo simulation generates thousands of possible equity paths by randomizing the sequence of historical trades (or using block bootstrapping to preserve autocorrelation). This converts a single backtest into a **distribution of outcomes**, answering questions that a single backtest cannot.

**Why retail traders should care:** "Your backtest showed +18% return. But what if you'd had a run of bad luck at the start? Or good luck? Monte Carlo shows the full range of possibilities."

### 7.2 Computation Boundary

**Backend (black box)** runs the simulation engine (trade shuffling or block bootstrap). The UI receives the distribution and renders the fan chart and summary statistics.

### 7.3 Output Contract

```typescript
// See types/index.ts:169–191
interface MonteCarloResult {
  // --- Summary Statistics (REQUIRED) ---
  medianReturn: number;           // Median final return (%)
  medianReturnDollar: number;     // Median final return ($)
  percentile5: number;            // 5th percentile return (%) — worst case
  percentile5Dollar: number;
  percentile95: number;           // 95th percentile return (%) — best case
  percentile95Dollar: number;
  probOfProfit: number;           // % of simulations that ended profitable
  riskOfRuin: number;             // % of simulations that lost ≥ 50% of capital
  maxDrawdownMedian: number;      // Median max drawdown across all simulations
  simulationsCount: number;       // Number of simulations run (e.g., 10000)

  // --- Time-Series Distribution (REQUIRED for fan chart) ---
  distribution: MonteCarloDistributionPoint[];
  // Each point represents one period (typically 1 week) with percentile bands

  // --- Drawdown Distribution (REQUIRED — new in v2.0) ---
  drawdownDistribution: {
    percentile: number;    // 5, 10, 25, 50, 75, 90, 95
    maxDrawdown: number;   // Max DD at this percentile (negative %)
  }[];

  // --- Convergence Diagnostic (REQUIRED — new in v2.0) ---
  convergenceDiagnostic: {
    isConverged: boolean;       // Has the simulation converged?
    medianStdError: number;     // Standard error of the median estimate
    recommendedSimulations: number;  // If not converged, how many more needed
  };
}

interface MonteCarloDistributionPoint {
  period: number;     // 0 = start, 1 = week 1, ..., 52 = week 52
  p5: number;         // 5th percentile equity at this period
  p25: number;        // 25th percentile
  median: number;     // 50th percentile
  p75: number;        // 75th percentile
  p95: number;        // 95th percentile
}
```

**Conditional Monte Carlo (New Endpoint):**

The backend should also support conditional MC — "What would happen if the next N months are in regime X?"

```typescript
// Request
POST /api/backtest/monte-carlo/conditional
{
  strategyId: string;
  conditionRegime: RegimeType;    // e.g., 'HIGH_VOL'
  conditionDurationMonths: number; // e.g., 3
  simulationsCount: number;        // e.g., 5000
}

// Response: same MonteCarloResult shape, but conditioned on the specified regime
```

### 7.4 Validation Invariants

| Invariant | Rule |
|-----------|------|
| Percentile ordering | At every period: `p5 ≤ p25 ≤ median ≤ p75 ≤ p95` |
| Starting point | `distribution[0].p5 == distribution[0].p95 == initialCapital` (all paths start at same point) |
| Probability bounds | `0 ≤ probOfProfit ≤ 100` and `0 ≤ riskOfRuin ≤ 100` |
| Prob consistency | If `medianReturn > 0`, then `probOfProfit > 50` (not guaranteed but expected) |
| Simulation count | `simulationsCount ≥ 1000` (minimum for meaningful statistics) |
| Convergence | If `convergenceDiagnostic.isConverged == false`, results should be flagged as preliminary |
| DD distribution ordering | Drawdown percentiles should monotonically decrease (5th pctl has smallest DD, 95th has largest) |

### 7.5 Fan Chart Construction

The fan chart is the primary visualization of Monte Carlo results:

```
┌────────────────────────────────────────────────────────────────┐
│  MONTE CARLO FAN CHART — 10,000 Simulations                   │
│                                                                │
│  $70k ─┤                                    ╱ p95 boundary    │
│        │                              ╱───╱   (best case)     │
│  $65k ─┤                        ╱───╱                         │
│        │                  ╱═══╱═══╱  p75                      │
│  $60k ─┤            ╱═══╱═══╱                                 │
│        │      ╱═══╱═══╱═══╱══╱  MEDIAN                        │
│  $55k ─┤╱═══╱═══╱═══╱                                        │
│        │  p25 ╱═══╱                                            │
│  $50k ─┤═══╱                                                  │
│        │╱ p5 boundary (worst case)                             │
│  $45k ─┤                                                      │
│        └──────┬──────┬──────┬──────┬──────┬──────────────────│
│          Week 0   13     26     39     52                     │
│                                                                │
│  ████ p25–p75 (likely range)                                   │
│  ░░░░ p5–p25 and p75–p95 (possible range)                     │
│  ── Median path                                                │
└────────────────────────────────────────────────────────────────┘
```

Rendering rules:
1. **p25–p75 band** (50% of outcomes): Filled with theme primary color at 30% opacity.
2. **p5–p25 and p75–p95 bands** (next 40%): Filled at 10% opacity.
3. **Median line**: Solid line, 2px, theme primary color.
4. **Starting point**: All bands converge at `initialCapital`.

### 7.6 Contextual Comparison Cards

Below the fan chart, display 3 comparison cards that contextualize the MC results against the user's situation:

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  WORST CASE (5%)  │  │  EXPECTED (50%)   │  │  BEST CASE (5%)  │
│                   │  │                   │  │                   │
│  -$6,200          │  │  +$9,250          │  │  +$19,100         │
│  -12.4%           │  │  +18.5%           │  │  +38.2%           │
│                   │  │                   │  │                   │
│  "Your daily loss │  │  "Right in line   │  │  "If everything   │
│   limit of $500   │  │   with your 20%   │  │   goes right."    │
│   would trigger   │  │   annual target." │  │                   │
│   well before     │  │                   │  │                   │
│   this level."    │  │                   │  │                   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Codebase reference:** `types/index.ts:169–191`, `mock/mockData.ts:227–257`, `components/workbench/build/MonteCarloTab.tsx`

---

## 8. Backtest Verdict Engine

### 8.1 Purpose & User Question

**"Should I deploy this strategy with real money?"**

The Verdict synthesizes all backtest outputs (performance, WFO, MC, risk) into a single human-readable assessment with a recommendation. This is a **UI-layer computation** — it combines black-box outputs with user-profile-dependent thresholds.

### 8.2 Computation Boundary

**UI / Middleware layer.** The Verdict is NOT computed by VectorBT. It is assembled from the outputs of §4–7, filtered through the user's risk profile.

### 8.3 Weighted Scoring Model

```
verdictScore = (
    w1 × f(meanOosSharpe) +           // WFO quality (30%)
    w2 × f(oosConsistency) +           // WFO reliability (25%)
    w3 × f(probOfProfit) +             // MC confidence (20%)
    w4 × f(maxDD_vs_tolerance) +       // Risk compatibility (15%)
    w5 × f(regimeSurvival) +           // Regime robustness (10%)
)

where:
    w1 = 0.30, w2 = 0.25, w3 = 0.20, w4 = 0.15, w5 = 0.10

    f(meanOosSharpe) = clamp(meanOosSharpe / 2.0, 0, 1)
    f(oosConsistency) = oosConsistency / 100
    f(probOfProfit) = probOfProfit / 100
    f(maxDD_vs_tolerance) = 1 - clamp(abs(maxDD) / userTolerance, 0, 1)
    f(regimeSurvival) = count(OOS windows with assessment ∈ {strong, survived}) / total_OOS_windows
```

### 8.4 Verdict Classification

```
if verdictScore ≥ 0.70:
    assessment = 'promising'
elif verdictScore ≥ 0.45:
    assessment = 'mixed'
else:
    assessment = 'not_recommended'
```

### 8.5 User-Profile-Adaptive Thresholds

| User Profile | Promising Threshold | Mixed Threshold | Key Strictness |
|-------------|-------------------|----------------|----------------|
| `conservative` | ≥ 0.80 | ≥ 0.55 | Requires OOS consistency ≥ 80% AND maxDD < 80% of tolerance |
| `moderate` | ≥ 0.70 | ≥ 0.45 | Standard thresholds |
| `aggressive` | ≥ 0.60 | ≥ 0.35 | Tolerates lower consistency if Sharpe is high |

### 8.6 Regime-Adaptive Verdict

The verdict should include regime-specific sub-assessments:

```typescript
interface VerdictBreakdown {
  overall: VerdictAssessment;       // 'promising' | 'mixed' | 'not_recommended'
  byRegime: Record<RegimeType, {
    assessment: VerdictAssessment;
    sharpe: number;
    explanation: string;
  }>;
  currentRegimeFit: {
    regime: RegimeType;
    assessment: VerdictAssessment;
    explanation: string;  // e.g., "Current LOW_VOL regime is this strategy's sweet spot."
  };
}
```

### 8.7 Expected Annual Return Range

```
annualVolatility = std(daily_returns) × √252     // From backtest result
expectedReturn_low  = annualVolatility × sharpe × 0.7   // 30% haircut (conservative)
expectedReturn_mid  = annualVolatility × sharpe
expectedReturn_high = annualVolatility × sharpe × 1.3   // 30% upside

expectedDollarRange = [
  initialCapital × expectedReturn_low,
  initialCapital × expectedReturn_high
]

// These ranges are what the user sees in the verdict card:
// "Expected annual return: $7,500 – $12,000"
```

### 8.8 Max Loss Scenario

```
maxLossScenarioDollar = abs(monteCarlo.percentile5Dollar)
maxLossScenarioPercent = abs(monteCarlo.percentile5)

withinTolerance = (maxLossScenarioPercent ≤ userProfile.maxDrawdownTolerance)
```

**Codebase reference:** `types/index.ts:194–205` (BacktestVerdictData), `mock/mockData.ts:292–301` (mockVerdict), `components/workbench/build/BacktestVerdict.tsx`

---

## 9. Expected Behavior Band

### 9.1 Purpose & User Question

**"Is my live bot behaving normally, or is something wrong?"**

Once a strategy is deployed live, the Expected Behavior Band provides a visual "normal range" envelope around the live equity curve. It answers the most common anxiety-inducing question: "My bot lost money today — is that normal, or is it broken?"

### 9.2 Computation Boundary

**UI / Middleware layer.** The band is computed from backtest statistics (mean daily return, standard deviation) that come from the backend. The actual band construction is done client-side.

### 9.3 Band Construction Algorithm

```
Given:
  μ = mean daily return from backtest (e.g., 0.0006 = 0.06% per day)
  σ = std dev of daily returns from backtest (e.g., 0.005 = 0.5% per day)
  capital = user's allocated capital for this bot
  t = trading days since deployment start

Expected center:
  center(t) = capital × (1 + μ × t)

Upper band (95% confidence):
  upper(t) = center(t) + capital × σ × √t × 1.96

Lower band (95% confidence):
  lower(t) = center(t) - capital × σ × √t × 1.96

Note: The band widens over time (proportional to √t) because
uncertainty grows the further from the starting point.
```

### 9.4 Output Contract (UI-Computed)

```typescript
// See types/index.ts:274–279
interface ExpectedBehaviorPoint {
  date: string;
  upper: number;      // Upper 95% confidence bound
  lower: number;      // Lower 95% confidence bound
  actual: number;     // Actual live equity at this point
}
```

### 9.5 Breach Detection

```
if actual(t) > upper(t):
    status = 'OUTPERFORMING'
    narrative = "Your bot is performing better than expected!
                 It's above the 95th percentile of its backtest range.
                 This is unusual — enjoy the ride, but watch for mean reversion."

if actual(t) < lower(t):
    status = 'UNDERPERFORMING'
    narrative = "Your bot is performing worse than backtesting predicted.
                 This could be due to:
                 1. An unfavorable regime shift
                 2. Market conditions the backtest didn't cover
                 3. Normal statistical variance (5% of the time it'll be outside the band)
                 
                 If it stays below for 5+ trading days, consider pausing."

if lower(t) ≤ actual(t) ≤ upper(t):
    status = 'NORMAL'
    narrative = "Your bot is performing within its expected range. No action needed."
```

### 9.6 Regime-Adjusted Bands

In an ideal implementation, the band parameters (μ, σ) should switch based on the current regime:

```
if currentRegime == 'LOW_VOL':
    μ = backtest.returnByRegime.LOW_VOL / 252
    σ = backtest.volatilityByRegime.LOW_VOL
elif currentRegime == 'CRISIS':
    μ = backtest.returnByRegime.CRISIS / 252
    σ = backtest.volatilityByRegime.CRISIS
// etc.
```

This produces tighter bands in calm markets and wider bands in volatile markets, reducing false alarms.

**Codebase reference:** `types/index.ts:274–279`, `mock/mockData.ts:354–372` (generateExpectedBehaviorData), `components/operations/FleetManagement.tsx`

---

# PART III: FLEET-LEVEL INTELLIGENCE

---

## 10. Portfolio Decomposition & Sensitivity Analysis

### 10.1 Purpose & User Question

**"Which of my bots is helping me, which is hurting me, and what happens if I change something?"**

Sensitivity analysis answers the most actionable question a fleet operator faces: "If I pause Bot X, how does that affect my total portfolio?" This goes beyond individual bot P&L — it accounts for correlation effects, risk contribution, and marginal Sharpe impact.

### 10.2 Computation Boundary

**Backend (black box)** computes the leave-one-out analysis and risk attribution. The UI displays results and generates narratives.

### 10.3 Output Contract

```typescript
// See types/index.ts:355–384
interface PortfolioIntelligence {
  // --- Aggregate (REQUIRED) ---
  totalEquityPL: number;            // Total fleet P&L in dollars
  totalEquityPLPercent: number;     // Total fleet P&L as %
  portfolioMaxDD: number;          // Portfolio-level max drawdown

  // --- Per-Bot Impact (REQUIRED) ---
  botImpacts: BotEquityImpact[];   // One per deployed bot

  // --- Correlation Data (REQUIRED) ---
  correlations: BotCorrelationPair[];
  concentrationWarning: string | null;

  // --- Directional Analysis (REQUIRED) ---
  directionalBias: 'net_long' | 'net_short' | 'neutral';
  directionalBiasPercent: number;   // 0–100, how skewed

  // --- LLM-Ready Narrative (REQUIRED) ---
  overallNarrative: string;
}

interface BotEquityImpact {
  deploymentId: string;
  name: string;

  // --- Return Attribution ---
  equityImpactDollar: number;       // How much $ this bot has contributed
  equityImpactPercent: number;      // As % of allocated capital
  portfolioReturnWithout: number;   // What portfolio return % would be without this bot

  // --- Risk Attribution ---
  riskSharePercent: number;         // Bot's contribution to portfolio volatility (0–100)
  maxDDContribution: number;        // Bot's contribution to portfolio max DD ($)
  maxDDContributionPercent: number; // As % of total portfolio DD

  // --- Marginal Sharpe Contribution (new in v2.0) ---
  marginalSharpe: number;           // How much the portfolio Sharpe changes if this bot is removed
                                    // Positive = bot improves portfolio Sharpe
                                    // Negative = bot drags portfolio Sharpe down

  // --- Narrative ---
  sensitivityNarrative: string;     // Pre-generated or LLM-generated explanation
}
```

### 10.4 Validation Invariants

| Invariant | Rule |
|-----------|------|
| Impact sum | `sum(botImpacts.equityImpactDollar) ≈ totalEquityPL` (may not be exact due to interaction effects) |
| Risk share | `sum(botImpacts.riskSharePercent) ≈ 100` (±5% for interaction effects) |
| DD contribution | `sum(botImpacts.maxDDContributionPercent) ≈ 100` (±10%) |
| Return without | For each bot: `portfolioReturnWithout` should be calculable as `(totalEquityPL - botEquityImpact) / totalCapital × 100` (approximate) |
| Bias consistency | If all bots are long, `directionalBias == 'net_long'` |

### 10.5 Interaction Effects

**Critical concept:** Removing Bot A doesn't just subtract Bot A's returns. If Bot A and Bot B are correlated, removing A also changes the risk profile of the remaining portfolio containing B. This is the **interaction effect**.

The backend should account for this. A simplistic leave-one-out (just subtracting returns) will produce inaccurate results when bots are correlated. The backend should re-run the portfolio risk calculation with each bot removed, not just subtract PnL.

**Narrative example showing interaction:**
```
"Removing TLT Range Trading would improve returns by $543 (+1.1%).
 However, because TLT has negative correlation (-0.31) with your equity bots,
 removing it would INCREASE portfolio volatility by ~15%.
 Your risk-adjusted return (Sharpe) would actually decrease from 1.42 to 1.18."
```

### 10.6 UI Visualization

The Portfolio Impact panel shows a **horizontal bar chart** where each bar represents a bot's dollar impact, color-coded by positive (green) or negative (red), with risk share shown as a secondary metric.

**Codebase reference:** `types/index.ts:355–384`, `mock/mockData.ts:380–428`, `components/command-center/PortfolioImpact.tsx`

---

## 11. Correlation & Concentration Risk

### 11.1 Purpose & User Question

**"Are my bots redundant? If the market drops, will ALL of them lose money at the same time?"**

Correlation risk is the most underappreciated risk in retail algo trading. A trader running 3 "diversified" bots on SPY, QQQ, and AAPL may think they're diversified, but all three are highly correlated with the equity market — a broad selloff hits them all simultaneously.

### 11.2 Computation Boundary

**Backend (black box)** computes all correlation matrices. **UI** interprets, grades, and generates warnings.

### 11.3 Output Contract

```typescript
// See types/index.ts:367–372
interface BotCorrelationPair {
  botA: string;
  botB: string;
  correlation: number;          // Pearson correlation, -1 to +1
  riskLevel: 'low' | 'moderate' | 'high';
}

// Extended correlation data (new in v2.0)
interface CorrelationAnalysis {
  // --- Static Correlation (REQUIRED) ---
  staticCorrelations: BotCorrelationPair[];

  // --- Rolling Correlation (REQUIRED for trend detection) ---
  rollingCorrelations: {
    botA: string;
    botB: string;
    series: {
      date: string;
      correlation: number;    // 30-day rolling correlation
    }[];
  }[];

  // --- Tail Correlation (REQUIRED for crisis awareness) ---
  tailCorrelations: {
    botA: string;
    botB: string;
    normalCorrelation: number;      // Correlation during normal markets
    tailCorrelation: number;        // Correlation during extreme moves (bottom 10% days)
    amplificationRisk: number;      // tailCorrelation / normalCorrelation
                                    // > 1.0 means they correlate MORE in crises
  }[];

  // --- Concentration Metrics ---
  herfindahlIndex: number;          // Concentration index (0–1, higher = more concentrated)
  netDelta: number;                 // Net directional exposure ($)
  netDeltaPercent: number;          // As % of total capital

  // --- Regime-Conditional Correlation (new in v2.0) ---
  regimeCorrelations: {
    regime: RegimeType;
    pairs: BotCorrelationPair[];
  }[];
}
```

### 11.4 Correlation Risk Thresholds

| Correlation Range | Risk Level | Color | Explanation |
|-------------------|-----------|-------|-------------|
| 0.7 to 1.0 | High | 🔴 Red | "These bots move almost identically. A loss in one likely means a loss in the other." |
| 0.4 to 0.7 | Moderate | 🟡 Yellow | "Some co-movement. Worth watching but not alarming." |
| -0.3 to 0.4 | Low | 🟢 Green | "Low correlation. Good diversification." |
| -1.0 to -0.3 | Beneficial | 🔵 Blue | "Negative correlation — these bots hedge each other. Excellent for risk reduction." |

### 11.5 Tail Correlation Warning

**Why this matters:** Many assets appear uncorrelated in normal markets but become highly correlated during crises. This is the "diversification illusion" — diversification disappears exactly when you need it most.

```
if tailCorrelation > normalCorrelation × 1.5:
    warning = "⚠ Crisis Amplification Risk: {botA} and {botB} have {normalCorrelation}
               correlation in normal markets, but it jumps to {tailCorrelation} during
               market stress. Your diversification benefit disappears in a crisis."
```

**Codebase reference:** `types/index.ts:367–372`, `mock/mockData.ts:419–424`

---

## 12. Fleet Health Composite Score

### 12.1 Purpose & User Question

**"At a glance — is everything okay with my portfolio right now?"**

The Fleet Health score is the single most important number on the Command Center. It aggregates multiple risk dimensions into one status that the user can check in 2 seconds.

### 12.2 Computation Boundary

**UI / Middleware layer.** Computed from multiple backend-provided inputs using a weighted formula.

### 12.3 Five-Factor Model

```
fleetHealthScore = (
    w1 × drawdownFactor +           // 30% — How deep is the current drawdown?
    w2 × circuitBreakerFactor +     // 25% — How close are we to circuit breaker triggers?
    w3 × regimeFavorabilityFactor + // 20% — Is the current regime good for our strategies?
    w4 × correlationStressFactor +  // 15% — Are correlated bots being stressed together?
    w5 × botAnomalyFactor           // 10% — Are any bots outside their expected behavior band?
) × 100

where all factors are normalized to [0, 1] (1 = healthy, 0 = critical):
```

**Factor Calculations:**

```
// Factor 1: Drawdown (30%)
drawdownRatio = abs(currentDrawdown) / userProfile.maxDrawdownTolerance
drawdownFactor = 1 - clamp(drawdownRatio, 0, 1)

// Factor 2: Circuit Breaker Proximity (25%)
cbProximity = max(
    dailyLossConsumed / dailyLossLimit,
    consecutiveLosses / consecutiveLossLimit,
    maxDrawdownConsumed / maxDrawdownLimit
)
circuitBreakerFactor = 1 - clamp(cbProximity, 0, 1)

// Factor 3: Regime Favorability (20%)
// For each active bot, check if the current regime is favorable
botRegimeScores = activeDeployments.map(bot => {
    // Backend provides sharpeByRegime for each strategy
    regimeSharpe = bot.backtestResult.sharpeByRegime[currentRegime]
    if regimeSharpe > 1.0: return 1.0    // Strong in this regime
    if regimeSharpe > 0.5: return 0.75   // Decent
    if regimeSharpe > 0.0: return 0.5    // Marginal
    return 0.25                           // Weak in this regime
})
regimeFavorabilityFactor = mean(botRegimeScores)

// Factor 4: Correlation Stress (15%)
// High correlation + negative P&L = correlated bots losing together
correlatedPairsUnderStress = count(pairs where correlation > 0.6 AND both bots have negative dayPL)
correlationStressFactor = 1 - clamp(correlatedPairsUnderStress / totalPairs, 0, 1)

// Factor 5: Bot Anomaly (10%)
botsOutsideBand = count(bots where actual equity < expectedBand.lower)
botAnomalyFactor = 1 - clamp(botsOutsideBand / totalBots, 0, 1)
```

### 12.4 Health Classification

```
if fleetHealthScore ≥ 70:
    status = 'HEALTHY'
    emoji = '🟢'
elif fleetHealthScore ≥ 40:
    status = 'CAUTION'
    emoji = '🟡'
else:
    status = 'AT_RISK'
    emoji = '🔴'
```

### 12.5 Health Momentum

Track the 5-day trend of `fleetHealthScore` to answer: **"Is risk getting better or worse?"**

```
healthMomentum = fleetHealthScore_today - fleetHealthScore_5days_ago

if healthMomentum > 5:
    trend = 'improving'    // "Risk is declining — conditions are improving."
elif healthMomentum < -5:
    trend = 'degrading'    // "Risk is increasing — stay alert."
else:
    trend = 'stable'       // "Steady state — no significant changes."
```

**Codebase reference:** `types/index.ts:29` (FleetHealthStatus), `mock/mockData.ts:32–37` (mockFleetHealth), `components/command-center/FleetHealthHero.tsx`

---

## 13. Action Cue Generation Engine

### 13.1 Purpose & User Question

**"What needs my attention right now?"**

Action Cues are the "notification center" of the Command Center. They surface the 2–3 things the user should actually pay attention to, ranked by urgency, with historical context that prevents overreaction.

### 13.2 Computation Boundary

**UI / Middleware layer** generates cues from backend-provided metrics.

### 13.3 Cue Generation Rules

Each rule evaluates a condition and, if true, generates a cue:

| # | Trigger Condition | Severity | Message Template | Historical Enrichment |
|---|------------------|----------|-----------------|----------------------|
| 1 | `bot.dailyLoss > 0.65 × dailyLossLimit` | `warning` | "Bot '{name}' hit {pct}% of daily loss limit (${consumed}/${limit})" | "This has happened {count} times this quarter. Each time the bot recovered within {avgDays} trading days." |
| 2 | `circuitBreaker.state == 'WARNING'` | `warning` | "Circuit breaker approaching trigger — {reason}" | "Your safety system has triggered {count} times historically. It prevented an average of ${saved} in additional losses." |
| 3 | `circuitBreaker.state == 'TRIPPED'` | `critical` | "Circuit breaker triggered — {botsAffected} bot(s) paused" | "This is the safety system working as designed. Historically, markets recovered within {avgDays} days after similar events." |
| 4 | `regimeIndicator.transition detected` | `info` | "Market regime shifting: {from} → {to} ({confidence}% confidence)" | "Your {strategyType} strategies historically {performance} during transitions. Consider {action}." |
| 5 | `bot.actual < bot.expectedBand.lower` for 3+ days | `warning` | "Bot '{name}' underperforming expected range for {days} days" | "In backtesting, this happened {count} times. Resolution: {resolution} in {avgDays} days." |
| 6 | `correlation pair stress` (both bots losing, corr > 0.7) | `info` | "Correlated bots {botA} and {botB} both losing today" | "Their combined loss is ${combined}. In the last similar event, recovery took {avgDays} days." |
| 7 | `maxDD approaching tolerance` | `critical` | "Portfolio drawdown at {pct}% of your {limit}% tolerance" | "Consider pausing the highest-risk bot ({name}) to protect remaining capital." |

### 13.4 Priority Scoring

```
priority = severityWeight × impactScore × urgencyMultiplier

where:
  severityWeight: critical = 3, warning = 2, info = 1
  impactScore: dollarImpact / capitalBase (normalized 0–1)
  urgencyMultiplier: isGettingWorse ? 1.5 : 1.0
```

### 13.5 Deduplication

- Don't generate multiple cues for the same root cause (e.g., if circuit breaker is TRIPPED, don't also show "approaching daily loss limit").
- Cap at 5 active cues. If more than 5, show top 5 by priority and add "N more alerts" expandable.

**Codebase reference:** `types/index.ts:82–93` (ActionCue), `mock/mockData.ts:77–90`, `components/command-center/ActionCuesPanel.tsx`

---

## 14. Command Center Data Story

### 14.1 Purpose

The Command Center is the **landing page** — the first thing a trader sees. It must answer "Is my portfolio safe right now?" within 3 seconds of loading.

### 14.2 Page Layout & Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOP METRICS BAR (always visible)                                    │
│  Equity: $127,450  |  Day P&L: +$1,234  |  Regime: LOW_VOL (94%)   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─── FLEET HEALTH HERO (§12) ───────────────────────────────────┐  │
│  │  🟢 FLEET IS HEALTHY                                          │  │
│  │  "All systems nominal. Drawdown 26% of tolerance. No action." │  │
│  │  [Drawdown meter: ████░░░░░░ 26%]                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─── ACTION CUES (§13) ────────────────────────────────────────┐   │
│  │  ⚠ QQQ Momentum hit 65% of daily loss limit ($325/$500)      │   │
│  │    → "This happened 3 times this quarter. Recovered in 2 days"│   │
│  │  ℹ Regime shifting: LOW_VOL → TRANSITIONAL (62% confidence)  │   │
│  │    → "Your momentum strategies underperform during transitions"│   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─── FLEET STATUS GRID ──────────┐  ┌─── PORTFOLIO IMPACT (§10) ──┐│
│  │  [Bot 1] SPY MR    ✅ +$3,240 │  │  Return Attribution:         ││
│  │  [Bot 2] QQQ Mom   ✅ +$1,876 │  │  ██████████ SPY MR: +$3,240  ││
│  │  [Bot 3] TLT Range ⏸ -$543   │  │  ██████    QQQ Mom: +$1,876  ││
│  │                                │  │  ▓▓        TLT:   -$543     ││
│  │  Each card shows:              │  │                               ││
│  │  - Status badge (LIVE/PAUSED)  │  │  Risk Share:                  ││
│  │  - Day P&L ($ and %)          │  │  SPY: 38% | QQQ: 32% | TLT: 30%│
│  │  - Drawdown vs tolerance bar   │  │                               ││
│  │  - Regime favorability         │  │  ⚠ Correlation warning:      ││
│  │  - Bot-level narrative         │  │  SPY↔QQQ: 0.72 (high)        ││
│  └────────────────────────────────┘  └───────────────────────────────┘│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 14.3 Data Dependencies

```
Command Center requires:
├── PortfolioSnapshot (WebSocket, real-time)
├── FleetHealthScore (§12, computed every 5 min from:)
│   ├── CircuitBreakerStatus (WebSocket)
│   ├── RegimeIndicator (REST, 5 min poll)
│   ├── Current drawdown (WebSocket)
│   ├── Bot expected behavior band status (computed)
│   └── Correlation stress (REST, 15 min poll)
├── ActionCues (§13, computed from above inputs)
├── Deployments[] (WebSocket for status, REST for details)
├── PortfolioIntelligence (§10, REST 15 min poll)
│   ├── Bot impacts
│   ├── Correlations
│   └── Concentration warning
└── LLM narratives (§21–25, on data change)
```

**Codebase reference:** `app/page.tsx`, `components/command-center/FleetHealthHero.tsx`, `components/command-center/ActionCuesPanel.tsx`, `components/command-center/FleetStatusGrid.tsx`, `components/command-center/PortfolioImpact.tsx`

---

# PART IV: RISK INTELLIGENCE SYSTEM

---

## 15. Risk Weather — Multi-Factor Model

### 15.1 Purpose & User Question

**"In plain English, how risky is my situation right now?"**

Risk Weather is the top-level abstraction that converts complex multi-dimensional risk into a single weather metaphor: clear ☀️, fair ⛅, cloudy ☁️, or stormy ⛈️. It provides instant visual calibration of the situation.

### 15.2 Computation Boundary

**UI / Middleware layer.** Computed from multiple backend-provided inputs.

### 15.3 Five-Factor Weather Model

```
weatherScore = (
    0.30 × drawdownVelocityFactor +      // How fast is drawdown worsening?
    0.25 × circuitBreakerProximityFactor + // How close to circuit breaker triggers?
    0.20 × regimeFavorabilityFactor +      // Is the current regime good for our strategies?
    0.15 × correlationStressFactor +       // Are correlated bots stressed together?
    0.10 × concentrationFactor             // How concentrated is our risk?
)

// Factor 1: Drawdown Velocity (30%)
// Uses drawdownVelocity from §5 — rate of change, not just absolute level
if drawdownVelocity > 0:
    drawdownVelocityFactor = 1.0    // Recovering
elif drawdownVelocity > -0.5:
    drawdownVelocityFactor = 0.7    // Stable/slow decline
elif drawdownVelocity > -1.0:
    drawdownVelocityFactor = 0.4    // Moderate decline
else:
    drawdownVelocityFactor = 0.1    // Rapid decline

// Factor 2: Circuit Breaker Proximity (25%)
// Same as §12 Factor 2

// Factor 3: Regime Favorability (20%)
// Same as §12 Factor 3

// Factor 4: Correlation Stress (15%)
// Same as §12 Factor 4

// Factor 5: Concentration (10%)
if herfindahlIndex < 0.3:
    concentrationFactor = 1.0    // Well diversified
elif herfindahlIndex < 0.5:
    concentrationFactor = 0.6    // Moderately concentrated
else:
    concentrationFactor = 0.2    // Highly concentrated
```

### 15.4 Weather Classification with Hysteresis

```
if weatherScore ≥ 0.75:
    condition = 'clear'    // ☀️
    riskLevel = 'low'
elif weatherScore ≥ 0.55:
    condition = 'fair'     // ⛅
    riskLevel = 'moderate'
elif weatherScore ≥ 0.35:
    condition = 'cloudy'   // ☁️
    riskLevel = 'elevated'
else:
    condition = 'stormy'   // ⛈️
    riskLevel = 'high'

// HYSTERESIS: Don't oscillate between states.
// Only transition to a WORSE state if weatherScore is below threshold for 3+ consecutive readings.
// Only transition to a BETTER state if weatherScore is above threshold for 2+ consecutive readings.
// This prevents "weather flapping" that erodes user trust.
```

### 15.5 Weather Momentum

```
weatherTrend = weatherScore_now - weatherScore_6h_ago

if weatherTrend > 0.1:
    momentum = 'improving'    // "Conditions are getting better"
elif weatherTrend < -0.1:
    momentum = 'degrading'    // "Conditions are getting worse — stay alert"
else:
    momentum = 'stable'       // "No significant change"
```

**Codebase reference:** `types/index.ts:287–294` (RiskWeatherData), `mock/mockData.ts:433–441`, `components/operations/RiskDashboard.tsx`

---

## 16. Risk Budget System

### 16.1 Purpose & User Question

**"How much risk have I 'spent' today, and how much can I afford to lose before safety systems kick in?"**

The Risk Budget frames risk as a **daily spending budget** — a metaphor that retail traders intuitively understand. "You've spent $125 of your $500 daily loss budget" is immediately actionable.

### 16.2 Computation Boundary

**UI / Middleware layer.** Consumes circuit breaker status and portfolio metrics from backend.

### 16.3 Budget Items

```typescript
interface RiskBudgetItem {
  label: string;
  current: number;         // How much has been consumed
  limit: number;           // Maximum allowed
  unit: string;            // '$', '%', or ''
  percentConsumed: number; // current / limit × 100
  status: 'safe' | 'caution' | 'danger';
  explanation: string;     // Human-readable context
  burnRate: number;        // Rate of consumption per hour (for projection)
  projectedTripTime: string | null;  // "At this pace, limit reached by 2:30 PM"
}

// Standard budget items:
budgetItems = [
  {
    label: 'Daily Loss Budget',
    current: abs(dayPL when negative),
    limit: userProfile.dailyLossLimit,
    unit: '$',
    burnRate: abs(dayPL) / hoursSinceMarketOpen,
    projectedTripTime: calculateProjection(burnRate, remaining, marketCloseTime),
  },
  {
    label: 'Drawdown Budget',
    current: abs(currentDrawdown),
    limit: userProfile.maxDrawdownTolerance,
    unit: '%',
  },
  {
    label: 'Consecutive Loss Streak',
    current: circuitBreaker.consecutiveLosses,
    limit: circuitBreaker.consecutiveLossLimit,
    unit: 'trades',
  },
  {
    label: 'Capital Exposure',
    current: totalAllocatedCapital / totalCapital × 100,
    limit: 100,
    unit: '%',
  }
]
```

### 16.4 Budget Status Thresholds

```
if percentConsumed < 50:
    status = 'safe'       // Green bar
elif percentConsumed < 80:
    status = 'caution'    // Yellow bar
else:
    status = 'danger'     // Red bar, pulsing animation
```

### 16.5 Burn Rate Projection

```
// Only applicable for intraday budgets (daily loss)
hoursElapsed = (now - marketOpen) / 3600
burnRatePerHour = currentConsumption / hoursElapsed
remainingBudget = limit - currentConsumption
hoursUntilTrip = remainingBudget / burnRatePerHour
projectedTripTime = now + hoursUntilTrip

if projectedTripTime < marketClose:
    projection = "At this pace, you'll hit your daily limit by {projectedTripTime}."
else:
    projection = "At this pace, you won't hit your daily limit today."
```

**Codebase reference:** `types/index.ts:296–307` (RiskBudgetItem, RiskBudgetData), `mock/mockData.ts:443–467`

---

## 17. Stress Scenario Engine

### 17.1 Purpose & User Question

**"What would actually happen to my money if the market crashes?"**

Stress scenarios replace abstract fear with concrete numbers. Instead of worrying vaguely about a crash, the trader sees: "In a 5% market drop, you'd lose about $3,200, and your circuit breaker would pause your bots after $500 in daily losses. Based on 3 similar events in history, recovery takes about 12 trading days."

### 17.2 Computation Boundary

**Backend (black box)** runs historical replay simulations. The UI receives the results and frames them narratively.

### 17.3 Output Contract

```typescript
// See types/index.ts:309–320
interface StressScenario {
  id: string;
  icon: string;                     // Emoji for quick visual
  title: string;                    // Short, descriptive
  description: string;              // What happens in this scenario

  // --- Impact Estimates (REQUIRED — from historical replay) ---
  estimatedLossDollar: number;      // Expected portfolio loss
  estimatedLossPercent: number;     // As % of current equity
  historicalOccurrences: number;    // How many times this has happened historically
  avgRecoveryDays: number;          // Average recovery time after similar events
  severity: ScenarioSeverity;       // 'moderate' | 'significant' | 'severe'

  // --- Safety Analysis (REQUIRED — connects to circuit breaker) ---
  safetyNet: string;                // What protections are in place

  // --- Per-Bot Impact (new in v2.0) ---
  botImpacts: {
    deploymentId: string;
    name: string;
    estimatedLoss: number;          // Per-bot estimated loss
    wouldCircuitBreakerTrip: boolean;
    tripAfterDays: number | null;   // Days until CB would trigger
  }[];
}
```

### 17.4 Scenario Categories

The backend should simulate these scenario archetypes:

| Category | Description | Historical Analogs |
|----------|-------------|-------------------|
| Flash Crash | Single-day 5%+ market drop | Aug 2015, Feb 2018, Mar 2020 Day 1 |
| Sustained Selloff | Multi-week grinding decline | Sep-Dec 2018, Jan-Mar 2020 |
| VIX Spike | VIX jumps to 35+ for 10+ days | Mar 2020, Aug 2015 |
| Sector Rotation | Sudden shift from growth to value | Nov 2020, Jan 2022 |
| Liquidity Crisis | Spreads widen, stops slip | Mar 2020 liquidity crunch |
| Bot-Specific Worst Case | Worst historical N-day stretch for each bot | Derived from backtest |

### 17.5 Conditional Scenarios

The backend should support **compound conditions**:

```typescript
POST /api/risk/stress-test/conditional
{
  conditions: [
    { type: 'regime_shift', to: 'CRISIS' },
    { type: 'correlation_spike', pair: ['dep-1', 'dep-2'], to: 0.95 },
    { type: 'vix_level', above: 35 }
  ],
  portfolioState: { deploymentIds: [...], currentEquity: ... }
}
```

**Codebase reference:** `types/index.ts:309–320`, `mock/mockData.ts:468–505`

---

## 18. Diversification Scoring Algorithm

### 18.1 Purpose & User Question

**"Am I putting all my eggs in one basket?"**

### 18.2 Computation Boundary

**UI / Middleware layer.** Computed from bot metadata and correlation analysis.

### 18.3 Four Dimensions with Weights

```
overallGrade = (
    0.30 × assetCoverageFactor +
    0.25 × strategyMixFactor +
    0.25 × correlationRiskFactor +
    0.20 × directionBiasFactor
)
```

**Dimension 1: Asset Coverage (30%)**
```
uniqueAssetClasses = count_unique(bots.map(b => b.assetClass))
// Asset classes: equities, bonds, commodities, crypto, FX, alternatives

if uniqueAssetClasses ≥ 4: grade = 'A'
elif uniqueAssetClasses == 3: grade = 'B+'
elif uniqueAssetClasses == 2: grade = 'B'
elif uniqueAssetClasses == 1: grade = 'D'
```

**Dimension 2: Strategy Mix (25%)**
```
uniqueStrategies = count_unique(bots.map(b => b.strategyType))
// Types: momentum, mean_reversion, stat_arb, market_neutral, trend_following

if uniqueStrategies ≥ 3: grade = 'A'
elif uniqueStrategies == 2: grade = 'B'
elif uniqueStrategies == 1: grade = 'D'
```

**Dimension 3: Correlation Risk (25%)**
```
avgCorrelation = mean(abs(pairwise_correlations))
highCorrPairs = count(pairs where correlation > 0.7)

if avgCorrelation < 0.3 AND highCorrPairs == 0: grade = 'A'
elif avgCorrelation < 0.5 AND highCorrPairs ≤ 1: grade = 'B'
elif avgCorrelation < 0.7: grade = 'C'
else: grade = 'D'
```

**Dimension 4: Directional Bias (20%)**
```
if directionalBiasPercent < 30: grade = 'A'     // Nearly neutral
elif directionalBiasPercent < 50: grade = 'B'
elif directionalBiasPercent < 70: grade = 'C'
else: grade = 'D'                                // Heavily directional
```

### 18.4 Marginal Diversification Benefit

When recommending a new strategy, compute how much it would improve the overall grade:

```
"Adding a commodity bot (gold futures) would:
 • Reduce average correlation from 0.52 to 0.38
 • Improve asset coverage from 2 to 3 classes
 • Improve your diversification grade from C+ to B+
 • Reduce estimated tail risk by ~18%"
```

**Codebase reference:** `types/index.ts:322–332`, `mock/mockData.ts:506–515`

---

## 19. Recommendation Engine — Causal DAG

### 19.1 Purpose & User Question

**"What should I actually DO right now?"**

Recommendations convert all risk signals into ranked, actionable next steps with specific CTAs that link to platform actions.

### 19.2 Computation Boundary

**UI / Middleware layer.** Consumes outputs from §10–18.

### 19.3 Priority DAG (Directed Acyclic Graph)

```
INPUT SIGNALS                    RECOMMENDATION CANDIDATES           OUTPUT
─────────────                    ─────────────────────────           ──────
drawdown > 70% tolerance  ─────▶ "Pause highest-risk bot"       ─┐
circuit breaker at WARNING ─────▶ "Reduce position sizes"       ─┤
                                                                  ├──▶ FILTER by
correlatedBots stressed   ──────▶ "Diversify — add uncorrelated" ─┤    user profile
diversification grade < C ──────▶ "Add commodity/FX strategy"   ─┤    ──▶ RANK by
                                                                  ├──▶ priority
bot outside expected band ──────▶ "Review bot deployment"       ─┤    ──▶ ENRICH
regime shift detected     ──────▶ "Adjust for new regime"       ─┤    with narrative
                                                                  │    ──▶ MAP to CTA
bot is top performer      ──────▶ "Keep running (reassurance)"  ─┤
bot has negative Sharpe   ──────▶ "Consider pausing/removing"   ─┘
```

### 19.4 Priority Scoring

```
priorityScore = severityWeight × impactMagnitude × urgency × (1 - userFatigue)

where:
  severityWeight: critical = 3, warning = 2, info = 1
  impactMagnitude: estimated dollar impact / capitalBase (normalized)
  urgency: isTimeSensitive ? 1.5 : 1.0
  userFatigue: hasBeenShownBefore ? 0.3 : 0.0  // Reduce priority of repeated recs
```

### 19.5 CTA Mapping

Each recommendation links to a specific platform action:

| Recommendation Type | CTA Label | Navigation Target |
|--------------------|-----------|-------------------|
| `keep` | "View Bot" | `/operations` → Fleet → Bot Detail |
| `add` | "Explore Strategies" | `/workbench` → Discover tab |
| `monitor` | "Open Bot Detail" | `/operations` → Fleet → Bot Detail → Decision Panel |
| `remove` | "Review Deployment" | `/operations` → Fleet → Bot Detail → Pause/Stop |

**Codebase reference:** `types/index.ts:336–344`, `mock/mockData.ts:516–552`

---

## 20. Cross-Metric Dependency Map

### 20.1 Purpose

This section documents the **computation order** and **invalidation cascade** — when one metric changes, which downstream metrics must recompute? An agentic AI coder needs this to implement efficient update propagation.

### 20.2 Dependency Graph

```
LEVEL 0 (Raw Backend Data — arrives via API/WebSocket):
├── Market Data (prices, volume)
├── Trade Executions (fills, P&L)
├── Equity Curve (point-in-time portfolio value)
└── Regime Classification (ATR/VIX-based)

LEVEL 1 (Backend-Computed Derived Metrics):
├── Performance Metrics (Sharpe, Sortino, Calmar, Profit Factor) ← depends on: equity curve, trades
├── Risk Metrics (drawdown, VaR, CVaR, underwater series) ← depends on: equity curve
├── WFO Windows (IS/OOS segmented equity, assessments) ← depends on: equity curve, regime
├── Monte Carlo Distribution (fan chart, probabilities) ← depends on: trade log
├── Correlation Matrix (static, rolling, tail) ← depends on: bot equity curves
├── Sensitivity Analysis (leave-one-out impacts) ← depends on: bot equity curves, correlation
└── Stress Scenario Replays ← depends on: equity curve, regime, correlation

LEVEL 2 (UI-Computed Interpretive Metrics):
├── Backtest Verdict (§8) ← depends on: Level 1 performance, WFO, MC, risk, user profile
├── Expected Behavior Band (§9) ← depends on: Level 1 performance (mean, stddev)
├── Fleet Health Score (§12) ← depends on: drawdown, circuit breaker, regime, correlation, band status
├── Risk Weather (§15) ← depends on: drawdown velocity, circuit breaker, regime, correlation, concentration
├── Risk Budget (§16) ← depends on: circuit breaker, portfolio P&L
├── Diversification Grade (§18) ← depends on: bot metadata, correlation matrix
├── Action Cues (§13) ← depends on: all Level 2 metrics above
└── Recommendations (§19) ← depends on: all Level 2 metrics + user profile

LEVEL 3 (Narrative Layer):
├── LLM Fleet Health Briefing ← depends on: fleet health, action cues, regime
├── LLM Bot Narratives ← depends on: bot metrics, expected band, regime
├── LLM Risk Weather Briefing ← depends on: risk weather, budget, scenarios
├── LLM Verdict Narrative ← depends on: verdict, WFO, MC, regime
└── LLM Sensitivity Explanation ← depends on: sensitivity, correlation, regime
```

### 20.3 Invalidation Cascade

When a metric at Level N changes, all dependent metrics at Levels N+1 and above must recompute:

```
Example: Regime shifts from LOW_VOL to HIGH_VOL
  ├──▶ Recompute: regimeFavorabilityFactor (Level 2)
  │     ├──▶ Recompute: Fleet Health Score
  │     ├──▶ Recompute: Risk Weather
  │     └──▶ Recompute: Action Cues (may generate "regime shift" cue)
  ├──▶ Recompute: Expected Behavior Band (switch to HIGH_VOL parameters)
  ├──▶ Regenerate: All LLM narratives that reference regime
  └──▶ Potentially trigger: Recommendation for position size reduction
```

---

# PART V: LLM NARRATIVE INTELLIGENCE

---

## 21. Narrative Type Taxonomy

### 21.1 Overview

The LLM Narrative Layer is not cosmetic decoration — it is the **core differentiator** of the platform. It bridges the gap between computed data and human understanding. Every narrative must satisfy three requirements:
1. **Grounded** — Every claim traces to a specific metric in the context packet.
2. **Actionable** — Ends with what the user should do (or confirms no action needed).
3. **Calibrated** — Tone matches the actual severity of the situation (see §25).

### 21.2 Seven Narrative Types

| # | Narrative Type | Trigger | UI Location | Refresh Frequency |
|---|---------------|---------|-------------|-------------------|
| 1 | **Fleet Health Briefing** | Page load + data change | Command Center → FleetHealthHero | Every 5 min |
| 2 | **Bot Performance Narrative** | Page load + data change | Fleet grid cards, Deployment detail | Every 5 min |
| 3 | **Backtest Verdict Narrative** | Backtest complete | Workbench → Build → Verdict card | Once per backtest |
| 4 | **Risk Weather Briefing** | Page load + data change | Operations → Risk Dashboard | Every 5 min |
| 5 | **Sensitivity Explanation** | Page load + data change | Command Center → Portfolio Impact | Every 15 min |
| 6 | **Stress Scenario Narrative** | Page load | Operations → Risk Intelligence | Every 30 min |
| 7 | **Action Cue Reasoning** | Cue generated | Command Center → Action Cues | On cue generation |

---

## 22. Context Packet Assembly

### 22.1 Principle

The LLM never invents data. It receives a **structured context packet** containing all pre-computed metrics and historical anchors, then **explains** what those numbers mean in plain English, relative to the user's situation.

### 22.2 Context Packet Structure (Per Narrative Type)

**Type 1: Fleet Health Briefing**

```json
{
  "narrative_type": "fleet_health_briefing",
  "user_profile": {
    "capitalBase": 50000,
    "riskComfort": "moderate",
    "maxDrawdownTolerance": 15,
    "financialGoal": "Grow 15-25% annually, DD < 15%",
    "experienceLevel": "advanced_beginner"
  },
  "portfolio_state": {
    "equity": 127450.23,
    "dayPL": 1234.56,
    "dayPLPercent": 0.98,
    "fleetHealthScore": 82,
    "fleetHealthStatus": "HEALTHY",
    "drawdownCurrent": -2.1,
    "drawdownOfTolerance": 14,
    "circuitBreakerState": "ARMED"
  },
  "bot_summaries": [
    {
      "name": "SPY Mean Reversion",
      "status": "active",
      "dayPL": 456.78,
      "totalPL": 3240.12,
      "isWithinExpected": true,
      "currentRegimeFavorability": "strong",
      "drawdownVsTolerance": 14
    }
  ],
  "regime_context": {
    "current": "LOW_VOL",
    "confidence": 94.2,
    "currentDurationDays": 92,
    "historicalAvgDuration": 180,
    "trend": "stable"
  },
  "risk_signals": {
    "correlationStress": "none",
    "concentrationRisk": "moderate",
    "upcomingRisks": []
  },
  "historical_anchors": [
    "Drawdowns of this size occurred every 6-8 weeks in backtesting",
    "Current regime has historically been the best performing for this strategy mix",
    "Portfolio is up 4.36% since inception (47 days)"
  ]
}
```

**Type 3: Backtest Verdict Narrative**

```json
{
  "narrative_type": "backtest_verdict",
  "user_profile": { "..." },
  "backtest_summary": {
    "strategyName": "SPY Mean Reversion",
    "testPeriod": "6 years (2018-2024)",
    "totalReturn": 186.7,
    "totalReturnDollar": 93350,
    "sharpe": 1.42,
    "maxDrawdown": -12.4,
    "maxDrawdownDollar": -6200
  },
  "wfo_summary": {
    "oosConsistency": 80,
    "oosDegradation": -8.2,
    "meanOosSharpe": 1.33,
    "regimesSurvived": ["LOW_VOL", "CRISIS", "NORMAL"],
    "regimesFailed": ["HIGH_VOL"],
    "robustnessScore": 72
  },
  "monte_carlo_summary": {
    "probOfProfit": 87.2,
    "riskOfRuin": 0.08,
    "worstCase5pct": -6200,
    "bestCase95pct": 19100,
    "medianReturn": 9250
  },
  "verdict": {
    "assessment": "promising",
    "verdictScore": 0.74,
    "withinTolerance": true
  },
  "regime_breakdown": {
    "LOW_VOL": { "sharpe": 2.14, "return": 22.1, "assessment": "strong" },
    "CRISIS": { "sharpe": 0.92, "return": 8.4, "assessment": "survived" },
    "NORMAL": { "sharpe": 1.87, "return": 31.2, "assessment": "strong" },
    "HIGH_VOL": { "sharpe": -0.21, "return": -3.2, "assessment": "weak" }
  }
}
```

**Type 5: Sensitivity Explanation**

```json
{
  "narrative_type": "sensitivity_explanation",
  "user_profile": { "..." },
  "portfolio_totals": {
    "totalPL": 4573.36,
    "totalPLPercent": 4.36
  },
  "bot_impacts": [
    {
      "name": "SPY Mean Reversion",
      "equityImpactDollar": 3240.12,
      "portfolioReturnWithout": 1.27,
      "riskSharePercent": 38,
      "marginalSharpe": 0.35,
      "regime": "LOW_VOL",
      "regimeFavorability": "strong"
    }
  ],
  "correlations": [
    { "botA": "SPY MR", "botB": "QQQ Mom", "correlation": 0.72, "riskLevel": "high" }
  ],
  "directionalBias": "net_long",
  "directionalBiasPercent": 76,
  "concentrationWarning": "SPY and QQQ bots have 0.72 correlation"
}
```

### 22.3 Grounding Rules

The LLM prompt must enforce these rules:

1. **No invented statistics.** Every number in the output must appear in the context packet.
2. **No future predictions.** The LLM can say "historically, X happened" but not "X will happen."
3. **No financial advice framing.** Use "consider" and "you might want to" instead of "you should" or "you must."
4. **Dollar amounts always paired with percentages.**
5. **Historical anchors must be cited.** If saying "this is normal," reference the specific historical data.

---

## 23. Anticipatory Risk Narration

### 23.1 Purpose

The most valuable narrative is not about **current state** but about **what might be coming**. This section specifies how the LLM explains upcoming risks by consuming regime transition probabilities and regime-conditional metrics.

### 23.2 Anticipatory Context Assembly

The backend provides regime transition probabilities (§3). The UI/middleware computes "what-if" impact estimates:

```
For each possible regime transition:
  1. Get P(transition) from backend
  2. Look up regime-conditional metrics for each bot in the new regime
  3. Estimate portfolio impact:
     - New expected Sharpe per bot (from sharpeByRegime)
     - New expected correlation (from regimeCorrelations)
     - New expected drawdown risk (from regime-conditional risk metrics)
     - Time until circuit breaker would trip (estimated from stress scenarios)
  4. Package as "anticipatory scenario" in the LLM context packet
```

### 23.3 Anticipatory Scenario Structure

```json
{
  "anticipatory_scenarios": [
    {
      "trigger": "Regime shifts to HIGH_VOL",
      "probability": 0.08,
      "timeframe": "next 30 days",
      "impacts": {
        "SPY Mean Reversion": {
          "currentSharpe": 2.14,
          "expectedSharpe": -0.21,
          "narrative": "Would struggle significantly"
        },
        "QQQ Momentum": {
          "currentSharpe": 1.87,
          "expectedSharpe": 0.45,
          "narrative": "Would underperform but survive"
        }
      },
      "correlationChange": {
        "SPY_QQQ": { "current": 0.72, "expected": 0.89 }
      },
      "portfolioImpact": {
        "expectedDrawdown": "-12.4%",
        "circuitBreakerTripDays": 4
      },
      "protectiveActions": [
        "Reduce QQQ position size by 50%",
        "Set VIX-based auto-halt at VIX > 25",
        "Resume TLT (decorrelation benefit increases in high-vol)"
      ]
    }
  ]
}
```

### 23.4 LLM Output for Anticipatory Narration

```
"Your portfolio is calm right now, but here's what to watch:

There's an 8% chance volatility spikes in the next month. If that happens,
your two equity bots would both struggle — their correlation jumps from
0.72 to 0.89 in high-vol markets, meaning a loss in SPY almost guarantees
a loss in QQQ too.

Your circuit breaker would likely pause trading within 4 days, limiting
your losses. But you could get ahead of it by setting a VIX alert at 25
to auto-reduce QQQ Momentum's position size.

On the positive side: TLT's decorrelation benefit actually increases
during high volatility — which is exactly when you need it most."
```

---

## 24. Prompt Engineering Specification

### 24.1 System Prompt (All Narrative Types)

```
You are a portfolio risk analyst for AlgoBrute, a retail algorithmic
trading platform. Your role is to explain complex trading metrics
in plain English to an advanced beginner trader.

RULES:
1. You may ONLY reference numbers and data provided in the context packet.
   Never invent or estimate statistics.
2. Always express losses and gains in BOTH dollar amounts and percentages.
3. Always provide historical context when discussing current performance
   ("This has happened X times before...").
4. End every narrative with either:
   a. A clear recommended action, or
   b. Explicit confirmation that no action is needed.
5. Use the tone specified in the context packet's riskLevel field:
   - low: reassuring, factual, brief
   - moderate: measured concern, specific observations
   - elevated: direct recommendations, clear thresholds
   - high: urgent, action-first, imperative language
6. Never use the words "guaranteed," "will definitely," "always," or "never"
   when discussing future performance.
7. Prefer simple sentences. If a sentence has more than one comma, split it.
8. When comparing to historical data, specify the time period and frequency.

PERSONA:
Think of yourself as a trusted financial advisor who explains things
clearly without being condescending. You're talking to someone who
understands the basics but needs help connecting the dots.
```

### 24.2 Few-Shot Examples

**Example 1: Fleet Health Briefing (Low Risk)**

```
INPUT CONTEXT:
{ fleetHealthStatus: "HEALTHY", drawdownOfTolerance: 14%, dayPL: +$1,234,
  allBotsWithinExpected: true, regime: "LOW_VOL" }

OUTPUT:
{
  "headline": "All systems nominal",
  "body": "Your portfolio gained $1,234 today (+0.98%). All three bots are
           operating within their expected performance ranges. Your current
           drawdown is just 2.1% — only 14% of your 15% comfort limit.
           The current low-volatility market is historically the best
           environment for your strategy mix. No action needed.",
  "confidence": 0.95,
  "actionItems": [],
  "tone": "reassuring"
}
```

**Example 2: Fleet Health Briefing (Elevated Risk)**

```
INPUT CONTEXT:
{ fleetHealthStatus: "CAUTION", drawdownOfTolerance: 68%, dayPL: -$380,
  botsOutsideBand: ["TLT Range Trading"], regime: "HIGH_VOL",
  circuitBreakerAt: "WARNING" }

OUTPUT:
{
  "headline": "Your portfolio needs attention",
  "body": "Your portfolio lost $380 today (-0.30%). More importantly,
           your total drawdown has reached 10.2% — that's 68% of your
           15% comfort limit. TLT Range Trading has been underperforming
           its expected range for 4 days.

           The current high-volatility market is challenging for your
           strategy mix. Your circuit breaker is in WARNING state and
           will pause trading automatically if losses continue.

           In backtesting, drawdowns of this size occurred 6 times and
           resolved within 8 trading days on average.",
  "confidence": 0.88,
  "actionItems": [
    "Review TLT Range Trading — consider pausing until regime shifts",
    "Check if QQQ Momentum position sizes should be reduced"
  ],
  "tone": "cautious"
}
```

**Example 3: Backtest Verdict (Promising)**

```
INPUT CONTEXT:
{ assessment: "promising", verdictScore: 0.74, regime: "LOW_VOL",
  oosConsistency: 80%, probOfProfit: 87%, maxDD: -12.4%,
  expectedReturn: "$7,500-$12,000/year", maxLoss: "$6,200" }

OUTPUT:
{
  "headline": "Strategy looks promising",
  "body": "Over 6 years of testing across 4 market regimes, this strategy
           returned +186% total ($93,350 on $50,000). It passed the
           walk-forward test in 4 out of 5 windows, meaning it's not
           just memorizing past data — it genuinely finds patterns.

           In 10,000 Monte Carlo simulations, it was profitable 87% of
           the time. Your expected annual return is $7,500-$12,000, with
           a worst-case loss of about $6,200 (within your 15% tolerance).

           One concern: it struggled during the 2022 high-volatility
           period (-3.2%). If markets turn choppy, watch closely.

           The current LOW_VOL regime is this strategy's sweet spot.",
  "confidence": 0.91,
  "actionItems": [
    "Deploy with paper trading first to validate live behavior",
    "Set a VIX alert at 25 to monitor for regime shift"
  ],
  "tone": "reassuring"
}
```

### 24.3 Structured Output Schema

All LLM narrative responses must conform to:

```typescript
interface NarrativeResponse {
  headline: string;          // 2-6 words, for card headers
  body: string;              // 50-200 words, the main narrative
  confidence: number;        // 0-1, LLM's self-assessed confidence
  actionItems: string[];     // 0-3 specific actions
  tone: 'reassuring' | 'cautious' | 'urgent';
  referencedMetrics: string[];  // Which metrics from context packet were cited
}
```

### 24.4 Fallback Templates

When LLM is unavailable (timeout, API error), use template-based fallbacks:

```typescript
const fallbackTemplates: Record<string, (ctx: any) => string> = {
  fleet_health_briefing: (ctx) =>
    `Portfolio is ${ctx.fleetHealthStatus.toLowerCase()}. ` +
    `Day P&L: ${formatCurrency(ctx.dayPL)}. ` +
    `Drawdown: ${ctx.drawdownCurrent}% (${ctx.drawdownOfTolerance}% of tolerance). ` +
    `${ctx.botsWithinExpected} of ${ctx.totalBots} bots within expected range.`,

  bot_narrative: (ctx) =>
    `${ctx.botName} is ${ctx.status}. ` +
    `Total P&L: ${formatCurrency(ctx.totalPL)} (${ctx.totalPLPercent}%). ` +
    `${ctx.isWithinExpected ? 'Operating within expected range.' : 'Outside expected range — review recommended.'}`,
  
  // ... additional templates for each narrative type
};
```

---

## 25. Tone Adaptation Matrix

### 25.1 The 3×3 Matrix

The intersection of **risk level** and **user profile** determines the narrative tone:

```
                    ┌─────────────────────┬───────────────────┬──────────────────────┐
                    │  CONSERVATIVE USER  │  MODERATE USER    │  AGGRESSIVE USER     │
┌───────────────────┼─────────────────────┼───────────────────┼──────────────────────┤
│  RISK: LOW        │  "Everything is     │  "All systems     │  "Portfolio is       │
│  (green)          │   running safely.   │   nominal. Your   │   running clean.     │
│                   │   Your capital is   │   bots are within │   No action needed." │
│                   │   well protected."  │   expected range." │                      │
│                   │                     │                   │                      │
│  Language:        │  Emphasize safety,  │  Factual, brief,  │  Minimal, let them   │
│                   │  protection, limits │  balanced          │  focus on other work │
├───────────────────┼─────────────────────┼───────────────────┼──────────────────────┤
│  RISK: MODERATE   │  "Your portfolio    │  "One bot is near │  "Minor drawdown on  │
│  (amber)          │   needs attention.  │   its loss limit. │   QQQ. Normal        │
│                   │   Consider pausing  │   Worth checking  │   variance. Keep     │
│                   │   the weakest bot   │   but not urgent." │   running."          │
│                   │   until conditions  │                   │                      │
│                   │   improve."         │                   │                      │
│                   │                     │                   │                      │
│  Language:        │  Proactive caution, │  Measured concern, │  Acknowledge but     │
│                   │  suggest action     │  present options   │  downplay, trust CB  │
├───────────────────┼─────────────────────┼───────────────────┼──────────────────────┤
│  RISK: HIGH       │  "Immediate action  │  "Your drawdown   │  "Drawdown at 80%    │
│  (red)            │   needed. Pause all │   is approaching  │   of limit. Circuit  │
│                   │   bots and review   │   your limit.     │   breaker will       │
│                   │   your risk         │   Circuit breaker  │   handle it if it    │
│                   │   settings."        │   is close to     │   goes further.      │
│                   │                     │   triggering.     │   Monitor."          │
│                   │                     │   Consider manual │                      │
│                   │                     │   intervention."  │                      │
│                   │                     │                   │                      │
│  Language:        │  Urgent, imperative,│  Direct, advisory, │  Confident in system,│
│                   │  manual override    │  present choices   │  trust automation    │
└───────────────────┴─────────────────────┴───────────────────┴──────────────────────┘
```

### 25.2 Reasoning Chains with Tone

The platform documents 10 major **reasoning chains** — multi-step causal paths from raw data to user action. Each chain is processed end-to-end by the LLM using the context packet, and the output is tone-adapted per the matrix above.

**Chain 1: "Is my portfolio safe right now?"**
```
Inputs: Fleet health score, drawdown ratio, circuit breaker state, regime
→ Intermediate: Compare drawdown to tolerance, check CB proximity, assess regime fit
→ LLM: Synthesize into fleet health briefing with appropriate tone
→ CTA: None (if safe) or "Review risk settings" (if elevated)
```

**Chain 2: "Can I trust this backtest?"**
```
Inputs: WFO consistency, OOS degradation, MC prob of profit, regime survival count
→ Intermediate: Compute verdict score, check for overfitting signals
→ LLM: Explain whether the strategy is memorizing data or finding real patterns
→ CTA: "Deploy paper" or "Refine strategy" or "Do not deploy"
```

**Chain 3: "Which bot should I pause?"**
```
Inputs: Bot P&L, sensitivity analysis, correlation impact, regime favorability
→ Intermediate: For each bot, compute "portfolio impact if paused"
→ LLM: Explain the trade-off (e.g., "TLT is losing money but provides decorrelation")
→ CTA: "Pause {bot}" or "Keep running, set alert at {threshold}"
```

**Chain 4: "What happens if the market crashes?"**
```
Inputs: Stress scenario replays, circuit breaker status, safety nets
→ Intermediate: Map scenario → per-bot impact → total portfolio loss → CB response
→ LLM: Translate to dollars and recovery timeline
→ CTA: "Your safety systems would limit losses to ${X}. No preemptive action needed."
```

**Chain 5: "Am I diversified enough?"**
```
Inputs: Correlation matrix, strategy types, asset classes, directional bias
→ Intermediate: Compute diversification grade per dimension + overall
→ LLM: Explain the weakest dimension and suggest specific improvements
→ CTA: "Explore {missing_strategy_type} strategies" → navigate to Discover
```

**Chain 6: "Is this bot behaving normally?"**
```
Inputs: Live equity, expected behavior band, regime, backtest history
→ Intermediate: Compare live position to band, check for breach
→ LLM: Explain whether deviation is normal variance or a concern
→ CTA: "Within range, no action" or "Outside range for {N} days — review"
```

**Chain 7: "Should I deploy this new strategy?"**
```
Inputs: Verdict score, capital adequacy, regime fit, correlation with existing fleet
→ Intermediate: Check if adding this strategy improves or worsens portfolio
→ LLM: Explain fit with existing portfolio, regime timing, capital requirements
→ CTA: "Deploy paper" or "Wait for regime shift" or "Not compatible with current fleet"
```

**Chain 8: "What risks are coming?"**
```
Inputs: Regime transition probabilities, regime-conditional metrics
→ Intermediate: Compute impact scenarios for each possible regime transition
→ LLM: Explain most likely and most dangerous upcoming regime shifts
→ CTA: "Set VIX alert at {level}" or "Pre-configure position size reduction"
```

**Chain 9: "Why did I lose money today?"**
```
Inputs: Trade log, regime, bot attribution, daily P&L breakdown
→ Intermediate: Identify which trades lost, which regime, which bots contributed
→ LLM: Explain the causal chain from market conditions to losses
→ CTA: "Review {trade}" or "This is normal variance — no action needed"
```

**Chain 10: "Should I add more capital?"**
```
Inputs: Risk budget utilization, return trajectory, MC forecast, current exposure
→ Intermediate: Check if current capital is fully utilized, if returns justify more
→ LLM: Explain risk/reward of adding capital given current portfolio state
→ CTA: "Consider adding ${X} to reach target allocation" or "Current allocation is appropriate"
```

---

# PART VI: PLATFORM MECHANICS

---

## 26. Circuit Breaker State Machine

### 26.1 Purpose

The circuit breaker is the portfolio's **automatic safety system**. It progressively restricts trading as risk accumulates, preventing catastrophic losses.

### 26.2 State Diagram

```
                    ┌──────────┐
        ┌──────────▶│  ARMED   │◀────────────────────┐
        │           │  (Normal)│                      │
        │           └────┬─────┘                      │
        │                │                            │
        │     Risk metric reaches 60% of limit        │
        │                │                            │
        │           ┌────▼─────┐                      │
        │           │ WARNING  │              24h cooldown
        │           │ (Alert)  │              expires
        │           └────┬─────┘                      │
        │                │                            │
        │     Risk metric reaches 80% of limit        │
        │                │                            │
        │           ┌────▼──────┐                     │
        │           │ THROTTLED │                     │
    User│           │(Reduce sz)│              ┌──────┴──────┐
    manual           └────┬──────┘              │  COOLDOWN   │
    reset                 │                     │  (Waiting)  │
        │     Risk metric reaches 100% of limit │             │
        │                │                      └──────▲──────┘
        │           ┌────▼─────┐                      │
        │           │ TRIPPED  │──────────────────────┘
        │           │(All stop)│  After trip resolved,
        └───────────└──────────┘  enter 24h cooldown
```

### 26.3 State Definitions

| State | Behavior | User Notification |
|-------|----------|-------------------|
| **ARMED** | Normal operation, all limits monitored | None (green status) |
| **WARNING** | Alert generated, monitoring intensified | Action Cue: "Circuit breaker approaching trigger" |
| **THROTTLED** | Position sizes automatically reduced by 50% | Action Cue: "Position sizes reduced — risk elevated" |
| **TRIPPED** | All trading halted, new orders blocked | Critical Cue: "Trading paused by safety system" |
| **COOLDOWN** | Trading resumes at 50% size for 24 hours | Info Cue: "Resuming cautiously — reduced position sizes" |

### 26.4 Trigger Conditions

```
Trip wires (any ONE triggers the transition):

ARMED → WARNING:
  dailyLossConsumed > 0.60 × dailyLossLimit
  OR consecutiveLosses ≥ ceil(0.60 × consecutiveLossLimit)
  OR currentDrawdown > 0.60 × maxDrawdownLimit

WARNING → THROTTLED:
  dailyLossConsumed > 0.80 × dailyLossLimit
  OR consecutiveLosses ≥ ceil(0.80 × consecutiveLossLimit)
  OR currentDrawdown > 0.80 × maxDrawdownLimit

THROTTLED → TRIPPED:
  dailyLossConsumed ≥ dailyLossLimit
  OR consecutiveLosses ≥ consecutiveLossLimit
  OR currentDrawdown ≥ maxDrawdownLimit

TRIPPED → COOLDOWN:
  Automatic after trip condition clears (e.g., new trading day resets daily loss)

COOLDOWN → ARMED:
  24 hours elapsed since entering COOLDOWN
  AND no trip conditions currently met
```

### 26.5 User Override

Users can manually:
- **Pause** any individual bot (bypasses circuit breaker)
- **Resume** after TRIPPED (overrides COOLDOWN, goes directly to WARNING)
- **Adjust limits** (cannot lower below platform minimums)
- **Cannot** disable the circuit breaker entirely (platform safety requirement)

**Codebase reference:** `types/index.ts:263–271` (CircuitBreakerStatus), `mock/mockData.ts:346–349`

---

## 27. Position Lifecycle State Machine

### 27.1 States & Transitions

```
┌──────┐     profit > 1×risk     ┌────────────┐
│ OPEN │─────────────────────────▶│ PROTECTING │
│      │                          │ (stop→BE)  │
└───┬──┘                          └─────┬──────┘
    │                                   │
    │  stop-loss hit                    │  profit > 2×risk
    │  OR time exit                     │
    ▼                                   ▼
┌────────┐                        ┌──────────┐
│CLOSING │◀───────────────────────│ TRAILING │
│        │  trailing stop hit     │ (ATR stop)│
└───┬────┘  OR take-profit hit    └──────────┘
    │
    ▼
┌────────┐
│ CLOSED │  → Creates JournalEntry
└────────┘
```

### 27.2 State Behaviors

| State | Stop-Loss | Risk Behavior | Regime Adaptation |
|-------|-----------|---------------|-------------------|
| **OPEN** | Fixed at entry (e.g., -2.1% ATR) | Full risk | None |
| **PROTECTING** | Moved to breakeven | Risk-free on entry capital | Tighter in HIGH_VOL |
| **TRAILING** | Dynamic ATR trail | Locks in profits | Wider trail in LOW_VOL |
| **CLOSING** | N/A | Exiting market | Immediate in CRISIS |
| **CLOSED** | N/A | No exposure | N/A |

**Codebase reference:** `types/index.ts:55–56` (PositionLifecycleState), `types/index.ts:57–69` (Position)

---

## 28. Deployment Pipeline

### 28.1 Pipeline Stages

```
Strategy         Capital         Risk Profile       Paper/Live      Brokerage        Expected Band
Validation  ───▶ Adequacy   ───▶ Compatibility  ───▶ Selection  ───▶ Integration ───▶ Initialization
                 Check           Check                                               
```

**Stage 1: Strategy Validation**
- Backtest has been run and completed
- Verdict is at least `mixed` (not `not_recommended`)
- WFO has been performed with ≥ 3 OOS windows

**Stage 2: Capital Adequacy Check**
- Requested allocation ≤ available cash
- Allocation ≤ 40% of total capital (single-bot concentration limit)
- Total fleet allocation after deployment ≤ 100% of capital

**Stage 3: Risk Profile Compatibility**
- Strategy's max tested drawdown ≤ user's maxDrawdownTolerance
- Strategy's worst single-day loss ≤ user's dailyLossLimit × 0.8

**Stage 4: Paper/Live Selection**
- New strategies start in paper mode by default
- Promotion to live requires: ≥ 30 days paper trading AND paper results within 80% of backtest expectations

**Stage 5: Brokerage Integration**
- Verify API connectivity
- Verify account permissions (trading, market data)
- Verify symbol availability

**Stage 6: Expected Band Initialization**
- Compute initial expected behavior band from backtest stats (§9)
- Set initial center line, upper/lower bounds
- Begin tracking actual vs. expected

---

## 29. Insights Analytics Engine

### 29.1 Purpose & User Question

**"Am I getting better as a trader over time?"**

### 29.2 Monthly Return Aggregation

```typescript
interface MonthlyReturn {
  month: string;       // "2024-01"
  returnPercent: number;
  returnDollar: number;
  tradeCount: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
}
```

### 29.3 Behavioral Scoring

| Metric | What It Measures | Score Range |
|--------|-----------------|-------------|
| Plan Adherence | Did bots follow rules? (no manual overrides) | 0–100 |
| Revenge Trading | Did user increase size after losses? | 0–100 (higher = better, no revenge) |
| Overtrading | Trade frequency vs. optimal frequency | 0–100 |
| Patience | Were positions held to target duration? | 0–100 |

### 29.4 Skill vs. Luck (t-Statistic)

```
t = (meanReturn - 0) / (stdReturn / √n)

where n = number of trades

if t > 2.0: "Your returns are statistically significant — 
             likely skill, not luck."
if 1.5 < t ≤ 2.0: "Suggestive of skill, but not conclusive. 
                    More trades needed for certainty."
if t ≤ 1.5: "Results could be due to luck. Keep trading and 
             re-evaluate after more data."
```

**Codebase reference:** `components/insights/AnalyticsTab.tsx`, `components/insights/AttributionTab.tsx`, `components/insights/JournalTab.tsx`

---

## 30. Discovery & Scanner Pipeline

### 30.1 Pipeline

```
Market Data ──▶ Signal Detection ──▶ Confidence Scoring ──▶ Alert Generation
                                                               │
                                                    ┌──────────▼──────────┐
                                                    │ LLM Trade Idea      │
                                                    │ Enrichment          │
                                                    └──────────┬──────────┘
                                                               │
                                                    ┌──────────▼──────────┐
                                                    │ Strategy Template   │
                                                    │ Creation            │
                                                    └─────────────────────┘
```

**Signal Confidence Scoring:**
```
confidence = (
    0.40 × signalStrength +          // How strong is the technical setup?
    0.30 × historicalWinRate +        // How often did this signal work in the past?
    0.20 × regimeAlignment +          // Does current regime favor this signal type?
    0.10 × marketBreadth              // Does broader market confirm?
) × 100
```

**Codebase reference:** `components/workbench/discover/DiscoverTab.tsx`

---

# PART VII: INTEGRATION

---

## 31. API Contract v2.0

### 31.1 Endpoint Summary

| Method | Endpoint | Purpose | Response Type |
|--------|----------|---------|---------------|
| `GET` | `/api/portfolio/snapshot` | Current portfolio state | `PortfolioSnapshot` |
| `GET` | `/api/portfolio/cues` | Active action cues | `ActionCue[]` |
| `GET` | `/api/deployments` | All deployments with status | `Deployment[]` |
| `GET` | `/api/deployments/:id/positions` | Positions for a deployment | `Position[]` |
| `GET` | `/api/regime/current` | Current regime + transition probs | `RegimeContext` |
| `POST` | `/api/backtest/run` | Run full backtest | `BacktestResult` |
| `POST` | `/api/backtest/monte-carlo/conditional` | Conditional MC simulation | `MonteCarloResult` |
| `GET` | `/api/fleet/health` | Fleet health + all factor inputs | See §12 |
| `GET` | `/api/fleet/sensitivity` | Leave-one-out analysis | `PortfolioIntelligence` |
| `GET` | `/api/fleet/correlations` | Correlation analysis | `CorrelationAnalysis` |
| `GET` | `/api/risk/intelligence` | Full risk intelligence package | `RiskIntelligenceData` |
| `POST` | `/api/risk/stress-test/conditional` | Conditional stress test | `StressScenario[]` |
| `GET` | `/api/journal/trades` | Trade history | `JournalEntry[]` |
| `GET` | `/api/circuit-breaker/status` | Current CB state | `CircuitBreakerStatus` |
| `POST` | `/api/deployments/:id/pause` | Pause a deployment | `{ success: boolean }` |
| `POST` | `/api/deployments/:id/resume` | Resume a deployment | `{ success: boolean }` |
| `POST` | `/api/narrative/generate` | Generate LLM narrative | `NarrativeResponse` |
| `WS` | `/ws/live` | Real-time updates | `WSEvent` stream |

### 31.2 Backtest Run — Full Contract

```typescript
// REQUEST
POST /api/backtest/run
{
  strategyConfig: {
    name: string;
    asset: string;
    type: string;
    entryRules: StrategyRule[];
    exitRules: StrategyRule[];
    riskEngine: {
      stopLoss: number;
      takeProfit: number;
      mode: 'FIXED' | 'TRAILING_ATR' | 'TRAILING_PERCENT';
    };
  };
  dateRange: {
    start: string;    // ISO date
    end: string;
  };
  initialCapital: number;
  options: {
    runWFO: boolean;           // Include Walk Forward Analysis
    wfoWindows: number;        // Number of OOS windows (default: 5)
    wfoISRatio: number;        // IS ratio (default: 0.6)
    runMonteCarlo: boolean;    // Include Monte Carlo simulation
    mcSimulations: number;     // Number of simulations (default: 10000)
    mcMethod: 'shuffle' | 'block_bootstrap';
  };
}

// RESPONSE
{
  // Core metrics (§4)
  strategyId: string;
  initialCapital: number;
  totalReturn: number;
  totalReturnDollar: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownDollar: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingPeriod: string;

  // Regime-conditional metrics (§4)
  sharpeByRegime: Record<RegimeType, number>;
  sortinoByRegime: Record<RegimeType, number>;
  returnByRegime: Record<RegimeType, number>;

  // Risk metrics (§5)
  var95: number;
  var99: number;
  cvar95: number;
  maxConsecutiveLosses: number;
  drawdownDurationDays: number;
  drawdownRecoveryDays: number | null;
  underwaterSeries: { date: string; drawdownPercent: number }[];

  // Equity curve with regime tags
  equityCurve: { time: string; value: number; regime: RegimeType }[];

  // Trade log
  tradeLog: JournalEntry[];

  // WFO results (§6) — if requested
  walkForward?: WalkForwardAnalysis;

  // Monte Carlo results (§7) — if requested
  monteCarlo?: MonteCarloResult;
}
```

### 31.3 Sanity Checks for Backend Validation

An agentic coder should implement these validation checks when consuming backend responses:

```typescript
function validateBacktestResult(result: BacktestResult): ValidationError[] {
  const errors: ValidationError[] = [];

  // Sharpe sanity
  if (Math.abs(result.sharpe) > 4.0) {
    errors.push({ field: 'sharpe', message: 'Sharpe > 4.0 is suspicious — check for lookahead bias' });
  }

  // Win rate consistency
  const expectedWinRate = (result.winningTrades / result.totalTrades) * 100;
  if (Math.abs(expectedWinRate - result.winRate) > 1.0) {
    errors.push({ field: 'winRate', message: `Win rate ${result.winRate}% doesn't match trade counts (expected ${expectedWinRate.toFixed(1)}%)` });
  }

  // Trade count consistency
  if (result.winningTrades + result.losingTrades !== result.totalTrades) {
    errors.push({ field: 'totalTrades', message: 'winningTrades + losingTrades != totalTrades' });
  }

  // Sharpe sign consistency
  if (Math.sign(result.sharpe) !== Math.sign(result.totalReturn) && Math.abs(result.totalReturn) > 1.0) {
    errors.push({ field: 'sharpe', message: 'Sharpe sign does not match totalReturn sign' });
  }

  // Dollar consistency
  const expectedDollar = result.initialCapital * result.totalReturn / 100;
  if (Math.abs(expectedDollar - result.totalReturnDollar) / result.initialCapital > 0.02) {
    errors.push({ field: 'totalReturnDollar', message: 'Dollar return does not match percentage return × capital' });
  }

  // Equity curve start value
  if (result.equityCurve.length > 0 && Math.abs(result.equityCurve[0].value - result.initialCapital) > 1.0) {
    errors.push({ field: 'equityCurve', message: 'Equity curve must start at initialCapital' });
  }

  // Profit factor positivity
  if (result.profitFactor < 0) {
    errors.push({ field: 'profitFactor', message: 'Profit factor cannot be negative' });
  }

  // Max drawdown sign
  if (result.maxDrawdown > 0) {
    errors.push({ field: 'maxDrawdown', message: 'maxDrawdown should be negative or zero' });
  }

  // WFO validation (if present)
  if (result.walkForward) {
    const wfo = result.walkForward;
    // Windows should be date-contiguous
    for (let i = 1; i < wfo.windows.length; i++) {
      const prevEnd = new Date(wfo.windows[i - 1].endDate);
      const currStart = new Date(wfo.windows[i].startDate);
      const gapDays = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24);
      if (gapDays > 5) { // Allow weekends/holidays
        errors.push({ field: `walkForward.windows[${i}]`, message: `Gap of ${gapDays} days between WFO windows ${i-1} and ${i}` });
      }
    }
    // OOS consistency should be 0-100
    if (wfo.oosConsistency < 0 || wfo.oosConsistency > 100) {
      errors.push({ field: 'walkForward.oosConsistency', message: 'OOS consistency must be 0-100' });
    }
  }

  // Monte Carlo validation (if present)
  if (result.monteCarlo) {
    const mc = result.monteCarlo;
    // Percentile ordering at every distribution point
    for (let i = 0; i < mc.distribution.length; i++) {
      const pt = mc.distribution[i];
      if (!(pt.p5 <= pt.p25 && pt.p25 <= pt.median && pt.median <= pt.p75 && pt.p75 <= pt.p95)) {
        errors.push({ field: `monteCarlo.distribution[${i}]`, message: `Percentile ordering violated: p5 <= p25 <= median <= p75 <= p95` });
        break; // One violation is enough to flag
      }
    }
    // Probability bounds
    if (mc.probOfProfit < 0 || mc.probOfProfit > 100) {
      errors.push({ field: 'monteCarlo.probOfProfit', message: 'Probability of profit must be 0-100' });
    }
    if (mc.riskOfRuin < 0 || mc.riskOfRuin > 100) {
      errors.push({ field: 'monteCarlo.riskOfRuin', message: 'Risk of ruin must be 0-100' });
    }
  }

  return errors;
}
```

### 31.4 Narrative Generation Endpoint

```typescript
// REQUEST
POST /api/narrative/generate
{
  type: NarrativeType;  // See §21 for the 7 types
  contextPacket: {
    // See §22 for full context packet structure per narrative type
    userProfile: UserRiskProfile;
    portfolioState: PortfolioSnapshot;
    botSummaries: BotEquityImpact[];
    regimeContext: RegimeContext;
    riskSignals: {
      fleetHealthScore: number;
      riskWeather: RiskWeatherCondition;
      circuitBreakerState: string;
      drawdownRatio: number;
    };
    historicalAnchors: {
      similarDrawdowns: { count: number; avgRecoveryDays: number }[];
      regimeDurations: { regime: RegimeType; avgDurationDays: number }[];
    };
    specificData?: Record<string, unknown>;  // Narrative-type-specific data
  };
}

// RESPONSE
interface NarrativeResponse {
  headline: string;        // 10-15 words max
  body: string;            // 2-4 sentences, max 80 words
  confidence: number;      // 0-100, how confident the LLM is in its assessment
  actionItems: {
    label: string;         // CTA button text
    action: string;        // Action identifier (e.g., 'pause_bot', 'set_alert')
    targetId?: string;     // Deployment or entity ID
    urgency: 'low' | 'medium' | 'high';
  }[];
  tone: 'reassuring' | 'measured' | 'direct' | 'urgent';
  groundingReferences: {   // Every claim must trace to a metric
    claim: string;         // The specific claim in the narrative
    metricPath: string;    // JSON path to the supporting metric in contextPacket
    value: string;         // The actual value referenced
  }[];
}
```

### 31.5 WebSocket Event Contracts

```typescript
// Connection
ws://host/ws/live?token={auth_token}

// Server → Client: Portfolio snapshot (every 1s during market hours)
{
  type: 'portfolio.snapshot',
  data: {
    equity: number;
    dayPL: number;
    dayPLPercent: number;
    unrealizedPL: number;
    cash: number;
    buyingPower: number;
    activeDeployments: number;
    timestamp: string;     // ISO 8601
  }
}

// Server → Client: Circuit breaker state change (on transition only)
{
  type: 'circuit_breaker.state_change',
  data: {
    previousState: 'ARMED' | 'WARNING' | 'THROTTLED' | 'TRIPPED' | 'COOLDOWN';
    newState: 'ARMED' | 'WARNING' | 'THROTTLED' | 'TRIPPED' | 'COOLDOWN';
    trigger: string;       // What caused the transition
    dailyLossConsumed: number;
    consecutiveLosses: number;
    maxDrawdownConsumed: number;
    timestamp: string;
  }
}

// Server → Client: Regime shift (on regime change only)
{
  type: 'regime.shift',
  data: {
    previous: RegimeType;
    current: RegimeType;
    confidence: number;
    transitionProbabilities: Record<RegimeType, number>;
    timestamp: string;
  }
}

// Client → Server: Subscribe to specific deployments
{
  type: 'subscribe',
  data: {
    deploymentIds: string[];    // Subscribe to position updates for these deployments
    channels: ('portfolio' | 'positions' | 'circuit_breaker' | 'regime' | 'logs')[];
  }
}
```

### 31.6 Error Response Contract

All API endpoints follow a consistent error format:

```typescript
interface APIError {
  status: number;            // HTTP status code
  code: string;              // Machine-readable error code
  message: string;           // Human-readable message
  details?: Record<string, unknown>;  // Additional context
  retryable: boolean;        // Whether the client should retry
  retryAfterMs?: number;     // Suggested retry delay
}

// Error codes relevant to trading
type ErrorCode =
  | 'BACKTEST_IN_PROGRESS'      // 409: Another backtest is already running
  | 'INSUFFICIENT_CAPITAL'      // 400: Not enough cash for deployment
  | 'CIRCUIT_BREAKER_TRIPPED'   // 403: Cannot deploy/trade while CB is tripped
  | 'REGIME_DATA_STALE'         // 503: Regime engine hasn't updated recently
  | 'BROKERAGE_DISCONNECTED'    // 502: Can't reach brokerage API
  | 'STRATEGY_VALIDATION_FAILED' // 422: Strategy rules are invalid
  | 'RATE_LIMITED'              // 429: Too many requests
  | 'NARRATIVE_GENERATION_FAILED'; // 500: LLM failed to generate narrative
```

---

## 32. Mock Data as Reference Implementation

### 32.1 Purpose

The `mock/mockData.ts` file serves as the **golden test fixture** — a complete, internally consistent dataset that demonstrates every calculation in this specification. It is the single source of truth for:

1. **API contract validation:** Every mock export matches the TypeScript interfaces in `types/index.ts` exactly. If a backend response doesn't match the shape of the mock, it's wrong.
2. **UI development:** Components are built and tested against mock data, ensuring they can render every edge case.
3. **Spec verification:** Every formula in this document can be verified by plugging in mock data values.
4. **Acceptance testing:** The transition from mock data to live API data should be a drop-in replacement with no UI changes required.

### 32.2 Mock Export → Spec Section Mapping

| Mock Export | Spec Section | What It Demonstrates |
|-------------|-------------|---------------------|
| `mockUserProfile` | §1.2 (Relatable Dollar Principle) | `capitalBase: 50000`, `maxDrawdownTolerance: 15`, `dailyLossLimit: 500`. These values are used throughout the spec to compute dollar equivalents. |
| `mockPortfolio` | §2.3 (Redux → API Mapping) | Portfolio snapshot matching `PortfolioSnapshot` interface. `equity: 127450.23`, `dayPL: 1234.56`. |
| `mockFleetHealth` | §12 (Fleet Health Composite) | `status: 'HEALTHY'`, `drawdownPercent: 2.1` (14% of tolerance). Narrative explains current state in plain English. |
| `mockDeployments` | §10 (Sensitivity), §13 (Action Cues) | 3 deployments with varying health: one active-healthy (SPY), one active-minor-dd (QQQ), one paused-losing (TLT). Each has `narrative`, `drawdownVsTolerance`, `isWithinExpected`. |
| `mockPositions` | §27 (Position Lifecycle) | 2 positions in different lifecycle states: `PROTECTING` (SPY, profit > 1.5× risk) and `TRAILING` (QQQ, trailing stop active). |
| `mockActionCues` | §13 (Action Cue Engine) | 2 cues with historical context: one warning (65% of daily loss limit) and one info (regime shift). Both have `occurrenceCount` and `avgRecoveryDays`. |
| `mockJournalEntries` | §29 (Insights Analytics) | 5 trades across 3 bots. Mix of wins and losses. Used to compute win rate, profit factor, skill-vs-luck t-statistic. |
| `mockWalkForward` | §6 (WFO Contract) | 5 OOS windows spanning 6 years, 4 regime types. `meanOosSharpe: 1.33`, `oosConsistency: 80`. Windows are equity-chained (each starts where previous ended). |
| `mockMonteCarlo` | §7 (MC Contract) | 52-week distribution with percentiles. `probOfProfit: 87.2`, `riskOfRuin: 0.08`. Percentile ordering invariant holds at every point. |
| `mockVerdict` | §8 (Verdict Engine) | `assessment: 'promising'`, with dollar-denominated return ranges and regime warning. |
| `mockBacktestResult` | §4–9 (All Bot Analytics) | Complete backtest result composing all sub-results. `sharpe: 1.42`, `totalReturn: 186.7%`, `initialCapital: 50000`. |
| `mockStrategy` | §28 (Deployment Pipeline), §30 (Discovery) | Strategy with entry/exit rules and risk engine configuration. Demonstrates the rule-based strategy structure. |
| `mockRegimeIndicator` | §3 (Regime Contract) | `current: 'LOW_VOL'`, `confidence: 94.2`. Used as root context for all downstream computations. |
| `mockCircuitBreaker` | §26 (Circuit Breaker SM) | `dailyLossConsumed: 125` of `500` limit (25%). `consecutiveLosses: 2` of `5` limit. `isTripped: false` (ARMED state). |
| `generateExpectedBehaviorData()` | §9 (Expected Behavior Band) | 47 days of expected vs. actual equity. Band computed from `meanDailyReturn = 0.18 / 252` and `dailyStdDev = 0.08 / √252`. |
| `mockPortfolioIntelligence` | §10 (Sensitivity), §11 (Correlation) | Leave-one-out analysis for 3 bots. SPY removal drops return from +4.36% to +1.27%. TLT removal improves return to +5.47% but increases vol ~15%. Correlation matrix shows SPY↔QQQ at 0.72 (high risk). |
| `mockRiskIntelligence` | §15–19 (Risk Intelligence System) | Complete risk package: weather (`clear`, grade `A-`), budget (3 items), stress scenarios (3 scenarios), diversification (4 dimensions, overall `B`), recommendations (4 prioritized actions). |

### 32.3 Verification Examples

An agentic coder can verify spec formulas against mock data:

**Example 1: Sharpe Interpretation (§4.5)**
```
mockBacktestResult.sharpe = 1.42
→ Falls in range 1.0–1.5 → Assessment: "Good"
→ Color: Green
→ Explanation: "Good risk-adjusted returns. Solidly above average."
✅ Matches mockVerdict.assessment = 'promising' (verdict factors in more than just Sharpe)
```

**Example 2: Risk Budget Burn Rate (§16.3)**
```
mockCircuitBreaker.dailyLossConsumed = 125
mockCircuitBreaker.dailyLossLimit = 500
→ Utilization: 125 / 500 = 25%
→ If market has been open 2 hours (120 min of 390 min session):
   burnRate = 125 / 120 = $1.04/min
   remainingBudget = 500 - 125 = $375
   timeToExhaustion = 375 / 1.04 ≈ 360 minutes ≈ 6 hours
→ Narrative: "At current pace, your daily loss budget won't be exhausted today."
✅ Matches mockRiskIntelligence.budget.items[0].explanation
```

**Example 3: Sensitivity Analysis (§10)**
```
mockPortfolioIntelligence.botImpacts[2] (TLT Range Trading):
  equityImpactDollar = -543.21
  portfolioReturnWithout = 5.47
  totalPortfolioReturn = 4.36 (computed from totalEquityPL / totalCapital)
→ Removing TLT: return improves from 4.36% → 5.47% (it's a drag)
→ BUT: TLT correlation with SPY = -0.31, with QQQ = -0.18 (decorrelating)
→ Removing it would increase portfolio volatility ~15%
→ Decision: Keep for decorrelation unless losses exceed $1,000
✅ Matches mockPortfolioIntelligence.botImpacts[2].sensitivityNarrative
```

**Example 4: Monte Carlo Percentile Invariant (§7.4)**
```
For every point i in mockMonteCarlo.distribution:
  distribution[i].p5 ≤ distribution[i].p25 ≤ distribution[i].median ≤ distribution[i].p75 ≤ distribution[i].p95
✅ Verified by the generateMCDistribution() function which uses:
   p5 = capital + drift - 2.0 × vol
   p25 = capital + drift - 0.8 × vol
   median = capital + drift
   p75 = capital + drift + 0.8 × vol
   p95 = capital + drift + 2.0 × vol
   Since vol ≥ 0, the ordering always holds.
```

**Example 5: WFO Equity Chaining (§6)**
```
Window 1 starts at initialCapital = 50000
Window 1 return = +22.1% → ends at ~61,050
Window 2 starts at ~61,050 (chained)
Window 2 return = +8.4% → ends at ~66,178
...
Window 5 return = +18.9%
✅ Verified by the chain logic: chainedEquity = equityCurve[last].equity
```

### 32.4 Mock Data Completeness Checklist

Before the mock data can be considered "complete" for spec coverage, every one of these must have a corresponding mock export:

| Data Entity | Has Mock? | Mock Export | Notes |
|-------------|-----------|-------------|-------|
| User risk profile | ✅ | `mockUserProfile` | |
| Portfolio snapshot | ✅ | `mockPortfolio` | |
| Fleet health status | ✅ | `mockFleetHealth` | |
| Deployments (3+) | ✅ | `mockDeployments` | 3 deployments in varied states |
| Positions (2+) | ✅ | `mockPositions` | 2 positions in different lifecycle states |
| Action cues (2+) | ✅ | `mockActionCues` | Warning + info severity |
| Journal entries (5+) | ✅ | `mockJournalEntries` | Mix of wins/losses across bots |
| Walk forward analysis | ✅ | `mockWalkForward` | 5 OOS windows, 4 regimes |
| Monte Carlo result | ✅ | `mockMonteCarlo` | 52-week distribution |
| Backtest verdict | ✅ | `mockVerdict` | |
| Full backtest result | ✅ | `mockBacktestResult` | Composes all sub-results |
| Strategy definition | ✅ | `mockStrategy` | Entry/exit rules |
| Regime indicator | ✅ | `mockRegimeIndicator` | |
| Circuit breaker | ✅ | `mockCircuitBreaker` | ARMED state |
| Expected behavior band | ✅ | `generateExpectedBehaviorData()` | 47 days |
| Portfolio intelligence | ✅ | `mockPortfolioIntelligence` | Sensitivity + correlations |
| Risk intelligence | ✅ | `mockRiskIntelligence` | Full risk package |
| Regime context (extended) | ❌ | — | Needs `transitionProbabilities`, `regimeHistory` |
| Correlation analysis (rolling) | ❌ | — | Needs `rollingCorrelation[]`, `tailCorrelation[]` |
| Conditional MC (regime-specific) | ❌ | — | Needs MC results filtered by regime |
| Fleet health factor inputs | ❌ | — | Needs per-factor scores feeding into composite |
| Deployment detail (deep) | ❌ | — | Needs per-deployment backtest results, position history |
| Circuit breaker state history | ❌ | — | Needs state transition log for Operations view |

---

## 33. Implementation Roadmap

### 33.1 Phasing Principles

1. **Dependency-aware:** Each phase builds on the outputs of the previous phase. No phase can start until its dependencies are complete.
2. **Backend-first within each phase:** API endpoints must be implemented and validated before UI components consume them.
3. **Mock-to-live transition:** Each UI component starts with mock data and transitions to live API data without structural changes. The Redux slice + API hook pattern makes this a configuration change, not a rewrite.
4. **Validation gates:** Each phase has explicit acceptance criteria that must pass before the next phase begins.

### 33.2 Phase Dependency Graph

```
Phase 1: Core Data Layer
    │
    ├──▶ Phase 2: Bot Analytics (depends on: regime, equity curves, trade logs)
    │       │
    │       ├──▶ Phase 3: Fleet Intelligence (depends on: per-bot metrics, correlations)
    │       │       │
    │       │       └──▶ Phase 4: Risk Intelligence (depends on: fleet health, sensitivity)
    │       │               │
    │       │               └──▶ Phase 5: LLM Narratives (depends on: all computed metrics)
    │       │
    │       └──▶ Phase 6: Platform Mechanics (depends on: backtest results, positions)
    │
    └──▶ Phase 7: Real-Time Integration (depends on: all REST endpoints)
```

### 33.3 Phase Details

**Phase 1: Core Data Layer**

| Work Item | Type | Spec Section | Acceptance Criteria |
|-----------|------|-------------|---------------------|
| Regime classification endpoint | Backend | §3 | Returns `RegimeContext` with all fields. Confidence 0–100. Transition probs sum to 1.0. |
| Portfolio snapshot endpoint | Backend | §2 | Returns `PortfolioSnapshot`. Matches mock shape exactly. |
| Deployments CRUD endpoints | Backend | §2, §28 | List, create, pause, resume, stop. Status transitions are valid. |
| Positions endpoint | Backend | §27 | Returns `Position[]` with lifecycle states. |
| Redux store foundation | UI | §2.3 | `portfolio`, `deployments`, `ui` slices connected to API. |
| Auth + WebSocket skeleton | Both | §31.5 | WS connection established, heartbeat working. |

**Phase 2: Bot Analytics**

| Work Item | Type | Spec Section | Acceptance Criteria |
|-----------|------|-------------|---------------------|
| Backtest run endpoint | Backend | §4, §31.2 | Full `BacktestResult` response. All validation invariants pass (§31.3). |
| WFO harness integration | Backend | §6 | 5+ OOS windows, date-contiguous, equity-chained. Regime tags per window. |
| Monte Carlo harness integration | Backend | §7 | 10,000+ simulations. Percentile ordering holds. `probOfProfit` and `riskOfRuin` computed. |
| Conditional MC endpoint | Backend | §7.7 | Accepts regime filter, returns filtered distribution. |
| Backtest results UI (tabs) | UI | §4–7 | `BacktestResultsTabs.tsx` renders equity chart, WFO tab, MC tab. |
| Verdict engine (UI computation) | UI | §8 | Weighted scoring model. Regime-adaptive verdict. User-profile-aware thresholds. |
| Expected behavior band (UI computation) | UI | §9 | Bollinger-style envelope. Breach detection logic. |
| Backend response validator | UI | §31.3 | `validateBacktestResult()` runs on every API response. Errors logged + surfaced. |

**Phase 3: Fleet Intelligence**

| Work Item | Type | Spec Section | Acceptance Criteria |
|-----------|------|-------------|---------------------|
| Leave-one-out sensitivity endpoint | Backend | §10 | `PortfolioIntelligence` with per-bot `equityImpactDollar`, `portfolioReturnWithout`. |
| Correlation matrix endpoint | Backend | §11 | Static + rolling + tail correlations. Regime-conditional correlations. |
| Fleet health composite (UI computation) | UI | §12 | 5-factor weighted score. Classification: HEALTHY / CAUTION / AT_RISK. Momentum tracking. |
| Action cue engine (UI computation) | UI | §13 | Rule-based cue generation. Severity classification. Priority scoring. Historical enrichment. |
| Command Center page integration | UI | §14 | FleetHealthHero → ActionCuesPanel → FleetStatusGrid → PortfolioImpact. All panels cross-reference. |
| Sensitivity bar chart + "what if" cards | UI | §10 | Interactive "What if I pause this bot?" with dollar impact. |

**Phase 4: Risk Intelligence**

| Work Item | Type | Spec Section | Acceptance Criteria |
|-----------|------|-------------|---------------------|
| Stress scenario replay endpoint | Backend | §17 | N closest historical analogs. Per-scenario `estimatedLoss`, `recoveryDays`, `safetyNet`. |
| Risk weather computation (UI) | UI | §15 | 5-factor model with hysteresis. Weather doesn't oscillate. Momentum direction tracked. |
| Risk budget computation (UI) | UI | §16 | Burn rate extrapolation. Time-to-exhaustion estimate. Cascading daily→weekly→monthly. |
| Diversification scoring (UI) | UI | §18 | 4-dimension grading. Marginal benefit calculation. Target portfolio suggestions. |
| Recommendation DAG (UI) | UI | §19 | Priority-ranked recommendations. CTA mapping to UI actions. User profile filtering. |
| Risk Intelligence dashboard | UI | §15–19 | Multi-block layout: weather → budget → stress → diversification → recommendations. |
| Cross-metric dependency wiring | UI | §20 | Regime change triggers cascade recomputation. Invalidation propagates correctly. |

**Phase 5: LLM Narrative Intelligence**

| Work Item | Type | Spec Section | Acceptance Criteria |
|-----------|------|-------------|---------------------|
| Narrative generation endpoint | Backend | §24, §31.4 | Accepts `NarrativeRequest`, returns `NarrativeResponse` with grounding references. |
| Context packet assembler (UI) | UI | §22 | Builds complete JSON context packets for each of 7 narrative types. |
| Anticipatory narration pipeline | UI + LLM | §23 | Regime transition probabilities → conditional scenarios → LLM explanation of upcoming risks. |
| Prompt templates (7 types) | LLM Config | §24 | System prompts, few-shot examples, output schemas. All pass grounding verification. |
| Tone adaptation logic | UI | §25 | 3×3 matrix (risk × profile) selects correct tone. Language style matches matrix cell. |
| 10 reasoning chain implementations | UI + LLM | §25.2 | All 10 chains produce correct narratives from mock data. CTAs map to correct UI actions. |
| Fallback templates | UI | §24 | When LLM is unavailable, template-based narratives with interpolated metrics. |
| Grounding verification | UI | §24 | Every claim in generated narrative traces to a metric in the context packet. |

**Phase 6: Platform Mechanics**

| Work Item | Type | Spec Section | Acceptance Criteria |
|-----------|------|-------------|---------------------|
| Circuit breaker state machine | Backend + UI | §26 | 6-state machine with correct transitions. Daily loss, consecutive loss, max DD triggers. |
| Position lifecycle state machine | Backend + UI | §27 | 5-state machine. Transitions triggered by P&L thresholds and trailing stop logic. |
| Deployment pipeline | UI | §28 | 6-stage pipeline with validation gates. Paper → live promotion rules. |
| Insights analytics engine | UI | §29 | Monthly aggregation, behavioral scoring, skill-vs-luck t-statistic. |
| Discovery scanner | Backend + UI | §30 | Signal detection → confidence scoring → alert generation → strategy template creation. |

**Phase 7: Real-Time Integration**

| Work Item | Type | Spec Section | Acceptance Criteria |
|-----------|------|-------------|---------------------|
| WebSocket live data integration | Both | §2.4, §31.5 | Portfolio snapshot updates every 1s. Position updates on change. CB state changes propagate immediately. |
| Regime shift detection + cascade | Both | §3, §20 | Regime shift event triggers recomputation of: fleet health, risk weather, action cues, narratives. |
| Data staleness monitoring | UI | §2.2 | Stale data indicators. Auto-poll on staleness threshold breach. |
| Polling ↔ push hybrid | UI | §2.2 | REST polling for non-critical data. WS push for time-sensitive data. Graceful fallback. |

### 33.4 Validation Gates Between Phases

| Gate | Between | Must Pass |
|------|---------|-----------|
| G1 | Phase 1 → 2 | All CRUD endpoints return valid data. Redux store hydrates correctly. WS heartbeat works. |
| G2 | Phase 2 → 3 | Backtest result passes all `validateBacktestResult()` checks. WFO and MC render correctly in UI. |
| G3 | Phase 3 → 4 | Fleet health score computes correctly from 5 factors. Sensitivity analysis returns correct dollar impacts. |
| G4 | Phase 4 → 5 | Risk weather is stable (no oscillation). All 4 diversification dimensions score correctly. |
| G5 | Phase 5 → 6 | LLM generates narratives for all 7 types. All claims are grounded. Tone adaptation produces correct language per matrix cell. |
| G6 | Phase 6 → 7 | Circuit breaker transitions work correctly. Position lifecycle states are accurate. |

### 33.5 Backend vs. UI Work Distribution

```
BACKEND TEAM (extend existing VectorBT + custom harnesses):
├── Regime classification engine + transition probability computation
├── Backtest run endpoint (VectorBT orchestration)
├── WFO harness: produce OOS windows with regime tags, chained equity
├── Monte Carlo harness: produce distribution, conditional MC by regime
├── Leave-one-out sensitivity computation
├── Correlation matrix (static + rolling + tail)
├── Stress scenario replay engine
├── Circuit breaker state machine (server-side enforcement)
├── Position lifecycle management
├── Signal scanner + confidence scoring
├── LLM integration (prompt execution, response validation)
└── WebSocket event broadcasting

UI / MIDDLEWARE TEAM (new computations per this spec):
├── Backtest verdict engine (§8)
├── Expected behavior band (§9)
├── Fleet health composite score (§12)
├── Action cue generation engine (§13)
├── Risk weather multi-factor model (§15)
├── Risk budget burn rate extrapolation (§16)
├── Diversification scoring algorithm (§18)
├── Recommendation priority DAG (§19)
├── Cross-metric dependency cascade (§20)
├── LLM context packet assembly (§22)
├── Tone adaptation matrix (§25)
├── Anticipatory narration pipeline (§23)
├── Backend response validation (§31.3)
└── All UI component implementation
```

---

# APPENDIX

---

## A. Codebase Cross-Reference Index

This appendix maps every UI component in `algobrute-nextjs` to the spec sections it implements.

### A.1 Command Center Components

| Component File | Spec Sections | Key Data Sources |
|----------------|--------------|-----------------|
| `components/command-center/FleetHealthHero.tsx` | §12, §14 | Fleet health status, portfolio equity, drawdown ratio |
| `components/command-center/ActionCuesPanel.tsx` | §13, §14 | Action cues with severity, historical context |
| `components/command-center/FleetStatusGrid.tsx` | §10, §14 | Deployment list with P&L, drawdown, regime status |
| `components/command-center/PortfolioImpact.tsx` | §10, §11, §14 | Sensitivity analysis, correlation pairs, concentration |

### A.2 Workbench Components

| Component File | Spec Sections | Key Data Sources |
|----------------|--------------|-----------------|
| `components/workbench/build/BacktestVerdict.tsx` | §8 | Verdict score, regime warning, dollar ranges |
| `components/workbench/build/WalkForwardTab.tsx` | §6 | WFO windows, regime-segmented equity, performance table |
| `components/workbench/build/MonteCarloTab.tsx` | §7 | MC distribution fan chart, contextual comparisons |
| `components/workbench/build/BacktestResultsTabs.tsx` | §4–9 | Tab container for all backtest analysis views |

### A.3 Operations Components

| Component File | Spec Sections | Key Data Sources |
|----------------|--------------|-----------------|
| `components/operations/RiskDashboard.tsx` | §15–19 | Risk weather, budget, stress scenarios, diversification |

### A.4 Type Definitions

| Interface | File Location | Spec Sections |
|-----------|--------------|--------------|
| `PortfolioSnapshot` | `types/index.ts:6` | §2.3 |
| `UserRiskProfile` | `types/index.ts:19` | §1.2, §8, §15, §25 |
| `FleetHealthStatus` | `types/index.ts:29` | §12 |
| `Deployment` | `types/index.ts:34` | §10, §13, §14, §28 |
| `Position` | `types/index.ts:57` | §27 |
| `RegimeType`, `RegimeIndicator` | `types/index.ts:72` | §3 |
| `ActionCue` | `types/index.ts:84` | §13 |
| `JournalEntry` | `types/index.ts:98` | §29 |
| `WalkForwardWindow`, `WalkForwardAnalysis` | `types/index.ts:128` | §6 |
| `MonteCarloDistributionPoint`, `MonteCarloResult` | `types/index.ts:170` | §7 |
| `BacktestVerdictData` | `types/index.ts:196` | §8 |
| `BacktestResult` | `types/index.ts:208` | §4–9 |
| `CircuitBreakerStatus` | `types/index.ts:263` | §26 |
| `ExpectedBehaviorPoint` | `types/index.ts:274` | §9 |
| `RiskWeatherData`, `RiskBudgetData` | `types/index.ts:287` | §15, §16 |
| `StressScenario` | `types/index.ts:309` | §17 |
| `DiversificationData` | `types/index.ts:328` | §18 |
| `RiskRecommendation` | `types/index.ts:336` | §19 |
| `RiskIntelligenceData` | `types/index.ts:346` | §15–19 |
| `PortfolioIntelligence`, `BotEquityImpact` | `types/index.ts:355` | §10 |
| `BotCorrelationPair` | `types/index.ts:367` | §11 |

### A.5 Redux Store

| Slice | File | Spec Sections |
|-------|------|--------------|
| `portfolio` | `store/slices/portfolioSlice.ts` | §2.3, §14 |
| `deployments` | `store/slices/deploymentsSlice.ts` | §2.3, §10 |
| `ui` | `store/slices/uiSlice.ts` | §2.3 |

### A.6 Utilities

| Function | File | Spec Sections |
|----------|------|--------------|
| `formatCurrency`, `formatPercent` | `utils/formatters.ts` | §1.2 (Relatable Dollar Principle) |
| `getRegimeColor`, `getRegimeHex` | `utils/formatters.ts` | §3.5 (Regime Semantics) |
| `getStatusColor`, `getStatusLabel` | `utils/formatters.ts` | §28 (Deployment Pipeline) |

---

## B. Glossary for Retail Traders

Terms used throughout this spec, explained at the "advanced beginner" level:

| Term | Plain English | Used In |
|------|--------------|---------|
| **Sharpe Ratio** | How much return you earn per unit of risk. Higher is better. Above 1.0 is good. | §4, §8 |
| **Sortino Ratio** | Like Sharpe, but only penalizes downside risk. More relevant if you care about losses specifically. | §4, §8 |
| **Calmar Ratio** | Annual return divided by worst drawdown. Higher means better recovery from losses. | §4 |
| **Max Drawdown** | The worst peak-to-trough decline in your portfolio. "How much did I lose at the worst point?" | §5, §12, §15 |
| **Walk Forward Analysis** | Testing a strategy on data it has NEVER seen, in chronological order. The gold standard for avoiding overfitting. | §6, §8 |
| **Monte Carlo Simulation** | Running 10,000 random variations of your trades to see the range of possible outcomes. | §7, §8 |
| **Regime** | The current "personality" of the market: calm, normal, volatile, or crisis. Strategies behave differently in each. | §3 |
| **Circuit Breaker** | An automatic safety system that pauses trading when losses exceed your comfort limits. | §26 |
| **Correlation** | How much two bots move together. High correlation = concentrated risk. Low/negative = diversified. | §11 |
| **Sensitivity Analysis** | "What happens to my portfolio if I remove this bot?" Shows each bot's true contribution. | §10 |
| **VaR (Value at Risk)** | The maximum you'd expect to lose on 95% of days. The 5% worst days could be worse. | §5 |
| **Expected Behavior Band** | A corridor showing where your equity "should" be based on backtesting. If actual equity goes outside, something unusual is happening. | §9 |

---

*End of Technical Specification v2.0*