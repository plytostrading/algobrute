// ============================================================
// AlgoBrute UI — Type Definitions
// ============================================================

// --- Portfolio ---
export interface PortfolioSnapshot {
  equity: number;
  dayPL: number;
  dayPLPercent: number;
  unrealizedPL: number;
  cash: number;
  buyingPower: number;
  activeDeployments: number;
}

// --- User Risk Profile ---
export type RiskComfortLevel = 'conservative' | 'moderate' | 'aggressive';

export interface UserRiskProfile {
  capitalBase: number;
  maxDrawdownTolerance: number;
  dailyLossLimit: number;
  riskComfortLevel: RiskComfortLevel;
  financialGoal: string;
  targetAnnualReturn: number;
}

// --- Fleet Health ---
export type FleetHealthStatus = 'HEALTHY' | 'CAUTION' | 'AT_RISK';

// --- Deployments ---
export type DeploymentStatus = 'active' | 'paused' | 'stopped' | 'idle';

export interface Deployment {
  id: string;
  name: string;
  strategyId: string;
  status: DeploymentStatus;
  capitalAllocated: number;
  dayPL: number;
  totalPL: number;
  totalPLPercent: number;
  isPaper: boolean;
  activePositions: number;
  createdAt: Date;
  narrative: string;
  isWithinExpected: boolean;
  drawdownVsTolerance: number;
  currentDrawdown: number;
  maxTestedDrawdown: number;
  daysSinceStart: number;
}

// --- Positions ---
export type PositionLifecycleState = 'OPEN' | 'PROTECTING' | 'TRAILING' | 'CLOSING' | 'CLOSED';

export interface Position {
  id: string;
  deploymentId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  state: PositionLifecycleState;
  barsHeld: number;
}

// --- Regimes ---
export type RegimeType = 'LOW_VOL' | 'NORMAL' | 'HIGH_VOL' | 'CRISIS';

export interface RegimeIndicator {
  current: RegimeType;
  confidence: number;
  volatilityATR: number;
  trendStrength: number;
}

// --- Action Cues ---
export type CueSeverity = 'critical' | 'warning' | 'info';

export interface ActionCue {
  id: string;
  severity: CueSeverity;
  message: string;
  action?: string;
  timestamp: Date;
  historicalContext: string;
  occurrenceCount: number;
  avgRecoveryDays: number;
}

// --- Trades ---
export type TradeSide = 'long' | 'short';

export interface JournalEntry {
  id: string;
  deploymentId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  entryTime: Date;
  exitPrice: number;
  exitTime: Date;
  grossPL: number;
  netPL: number;
  returnPercent: number;
  commission: number;
  holdingPeriod: number;
  notes: string;
}

// --- Metrics ---
export type MetricFormat = 'currency' | 'percent' | 'number' | 'ratio';

export interface BacktestMetric {
  label: string;
  value: number | string;
  format: MetricFormat;
}

// --- Walk Forward Analysis ---
export type RegimeAssessment = 'strong' | 'survived' | 'weak' | 'failed';

export interface WalkForwardWindow {
  windowId: number;
  windowType: 'in_sample' | 'out_of_sample';
  label: string;
  startDate: string;
  endDate: string;
  regimeLabel: RegimeType;
  regimeConfidence: number;
  performance: {
    totalReturn: number;
    sharpe: number;
    sortino: number;
  };
  risk: {
    maxDrawdown: number;
    var95: number;
  };
  tradeStats: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
  };
  equityCurve: { date: string; equity: number; cumulativeReturn: number }[];
  color: string;
  assessment: RegimeAssessment;
}

export interface WalkForwardAnalysis {
  nWindows: number;
  inSampleRatio: number;
  meanOosSharpe: number;
  stdOosSharpe: number;
  meanOosReturn: number;
  oosConsistency: number;
  oosDegradation: number;
  windows: WalkForwardWindow[];
  benchmarkCurve: { date: string; buyHold: number; spy: number }[];
}

// --- Monte Carlo ---
export interface MonteCarloDistributionPoint {
  period: number;
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
}

export interface MonteCarloResult {
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
}

// --- Backtest Verdict ---
export type VerdictAssessment = 'promising' | 'mixed' | 'not_recommended';

