import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolConfig } from 'pg';

// Database connection pool
const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  max: 5,
  idleTimeoutMillis: 30000,
});

function getTimeframeParams(timeframe: string) {
  const now = new Date();
  const endTimestamp = Math.floor(now.getTime() / 1000);
  let startTimestamp: number;

  switch (timeframe) {
    case '1D': // 1 Day - Minute candlesticks
      startTimestamp = Math.floor((now.getTime() - (1 * 24 * 60 * 60 * 1000)) / 1000);
      break;
      
    case '1W': // 1 Week - Minute candlesticks
      startTimestamp = Math.floor((now.getTime() - (7 * 24 * 60 * 60 * 1000)) / 1000);
      break;
      
    case '1M': // 1 Month (30 days)
      startTimestamp = Math.floor((now.getTime() - (30 * 24 * 60 * 60 * 1000)) / 1000);
      break;
      
    case '3M': // 3 Months (90 days)
      startTimestamp = Math.floor((now.getTime() - (90 * 24 * 60 * 60 * 1000)) / 1000);
      break;
      
    case '6M': // 6 Months (180 days)
      startTimestamp = Math.floor((now.getTime() - (180 * 24 * 60 * 60 * 1000)) / 1000);
      break;
      
    case 'YTD': // Year to Date (from January 1 of current year to today)
      const yearStart = new Date(now.getFullYear(), 0, 1);
      startTimestamp = Math.floor(yearStart.getTime() / 1000);
      break;
      
    case '1Y': // 1 Year (past 12 months)
      startTimestamp = Math.floor((now.getTime() - (365 * 24 * 60 * 60 * 1000)) / 1000);
      break;
      
    case '5Y': // 5 Years (past 5 years)
      startTimestamp = Math.floor((now.getTime() - (5 * 365 * 24 * 60 * 60 * 1000)) / 1000);
      break;
      
    default:
      // Default to 1Y
      startTimestamp = Math.floor((now.getTime() - (365 * 24 * 60 * 60 * 1000)) / 1000);
      break;
  }
  
  console.log(`📅 Timeframe ${timeframe}: ${new Date(startTimestamp * 1000).toDateString()} to ${new Date(endTimestamp * 1000).toDateString()}`);
  
  return { startTimestamp, endTimestamp };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    const timeframe = searchParams.get('timeframe') || '1Y';

    console.log(`🗄️ Fetching DB data for ${symbol} ${timeframe}...`);
    
    // Calculate date range based on timeframe
    const { startTimestamp, endTimestamp } = getTimeframeParams(timeframe);
    const timespan = (timeframe === '1D' || timeframe === '1W') ? 'minute' : 'day';

    // Query PostgreSQL
    const sql = `
      SELECT 
        "timestamp" AT TIME ZONE 'UTC' as ts_utc,
        open, high, low, close, volume
      FROM public.equity_price_aggregates
      WHERE ticker = $1
        AND LOWER(timespan) = LOWER($2)
        AND "timestamp" BETWEEN to_timestamp($3) AND to_timestamp($4)
      ORDER BY "timestamp" ASC
    `;
    const normalizedSymbol = symbol.toUpperCase();
    const normalizedTimespan = (timeframe === '1D' || timeframe === '1W') ? 'minute' : 'day';
    const params = [normalizedSymbol, normalizedTimespan, startTimestamp, endTimestamp];
    
    const client = await pool.connect();
    try {
      const res = await client.query(sql, params);
      const ohlcData = res.rows.map((row: any) => {
        const dateObj = new Date(row.ts_utc);
        const timeString = (timespan === 'minute')
          ? dateObj.toISOString()
          : dateObj.toISOString().split('T')[0];
        return {
          time: timeString,
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          volume: Number(row.volume) || 0,
        };
      });
      
      console.log(`✅ Fetched ${ohlcData.length} DB data points for ${symbol}`);
      
      return NextResponse.json({
        success: true,
        data: ohlcData,
        count: ohlcData.length,
        timeframe,
        timespan
      });
    } catch (e) {
      console.error('DB query failed', { sql, params, error: e });
      throw e;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error fetching market data from DB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }, { status: 500 });
  }
}