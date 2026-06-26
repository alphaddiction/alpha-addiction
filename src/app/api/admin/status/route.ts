import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkEnvVar } from '@/lib/env/admin-env';

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

  const checkDb = checkEnvVar('DATABASE_URL');
  const checkPaypalClient = checkEnvVar('PAYPAL_CLIENT_ID');
  const checkPaypalSecret = checkEnvVar('PAYPAL_CLIENT_SECRET');
  const checkPrintful = checkEnvVar('PRINTFUL_API_KEY');
  const checkPrintfulStore = checkEnvVar('PRINTFUL_STORE_ID');
  const checkSmtpUser = checkEnvVar('SMTP_USER');
  const checkSmtpPass = checkEnvVar('SMTP_PASS');

  // Check variables using centralized validation layer
  const envVariables = {
    DATABASE_URL: checkDb.exists && !checkDb.isEmpty ? 'configured' : 'pending',
    PAYPAL_CLIENT_ID: checkPaypalClient.exists && !checkPaypalClient.isEmpty ? 'configured' : 'pending',
    PAYPAL_CLIENT_SECRET: checkPaypalSecret.exists && !checkPaypalSecret.isEmpty ? 'configured' : 'pending',
    PRINTFUL_API_TOKEN: checkPrintful.exists && !checkPrintful.isEmpty ? 'configured' : 'pending',
    PRINTFUL_STORE_ID: checkPrintfulStore.exists && !checkPrintfulStore.isEmpty ? 'configured' : 'pending',
    SMTP_USER: checkSmtpUser.exists && !checkSmtpUser.isEmpty ? 'configured' : 'pending',
    SMTP_PASS: checkSmtpPass.exists && !checkSmtpPass.isEmpty ? 'configured' : 'pending',
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
