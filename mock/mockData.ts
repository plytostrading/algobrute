import {
  PortfolioSnapshot, Deployment, Position, ActionCue, JournalEntry,
  BacktestResult, Strategy, RegimeIndicator, LogEntry, CircuitBreakerStatus,
  UserRiskProfile, WalkForwardAnalysis, WalkForwardWindow, MonteCarloResult,
  MonteCarloDistributionPoint, BacktestVerdictData, FleetHealthStatus,
  ExpectedBehaviorPoint, RegimeType, PortfolioIntelligence, RiskIntelligenceData,
} from '../types';

// ============================================================
// User Risk Profile
// ============================================================
export const mockUserProfile: UserRiskProfile = {
  capitalBase: 50000,
  maxDrawdownTolerance: 15,
  dailyLossLimit: 500,
  riskComfortLevel: 'moderate',
  financialGoal: 'Grow trading account by 15-25% annually while keeping max drawdown under 15%',
  targetAnnualReturn: 20,
};

// ============================================================
// Portfolio
// ============================================================
export const mockPortfolio: PortfolioSnapshot = {
  equity: 127450.23, dayPL: 1234.56, dayPLPercent: 0.98,
  unrealizedPL: 2345.67, cash: 45230.12, buyingPower: 180900.46, activeDeployments: 3,
};

// ============================================================
// Fleet Health
// ============================================================
export const mockFleetHealth: { status: FleetHealthStatus; narrative: string; drawdownPercent: number; drawdownOfTolerance: number } = {
  status: 'HEALTHY',
  narrative: 'All systems nominal. Your mean-reversion bots are performing well in the current low-volatility regime. Portfolio drawdown is 26% of your stated comfort limit. No interventions recommended.',
  drawdownPercent: 2.1,
  drawdownOfTolerance: 26,
};

// ============================================================
// Deployments (enhanced with narratives)
// ============================================================
export const mockDeployments: Deployment[] = [
  {
    id: 'dep-1', name: 'SPY Mean Reversion', strategyId: 'strat-1', status: 'active',
    capitalAllocated: 50000, dayPL: 456.78, totalPL: 3240.12, totalPLPercent: 6.48,
    isPaper: false, activePositions: 1, createdAt: new Date('2024-01-15'),
    narrative: 'Performing as expected for the current LOW_VOL regime. Day P&L is positive and within normal variance. This strategy historically returns +18% annualized in similar conditions.',
    isWithinExpected: true, drawdownVsTolerance: 14, currentDrawdown: 1.8, maxTestedDrawdown: 12, daysSinceStart: 47,
  },
  {
    id: 'dep-2', name: 'QQQ Momentum', strategyId: 'strat-2', status: 'active',
    capitalAllocated: 30000, dayPL: -125.43, totalPL: 1876.45, totalPLPercent: 6.25,
    isPaper: false, activePositions: 2, createdAt: new Date('2024-01-20'),
    narrative: 'Minor drawdown today after a losing trade on AAPL. This is within normal range — drawdowns of this size occurred every 6-8 weeks in backtesting and recovered within 2-5 trading days.',
    isWithinExpected: true, drawdownVsTolerance: 22, currentDrawdown: 2.8, maxTestedDrawdown: 14, daysSinceStart: 42,
  },
  {
    id: 'dep-3', name: 'TLT Range Trading', strategyId: 'strat-3', status: 'paused',
    capitalAllocated: 25000, dayPL: 0, totalPL: -543.21, totalPLPercent: -2.17,
    isPaper: false, activePositions: 0, createdAt: new Date('2024-02-01'),
    narrative: 'Paused after hitting 65% of daily loss limit. This strategy struggles in trending bond markets. Consider resuming when TLT returns to a range-bound regime.',
    isWithinExpected: false, drawdownVsTolerance: 45, currentDrawdown: 5.2, maxTestedDrawdown: 10, daysSinceStart: 30,
  },
];

// ============================================================
// Positions
// ============================================================
export const mockPositions: Position[] = [
  { id: 'pos-1', deploymentId: 'dep-1', symbol: 'SPY', side: 'long', quantity: 50, entryPrice: 450.23, currentPrice: 458.67, unrealizedPL: 422.00, unrealizedPLPercent: 1.87, state: 'PROTECTING', barsHeld: 12 },
  { id: 'pos-2', deploymentId: 'dep-2', symbol: 'QQQ', side: 'long', quantity: 100, entryPrice: 380.45, currentPrice: 385.12, unrealizedPL: 467.00, unrealizedPLPercent: 1.23, state: 'TRAILING', barsHeld: 8 },
];

