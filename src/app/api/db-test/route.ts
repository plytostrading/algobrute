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
    const client = await pool.connect();
    
    try {
      // Test 1: Check if table exists and get structure
      console.log('🔍 Checking table structure...');
      const structureSQL = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'equity_price_aggregates'
        ORDER BY ordinal_position;
      `;
      const structureRes = await client.query(structureSQL);
      
      // Test 2: Get a sample of data
      console.log('🔍 Getting sample data...');
      const sampleSQL = `
        SELECT * FROM public.equity_price_aggregates 
        WHERE ticker = 'AAPL'
        ORDER BY timestamp DESC 
        LIMIT 5;
      `;
      const sampleRes = await client.query(sampleSQL);
      
      // Test 3: Check distinct tickers and timespans
      console.log('🔍 Checking distinct values...');
      const distinctSQL = `
        SELECT 
          (SELECT array_agg(DISTINCT ticker) FROM public.equity_price_aggregates LIMIT 10) as tickers,
          (SELECT array_agg(DISTINCT timespan) FROM public.equity_price_aggregates) as timespans,
          (SELECT COUNT(*) FROM public.equity_price_aggregates WHERE ticker = 'AAPL') as aapl_count;
      `;
      const distinctRes = await client.query(distinctSQL);
      
      return NextResponse.json({
        success: true,
        table_structure: structureRes.rows,
        sample_data: sampleRes.rows,
        meta_info: distinctRes.rows[0]
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}