"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Settings, 
  Maximize2,
  Loader2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createChart } from 'lightweight-charts';
import type { IChartApi, CandlestickData, HistogramData, ISeriesApi } from 'lightweight-charts';
import { 
  CHART_THEME, 
  CANDLESTICK_CONFIG, 
  SMA_20_CONFIG, 
  SMA_50_CONFIG, 
  VOLUME_CONFIG,
  TIMEFRAMES,
  calculateSMA,
  formatPrice,
  formatVolume,
  createMarkers,
  createResizeObserver
} from '@/utils/chartUtils';
import { dataService } from '@/lib/dataService';

// Enhanced mock data for TradingView charts with realistic OHLC spreads
const mockCandlestickData: CandlestickData[] = [
  { time: '2024-01-01', open: 150.25, high: 155.80, low: 148.90, close: 153.45 },
  { time: '2024-01-02', open: 153.45, high: 159.20, low: 151.15, close: 157.30 },
  { time: '2024-01-03', open: 157.30, high: 162.50, low: 155.40, close: 159.20 },
  { time: '2024-01-04', open: 159.20, high: 165.75, low: 157.60, close: 163.90 },
  { time: '2024-01-05', open: 163.90, high: 168.40, low: 161.25, close: 165.15 },
  { time: '2024-01-08', open: 165.15, high: 171.30, low: 163.80, close: 169.45 },
  { time: '2024-01-09', open: 169.45, high: 174.60, low: 166.20, close: 168.80 },
  { time: '2024-01-10', open: 168.80, high: 177.95, low: 167.50, close: 175.42 },
  { time: '2024-01-11', open: 175.42, high: 179.20, low: 172.15, close: 176.80 },
  { time: '2024-01-12', open: 176.80, high: 181.45, low: 174.90, close: 178.25 },
  { time: '2024-01-15', open: 178.25, high: 182.60, low: 175.30, close: 179.85 },
  { time: '2024-01-16', open: 179.85, high: 184.20, low: 177.40, close: 181.50 },
  { time: '2024-01-17', open: 181.50, high: 185.75, low: 179.60, close: 183.20 },
  { time: '2024-01-18', open: 183.20, high: 186.80, low: 180.90, close: 185.40 },
  { time: '2024-01-19', open: 185.40, high: 189.25, low: 182.75, close: 187.60 },
];

const mockVolumeData: HistogramData[] = [
  { time: '2024-01-01', value: 1000000, color: '#10b981' },
  { time: '2024-01-02', value: 1100000, color: '#10b981' },
  { time: '2024-01-03', value: 900000, color: '#10b981' },
  { time: '2024-01-04', value: 1200000, color: '#10b981' },
  { time: '2024-01-05', value: 1050000, color: '#10b981' },
  { time: '2024-01-08', value: 1300000, color: '#10b981' },
  { time: '2024-01-09', value: 1150000, color: '#ef4444' },
  { time: '2024-01-10', value: 1400000, color: '#10b981' },
  { time: '2024-01-11', value: 980000, color: '#10b981' },
  { time: '2024-01-12', value: 1250000, color: '#10b981' },
  { time: '2024-01-15', value: 1180000, color: '#10b981' },
  { time: '2024-01-16', value: 1320000, color: '#10b981' },
  { time: '2024-01-17', value: 1090000, color: '#10b981' },
  { time: '2024-01-18', value: 1450000, color: '#10b981' },
  { time: '2024-01-19', value: 1270000, color: '#10b981' },
];

const mockSignals = [
  { time: '2024-01-02', type: 'buy' as const, price: 157.30, reason: '20-SMA crossed above 50-SMA' },
  { time: '2024-01-08', type: 'sell' as const, price: 169.45, reason: 'RSI overbought signal' },
  { time: '2024-01-11', type: 'buy' as const, price: 176.80, reason: 'Support level bounce' },
];

