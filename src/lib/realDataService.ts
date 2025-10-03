// Real market data service using API routes

export interface RealCandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

class RealDataService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  constructor() {}

  private setCache(key: string, data: any, ttl = this.CACHE_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  // Get real OHLCV data using Yahoo Finance API
  async getRealOHLCData(symbol: string, timeframe: string = '1D'): Promise<RealCandlestickData[]> {
    const cacheKey = `real-ohlc-${symbol}-${timeframe}`;
    const cached = this.getCache<RealCandlestickData[]>(cacheKey);
    
    if (cached) {
      console.log(`📦 Using cached data for ${symbol} ${timeframe}`);
      return cached;
    }

    try {
      console.log(`🗄️ Fetching DB data for ${symbol} ${timeframe}...`);
      
      // Call API route
      const response = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol.toUpperCase())}&timeframe=${encodeURIComponent(timeframe)}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch market data');
      }
      
      console.log(`✅ Fetched ${result.count} DB data points for ${symbol}`);
      this.setCache(cacheKey, result.data);
      return result.data;

    } catch (error) {
      console.error('❌ Error fetching market data from API:', error);
      // Fallback to mock data if API fails
      return this.generateFallbackData(symbol, timeframe);
    }
  }

  // Get current stock info (from API route)
  async getStockInfo(symbol: string): Promise<CompanyInfo> {
    try {
      const response = await fetch(`/api/stock-info?symbol=${encodeURIComponent(symbol.toUpperCase())}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stock info');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching stock info from API:', error);
      // Return fallback info
      return {
        symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0
      };
    }
  }



  // Fallback mock data if API fails
  private generateFallbackData(symbol: string, timeframe: string): RealCandlestickData[] {
    console.log(`🔄 Using fallback mock data for ${symbol} (${timeframe})`);
    
    const data: RealCandlestickData[] = [];
    let basePrice = symbol === 'AAPL' ? 180 : 150;
    
    // Determine number of data points based on timeframe
    let periods: number;
    let intervalMs: number;
    
    switch (timeframe) {
      case '1D':
        periods = 390; // 1-minute intervals in trading day (6.5 hours = 390 minutes)
        intervalMs = 1 * 60 * 1000;
        break;
      case '1W':
        periods = 1950; // 1-minute intervals for week (7 days * 6.5 hours * 60 minutes = 2730, but limiting to trading hours)
        intervalMs = 1 * 60 * 1000;
        break;
      case '1M':
        periods = 30; // Daily data for a month
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case '3M':
        periods = 90; // Daily data for 3 months
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case '6M':
        periods = 180; // Daily data for 6 months
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case 'YTD':
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        periods = Math.floor((now.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000));
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case '1Y':
        periods = 365; // Daily data for a year
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case '5Y':
        periods = 260; // Weekly data for 5 years
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        periods = 365;
        intervalMs = 24 * 60 * 60 * 1000;
        break;
    }

    for (let i = 0; i < periods; i++) {
      const date = new Date();
      date.setTime(date.getTime() - ((periods - 1 - i) * intervalMs));
      
      // More realistic price movements
      const volatility = 0.02;
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      basePrice *= (1 + randomChange);
      
      const open = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const close = open + (Math.random() - 0.5) * open * 0.03;
      const high = Math.max(open, close) + Math.random() * Math.abs(close - open) * 1.5;
      const low = Math.min(open, close) - Math.random() * Math.abs(close - open) * 1.5;
      
      // Format time based on timeframe (minute vs daily)
      let timeString: string;
      if (timeframe === '1D' || timeframe === '1W') {
        // For minute data, include full datetime
        timeString = date.toISOString();
      } else {
        // For daily/weekly data, use just the date
        timeString = date.toISOString().split('T')[0];
      }
      
      data.push({
        time: timeString,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(20000000 + Math.random() * 30000000)
      });
      
      basePrice = close;
    }
    
    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const realDataService = new RealDataService();