// ============================================================
// Action Cues (enhanced with historical context)
// ============================================================
export const mockActionCues: ActionCue[] = [
  {
    id: 'cue-1', severity: 'warning', message: 'Bot "QQQ Momentum" hit 65% of daily loss limit ($325/$500)',
    action: 'Review positions', timestamp: new Date(),
    historicalContext: 'This has happened 3 times this quarter. Each time the bot recovered within 2 trading days without intervention.',
    occurrenceCount: 3, avgRecoveryDays: 2,
  },
  {
    id: 'cue-2', severity: 'info', message: 'Market regime shifting: LOW_VOL → TRANSITIONAL (62% confidence)',
    action: 'Review positions', timestamp: new Date(),
    historicalContext: 'Your momentum strategies historically underperform during transitions. Consider reducing position sizes by 30%.',
    occurrenceCount: 0, avgRecoveryDays: 0,
  },
];

// ============================================================
// Journal Entries
// ============================================================
export const mockJournalEntries: JournalEntry[] = [
  { id: 'trade-1', deploymentId: 'dep-1', symbol: 'SPY', side: 'long', quantity: 50, entryPrice: 442.10, entryTime: new Date('2024-02-10T09:30:00'), exitPrice: 448.23, exitTime: new Date('2024-02-12T15:45:00'), grossPL: 306.50, netPL: 304.50, returnPercent: 1.39, commission: 2.00, holdingPeriod: 2880, notes: 'Clean RSI bounce, exited at SMA resistance' },
  { id: 'trade-2', deploymentId: 'dep-2', symbol: 'QQQ', side: 'long', quantity: 100, entryPrice: 375.50, entryTime: new Date('2024-02-11T10:15:00'), exitPrice: 382.10, exitTime: new Date('2024-02-13T14:20:00'), grossPL: 660.00, netPL: 658.00, returnPercent: 1.76, commission: 2.00, holdingPeriod: 2760, notes: 'Momentum breakout, trailing stop triggered' },
  { id: 'trade-3', deploymentId: 'dep-1', symbol: 'SPY', side: 'long', quantity: 40, entryPrice: 455.20, entryTime: new Date('2024-02-15T10:00:00'), exitPrice: 452.10, exitTime: new Date('2024-02-16T14:30:00'), grossPL: -124.00, netPL: -126.00, returnPercent: -0.68, commission: 2.00, holdingPeriod: 1470, notes: 'False RSI signal, stopped out' },
  { id: 'trade-4', deploymentId: 'dep-2', symbol: 'QQQ', side: 'long', quantity: 80, entryPrice: 388.00, entryTime: new Date('2024-02-18T09:45:00'), exitPrice: 395.60, exitTime: new Date('2024-02-20T15:00:00'), grossPL: 608.00, netPL: 606.00, returnPercent: 1.96, commission: 2.00, holdingPeriod: 2835, notes: 'Strong momentum continuation' },
  { id: 'trade-5', deploymentId: 'dep-3', symbol: 'TLT', side: 'short', quantity: 200, entryPrice: 92.50, entryTime: new Date('2024-02-19T11:00:00'), exitPrice: 93.80, exitTime: new Date('2024-02-21T13:15:00'), grossPL: -260.00, netPL: -262.00, returnPercent: -1.41, commission: 2.00, holdingPeriod: 2895, notes: 'Range broke upward, stopped out' },
];

// ============================================================
// Walk Forward Analysis — 5 OOS Windows over 6 years
// ============================================================