export function ChartPanel() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [currentPrice] = useState(178.25);
  const [priceChange] = useState(2.18);
  const [isLoading, setIsLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  // const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    const initChart = async () => {
      try {
        console.log('Initializing TradingView chart...');
        
        // Create chart instance
        const chart = createChart(chartRef.current, {
          ...CHART_THEME,
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
          rightPriceScale: {
            borderColor: '#4b5563',
            borderVisible: true,
            scaleMargins: {
              top: 0.1,
              bottom: 0.35, // Leave space for volume
            },
          },
        });
        
        chartInstanceRef.current = chart;
        console.log('Chart instance created successfully');

        // Add candlestick series using v4 API
        const candlestickSeries = chart.addCandlestickSeries(CANDLESTICK_CONFIG);
        candlestickSeriesRef.current = candlestickSeries;
        
        // Add volume series with separate price scale
        const volumeSeries = chart.addHistogramSeries({
          color: '#64748b',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        });
        volumeSeriesRef.current = volumeSeries;
        
        // Configure volume price scale
        chart.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.65, // Volume takes bottom 35% of chart
            bottom: 0,
          },
          borderVisible: false,
          visible: false, // Hide volume price labels
        });

        // Add SMA indicators if enabled
        if (showIndicators) {
          const sma20Series = chart.addLineSeries(SMA_20_CONFIG);
          const sma50Series = chart.addLineSeries(SMA_50_CONFIG);
          
          sma20SeriesRef.current = sma20Series;
          sma50SeriesRef.current = sma50Series;
        }

        // Load initial data
        const initialData = await dataService.getOHLCData('AAPL', selectedTimeframe);
        console.log('Initial data loaded:', initialData);
        
        candlestickSeries.setData(initialData);
        
        // Generate volume data
        const volumeData = initialData.map(candle => ({
          time: candle.time,
          value: candle.volume || (800000 + Math.random() * 800000),
          color: candle.close >= candle.open ? '#22c55e' : '#ef4444'
        }));
        volumeSeries.setData(volumeData);
        
        // Add SMA data if indicators are enabled
        if (showIndicators) {
          const sma20Data = calculateSMA(initialData, 20);
          const sma50Data = calculateSMA(initialData, 50);
          
          sma20SeriesRef.current?.setData(sma20Data);
          sma50SeriesRef.current?.setData(sma50Data);
        }

        // Add trading signals
        const markers = createMarkers(mockSignals);
        candlestickSeries.setMarkers(markers);

        // Setup resize observer
        const handleResize = () => {
          if (chartRef.current && chart) {
            chart.applyOptions({
              width: chartRef.current.clientWidth,
              height: chartRef.current.clientHeight,
            });
          }
        };

        resizeObserverRef.current = createResizeObserver(chartRef.current, handleResize);
        
        // Fit content and finish loading
        chart.timeScale().fitContent();
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error initializing chart:', error);
        setIsLoading(false);
      }
    };

    initChart();

    // Cleanup function
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [showIndicators, selectedTimeframe]);

  // Handle timeframe changes
  const handleTimeframeChange = async (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    setIsLoading(true);
    
    try {
      // Fetch new data for the selected timeframe
      const newData = await dataService.getOHLCData('AAPL', timeframe);
      console.log(`Loading ${timeframe} data:`, newData);
      
      // Update candlestick data
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(newData);
      }
      
      // Update volume data (generate matching volume)
      if (volumeSeriesRef.current) {
        const volumeData = newData.map((candle, i) => ({
          time: candle.time,
          value: candle.volume || (800000 + Math.random() * 800000),
          color: candle.close >= candle.open ? '#22c55e' : '#ef4444'
        }));
        volumeSeriesRef.current.setData(volumeData);
      }
      
      // Update indicators if enabled
      if (showIndicators) {
        const sma20Data = calculateSMA(newData, 20);
        const sma50Data = calculateSMA(newData, 50);
        
        if (sma20SeriesRef.current) {
          sma20SeriesRef.current.setData(sma20Data);
        }
        if (sma50SeriesRef.current) {
          sma50SeriesRef.current.setData(sma50Data);
        }
      }
      
      // Fit chart to new data
      chartInstanceRef.current?.timeScale().fitContent();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error changing timeframe:', error);
      setIsLoading(false);
    }
  };

  // Toggle indicators
  const toggleIndicators = () => {
    setShowIndicators(prev => !prev);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Handle fullscreen state changes here if needed
      console.log('Fullscreen changed:', !!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-none border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-lg">AAPL</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">
                {formatPrice(currentPrice)}
              </span>
              <Badge 
                variant={priceChange >= 0 ? "default" : "destructive"} 
                className={`text-sm font-medium ${priceChange >= 0 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
              >
                {priceChange >= 0 ? "+" : ""}{priceChange} ({((priceChange / currentPrice) * 100).toFixed(2)}%)
              </Badge>
            </div>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Timeframe Selector */}
            <div className="flex rounded-lg border border-border bg-muted/20">
              {TIMEFRAMES.map((tf) => (
                <Button
                  key={tf.value}
                  variant={selectedTimeframe === tf.value ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs px-3 h-8 rounded-none first:rounded-l-lg last:rounded-r-lg ${
                    selectedTimeframe === tf.value ? "bg-primary text-primary-foreground" : "hover:bg-muted/40"
                  }`}
                  onClick={() => handleTimeframeChange(tf.value)}
                  disabled={isLoading}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleIndicators}
                className={`h-8 w-8 p-0 ${
                  showIndicators ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : ""
                }`}
                title="Toggle Indicators"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
                title="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <div className="relative h-full w-full">
          {/* TradingView Lightweight Charts Container */}
          <div 
            ref={chartRef} 
            className="absolute inset-0 w-full h-full bg-gray-900 rounded-b-lg"
            style={{ minHeight: '500px' }}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Loading chart data...</span>
              </div>
            </div>
          )}
          
        </div>
      </CardContent>
    </Card>
  );
}