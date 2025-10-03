import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';

    const client = await pool.connect();
    try {
      const sql = `
        WITH last_two AS (
          SELECT close, "timestamp"
          FROM public.equity_price_aggregates
          WHERE ticker = $1 AND LOWER(timespan) = 'day'
          ORDER BY "timestamp" DESC
          LIMIT 2
        )
        SELECT 
          (SELECT close FROM last_two ORDER BY "timestamp" DESC LIMIT 1) as last_close,
          (SELECT close FROM last_two ORDER BY "timestamp" DESC OFFSET 1 LIMIT 1) as prev_close
      `;
      const res = await client.query(sql, [symbol.toUpperCase()]);
      const row = res.rows[0] || {};
      const last = Number(row.last_close) || 0;
      const prev = Number(row.prev_close) || last;
      const change = last - prev;
      const changePercent = prev ? (change / prev) * 100 : 0;
      
      const stockInfo = {
        symbol,
        name: symbol,
        price: last,
        change,
        changePercent,
        volume: 0,
      };
      
      return NextResponse.json({
        success: true,
        data: stockInfo
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error fetching stock info from DB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        symbol: 'AAPL',
        name: 'AAPL',
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0
      }
    }, { status: 500 });
  }
}