// Generate equity curve for a single OOS window using its actual date range.
// startVal is the equity at the beginning of this window (chained from previous).
function generateWFWindowEquity(
  startVal: number,
  returnPct: number,
  windowStartDate: string,
  windowEndDate: string,
  volatility: number,
): { date: string; equity: number; cumulativeReturn: number }[] {
  const curve: { date: string; equity: number; cumulativeReturn: number }[] = [];
  const start = new Date(windowStartDate);
  const end = new Date(windowEndDate);
  const calendarDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const tradingDays = Math.max(Math.round(calendarDays * 252 / 365), 10);
  const dailyReturn = returnPct / 100 / tradingDays;
  let val = startVal;
  for (let i = 0; i <= tradingDays; i++) {
    const noise = (Math.sin(i * 0.7) * 0.3 + Math.cos(i * 1.3) * 0.2) * volatility * 0.01;
    val *= (1 + dailyReturn + noise);
    // Map trading day index to a calendar date within the window
    const calDay = Math.round((i / tradingDays) * calendarDays);
    const d = new Date(start);
    d.setDate(d.getDate() + calDay);
    curve.push({ date: d.toISOString().slice(0, 10), equity: val, cumulativeReturn: (val - startVal) / startVal });
  }
  return curve;
}

const wfColors: Record<RegimeType, string> = {
  LOW_VOL: '#3B82F6',
  NORMAL: '#22C55E',
  HIGH_VOL: '#F59E0B',
  CRISIS: '#EF4444',
};

// Window definitions — equity curves are chained below
const wfWindowDefs: Omit<WalkForwardWindow, 'equityCurve'>[] = [
  {
    windowId: 1, windowType: 'out_of_sample', label: 'OOS 1', startDate: '2018-06-01', endDate: '2019-12-31',
    regimeLabel: 'LOW_VOL', regimeConfidence: 89,
    performance: { totalReturn: 22.1, sharpe: 2.14, sortino: 3.12 },
    risk: { maxDrawdown: -4.8, var95: -1.2 },
    tradeStats: { totalTrades: 38, winRate: 58, profitFactor: 2.41, avgWin: 420, avgLoss: -195 },
    color: wfColors.LOW_VOL, assessment: 'strong',
  },
  {
    windowId: 2, windowType: 'out_of_sample', label: 'OOS 2', startDate: '2020-01-02', endDate: '2020-06-30',
    regimeLabel: 'CRISIS', regimeConfidence: 95,
    performance: { totalReturn: 8.4, sharpe: 0.92, sortino: 1.15 },
    risk: { maxDrawdown: -9.2, var95: -3.8 },
    tradeStats: { totalTrades: 22, winRate: 50, profitFactor: 1.65, avgWin: 380, avgLoss: -230 },
    color: wfColors.CRISIS, assessment: 'survived',
  },
  {
    windowId: 3, windowType: 'out_of_sample', label: 'OOS 3', startDate: '2020-07-01', endDate: '2022-03-31',
    regimeLabel: 'NORMAL', regimeConfidence: 82,
    performance: { totalReturn: 31.2, sharpe: 1.87, sortino: 2.65 },
    risk: { maxDrawdown: -6.1, var95: -1.8 },
    tradeStats: { totalTrades: 64, winRate: 56, profitFactor: 2.18, avgWin: 445, avgLoss: -210 },
    color: wfColors.NORMAL, assessment: 'strong',
  },
  {
    windowId: 4, windowType: 'out_of_sample', label: 'OOS 4', startDate: '2022-04-01', endDate: '2023-06-30',
    regimeLabel: 'HIGH_VOL', regimeConfidence: 91,
    performance: { totalReturn: -3.2, sharpe: -0.21, sortino: -0.18 },
    risk: { maxDrawdown: -12.4, var95: -4.5 },
    tradeStats: { totalTrades: 41, winRate: 44, profitFactor: 0.88, avgWin: 310, avgLoss: -355 },
    color: wfColors.HIGH_VOL, assessment: 'weak',
  },
  {
    windowId: 5, windowType: 'out_of_sample', label: 'OOS 5', startDate: '2023-07-01', endDate: '2024-12-31',
    regimeLabel: 'LOW_VOL', regimeConfidence: 88,
    performance: { totalReturn: 18.9, sharpe: 1.95, sortino: 2.88 },
    risk: { maxDrawdown: -5.1, var95: -1.4 },
    tradeStats: { totalTrades: 35, winRate: 57, profitFactor: 2.32, avgWin: 435, avgLoss: -200 },
    color: wfColors.LOW_VOL, assessment: 'strong',
  },
];

// Chain OOS windows: each starts where the previous ended
const volatilityByRegime: Record<RegimeType, number> = { LOW_VOL: 0.8, NORMAL: 1.2, HIGH_VOL: 2.8, CRISIS: 2.5 };
let chainedEquity = 50000; // initial capital
const mockWFWindows: WalkForwardWindow[] = wfWindowDefs.map((def) => {
  const equityCurve = generateWFWindowEquity(
    chainedEquity, def.performance.totalReturn, def.startDate, def.endDate, volatilityByRegime[def.regimeLabel],
  );
  chainedEquity = equityCurve[equityCurve.length - 1].equity;
  return { ...def, equityCurve };
});

