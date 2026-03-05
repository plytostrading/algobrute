export const pollingIntervals = {
  live: 30_000,
  nearLive: 60_000,
  recommendation: 2 * 60_000,
  slow: 5 * 60_000,
  backtestProgress: 3_000,
  backtestList: 30_000,
} as const;

export const queryKeys = {
  user: {
    all: ['user'] as const,
    profile: ['user', 'profile'] as const,
    alpacaStatus: ['user', 'alpaca', 'status'] as const,
  },
  bots: {
    all: ['bots'] as const,
    skill: (botId: string | null | undefined) =>
      ['bots', botId, 'skill'] as const,
  },
  fleet: {
    all: ['fleet'] as const,
    weather: ['fleet', 'weather'] as const,
    weatherHistory: ['fleet', 'weather', 'history'] as const,
    narrative: ['fleet', 'narrative'] as const,
    recommendations: ['fleet', 'recommendations'] as const,
    analytics: ['fleet', 'analytics'] as const,
    state: ['fleet', 'state'] as const,
    var: ['fleet', 'var'] as const,
    correlation: (regime: number) => ['fleet', 'correlation', regime] as const,
    correlationInsight: (regime: number) => ['fleet', 'correlation', regime, 'insight'] as const,
    benchmark: (ticker: string) => ['fleet', 'benchmark', ticker] as const,
    portfolioContribution: ['fleet', 'portfolio-contribution'] as const,
  },
  monitoring: {
    all: ['monitoring'] as const,
    regime: ['monitoring', 'regime'] as const,
    harness: (botId: string | null | undefined) =>
      ['monitoring', 'harness', botId] as const,
    report: (botId: string | null | undefined) =>
      ['monitoring', 'report', botId] as const,
  },
  strategies: {
    all: ['strategies'] as const,
    detail: (strategyId: string | null | undefined) =>
      ['strategies', strategyId] as const,
  },
  backtest: {
    all: ['backtest'] as const,
    list: ['backtest', 'list'] as const,
    job: (jobId: string | null | undefined) => ['backtest', jobId] as const,
    export: (jobId: string | null | undefined) =>
      ['backtest', jobId, 'export'] as const,
    trades: (jobId: string | null | undefined) =>
      ['backtest', jobId, 'trades'] as const,
    passport: (jobId: string | null | undefined) =>
      ['backtest', jobId, 'passport'] as const,
    chartData: (jobId: string | null | undefined) =>
      ['backtest', jobId, 'chart-data'] as const,
    regimeLabels: (jobId: string | null | undefined) =>
      ['backtest', jobId, 'regime-labels'] as const,
    insight: (jobId: string | null | undefined, sectionKey: string) =>
      ['backtest', jobId, 'insight', sectionKey] as const,
  },
} as const;
