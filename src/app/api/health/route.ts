import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'pending';
  try {
    // Test the database connection
    await db.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    console.error('❌ Database health check failed:', e);
    dbStatus = 'offline';
  }

  return NextResponse.json({
    status: dbStatus === 'connected' ? 'online' : 'degraded',
    web: 'online',
    api: 'online',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