// Benchmark: SPY buy-and-hold starting at same capital, spanning the full OOS date range
function generateBenchmarkCurve(): { date: string; buyHold: number; spy: number }[] {
  const curve: { date: string; buyHold: number; spy: number }[] = [];
  const capital = 50000;
  let bh = capital;
  const start = new Date('2018-06-01'); // align with first OOS window
  const end = new Date('2024-12-31');   // align with last OOS window
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  for (let i = 0; i <= totalDays; i += 2) { // every other day to keep data manageable
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    // ~10% annual return with mild noise
    const t = i / 365;
    bh = capital * (1 + 0.10 * t + Math.sin(i * 0.008) * 0.04 * t);
    curve.push({ date: d.toISOString().slice(0, 10), buyHold: bh, spy: bh });
  }
  return curve;
}

export const mockWalkForward: WalkForwardAnalysis = {
  nWindows: 5, inSampleRatio: 0.6,
  meanOosSharpe: 1.33, stdOosSharpe: 0.89,
  meanOosReturn: 15.48, oosConsistency: 80, oosDegradation: -8.2,
  windows: mockWFWindows,
  benchmarkCurve: generateBenchmarkCurve(),
};

// ============================================================
// Monte Carlo — Distribution Data
// ============================================================
function generateMCDistribution(capital: number): MonteCarloDistributionPoint[] {
  const points: MonteCarloDistributionPoint[] = [];
  for (let i = 0; i <= 52; i++) {
    const t = i / 52; // weeks over 1 year
    const drift = capital * 0.185 * t;
    const vol = capital * 0.12 * Math.sqrt(t);
    points.push({
      period: i,
      p5: capital + drift - 2.0 * vol,
      p25: capital + drift - 0.8 * vol,
      median: capital + drift,
      p75: capital + drift + 0.8 * vol,
      p95: capital + drift + 2.0 * vol,
    });
  }
  return points;
}

export const mockMonteCarlo: MonteCarloResult = {
  medianReturn: 18.5,
  medianReturnDollar: 9250,
  percentile5: -12.4,
  percentile5Dollar: -6200,
  percentile95: 38.2,
  percentile95Dollar: 19100,
  probOfProfit: 87.2,
  riskOfRuin: 0.08,
  maxDrawdownMedian: 8.3,
  simulationsCount: 10000,
  distribution: generateMCDistribution(50000),
};

// ============================================================
// Equity Curve — 6 years
// ============================================================
function generateEquityCurve() {
  const data: { time: Date; value: number; regime: RegimeType }[] = [];
  const regimeSchedule: { days: number; regime: RegimeType }[] = [
    { days: 390, regime: 'LOW_VOL' },
    { days: 130, regime: 'CRISIS' },
    { days: 455, regime: 'NORMAL' },
    { days: 325, regime: 'HIGH_VOL' },
    { days: 390, regime: 'LOW_VOL' },
  ];
  let value = 50000;
  const startDate = new Date('2018-01-02');
  let dayCounter = 0;
  for (const segment of regimeSchedule) {
    const dailyReturn = segment.regime === 'CRISIS' ? 0.0003 : segment.regime === 'HIGH_VOL' ? -0.0001 : 0.0006;
    const vol = segment.regime === 'CRISIS' ? 0.015 : segment.regime === 'HIGH_VOL' ? 0.012 : 0.005;
    for (let i = 0; i < segment.days; i++) {
      const noise = (Math.sin(dayCounter * 0.7) * 0.4 + Math.cos(dayCounter * 1.1) * 0.3) * vol;
      value *= (1 + dailyReturn + noise);
      const time = new Date(startDate);
      time.setDate(time.getDate() + dayCounter);
      data.push({ time, value, regime: segment.regime });
      dayCounter++;
    }
  }
  return data;
}