export interface BacktestVerdictData {
  assessment: VerdictAssessment;
  narrative: string;
  expectedAnnualReturnRange: [number, number];
  expectedAnnualReturnDollarRange: [number, number];
  maxLossScenarioDollar: number;
  maxLossScenarioPercent: number;
  regimeWarning: string | null;
  withinTolerance: boolean;
}

// --- Enhanced Backtest Result ---
export interface BacktestResult {
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
  avgHoldingPeriod: string;
  equityCurve: { time: Date; value: number; regime: RegimeType }[];
  walkForward: WalkForwardAnalysis;
  monteCarlo: MonteCarloResult;
  verdict: BacktestVerdictData;
}

// --- Strategy ---
export interface StrategyRule {
  indicator: string;
  operator: string;
  value: number | string;
  period?: number;
}

export interface Strategy {
  id: string;
  name: string;
  asset: string;
  type: string;
  entryRules: StrategyRule[];
  exitRules: StrategyRule[];
  riskEngine: { stopLoss: number; takeProfit: number; mode: string; isLiveUpdating: boolean };
  createdAt: Date;
}

// --- Logs ---
export type LogTag = 'DATA' | 'ALGO' | 'RISK' | 'LOGIC';

export interface LogEntry {
  tag: LogTag;
  message: string;
  timestamp: Date;
}

// --- Circuit Breakers ---
export interface CircuitBreakerStatus {
  dailyLossLimit: number;
  dailyLossConsumed: number;
  consecutiveLossLimit: number;
  consecutiveLosses: number;
  maxDrawdownLimit: number;
  maxDrawdownConsumed: number;
  isTripped: boolean;
}

// --- Expected Behavior ---
export interface ExpectedBehaviorPoint {
  date: string;
  upper: number;
  lower: number;
  actual: number;
}

// --- Risk Intelligence (Storytelling) ---
export type RiskWeatherCondition = 'clear' | 'fair' | 'cloudy' | 'stormy';
export type RiskGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
export type RiskActionType = 'keep' | 'add' | 'monitor' | 'remove';
export type ScenarioSeverity = 'moderate' | 'significant' | 'severe';

export interface RiskWeatherData {
  condition: RiskWeatherCondition;
  overallGrade: RiskGrade;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  narrative: string;
  drawdownCurrent: number;
  drawdownLimit: number;
}

export interface RiskBudgetItem {
  label: string;
  current: number;
  limit: number;
  unit: string;
  explanation: string;
}

export interface RiskBudgetData {
  items: RiskBudgetItem[];
  narrative: string;
}

export interface StressScenario {
  id: string;
  icon: string;
  title: string;
  description: string;
  estimatedLossDollar: number;
  estimatedLossPercent: number;
  historicalOccurrences: number;
  avgRecoveryDays: number;
  safetyNet: string;
  severity: ScenarioSeverity;
}

export interface DiversificationDimension {
  label: string;
  grade: RiskGrade;
  explanation: string;
}

export interface DiversificationData {
  dimensions: DiversificationDimension[];
  overallGrade: RiskGrade;
  narrative: string;
}

export type RiskLinkTarget = 'fleet' | 'discover' | 'command-center';

export interface RiskRecommendation {
  type: RiskActionType;
  title: string;
  description: string;
  priority: number;
  deploymentId?: string;
  linkTarget?: RiskLinkTarget;
  ctaLabel?: string;
}

export interface RiskIntelligenceData {
  weather: RiskWeatherData;
  budget: RiskBudgetData;
  stressScenarios: StressScenario[];
  diversification: DiversificationData;
  recommendations: RiskRecommendation[];
}

// --- Portfolio Intelligence ---
export interface BotEquityImpact {
  deploymentId: string;
  name: string;
  equityImpactDollar: number;
  equityImpactPercent: number;
  riskSharePercent: number;
  maxDDContribution: number;
  maxDDContributionPercent: number;
  sensitivityNarrative: string;
  portfolioReturnWithout: number;
}

export interface BotCorrelationPair {
  botA: string;
  botB: string;
  correlation: number;
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface PortfolioIntelligence {
  totalEquityPL: number;
  totalEquityPLPercent: number;
  portfolioMaxDD: number;
  botImpacts: BotEquityImpact[];
  correlations: BotCorrelationPair[];
  concentrationWarning: string | null;
  directionalBias: 'net_long' | 'net_short' | 'neutral';
  directionalBiasPercent: number;
  overallNarrative: string;
}
