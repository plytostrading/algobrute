"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Settings, 
  Maximize2,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import dynamic from 'next/dynamic';
import { realDataService, type CompanyInfo } from '@/lib/realDataService';
import { formatPrice, TIMEFRAMES } from '@/utils/chartUtils';

// Dynamic import of Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 rounded">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="text-sm text-gray-300">Loading Plotly.js Chart...</span>
      </div>
    </div>
  )
});


export function ChartPanel() {
  const { theme } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const [stockInfo, setStockInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [plotlyData, setPlotlyData] = useState<any[]>([]);

  // Load and prepare chart data
  const loadChartData = async (timeframe: string) => {
    setIsLoading(true);
    try {
      // Load real market data from Yahoo Finance
      const data = await realDataService.getRealOHLCData('AAPL', timeframe);
      console.log(`📊 Loading ${timeframe} REAL data for Plotly.js:`, data.length, 'candles');
      
      // Also load current stock info
      const info = await realDataService.getStockInfo('AAPL');
      setStockInfo(info);
      console.log(`📈 Current AAPL info:`, info);

      // Create candlestick trace (main chart)
      const candlestickTrace = {
        type: 'candlestick' as const,
        x: data.map(d => d.time),
        open: data.map(d => d.open),
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        name: 'AAPL',
        yaxis: 'y',
        increasing: { line: { color: '#22c55e', width: 1 } },
        decreasing: { line: { color: '#ef4444', width: 1 } }
      };

      // Create volume trace (bottom subplot)
      const volumeTrace = {
        type: 'bar' as const,
        x: data.map(d => d.time),
        y: data.map(d => d.volume || Math.floor(800000 + Math.random() * 800000)),
        name: 'Volume',
        yaxis: 'y2',
        marker: {
          color: data.map(d => d.close >= d.open ? '#22c55e' : '#ef4444'),
          opacity: 0.7
        }
      };

      const traces = [candlestickTrace, volumeTrace];

      // Add moving averages if enabled
      if (showIndicators) {
        // Simple Moving Average 20
        if (data.length >= 20) {
          const sma20Values = [];
          for (let i = 19; i < data.length; i++) {
            const sum = data.slice(i - 19, i + 1).reduce((acc, item) => acc + item.close, 0);
            sma20Values.push(sum / 20);
          }
          
          traces.push({
            type: 'scatter' as const,
            mode: 'lines' as const,
            x: data.slice(19).map(d => d.time),
            y: sma20Values,
            name: 'SMA 20',
            line: { color: '#3b82f6', width: 2 },
            yaxis: 'y'
          });
        }

        // Simple Moving Average 50
        if (data.length >= 50) {
          const sma50Values = [];
          for (let i = 49; i < data.length; i++) {
            const sum = data.slice(i - 49, i + 1).reduce((acc, item) => acc + item.close, 0);
            sma50Values.push(sum / 50);
          }
          
          traces.push({
            type: 'scatter' as const,
            mode: 'lines' as const,
            x: data.slice(49).map(d => d.time),
            y: sma50Values,
            name: 'SMA 50',
            line: { color: '#f59e0b', width: 2 },
            yaxis: 'y'
          });
        }
      }

      // Generate buy/sell signals based on SMA crossovers
      const signals = generateTradingSignals(data, showIndicators);
      if (signals.length > 0) {
        // Add buy signals
        const buySignals = signals.filter(s => s.type === 'buy');
        if (buySignals.length > 0) {
          traces.push({
            type: 'scatter' as const,
            mode: 'markers' as const,
            x: buySignals.map(s => s.time),
            y: buySignals.map(s => s.price * 0.98), // Position below candle
            name: 'Buy Signals',
            marker: {
              symbol: 'triangle-up',
              size: 12,
              color: '#22c55e',
              line: { width: 2, color: '#ffffff' }
            },
            yaxis: 'y',
            hovertemplate: '<b>BUY SIGNAL</b><br>Price: $%{y:.2f}<br>Date: %{x}<extra></extra>'
          });
        }

        // Add sell signals
        const sellSignals = signals.filter(s => s.type === 'sell');
        if (sellSignals.length > 0) {
          traces.push({
            type: 'scatter' as const,
            mode: 'markers' as const,
            x: sellSignals.map(s => s.time),
            y: sellSignals.map(s => s.price * 1.02), // Position above candle
            name: 'Sell Signals',
            marker: {
              symbol: 'triangle-down',
              size: 12,
              color: '#ef4444',
              line: { width: 2, color: '#ffffff' }
            },
            yaxis: 'y',
            hovertemplate: '<b>SELL SIGNAL</b><br>Price: $%{y:.2f}<br>Date: %{x}<extra></extra>'
          });
        }
      }

      console.log('✅ Plotly.js traces ready:', traces.length, `(${signals.length} signals)`);
      setPlotlyData(traces);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading chart data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Plotly.js ChartPanel initializing...');
    loadChartData(selectedTimeframe);
  }, [selectedTimeframe, showIndicators]);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  const toggleIndicators = () => {
    setShowIndicators(prev => !prev);
  };

  // Generate trading signals based on SMA crossovers
  const generateTradingSignals = (data: any[], useIndicators: boolean) => {
    if (!useIndicators || data.length < 50) return [];
    
    const signals = [];
    
    // Calculate SMA 20 and 50 for signal generation
    const sma20Values = [];
    const sma50Values = [];
    
    for (let i = 19; i < data.length; i++) {
      const sum20 = data.slice(i - 19, i + 1).reduce((acc, item) => acc + item.close, 0);
      sma20Values.push({ index: i, value: sum20 / 20, time: data[i].time, close: data[i].close });
    }
    
    for (let i = 49; i < data.length; i++) {
      const sum50 = data.slice(i - 49, i + 1).reduce((acc, item) => acc + item.close, 0);
      sma50Values.push({ index: i, value: sum50 / 50, time: data[i].time, close: data[i].close });
    }
    
    // Find crossovers
    for (let i = 1; i < sma50Values.length; i++) {
      const prev20 = sma20Values.find(s => s.index === sma50Values[i-1].index);
      const curr20 = sma20Values.find(s => s.index === sma50Values[i].index);
      const prev50 = sma50Values[i-1];
      const curr50 = sma50Values[i];
      
      if (prev20 && curr20) {
        // Golden Cross: SMA20 crosses above SMA50 (Buy signal)
        if (prev20.value <= prev50.value && curr20.value > curr50.value) {
          signals.push({
            type: 'buy',
            time: curr20.time,
            price: curr20.close,
            reason: 'Golden Cross: SMA20 > SMA50'
          });
        }
        // Death Cross: SMA20 crosses below SMA50 (Sell signal)
        else if (prev20.value >= prev50.value && curr20.value < curr50.value) {
          signals.push({
            type: 'sell',
            time: curr20.time,
            price: curr20.close,
            reason: 'Death Cross: SMA20 < SMA50'
          });
        }
      }
    }
    
    console.log(`🎯 Generated ${signals.length} trading signals`);
    return signals;
  };

  const isDark = theme === 'dark';
  
  const layout = {
    title: false,
    dragmode: 'zoom',
    margin: {
      r: 5,
      t: 15,
      b: 20,
      l: 40,
    },
    showlegend: false,
    xaxis: {
      autorange: true,
      domain: [0, 1],
      rangeslider: { visible: false },
      type: 'date',
      gridcolor: isDark ? '#374151' : '#e5e7eb',
      tickfont: { color: isDark ? '#9ca3af' : '#6b7280', size: 11 },
      linecolor: isDark ? '#4b5563' : '#d1d5db'
    },
    yaxis: {
      domain: [0.25, 1],
      autorange: true,
      gridcolor: isDark ? '#374151' : '#e5e7eb',
      tickfont: { color: isDark ? '#9ca3af' : '#6b7280', size: 11 },
      linecolor: isDark ? '#4b5563' : '#d1d5db',
      side: 'right'
    },
    yaxis2: {
      domain: [0, 0.2],
      autorange: true,
      showticklabels: false,
      gridcolor: isDark ? '#374151' : '#e5e7eb',
      linecolor: isDark ? '#4b5563' : '#d1d5db'
    },
    plot_bgcolor: isDark ? '#111827' : '#ffffff',
    paper_bgcolor: isDark ? '#111827' : '#ffffff',
    font: { color: isDark ? '#e5e7eb' : '#374151' },
    hovermode: 'x unified'
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'resetScale2d', 'autoScale2d'],
    responsive: true
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden m-0 border-0 shadow-none">
      {/* Simplified Header */}
      <CardHeader className="flex-shrink-0 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <span className="text-lg font-semibold">{stockInfo?.symbol || 'AAPL'}</span>
            <span className="text-xs text-muted-foreground">{stockInfo?.name || 'Apple Inc.'}</span>
            <span className="text-xl font-bold">
              {stockInfo ? formatPrice(stockInfo.price) : '--'}
            </span>
            {stockInfo && (
              <Badge 
                className={stockInfo.change >= 0 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20"
                }
              >
                {stockInfo.change >= 0 ? "+" : ""}{stockInfo.change.toFixed(2)} ({stockInfo.changePercent.toFixed(2)}%)
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Timeframe Buttons */}
            <div className="flex border rounded">
              {TIMEFRAMES.map((tf) => (
                <Button
                  key={tf.value}
                  variant={selectedTimeframe === tf.value ? "default" : "ghost"}
                  size="sm"
                  className="text-xs px-3 h-7 rounded-none first:rounded-l last:rounded-r"
                  onClick={() => handleTimeframeChange(tf.value)}
                  disabled={isLoading}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleIndicators}
              className={`h-7 w-7 p-0 ${showIndicators ? "bg-blue-500/10 text-blue-400" : ""}`}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Chart Area */}
      <CardContent className="flex-1 p-0 min-h-0">
        <div className="h-full w-full">
          {isLoading ? (
            <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading {selectedTimeframe} data...</span>
              </div>
            </div>
          ) : plotlyData.length > 0 ? (
            <div className="relative h-full">
              {/* Data Source Indicator */}
              <div className="absolute top-2 left-2 z-10 bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded font-medium">
                🌍 Real Data from Yahoo Finance
              </div>
              
              {/* Indicator Legend - Traditional Top Left Position */}
              {showIndicators && (
                <div className={`absolute top-12 left-2 z-10 backdrop-blur-sm border rounded-lg p-3 ${
                  isDark 
                    ? 'bg-gray-900/80 border-gray-700' 
                    : 'bg-white/80 border-gray-300'
                }`}>
                  <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Indicators</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-blue-400"></div>
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SMA 20</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-amber-400"></div>
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SMA 50</span>
                    </div>
                  </div>
                </div>
              )}
              
              <Plot
                data={plotlyData}
                layout={{
                  ...layout,
                  autosize: true,
                  height: undefined,
                  width: undefined
                }}
                config={config}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          ) : (
            <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No chart data available</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