// ============================================================
// Backtest Verdict
// ============================================================
export const mockVerdict: BacktestVerdictData = {
  assessment: 'promising',
  narrative: `Over 6 years of testing across 4 market regimes, this strategy returned +186% total with a max drawdown of 12%. It performs best in low-volatility markets (+22% ann.) but struggled during the 2022 high-vol period (-3%). With $50,000 capital, your realistic expected annual return is $7,500–$12,000 with a worst-case loss of about $6,200 in a bad year.`,
  expectedAnnualReturnRange: [15, 24],
  expectedAnnualReturnDollarRange: [7500, 12000],
  maxLossScenarioDollar: 6200,
  maxLossScenarioPercent: 12.4,
  regimeWarning: 'Weak in high-volatility markets. If HIGH_VOL returns, expect -3% to -5% drawdown before recovery.',
  withinTolerance: true,
};

// ============================================================
// Full Backtest Result
// ============================================================
export const mockBacktestResult: BacktestResult = {
  strategyId: 'strat-1', initialCapital: 50000,
  totalReturn: 186.7, totalReturnDollar: 93350,
  sharpe: 1.42, sortino: 2.15, calmar: 1.85,
  maxDrawdown: -12.4, maxDrawdownDollar: -6200,
  winRate: 55, profitFactor: 2.36, totalTrades: 200,
  winningTrades: 110, losingTrades: 90,
  avgWin: 415, avgLoss: -215,
  bestTrade: 2340, worstTrade: -1120,
  avgHoldingPeriod: '3.2 days',
  equityCurve: generateEquityCurve(),
  walkForward: mockWalkForward,
  monteCarlo: mockMonteCarlo,
  verdict: mockVerdict,
};

// ============================================================
// Strategy
// ============================================================
export const mockStrategy: Strategy = {
  id: 'strat-1', name: 'SPY Mean Reversion', asset: 'SPY', type: 'MEAN_REVERSION',
  entryRules: [{ indicator: 'RSI', operator: '<', value: 30, period: 14 }, { indicator: 'Price', operator: '>', value: '200_SMA', period: 200 }],
  exitRules: [{ indicator: 'RSI', operator: '>', value: 70, period: 14 }],
  riskEngine: { stopLoss: 2.1, takeProfit: 5.3, mode: 'TRAILING_ATR', isLiveUpdating: true },
  createdAt: new Date('2024-01-10'),
};

// ============================================================
// Other mocks
// ============================================================
export const mockRegimeIndicator: RegimeIndicator = { current: 'LOW_VOL', confidence: 94.2, volatilityATR: 1.42, trendStrength: 42.5 };

export const mockLogEntries: LogEntry[] = [
  { tag: 'DATA', message: 'Ingesting 1m candles [SPY]... OK', timestamp: new Date() },
  { tag: 'ALGO', message: 'Calculating RSI(14): 18.2 < 30', timestamp: new Date() },
  { tag: 'ALGO', message: 'Checking Price > 200 SMA: 418.7 > SMA', timestamp: new Date() },
  { tag: 'RISK', message: 'Signal: WAIT (Conditions not met)', timestamp: new Date() },
  { tag: 'LOGIC', message: 'NO_ACTION_TAKEN. Waiting for next tick...', timestamp: new Date() },
];

export const mockCircuitBreaker: CircuitBreakerStatus = {
  dailyLossLimit: 500, dailyLossConsumed: 125, consecutiveLossLimit: 5,
  consecutiveLosses: 2, maxDrawdownLimit: 15, maxDrawdownConsumed: 2.1, isTripped: false,
};

// ============================================================
// Expected Behavior Band (for Operations)
// ============================================================
export function generateExpectedBehaviorData(): ExpectedBehaviorPoint[] {
  const points: ExpectedBehaviorPoint[] = [];
  let actual = 50000;
  for (let i = 0; i < 47; i++) {
    const t = i / 252;
    const center = 50000 * (1 + 0.18 * t);
    const band = 50000 * 0.08 * Math.sqrt(t);
    actual += (Math.sin(i * 0.5) * 80 + 40);
    const d = new Date('2024-01-15');
    d.setDate(d.getDate() + i);
    points.push({
      date: d.toISOString().slice(0, 10),
      upper: center + band,
      lower: center - band,
      actual,
    });
  }
  return points;
}

// ============================================================
// Portfolio Intelligence — Bot ↔ Portfolio Story
// ============================================================
const totalFleetPL = mockDeployments.reduce((sum, d) => sum + d.totalPL, 0);
const totalFleetCapital = mockDeployments.reduce((sum, d) => sum + d.capitalAllocated, 0);

