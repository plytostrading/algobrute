# AlgoBrute: Product Proposal & Go-to-Market Strategy

## 1. Executive Summary
**AlgoBrute** (formerly InsightTrader) is an institutional-grade algorithmic trading infrastructure designed for the sophisticated retail trader. Unlike competitors that gamify gambling or offer black-box "copy trading," AlgoBrute provides a transparent, code-first environment for rigorous backtesting, risk management, and automated execution.

**Mission**: To democratize the scientific method in financial markets, replacing emotional speculation with engineered precision.

---

## 2. Market Analysis

### 2.1 The Problem
The retail trading market is bifurcated:
1.  **Gambling Apps**: Robinhood, eToro. Focus on UI/UX, gamification, and encouraging over-trading. High churn, low sophistication.
2.  **Institutional Platforms**: Bloomberg, specialized quant software. Prohibitively expensive ($24k+/yr), complex UX, inaccessible to individuals.

There is a "missing middle": The **Sophisticated Retail Trader**. This user understands markets, knows technical analysis, perhaps codes a little (Python/JS), but lacks the infrastructure to rigorously test their ideas before risking capital. They are currently cobbling together TradingView scripts, Excel sheets, and Python notebooks.

### 2.2 Target Audience (The "Stickiest" Customer)
*   **Persona**: "The Engineer-Trader"
*   **Demographics**: Male, 25-45, STEM background (Software Engineers, Data Scientists, Engineers).
*   **Psychographics**: Values precision, hates ambiguity, skeptical of "get rich quick" schemes, willing to pay for tools that give a perceived "edge."
*   **Pain Points**:
    *   Fear of drawdown/ruin.
    *   Frustration with emotional execution errors.
    *   Inability to validate strategies historically (backtesting).

### 2.3 Competitive Landscape
| Competitor | Positioning | Weakness | AlgoBrute Advantage |
| :--- | :--- | :--- | :--- |
| **TradingView** | Charting & Social | PineScript is limited; backtesting is often inaccurate (repainting). | Real Python/SDO execution; rigorous walk-forward analysis. |
| **QuantConnect** | Hardcore Quant | Extremely high learning curve (C#/Python); intimidating for semi-pros. | LLM-assisted strategy generation lowers the barrier to entry. |
| **Composer.trade** | No-code Algo | "Black box" feel; limited customization; simplistic logic. | "Glass box" transparency; full control over signal hierarchy. |

---

## 3. TAM / SAM / SOM Analysis

### Total Addressable Market (TAM)
**Global Retail Trading Market**: Estimated at **$10.2 Billion** (2023).
*   Includes all retail brokerage accounts and trading software spend.
*   *Source: Business Research Insights, Retail Trading Platform Market Report.*

### Serviceable Available Market (SAM)
**Active "Pro-sumer" Traders**: Estimated **$1.5 Billion**.
*   Traders who pay for premium subscriptions (TradingView Pro, Benzinga, etc.).
*   Approx. 15% of the total retail market are considered "active" or "sophisticated."

### Serviceable Obtainable Market (SOM)
**AlgoBrute's Year 1-3 Target**: **$10 Million ARR**.
*   Targeting **0.6%** of the SAM.
*   **Calculation**:
    *   Goal: $1M ARR (Year 1) -> $10M ARR (Year 3).
    *   At an average revenue per user (ARPU) of $100/mo ($1,200/yr):
    *   **833 subscribers** needed for $1M ARR.
    *   **8,333 subscribers** needed for $10M ARR.
*   *Conclusion*: The $1M ARR goal is highly conservative and achievable with fewer than 1,000 core users.

---

## 4. Pricing Strategy
We utilize a tiered SaaS model that aligns price with the value of **compute** and **data quality**.

### Tier 1: ANALYST ($49/mo)
*   *Target*: The curious validator.
*   **Features**:
    *   End-of-Day (EOD) Data only.
    *   Basic Backtesting Engine (Standard metrics).
    *   5 Active Strategy Slots.
    *   Community Support.

### Tier 2: QUANT ($149/mo) - **Core Growth Driver**
*   *Target*: The active algo trader.
*   **Features**:
    *   **Real-time Data** (Polygon.io integration).
    *   **LLM Strategy Discovery** (The "Killer Feature").
    *   **Regime Detection** (Walk-forward analysis).
    *   Unlimited Strategy Slots.
    *   Automated Execution (Paper Trading).

### Tier 3: INSTITUTIONAL ($499/mo)
*   *Target*: Small family offices / HNW individuals.
*   **Features**:
    *   Live Broker Execution (Alpaca/IBKR).
    *   Dedicated Server Instance (Low latency).
    *   Custom Data Integrations.
    *   Priority Support.

---

## 5. Product Roadmap & Execution

### Phase 1: The "Truth" Engine (Current)
*   Focus on the **Backtester**. It must be trusted implicitly.
*   Launch the "Micro-Experiment" marketing campaign.
*   Deliver the LLM Discovery Pipeline to generate strategies from plain English.

### Phase 2: The "Guardrails" (Q3 2026)
*   Implement the **Risk Management Protocol**.
*   "Kill Switch" features that prevent emotional overrides.
*   Portfolio-level risk analysis (correlation matrices).

### Phase 3: The "Autopilot" (Q4 2026)
*   Full live execution with major brokerages.
*   Marketplace for verified SDO v2 strategies (users can sell their alphas).

---

## 6. Conclusion
AlgoBrute is positioned to capture the high-value segment of the retail trading market by treating them with respect—offering professional-grade tools rather than gamified distractions. By focusing on **transparency**, **rigor**, and **automation**, we solve the primary cause of retail failure: emotional decision-making.
