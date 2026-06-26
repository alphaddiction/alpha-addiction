import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'pending';
  try {
    // Test connection
    await db.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'offline';
  }

  // Check variables without exposing values
  const envVariables = {
    DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'pending',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'pending',
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? 'configured' : 'pending',
    PRINTFUL_API_TOKEN: process.env.PRINTFUL_API_TOKEN ? 'configured' : 'pending',
    PRINTFUL_STORE_ID: process.env.PRINTFUL_STORE_ID ? 'configured' : 'pending',
    SMTP_USER: process.env.SMTP_USER ? 'configured' : 'pending',
    SMTP_PASS: process.env.SMTP_PASS ? 'configured' : 'pending',
  };

  // Determine modules operational status
  const modules = {
    database: dbStatus === 'connected' ? 'connected' : 'pending',
    paypal: (envVariables.PAYPAL_CLIENT_ID === 'configured' && envVariables.PAYPAL_CLIENT_SECRET === 'configured') ? 'configured' : 'pending',
    printful: (envVariables.PRINTFUL_API_TOKEN === 'configured' && envVariables.PRINTFUL_STORE_ID === 'configured') ? 'configured' : 'pending',
    email: (envVariables.SMTP_USER === 'configured' && envVariables.SMTP_PASS === 'configured') ? 'configured' : 'pending',
  };

  return NextResponse.json({
    web: 'online',
    api: 'online',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    envVariables,
    modules,
  });
}