export const mockPortfolioIntelligence: PortfolioIntelligence = {
  totalEquityPL: totalFleetPL,
  totalEquityPLPercent: (totalFleetPL / totalFleetCapital) * 100,
  portfolioMaxDD: -12.4,
  botImpacts: [
    {
      deploymentId: 'dep-1',
      name: 'SPY Mean Reversion',
      equityImpactDollar: 3240.12,
      equityImpactPercent: 6.48,
      riskSharePercent: 38,
      maxDDContribution: -4.8,
      maxDDContributionPercent: 39,
      sensitivityNarrative: 'If this bot stopped today, portfolio return drops from +4.36% to +1.27%. It contributes 71% of all gains and is your strongest performer in the current LOW_VOL regime.',
      portfolioReturnWithout: 1.27,
    },
    {
      deploymentId: 'dep-2',
      name: 'QQQ Momentum',
      equityImpactDollar: 1876.45,
      equityImpactPercent: 6.25,
      riskSharePercent: 32,
      maxDDContribution: -5.2,
      maxDDContributionPercent: 42,
      sensitivityNarrative: 'Removing this bot would reduce portfolio return to +2.57%. It carries the highest single-bot drawdown risk (42% of portfolio DD) due to concentrated equity exposure.',
      portfolioReturnWithout: 2.57,
    },
    {
      deploymentId: 'dep-3',
      name: 'TLT Range Trading',
      equityImpactDollar: -543.21,
      equityImpactPercent: -2.17,
      riskSharePercent: 30,
      maxDDContribution: -2.4,
      maxDDContributionPercent: 19,
      sensitivityNarrative: 'This bot is currently a drag on returns. Pausing it would improve portfolio return from +4.36% to +5.47%. However, it provides bond-market decorrelation that reduces overall portfolio volatility by ~15%.',
      portfolioReturnWithout: 5.47,
    },
  ],
  correlations: [
    { botA: 'SPY Mean Reversion', botB: 'QQQ Momentum', correlation: 0.72, riskLevel: 'high' },
    { botA: 'SPY Mean Reversion', botB: 'TLT Range Trading', correlation: -0.31, riskLevel: 'low' },
    { botA: 'QQQ Momentum', botB: 'TLT Range Trading', correlation: -0.18, riskLevel: 'low' },
  ],
  concentrationWarning: 'SPY and QQQ bots have 0.72 correlation — a broad equity selloff would hit both simultaneously. Consider adding uncorrelated strategies (commodities, FX) to reduce co-movement risk.',
  directionalBias: 'net_long',
  directionalBiasPercent: 76,
  overallNarrative: 'Your fleet is net long equities (76% directional bias). SPY Mean Reversion is your biggest contributor (+$3,240, 71% of gains) but also creates concentration risk alongside QQQ Momentum (r=0.72). TLT provides decorrelation but is currently underperforming. In the current LOW_VOL regime, this portfolio composition is favorable.',
};

