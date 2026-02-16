import { RegimeType, DeploymentStatus, MetricFormat } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

export const formatCurrencyCompact = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return formatCurrency(value);
};

export const formatPercent = (value: number, withSign = false): string => {
  return `${value > 0 && withSign ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatNumber = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
};

export const getPLColor = (value: number): string => value >= 0 ? 'success.main' : 'error.main';

export const getRegimeColor = (regime: RegimeType): string => {
  const map: Record<RegimeType, string> = { LOW_VOL: 'info.light', NORMAL: 'success.light', HIGH_VOL: 'warning.main', CRISIS: 'error.main' };
  return map[regime];
};

export const getRegimeHex = (regime: RegimeType, mode: 'light' | 'dark' = 'light'): string => {
  const lightMap: Record<RegimeType, string> = { LOW_VOL: '#3B82F6', NORMAL: '#22C55E', HIGH_VOL: '#F59E0B', CRISIS: '#EF4444' };
  const darkMap: Record<RegimeType, string> = { LOW_VOL: '#58A6FF', NORMAL: '#56D364', HIGH_VOL: '#E3B341', CRISIS: '#FF7A6A' };
  return mode === 'dark' ? darkMap[regime] : lightMap[regime];
};

export const getStatusColor = (status: DeploymentStatus): string => {
  const map: Record<DeploymentStatus, string> = { active: 'success.main', paused: 'warning.main', stopped: 'error.main', idle: 'grey.500' };
  return map[status];
};

export const getStatusLabel = (status: DeploymentStatus): string => {
  const map: Record<DeploymentStatus, string> = { active: 'LIVE_TRADING', paused: 'PAUSED', stopped: 'STOPPED', idle: 'IDLE' };
  return map[status];
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return `${days}d ${hrs}h`;
};

export const formatMetric = (value: number | string, format: MetricFormat): string => {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'currency': return formatCurrency(value);
    case 'percent': return formatPercent(value);
    case 'ratio': return formatNumber(value, 2);
    case 'number': default: return formatNumber(value, 0);
  }
};

export const formatDateTime = (date: Date): string => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
export const formatDate = (date: Date): string => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
export const formatTime = (date: Date): string => new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
