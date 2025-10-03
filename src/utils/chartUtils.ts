// Chart utilities for TradingView Lightweight Charts
import { DeepPartial, ChartOptions, CandlestickSeriesOptions, LineSeriesOptions, HistogramSeriesOptions, Time } from 'lightweight-charts';

// Chart theme configuration
export const CHART_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: '#111827' },
    textColor: '#e5e7eb',
    fontSize: 12,
  },
  grid: {
    vertLines: { color: '#374151', style: 1, visible: true },
    horzLines: { color: '#374151', style: 1, visible: true },
  },
  crosshair: {
    mode: 1,
    vertLine: {
      width: 1,
      color: '#9ca3af',
      style: 2,
      labelBackgroundColor: '#374151',
    },
    horzLine: {
      width: 1,
      color: '#9ca3af',
      style: 2,
      labelBackgroundColor: '#374151',
    },
  },
  timeScale: {
    borderColor: '#4b5563',
    timeVisible: true,
    secondsVisible: false,
    borderVisible: true,
  },
  rightPriceScale: {
    borderColor: '#4b5563',
    borderVisible: true,
    scaleMargins: {
      top: 0.05,
      bottom: 0.05,
    },
  },
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: true,
    pinch: true,
  },
};

// Candlestick series configuration
export const CANDLESTICK_CONFIG: DeepPartial<CandlestickSeriesOptions> = {
  upColor: '#22c55e', // Green for up candles
  downColor: '#ef4444', // Red for down candles
  borderUpColor: '#22c55e',
  borderDownColor: '#ef4444',
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
  borderVisible: true,
  wickVisible: true,
};

// SMA line series configurations
export const SMA_20_CONFIG: DeepPartial<LineSeriesOptions> = {
  color: '#3B82F6',
  lineWidth: 2,
  title: 'SMA 20',
  priceLineVisible: false,
  lastValueVisible: false,
};

export const SMA_50_CONFIG: DeepPartial<LineSeriesOptions> = {
  color: '#F59E0B',
  lineWidth: 2,
  title: 'SMA 50',
  priceLineVisible: false,
  lastValueVisible: false,
};

// Volume histogram configuration
export const VOLUME_CONFIG: DeepPartial<HistogramSeriesOptions> = {
  color: '#6B7280',
  priceFormat: {
    type: 'volume',
  },
  priceScaleId: 'volume', // Separate price scale for volume
};

// Chart timeframes - Trading periods
export const TIMEFRAMES = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1 Mo', value: '1M' },
  { label: '3 Mo', value: '3M' },
  { label: '6 Mo', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
] as const;

// Calculate Simple Moving Average
export function calculateSMA(data: Array<{time: Time, close: number}>, period: number) {
  const result = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
    const average = sum / period;
    
    result.push({
      time: data[i].time,
      value: average,
    });
  }
  
  return result;
}

// Format number for price display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

// Format number for volume display
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return (volume / 1e9).toFixed(1) + 'B';
  } else if (volume >= 1e6) {
    return (volume / 1e6).toFixed(1) + 'M';
  } else if (volume >= 1e3) {
    return (volume / 1e3).toFixed(1) + 'K';
  }
  return volume.toString();
}

// Generate trading signal markers
export function createMarkers(signals: Array<{time: Time, type: 'buy' | 'sell', price: number, reason: string}>) {
  return signals.map(signal => ({
    time: signal.time,
    position: signal.type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
    color: signal.type === 'buy' ? '#22C55E' : '#EF4444',
    shape: signal.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
    text: `${signal.type.toUpperCase()} @ ${formatPrice(signal.price)}`,
  }));
}

// Resize observer utility
export function createResizeObserver(element: HTMLElement, callback: () => void) {
  const resizeObserver = new ResizeObserver(callback);
  resizeObserver.observe(element);
  return resizeObserver;
}