// ============================================================
// Risk Intelligence — Storytelling Data
// ============================================================
export const mockRiskIntelligence: RiskIntelligenceData = {
  weather: {
    condition: 'clear',
    overallGrade: 'A-',
    riskLevel: 'low',
    narrative: 'Your portfolio risk is low today. All bots are operating within tested boundaries, drawdown is well below your comfort limit, and the current low-volatility market regime favors your strategies. No action is needed right now.',
    drawdownCurrent: 2.1,
    drawdownLimit: 15,
  },
  budget: {
    items: [
      {
        label: 'Daily Loss Budget',
        current: 125,
        limit: 500,
        unit: '$',
        explanation: 'You\'ve used $125 of your $500 daily loss limit. At this pace, your circuit breaker won\'t trigger today.',
      },
      {
        label: 'Drawdown Budget',
        current: 2.1,
        limit: 15,
        unit: '%',
        explanation: 'Your portfolio is down 2.1% from its peak — well within your 15% comfort limit. You have 86% of your drawdown budget remaining.',
      },
      {
        label: 'Capital Exposure',
        current: 82,
        limit: 100,
        unit: '%',
        explanation: '82% of your capital is deployed across 3 bots. The remaining 18% ($22,941) is in cash, acting as a safety buffer.',
      },
    ],
    narrative: 'Think of risk like a daily budget — here\'s how much you\'ve "spent" so far today. Green means plenty of room. If any bar turns orange or red, it\'s time to pay attention.',
  },
  stressScenarios: [
    {
      id: 'stress-1',
      icon: '📉',
      title: 'Market drops 5% in a week',
      description: 'A broad equity selloff hits both SPY and QQQ. Your equity bots take losses while TLT partially offsets.',
      estimatedLossDollar: 3200,
      estimatedLossPercent: 2.51,
      historicalOccurrences: 3,
      avgRecoveryDays: 12,
      safetyNet: 'Your circuit breaker would pause the hardest-hit bot after $500 daily loss. Historically, your bots recovered within 2 weeks after similar events.',
      severity: 'moderate',
    },
    {
      id: 'stress-2',
      icon: '🔻',
      title: 'Your worst bot has a losing streak',
      description: 'QQQ Momentum hits 5 consecutive losing trades, draining daily loss budget quickly.',
      estimatedLossDollar: 1800,
      estimatedLossPercent: 1.41,
      historicalOccurrences: 5,
      avgRecoveryDays: 8,
      safetyNet: 'Circuit breaker pauses the bot at 5 consecutive losses. In backtesting, it resumed profitably 4 out of 5 times within 8 trading days.',
      severity: 'moderate',
    },
    {
      id: 'stress-3',
      icon: '🌪️',
      title: 'VIX spike to 35+ (crisis regime)',
      description: 'A sudden volatility explosion like early 2020. All strategies face wider spreads and faster stops getting hit.',
      estimatedLossDollar: 5100,
      estimatedLossPercent: 4.00,
      historicalOccurrences: 1,
      avgRecoveryDays: 22,
      safetyNet: 'Your mean-reversion bots reduce position sizes automatically in high-vol regimes. TLT decorrelation absorbs ~15% of the equity loss. Max tested drawdown in crisis was 9.2%.',
      severity: 'significant',
    },
  ],
  diversification: {
    dimensions: [
      { label: 'Asset Coverage', grade: 'B+', explanation: '3 assets (SPY, QQQ, TLT) across equities and bonds. Adding commodities or FX would improve this.' },
      { label: 'Strategy Mix', grade: 'B-', explanation: '2 strategy types (mean-reversion + momentum). Both are trend-sensitive. A market-neutral strategy would help.' },
      { label: 'Correlation Risk', grade: 'C+', explanation: 'SPY and QQQ have 0.72 correlation — they tend to move together. A broad selloff would hit both simultaneously.' },
      { label: 'Direction Bias', grade: 'C', explanation: 'You\'re 76% net long equities. In a sustained downturn, most of your portfolio moves against you.' },
    ],
    overallGrade: 'B',
    narrative: 'Your biggest weakness is correlation: SPY and QQQ move together (r = 0.72), so a broad equity selloff would hit 76% of your capital at once. TLT helps, but it\'s only 24% of the fleet. Consider adding an uncorrelated asset class (commodities, FX pairs) to bring correlation risk down.',
  },
  recommendations: [
    {
      type: 'keep',
      title: 'Keep SPY Mean Reversion running',
      description: 'It\'s your top performer (+$3,240) and the current LOW_VOL regime is its sweet spot. No changes needed.',
      priority: 1,
      deploymentId: 'dep-1',
      linkTarget: 'fleet',
      ctaLabel: 'View Bot',
    },
    {
      type: 'add',
      title: 'Consider adding a commodity or FX bot',
      description: 'This would reduce your SPY↔QQQ co-movement risk and bring your correlation grade from C+ to B+.',
      priority: 2,
      linkTarget: 'discover',
      ctaLabel: 'Explore Strategies',
    },
    {
      type: 'monitor',
      title: 'Watch TLT Range Trading closely',
      description: 'It\'s your only losing bot (-$543). If it stays negative for 2 more weeks, consider pausing until TLT returns to a range-bound regime.',
      priority: 3,
      deploymentId: 'dep-3',
      linkTarget: 'fleet',
      ctaLabel: 'Open Bot Detail',
    },
    {
      type: 'monitor',
      title: 'Reduce position size if VIX crosses 25',
      description: 'Your momentum strategies underperform when volatility rises. Pre-set a rule to halve QQQ Momentum size at VIX > 25.',
      priority: 4,
      deploymentId: 'dep-2',
      linkTarget: 'fleet',
      ctaLabel: 'Review Bot',
    },
  ],
};
