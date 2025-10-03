// Data service for delayed financial feeds
// Using mock data for now, easily extensible to real APIs

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CompanyData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  pe: number;
  eps: number;
  dividend: number;
  beta: number;
  volume: string;
  avgVolume: string;
}

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  timestamp: string;
  url?: string;
}

class DataService {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes for delayed data

  // Cache management
  private setCache(key: string, data: unknown, ttl = this.CACHE_TTL) {
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

  // Generate mock OHLC data with realistic patterns
  async getOHLCData(symbol: string, timeframe: string = '1D'): Promise<CandlestickData[]> {
    const cacheKey = `ohlc-${symbol}-${timeframe}`;
    const cached = this.getCache<CandlestickData[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate realistic OHLC data
    const data = this.generateRealisticOHLC(symbol, timeframe);
    this.setCache(cacheKey, data);
    
    return data;
  }

  // Get company fundamentals
  async getCompanyData(symbol: string): Promise<CompanyData> {
    const cacheKey = `company-${symbol}`;
    const cached = this.getCache<CompanyData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Mock company data (in real app, fetch from Alpha Vantage, Yahoo Finance, etc.)
    const data: CompanyData = {
      symbol,
      name: this.getCompanyName(symbol),
      sector: this.getSector(symbol),
      price: 175.42 + Math.random() * 10 - 5,
      change: Math.random() * 6 - 3,
      changePercent: Math.random() * 4 - 2,
      marketCap: '2.89T',
      pe: 29.4,
      eps: 5.96,
      dividend: 0.94,
      beta: 1.24,
      volume: '52.1M',
      avgVolume: '57.3M'
    };

    this.setCache(cacheKey, data);
    return data;
  }

  // Get news feed
  async getNews(symbol: string): Promise<NewsItem[]> {
    const cacheKey = `news-${symbol}`;
    const cached = this.getCache<NewsItem[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock news data
    const news = this.generateRealisticNews(symbol);
    this.setCache(cacheKey, news);
    
    return news;
  }

  // Technical indicators calculation
  calculateSMA(data: CandlestickData[], period: number): { time: string; value: number }[] {
    const sma: { time: string; value: number }[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const average = slice.reduce((sum, candle) => sum + candle.close, 0) / period;
      
      sma.push({
        time: data[i].time,
        value: average
      });
    }
    
    return sma;
  }

  // Generate realistic OHLC data with trends
  private generateRealisticOHLC(symbol: string, timeframe: string): CandlestickData[] {
    // Use parameters to vary data generation based on timeframe
    console.log(`Generating OHLC data for ${symbol} with timeframe ${timeframe}`);
    const data: CandlestickData[] = [];
    let basePrice = 150;
    const trend = Math.random() > 0.5 ? 1 : -1; // Random uptrend or downtrend
    
    // Adjust parameters based on timeframe
    const timeframeConfig = this.getTimeframeConfig(timeframe);
    const { periods, volatility, dateIncrement } = timeframeConfig;
    
    // Generate data for the specified number of periods
    for (let i = 0; i < periods; i++) {
      const date = new Date();
      
      // Adjust date based on timeframe
      switch (dateIncrement.unit) {
        case 'minutes':
          date.setMinutes(date.getMinutes() - ((periods - 1 - i) * dateIncrement.value));
          break;
        case 'hours':
          date.setHours(date.getHours() - ((periods - 1 - i) * dateIncrement.value));
          break;
        case 'days':
          date.setDate(date.getDate() - ((periods - 1 - i) * dateIncrement.value));
          break;
        case 'weeks':
          date.setDate(date.getDate() - ((periods - 1 - i) * dateIncrement.value * 7));
          break;
      }
      
      // Add trend and random walk
      const trendComponent = trend * 0.3 * Math.random();
      const randomWalk = (Math.random() - 0.5) * 2 * volatility;
      basePrice *= (1 + trendComponent + randomWalk);
      
      // Generate OHLC with realistic relationships
      const open = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const close = open + (Math.random() - 0.5) * open * 0.03;
      const high = Math.max(open, close) + Math.random() * Math.abs(close - open) * 2;
      const low = Math.min(open, close) - Math.random() * Math.abs(close - open) * 2;
      
      // Format time based on timeframe
      let timeString: string;
      if (dateIncrement.unit === 'minutes' || dateIncrement.unit === 'hours') {
        timeString = Math.floor(date.getTime() / 1000).toString(); // Unix timestamp for intraday
      } else {
        timeString = date.toISOString().split('T')[0]; // YYYY-MM-DD for daily+
      }
      
      data.push({
        time: timeString,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(800000 + Math.random() * 800000)
      });
      
      basePrice = close;
    }
    
    return data;
  }

  private getTimeframeConfig(timeframe: string) {
    const configs: Record<string, { periods: number; volatility: number; dateIncrement: { unit: string; value: number } }> = {
      '1m': { periods: 100, volatility: 0.001, dateIncrement: { unit: 'minutes', value: 1 } },
      '5m': { periods: 100, volatility: 0.003, dateIncrement: { unit: 'minutes', value: 5 } },
      '15m': { periods: 100, volatility: 0.008, dateIncrement: { unit: 'minutes', value: 15 } },
      '1H': { periods: 100, volatility: 0.015, dateIncrement: { unit: 'hours', value: 1 } },
      '1D': { periods: 50, volatility: 0.02, dateIncrement: { unit: 'days', value: 1 } },
      '1W': { periods: 52, volatility: 0.05, dateIncrement: { unit: 'weeks', value: 1 } },
    };
    
    return configs[timeframe] || configs['1D'];
  }

  private getCompanyName(symbol: string): string {
    const companies: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'AMD': 'Advanced Micro Devices, Inc.',
      'AMZN': 'Amazon.com, Inc.'
    };
    return companies[symbol] || `${symbol} Corporation`;
  }

  private getSector(symbol: string): string {
    const sectors: Record<string, string> = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Communication Services',
      'TSLA': 'Consumer Discretionary',
      'NVDA': 'Technology',
      'AMD': 'Technology',
      'AMZN': 'Consumer Discretionary'
    };
    return sectors[symbol] || 'Technology';
  }

  private generateRealisticNews(symbol: string): NewsItem[] {
    const headlines = [
      `${symbol} Reports Strong Q4 Earnings, Revenue Beats Expectations`,
      `${symbol} Announces New Strategic Initiative to Drive Growth`,
      `Analyst Upgrades ${symbol} Target Price on Positive Outlook`,
      `${symbol} Faces Supply Chain Challenges But Maintains Guidance`,
      `${symbol} Expands Market Share in Key Segment`,
    ];

    return headlines.map((headline, index) => ({
      id: index + 1,
      headline,
      summary: `${headline.substring(0, 50)}... Detailed analysis shows mixed signals for the stock's performance in the coming quarter.`,
      sentiment: ['positive', 'positive', 'positive', 'negative', 'positive'][index] as 'positive' | 'negative' | 'neutral',
      source: ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch', 'Yahoo Finance'][index],
      timestamp: `${index + 1} hour${index > 0 ? 's' : ''} ago`,
    }));
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const dataService = new DataService();

// Data source configuration for different providers
export const DATA_SOURCES = {
  ALPHA_VANTAGE: {
    name: 'Alpha Vantage',
    free_tier: '25 requests/day',
    delay: '15-20 minutes',
    cost: 'Free'
  },
  YAHOO_FINANCE: {
    name: 'Yahoo Finance',
    free_tier: 'Unlimited',
    delay: '15-20 minutes',
    cost: 'Free'
  },
  TWELVE_DATA: {
    name: 'Twelve Data',
    free_tier: '800 requests/day',
    delay: '15-20 minutes',
    cost: 'Free'
  }
};