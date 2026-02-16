# AlgoBrute: Technical Specification for Backend Integration

**Version:** 1.0  
**Date:** February 16, 2026  
**Purpose:** Bridge the gap between the Next.js/shadcn UI prototype and backend implementation with explicit mathematical formulas, domain-aware calculations, and storytelling principles.

---

## Table of Contents

1. [Philosophy & Design Principles](#philosophy--design-principles)
2. [Data Layer Architecture](#data-layer-architecture)
3. [Portfolio Metrics Calculations](#portfolio-metrics-calculations)
4. [Performance Metrics (Sharpe, Sortino, Calmar)](#performance-metrics-sharpe-sortino-calmar)
5. [Risk Metrics & Drawdown Analysis](#risk-metrics--drawdown-analysis)
6. [Walk Forward Optimization (WFO)](#walk-forward-optimization-wfo)
7. [Monte Carlo Simulation Engine](#monte-carlo-simulation-engine)
8. [Backtest Verdict Generation](#backtest-verdict-generation)
9. [Portfolio Intelligence: Sensitivity Analysis](#portfolio-intelligence-sensitivity-analysis)
10. [Portfolio Intelligence: Correlation Risk](#portfolio-intelligence-correlation-risk)
11. [Risk Intelligence: Weather & Budget](#risk-intelligence-weather--budget)
12. [Risk Intelligence: Stress Scenarios](#risk-intelligence-stress-scenarios)
13. [Risk Intelligence: Diversification Grading](#risk-intelligence-diversification-grading)
14. [Risk Recommendations Engine](#risk-recommendations-engine)
15. [LLM-Assisted Narrative Generation](#llm-assisted-narrative-generation)
16. [API Contract & Response Schema](#api-contract--response-schema)
17. [Mock Data Structure (Reference)](#mock-data-structure-reference)
18. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Philosophy & Design Principles

### 1.1 Decision-Support Storytelling

The AlgoBrute UI is fundamentally a **decision-support system** that answers three core questions:

1. **"Is my portfolio healthy right now?"** → Risk Intelligence (weather, budget, scenarios)
2. **"Can I trust this strategy?"** → Backtest Verdict + Walk Forward Analysis
3. **"How does each bot contribute or harm my overall performance?"** → Portfolio Intelligence (sensitivity, correlation)

**Storytelling Imperative:**
- All metrics must be framed in **relatable dollar terms**, not just percentages.
- Historical context (e.g., "This max drawdown is worse than X% of your backtest") anchors numbers to reality.
- Narratives must explain **causality**, not just describe outcomes.

### 1.2 Relatable Dollar Principle

A retail trader with $50,000 capital understands "$2,500 loss" more intuitively than "5% drawdown."

**Implementation Rule:**
- Always display dual metrics: **absolute (dollars) + relative (%)**.
- Dollar amounts should reference the user's `capitalBase` from `UserRiskProfile`.

**Example:**
```
"Your portfolio is down $3,275 (6.5% drawdown) from its peak."
vs.
"Your portfolio is down 6.5%."
```

### 1.3 Historical Anchor

Every metric should be contextualized against historical performance or statistical benchmarks.

**Example:**
```
"Max DD of 18% is within your 25% tolerance, and better than 72% of strategies in this asset class."
```

---

## 2. Data Layer Architecture

### 2.1 Raw Input Data (from backend)

Every backtest request must return a complete **BacktestResult** object containing:

```typescript
{
  strategyId: string;
  initialCapital: number;
  equityCurve: [
    { time: Date; value: number; regime: RegimeType; }
  ];
  tradeLog: [
    { entryTime: Date; exitTime: Date; entryPrice: number; 
      exitPrice: number; quantity: number; symbol: string; side: 'long'|'short'; }
  ];
}
```

### 2.2 Regime Classification

The backend must classify each bar/candle into one of four regimes based on **volatility** and **trend**:

```
RegimeType = 'LOW_VOL' | 'NORMAL' | 'HIGH_VOL' | 'CRISIS'
```

**Algorithm (example):**
```
ATR_20 = 20-bar Average True Range
TREND = RSI(14) or slope of 50-SMA

if ATR_20 < 0.5th percentile:
  regime = LOW_VOL
elif ATR_20 > 95th percentile AND consecutive down days > 3:
  regime = CRISIS
elif ATR_20 > 75th percentile:
  regime = HIGH_VOL
else:
  regime = NORMAL
```

This classification is critical for understanding strategy robustness across market conditions.

---

## 3. Portfolio Metrics Calculations

### 3.1 Daily Equity (Point-in-Time)

**Definition:** The unrealized P&L of the entire portfolio at a specific timestamp.

```
Equity(t) = initialCapital + ∑(position_value(t)) - commissions_paid
```

### 3.2 Daily P&L (Realized + Unrealized)

```
dayPL = Σ(closed_trade_net_PL_today) + Σ(unrealized_change_today)
dayPLPercent = (dayPL / equityAtStartOfDay) × 100
```

### 3.3 Total Return (over backtest period)

```
totalReturn% = ((finalEquity - initialCapital) / initialCapital) × 100
totalReturnDollar = finalEquity - initialCapital
```

**Storytelling Note:** Always show both. "You gained $12,500 (25% on your $50k)."

---

## 4. Performance Metrics (Sharpe, Sortino, Calmar)

### 4.1 Sharpe Ratio

**Definition:** Risk-adjusted return. Measures excess return per unit of volatility.

```
Sharpe = (meanReturn - riskFreeRate) / stdDevReturn

where:
- meanReturn = average daily/monthly return
- riskFreeRate ≈ 0.04 / 252 (4% annual / 252 trading days) ≈ 0.00016 daily
- stdDevReturn = standard deviation of daily returns
```

**Implementation:**
```python
def sharpe_ratio(returns: list, risk_free_rate=0.04/252):
    mean = np.mean(returns)
    std = np.std(returns)
    return (mean - risk_free_rate) / std if std > 0 else 0
```

**Interpretation for Retail Traders:**
- Sharpe > 1.5: "Excellent risk-adjusted returns"
- Sharpe 1.0–1.5: "Good"
- Sharpe 0.5–1.0: "Acceptable"
- Sharpe < 0.5: "Poor"

### 4.2 Sortino Ratio

**Definition:** Like Sharpe, but only penalizes **downside** volatility (losses), not upside volatility.

```
Sortino = (meanReturn - riskFreeRate) / downside_std_dev

where:
downside_std_dev = sqrt(mean(min(return, 0)²))
```

**Why it matters:** A strategy with big wins and small losses will have higher Sortino than Sharpe.

### 4.3 Calmar Ratio

**Definition:** Annual return divided by max drawdown. Measures return per unit of downside risk.

```
Calmar = (annualReturn) / (maxDrawdown_absolute)

Example:
If strategy returns 30% annually and max DD is 15%, Calmar = 30/15 = 2.0
```

---

## 5. Risk Metrics & Drawdown Analysis

### 5.1 Maximum Drawdown (%)

**Definition:** The largest peak-to-trough decline from any high point.

```
equity_curve = [100, 110, 105, 115, 90, 95, 120]
running_max = [100, 110, 110, 115, 115, 115, 120]
drawdown = (equity_curve - running_max) / running_max
maxDD = min(drawdown) = (90 - 115) / 115 = -21.7%
```

### 5.2 Maximum Drawdown ($)

```
maxDrawdownDollar = initialCapital × maxDrawdown%
```

**Narrative framing:**
```
"Your worst losing streak cost $10,750 (21.5% of your $50k capital).
Within your 25% tolerance. ✓"
```

### 5.3 Drawdown Duration

**Definition:** Number of days from peak to recovery.

```
drawdown_recovery_days = days_from_peak_to_new_high
```

### 5.4 Consecutive Losing Trades

```
consecutive_losses = max(run_length) where each trade is a loss
```

---

## 6. Walk Forward Optimization (WFO)

### 6.1 Concept & Purpose

Walk Forward Analysis tests whether a strategy remains profitable when optimized on past data (in-sample, IS) and validated on future unseen data (out-of-sample, OOS).

**Why it matters:** Prevents overfitting. A strategy with great IS performance but poor OOS performance is "curve-fit" to historical noise.

### 6.2 Window Segmentation

A typical WFO with 10 windows over 5 years might look like:

```
Year 1–3 (IS)  → Optimize params → Validate on Year 3–4 (OOS)
Year 2–4 (IS)  → Optimize params → Validate on Year 4–5 (OOS)
Year 3–5 (IS)  → Optimize params → Validate on remaining months (OOS)
```

**Window structure:**
```
{
  windowId: 1,
  windowType: 'in_sample',
  startDate: '2021-01-01',
  endDate: '2022-12-31',
  regimeLabel: 'NORMAL',
  performance: { totalReturn: 28.5, sharpe: 1.45, ... },
  equityCurve: [...],
  assessment: 'strong' | 'survived' | 'weak' | 'failed'
}
```

### 6.3 Assessment Logic

```
if OOS_sharpe > 1.0:
  assessment = 'strong'
elif OOS_return > 0 and OOS_sharpe > 0.5:
  assessment = 'survived'
elif OOS_return > 0 but OOS_sharpe < 0.5:
  assessment = 'weak'
else:
  assessment = 'failed'
```

### 6.4 Aggregate Metrics

```
meanOosSharpe = mean(sharpe for all OOS windows)
oosConsistency = (count of profitable OOS windows) / total_OOS_windows × 100
oosDegradation = (meanIsSharpe - meanOosSharpe) / meanIsSharpe × 100

Narrative: "Sharpe dropped 18% from IS to OOS, suggesting modest overfitting."
```

### 6.5 Benchmark Curve

Compare strategy against:
- **SPY Buy & Hold:** `buyHold = initialCapital × (1 + SPY_return)`
- **Risk-Free Rate:** `riskFree = initialCapital × (1 + 0.04)^(years)`

---

## 7. Monte Carlo Simulation Engine

### 7.1 Purpose

Generate a **distribution of possible outcomes** by randomizing the sequence of historical trades while preserving their statistical properties.

**Why it matters for retail traders:**
- "What if I have bad luck?" → See the 5th percentile outcome.
- "What's my best-case scenario?" → See the 95th percentile.
- "What's the probability my strategy makes money?" → Prob of Profit.

### 7.2 Algorithm

```python
def monte_carlo_simulation(trade_log, initial_capital, num_simulations=10000):
    results = []
    
    for sim_idx in range(num_simulations):
        # Shuffle trade sequence
        shuffled_trades = random.shuffle(trade_log)
        
        # Replay trades in randomized order
        equity = initial_capital
        equity_curve = [equity]
        
        for trade in shuffled_trades:
            pnl = trade['netPL']
            equity += pnl
            equity_curve.append(equity)
        
        # Record outcome
        final_return = (equity - initial_capital) / initial_capital
        max_dd = calculate_max_drawdown(equity_curve)
        
        results.append({
            'final_equity': equity,
            'return': final_return,
            'max_dd': max_dd,
            'equity_curve': equity_curve
        })
    
    return results
```

### 7.3 Distribution Calculation

For each **period** (week, month, year) in the simulation:

```
period_equities = [result['equity_curve'][period_idx] for result in results]

p5 = np.percentile(period_equities, 5)     # Worst case
p25 = np.percentile(period_equities, 25)
median = np.percentile(period_equities, 50)
p75 = np.percentile(period_equities, 75)
p95 = np.percentile(period_equities, 95)   # Best case
```

### 7.4 Key Outputs

```
probOfProfit = (count of simulations with final_equity > initial_capital) / num_simulations × 100
riskOfRuin = (count of simulations with final_equity < 0.5 × initial_capital) / num_simulations × 100
medianReturn = median(final_equities)
```

**Narrative Example:**
```
"In 10,000 simulations, your strategy was profitable 87% of the time.
In the worst 5% of scenarios, you'd lose $3,250.
Risk of losing 50% of capital: <0.1%."
```

---

## 8. Backtest Verdict Generation

### 8.1 Verdict Assessment Logic

The verdict is a **human-readable summary** of whether the backtest is actionable.

```
if (OOS_sharpe > 1.0 AND winRate > 45% AND maxDD < userTolerance):
  assessment = 'promising'
elif (OOS_sharpe > 0.5 AND totalReturn > 5% AND maxDD < userTolerance × 1.2):
  assessment = 'mixed'
else:
  assessment = 'not_recommended'
```

### 8.2 Expected Annual Return Range

Based on Sharpe ratio and historical volatility:

```
annualVolatility = stdDev(daily_returns) × sqrt(252)
expectedReturn_low = annualVolatility × sharpe × 0.8     # Conservative
expectedReturn_mid = annualVolatility × sharpe
expectedReturn_high = annualVolatility × sharpe × 1.2    # Optimistic

# Convert to dollars
expectedDollarRange = [
  initialCapital × expectedReturn_low,
  initialCapital × expectedReturn_high
]
```

### 8.3 Max Loss Scenario

```
# 95th percentile loss from Monte Carlo
maxLossScenarioDollar = percentile5_from_MC
maxLossScenarioPercent = maxLossScenarioDollar / initialCapital × 100

withinTolerance = maxLossScenarioDollar <= userProfile.dailyLossLimit
```

### 8.4 Regime Warning

```
regime_performance = {}
for regime in [LOW_VOL, NORMAL, HIGH_VOL, CRISIS]:
  regime_oos_sharpe = mean(sharpe for OOS windows with this regime)
  regime_performance[regime] = regime_oos_sharpe

worst_regime = min(regime_performance.values())

if worst_regime < 0.3:
  regimeWarning = f"Strategy struggles in {worst_regime_name} markets. 
                    Last tested {crisis_date}. Monitor closely."
```

### 8.5 Narrative Generation

See Section 15 (LLM-Assisted Narratives) for detailed narrative generation.

---

## 9. Portfolio Intelligence: Sensitivity Analysis

### 9.1 Purpose

Understand the **marginal contribution** of each bot to overall portfolio returns and risk.

**Question it answers:** "If I pause Bot #2, how much does that hurt my returns?"

### 9.2 Leave-One-Out Backretest

```python
def sensitivity_analysis(all_bots, historical_trades):
    results = {}
    
    # Baseline: all bots together
    baseline_equity = backtest_with_bots(all_bots, historical_trades)
    baseline_return = (baseline_equity - capital) / capital
    
    # Remove each bot one at a time
    for bot_id in all_bots:
        remaining_bots = [b for b in all_bots if b.id != bot_id]
        without_equity = backtest_with_bots(remaining_bots, historical_trades)
        without_return = (without_equity - capital) / capital
        
        # Calculate impact
        equity_impact = baseline_equity - without_equity
        return_impact_percent = (baseline_return - without_return) × 100
        
        results[bot_id] = {
            'equityImpactDollar': equity_impact,
            'equityImpactPercent': return_impact_percent,
            'portfolioReturnWithout': without_return × 100
        }
    
    return results
```

### 9.3 Risk Share Calculation

```
# Each bot's contribution to portfolio volatility
# Using risk contribution formula:

bot_volatility = stdev(bot_daily_returns)
portfolio_volatility = stdev(portfolio_daily_returns)

# Correlation with portfolio
correlation = corr(bot_returns, portfolio_returns)

# Risk contribution (simplified)
riskSharePercent = (bot_volatility × correlation) / portfolio_volatility × 100
```

### 9.4 Max Drawdown Contribution

During the period of maximum drawdown:

```
# Which bots lost the most during max DD period?
max_dd_period_start = date_of_peak
max_dd_period_end = date_of_trough

bot_dd_contribution = sum(bot_loss for bot in all_bots during this period)
bot_dd_contribution_percent = bot_dd_contribution / total_dd × 100
```

### 9.5 Sensitivity Narrative

```
"Bot 'SPY Scalper' contributes $8,400 (34%) of your portfolio's 
gains but also bears 42% of downside risk. It's your biggest 
profit driver but also your volatility engine."
```

---

## 10. Portfolio Intelligence: Correlation Risk

### 10.1 Purpose

Identify **co-movement risk** between bots trading related assets.

**Question:** "Are my bots redundant? Do they amplify losses together?"

### 10.2 Correlation Matrix

```python
def correlation_matrix(bot_returns_dict):
    """
    bot_returns_dict = {
      'SPY Bot': [daily_returns...],
      'QQQ Bot': [daily_returns...],
      ...
    }
    """
    pairs = []
    
    for bot_a, bot_b in combinations(bot_returns_dict.keys(), 2):
        correlation = pearson_correlation(
            bot_returns_dict[bot_a],
            bot_returns_dict[bot_b]
        )
        
        if correlation > 0.7:
            risk_level = 'high'
        elif correlation > 0.5:
            risk_level = 'moderate'
        else:
            risk_level = 'low'
        
        pairs.append({
            'botA': bot_a,
            'botB': bot_b,
            'correlation': correlation,
            'riskLevel': risk_level
        })
    
    return pairs
```

### 10.3 Concentration Warning

If multiple bots are highly correlated (e.g., both long SPY/QQQ):

```
high_corr_pairs = [p for p in correlations if p['correlation'] > 0.7]

if len(high_corr_pairs) > 2:
  concentrationWarning = 
    "Three bot pairs are highly correlated. Your portfolio 
     has directional (long equity tech) bias. Consider adding 
     uncorrelated strategies (e.g., bonds, commodities, mean reversion)."
```

---

## 11. Risk Intelligence: Weather & Budget

### 11.1 Risk Weather Condition

A metaphorical but meaningful classification of current portfolio risk state.

```
def risk_weather(drawdown_percent, drawdown_limit, sharpe, volatility):
    
    drawdown_ratio = drawdown_percent / drawdown_limit
    
    if drawdown_ratio < 0.4:
        condition = 'clear'     # ☀️
        grade = 'A'
    elif drawdown_ratio < 0.6:
        condition = 'fair'      # ⛅
        grade = 'B'
    elif drawdown_ratio < 0.85:
        condition = 'cloudy'    # ☁️
        grade = 'C'
    else:
        condition = 'stormy'    # ⛈️
        grade = 'F'
    
    return { 'condition': condition, 'overallGrade': grade }
```

### 11.2 Risk Budget Items

Track how much of each "risk budget" has been consumed:

```
budget_items = [
  {
    'label': 'Daily Loss Limit',
    'current': abs(dayPL),
    'limit': userProfile.dailyLossLimit,
    'unit': '$',
    'explanation': "You've lost $1,250 today. 
                    Can afford $1,750 more before daily limit."
  },
  {
    'label': 'Max Drawdown',
    'current': abs(currentMaxDD),
    'limit': userProfile.maxDrawdownTolerance,
    'unit': '%',
    'explanation': "Portfolio is down 12% from peak. 
                    Your tolerance is 25%. Safe for now."
  },
  {
    'label': 'Consecutive Losses',
    'current': consecutiveLossCount,
    'limit': circuitBreaker.consecutiveLossLimit,
    'unit': '',
    'explanation': "3 losing days in a row. 
                    Safety cutoff is 5. System will stop at 5."
  }
]
```

---

## 12. Risk Intelligence: Stress Scenarios

### 12.1 Purpose

Simulate **specific adverse events** to show retail traders "What could realistically go wrong?"

### 12.2 Scenario Types

```
scenarios = [
  {
    'id': 'flash_crash',
    'icon': '📉',
    'title': 'Flash Crash (Single Day)',
    'description': 'Market gaps down 5% in first 5 minutes. 
                    Stops triggered. Recovery takes 3–5 days.',
    'estimatedLossDollar': 3500,
    'estimatedLossPercent': 7.0,
    'historicalOccurrences': 2,  # in last 10 years
    'avgRecoveryDays': 4,
    'safetyNet': 'Your stop-loss orders trigger at <$3k loss.',
    'severity': 'significant'
  },
  {
    'id': 'vix_spike',
    'icon': '⚡',
    'title': 'VIX Spike (10+ Days)',
    'description': 'Sustained volatility spike like Mar-2020. 
                    Mean reversion bots suffer; momentum bots may thrive.',
    'estimatedLossDollar': 7200,
    'estimatedLossPercent': 14.4,
    'historicalOccurrences': 3,
    'avgRecoveryDays': 18,
    'safetyNet': 'Circuit breaker pauses trading after 3 losing days.',
    'severity': 'severe'
  },
  ...
]
```

### 12.3 Calculation Methodology

**For each scenario:**

1. Identify historical analogs (e.g., "similar days when VIX > 40").
2. Simulate: Run backtest with those specific market conditions.
3. Measure: Max loss, recovery duration.
4. Generalize: "If this happened today, expect $X loss."

---

## 13. Risk Intelligence: Diversification Grading

### 13.1 Purpose

Grade how well-diversified the portfolio is across dimensions.

### 13.2 Dimensions

```
dimensions = [
  {
    'label': 'Asset Class Diversification',
    'grade': 'B',  // 2 of 4 major classes (equities, bonds, crypto, commodities)
    'explanation': 'Only equities and bonds. Missing crypto and commodities hedges.'
  },
  {
    'label': 'Time Frame Diversification',
    'grade': 'A',
    'explanation': 'Good mix: scalper (1h), day trader (4h), swing (3d).'
  },
  {
    'label': 'Strategy Type Diversification',
    'grade': 'C',
    'explanation': '3 momentum bots, 0 mean reversion, 0 stat arb. 
                    Over-reliant on trending markets.'
  },
  {
    'label': 'Correlation Diversification',
    'grade': 'B-',
    'explanation': 'Two bots are highly correlated (SPY/QQQ). 
                    Net long bias reduces hedging potential.'
  }
]

overallGrade = weighted_average(grades)  // e.g., 'B'
narrative = "Your portfolio is reasonably diversified but has 
             a directional bias toward equities. Consider adding 
             mean reversion or bonds for downside protection."
```

---

## 14. Risk Recommendations Engine

### 14.1 Purpose

Convert risk insights into **actionable next steps** for the user.

### 14.2 Recommendation Logic

```python
def generate_recommendations(
    portfolio_intel,
    risk_intel,
    user_profile,
    circuit_breaker
):
    recommendations = []
    
    # Rule 1: If any bot has high correlation, recommend monitoring
    if portfolio_intel.highCorrelationPairs > 0:
        recommendations.append({
            'type': 'monitor',
            'priority': 1,
            'title': 'Monitor Bot Correlation',
            'description': f"{portfolio_intel.highCorrelationPairs} bot pairs 
                            moving together. Watch for amplified losses.",
            'linkTarget': 'fleet',
            'ctaLabel': 'View Fleet Health'
        })
    
    # Rule 2: If drawdown is >70% of tolerance, recommend pause
    if risk_intel.drawdownRatio > 0.7:
        recommendations.append({
            'type': 'monitor',
            'priority': 2,
            'title': 'Drawdown Approaching Limit',
            'description': f"Portfolio is {drawdown_percent}% down 
                            from peak (limit: {limit}%). 
                            Consider pausing least profitable bot.",
            'deploymentId': least_profitable_bot_id,
            'ctaLabel': 'Review Deployment'
        })
    
    # Rule 3: If diversification grade < B-, recommend adding strategy
    if risk_intel.diversification.overallGrade in ['C', 'C-', 'D', 'F']:
        recommendations.append({
            'type': 'add',
            'priority': 3,
            'title': 'Low Diversification',
            'description': f"Add a {missing_strategy_type} strategy 
                            to hedge your {dominant_bias}.",
            'linkTarget': 'discover',
            'ctaLabel': 'Browse Strategies'
        })
    
    # Sort by priority
    recommendations.sort(key=lambda r: r['priority'])
    
    return recommendations
```

---

## 15. LLM-Assisted Narrative Generation

### 15.1 Purpose

Convert metrics into human-readable stories that make sense to retail traders.

### 15.2 Narrative Layers

#### Narrative Layer 1: Verdict Narrative

**Input:** `BacktestVerdictData`

**Template:**
```
"{assessment} {phrase}. {evidence}. {caveat}."

Examples:

Promising:
"This strategy looks promising. It was profitable in 8 out of 10 
walk-forward periods and has a Sharpe ratio of 1.2. 
However, it struggled in high-volatility regimes; ensure you're 
prepared for 2–3 week losing streaks."

Mixed:
"This strategy has potential but shows inconsistent results. 
It was profitable overall (18% return) but with concerning 
drawdowns in crisis regimes. Only deploy if you can tolerate 
larger losses and have a longer timeframe."

Not Recommended:
"This strategy is not recommended for live trading. 
It failed in 4 of 10 walk-forward windows and has a 
negative Sharpe ratio, suggesting it may not outperform 
a buy-and-hold approach."
```

#### Narrative Layer 2: Risk Weather Narrative

**Input:** `RiskWeatherData`

**Template:**
```
"Your portfolio's weather is {condition}. {current_state}. {next_steps}."

Example:
"Your portfolio's weather is fair. You're down 8% from peak, 
which is 32% of your 25% tolerance. Drawdown is stable; no new 
lows in the last 3 days. Monitor the next few trading sessions 
to see if volatility subsides."
```

#### Narrative Layer 3: Sensitivity Analysis Narrative

**Input:** `BotEquityImpact[]`

**Template:**
```
"{top_bot_name} is your {impact_type}. {contribution}. 
{caveat_or_opportunity}."

Example:
"Bot 'SPY Scalper' is your biggest profit driver, contributing 
$6,200 of your $18,500 total gains. It also bears 45% of 
portfolio volatility, making it your risk engine. 
Consider pausing it if volatility spikes above 25."
```

#### Narrative Layer 4: Diversification Narrative

**Input:** `DiversificationData`

**Template:**
```
"Your portfolio scores {grade} on diversification. {strengths}. 
{weaknesses}. {recommendation}."

Example:
"Your portfolio scores B on diversification. You have good 
time-frame diversity (scalper, day, swing) and low correlations 
overall. However, all bots are long-biased equities; you lack 
defensive hedges. Consider adding a short strategy or bond algo."
```

### 15.3 LLM Integration (Conceptual)

```python
def generate_narrative(metric_category: str, data: dict) -> str:
    """
    Use LLM to generate human-readable narrative.
    
    Args:
        metric_category: 'verdict', 'weather', 'sensitivity', 'diversification'
        data: corresponding BacktestVerdictData, RiskWeatherData, etc.
    
    Returns:
        str: Human-readable narrative
    """
    
    # Build context prompt
    context = f"""
    You are a financial advisor helping a retail trader understand 
    their algorithmic trading portfolio. Be clear, honest, and 
    actionable. Avoid jargon. Use dollar amounts, not just percentages.
    
    {metric_category.upper()} DATA:
    {json.dumps(data, indent=2)}
    
    TASK: Generate a short (2–3 sentences) narrative that explains 
    this data to a retail trader with basic financial knowledge.
    
    STYLE:
    - Lead with the most important insight.
    - Use concrete numbers (dollars, percentages).
    - Include one actionable next step.
    - Avoid hedging language unless there's genuine uncertainty.
    """
    
    # Call LLM (OpenAI, Anthropic, etc.)
    response = llm.chat.completions.create(
        model='gpt-4-turbo',
        messages=[
            {'role': 'system', 'content': 'You are a financial advisor.'},
            {'role': 'user', 'content': context}
        ],
        temperature=0.3,  # Deterministic
        max_tokens=200
    )
    
    return response.choices[0].message.content
```

---

## 16. API Contract & Response Schema

### 16.1 Backtest Request

```typescript
POST /api/backtest

{
  strategyId: string;
  strategyCode: string;  // user's strategy rules
  initialCapital: number;
  startDate: string;  // YYYY-MM-DD
  endDate: string;
  walkForwardWindows?: number;  // default: 10
  monteCarloSimulations?: number;  // default: 10000
  userRiskProfile: UserRiskProfile;
}
```

### 16.2 Backtest Response

```typescript
{
  strategyId: string;
  initialCapital: number;
  totalReturn: number;
  totalReturnDollar: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  maxDrawdown: number;
  maxDrawdownDollar: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingPeriod: string;  // "2h 30m"
  
  equityCurve: {
    time: Date;
    value: number;
    regime: RegimeType;
  }[];
  
  walkForward: {
    nWindows: number;
    inSampleRatio: number;
    meanOosSharpe: number;
    stdOosSharpe: number;
    meanOosReturn: number;
    oosConsistency: number;
    oosDegradation: number;
    windows: WalkForwardWindow[];
    benchmarkCurve: { date: string; buyHold: number; spy: number }[];
  };
  
  monteCarlo: {
    medianReturn: number;
    medianReturnDollar: number;
    percentile5: number;
    percentile5Dollar: number;
    percentile95: number;
    percentile95Dollar: number;
    probOfProfit: number;
    riskOfRuin: number;
    maxDrawdownMedian: number;
    simulationsCount: number;
    distribution: MonteCarloDistributionPoint[];
  };
  
  verdict: {
    assessment: 'promising' | 'mixed' | 'not_recommended';
    narrative: string;
    expectedAnnualReturnRange: [number, number];
    expectedAnnualReturnDollarRange: [number, number];
    maxLossScenarioDollar: number;
    maxLossScenarioPercent: number;
    regimeWarning: string | null;
    withinTolerance: boolean;
  };
}
```

### 16.3 Portfolio Intelligence Request

```typescript
POST /api/portfolio/intelligence

{
  deploymentIds: string[];  // array of active bot IDs
  timeRange: 'last_30_days' | 'last_90_days' | 'all_time';
}
```

### 16.4 Portfolio Intelligence Response

```typescript
{
  totalEquityPL: number;
  totalEquityPLPercent: number;
  portfolioMaxDD: number;
  
  botImpacts: {
    deploymentId: string;
    name: string;
    equityImpactDollar: number;
    equityImpactPercent: number;
    riskSharePercent: number;
    maxDDContribution: number;
    maxDDContributionPercent: number;
    sensitivityNarrative: string;
    portfolioReturnWithout: number;
  }[];
  
  correlations: {
    botA: string;
    botB: string;
    correlation: number;
    riskLevel: 'low' | 'moderate' | 'high';
  }[];
  
  concentrationWarning: string | null;
  directionalBias: 'net_long' | 'net_short' | 'neutral';
  directionalBiasPercent: number;
  overallNarrative: string;
}
```

### 16.5 Risk Intelligence Request

```typescript
POST /api/risk/intelligence

{
  userRiskProfile: UserRiskProfile;
  currentPortfolioState: {
    equity: number;
    dayPL: number;
    maxDrawdown: number;
    deploymentIds: string[];
  };
}
```

### 16.6 Risk Intelligence Response

```typescript
{
  weather: {
    condition: 'clear' | 'fair' | 'cloudy' | 'stormy';
    overallGrade: RiskGrade;
    riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
    narrative: string;
    drawdownCurrent: number;
    drawdownLimit: number;
  };
  
  budget: {
    items: {
      label: string;
      current: number;
      limit: number;
      unit: string;
      explanation: string;
    }[];
    narrative: string;
  };
  
  stressScenarios: {
    id: string;
    icon: string;
    title: string;
    description: string;
    estimatedLossDollar: number;
    estimatedLossPercent: number;
    historicalOccurrences: number;
    avgRecoveryDays: number;
    safetyNet: string;
    severity: 'moderate' | 'significant' | 'severe';
  }[];
  
  diversification: {
    dimensions: {
      label: string;
      grade: RiskGrade;
      explanation: string;
    }[];
    overallGrade: RiskGrade;
    narrative: string;
  };
  
  recommendations: {
    type: 'keep' | 'add' | 'monitor' | 'remove';
    title: string;
    description: string;
    priority: number;
    deploymentId?: string;
    linkTarget?: 'fleet' | 'discover' | 'command-center';
    ctaLabel?: string;
  }[];
}
```

---

## 17. Mock Data Structure (Reference)

See `mock/mockData.ts` in the codebase for the complete mock data structure. This serves as the **single source of truth** for API response shapes and example calculations.

Key exports:
- `mockBacktestResult`: Complete backtest with all metrics
- `mockPortfolioIntelligence`: Sensitivity & correlation data
- `mockRiskIntelligence`: Weather, budget, scenarios
- `mockUserProfile`: User's risk preferences
- `mockCircuitBreaker`: Current risk budget consumption

---

## 18. Implementation Roadmap

### Phase 1: Core Metrics (Weeks 1–2)

- [ ] Equity curve calculation
- [ ] Daily P&L computation
- [ ] Sharpe, Sortino, Calmar ratios
- [ ] Max drawdown + dollar conversion

### Phase 2: Walk Forward Analysis (Weeks 3–4)

- [ ] Window segmentation logic
- [ ] IS/OOS backtesting
- [ ] Regime classification
- [ ] Assessment grading

### Phase 3: Monte Carlo (Weeks 5–6)

- [ ] Trade sequence shuffling
- [ ] Simulation engine
- [ ] Percentile distribution
- [ ] Risk of ruin calculation

### Phase 4: Portfolio Intelligence (Weeks 7–8)

- [ ] Leave-one-out sensitivity
- [ ] Risk attribution
- [ ] Correlation matrix
- [ ] Concentration warnings

### Phase 5: Risk Intelligence (Weeks 9–10)

- [ ] Weather grading
- [ ] Risk budget tracking
- [ ] Stress scenario simulation
- [ ] Diversification scoring

### Phase 6: Narratives & Integration (Weeks 11–12)

- [ ] LLM integration
- [ ] Narrative templates
- [ ] Recommendation engine
- [ ] API endpoint testing

### Phase 7: Polish & Validation (Weeks 13–14)

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment

---

## Conclusion

This document provides the mathematical and conceptual foundation for bridging AlgoBrute's UI prototype to a production backend. Every metric is grounded in retail trader intuition (dollars, tolerance levels, risk budgets) while maintaining mathematical rigor (Sharpe ratios, Monte Carlo, walk-forward validation).

The key principle: **Metrics alone are meaningless. Stories make them actionable.**

---

**Document Version History:**
- v1.0 (Feb 16, 2026): Initial specification based on Next.js/shadcn prototype.
