import type { BacktestExportMetadata, BacktestJobSummary, BacktestResult } from '@/types/api';

type BacktestDisplaySource =
  | Pick<
      BacktestJobSummary,
      'display_label' | 'strategy_id' | 'strategy_name' | 'ticker' | 'start_date' | 'end_date'
    >
  | Pick<
      BacktestResult,
      'display_label' | 'strategy_id' | 'strategy_name' | 'validation_window'
    >
  | Pick<
      BacktestExportMetadata,
      'display_label' | 'strategy_id' | 'strategy_name' | 'ticker' | 'start_date' | 'end_date'
    >;

export function getBacktestDisplayLabel(
  source: BacktestDisplaySource,
  fallback?: {
    ticker?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  },
): string {
  if ('display_label' in source && source.display_label) {
    return source.display_label;
  }
  const strategyName = ('strategy_name' in source && source.strategy_name) || source.strategy_id;
  const ticker = ('ticker' in source ? source.ticker : fallback?.ticker) ?? 'UNKNOWN';
  const startDate = ('start_date' in source ? source.start_date : fallback?.startDate) ?? 'unknown';
  const endDate = ('end_date' in source ? source.end_date : fallback?.endDate) ?? 'unknown';
  return `${strategyName}-${ticker.toUpperCase()}-${startDate}→${endDate}`;
}

export function formatBacktestComputeTime(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 60) {
    return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.round(seconds % 60);
    return `${minutes}m ${remainder}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
