import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { printfulFetch } from '@/lib/printful';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  
  // 1. Diagnóstico de Base de Datos (Neon PostgreSQL)
  let dbStatus: 'connected' | 'error' = 'error';
  let dbLatency = 0;
  let dbLastCheck = timestamp;
  
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (error) {
    console.error('❌ [Health API] Database connection failed:', error);
    dbStatus = 'error';
  }

  // 2. Diagnóstico de Printful API
  let printfulStatus: 'connected' | 'error' = 'error';
  let printfulLastSync = 'Desconocida';
  let printfulLastWebhook = 'Ninguno';
  let printfulLastOrder = 'Ninguno';

  try {
    const printfulCheck = await printfulFetch<any>('store');
    if (printfulCheck && printfulCheck.code === 200) {
      printfulStatus = 'connected';
    }
  } catch (error) {
    console.error('❌ [Health API] Printful API connection failed:', error);
    printfulStatus = 'error';
  }

  // Si la DB está conectada, buscar métricas e historial de Printful
  if (dbStatus === 'connected') {
    try {
      // Última sincronización de catálogo
      const lastSyncLog = await db.auditLog.findFirst({
        where: { action: 'SYNC_PRODUCTS_SUCCESS' },
        orderBy: { createdAt: 'desc' },
      });
      if (lastSyncLog) {
        printfulLastSync = lastSyncLog.createdAt.toLocaleString('es-ES');
      }

      // Último webhook recibido
      const lastWebhookEvent = await db.orderEvent.findFirst({
        where: { type: { startsWith: 'FULFILLMENT_' } },
        orderBy: { createdAt: 'desc' },
      });
      if (lastWebhookEvent) {
        printfulLastWebhook = `${lastWebhookEvent.createdAt.toLocaleString('es-ES')} (${lastWebhookEvent.type})`;
      }

      // Último pedido enviado
      const lastOrderSubmitted = await db.order.findFirst({
        where: { printfulOrderId: { not: null } },
        orderBy: { updatedAt: 'desc' },
      });
      if (lastOrderSubmitted) {
        printfulLastOrder = `#${lastOrderSubmitted.orderNumber} (Printful ID: #${lastOrderSubmitted.printfulOrderId})`;
      }
    } catch (dbError) {
      console.warn('⚠️ [Health API] Error recuperando detalles de Printful de la base de datos:', dbError);
    }
  }

  // 3. Diagnóstico de PayPal
  // Se marca como "Pendiente de configurar" para producción hasta que las variables reales se activen
  const paypalConfigured = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const paypalStatus = paypalConfigured ? 'configured' : 'pending_setup';

  // 4. Variables de entorno (Comprobación de existencia únicamente, sin exponer valores)
  const envStatus = {
    DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
    PRINTFUL_API_KEY: process.env.PRINTFUL_API_KEY ? 'configured' : 'missing',
    PRINTFUL_WEBHOOK_SECRET: (process.env.PRINTFUL_WEBHOOK_SECRET || process.env.PRINTFUL_WEBHOOK_SIGNING_SECRET) ? 'configured' : 'missing',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'missing',
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? 'configured' : 'missing',
    JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ? 'configured' : 'missing',
  };

  // 5. Métricas de Pedidos
  let ordersCount = {
    total: 0,
    paid: 0,
    pending: 0,
    production: 0,
    shipped: 0,
    failed: 0,
  };

  if (dbStatus === 'connected') {
    try {
      const allOrders = await db.order.findMany({
        select: { orderStatus: true, paymentStatus: true },
      });

      ordersCount.total = allOrders.length;
      allOrders.forEach(o => {
        if (o.paymentStatus === 'pagado') ordersCount.paid++;
        if (o.orderStatus === 'pago_pendiente') ordersCount.pending++;
        if (o.orderStatus === 'printful_production') ordersCount.production++;
        if (o.orderStatus === 'shipped') ordersCount.shipped++;
        if (o.orderStatus === 'fulfillment_failed' || o.orderStatus === 'failed') ordersCount.failed++;
      });
    } catch (oError) {
      console.warn('⚠️ [Health API] Error contando métricas de pedidos:', oError);
    }
  }

  // 6. Logs de Auditoría Recientes
  let recentLogs: any[] = [];
  if (dbStatus === 'connected') {
    try {
      recentLogs = await db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          details: true,
          ipAddress: true,
          createdAt: true,
        },
      });
    } catch (lError) {
      console.warn('⚠️ [Health API] Error consultando logs de auditoría:', lError);
    }
  }

  // Determinar estado general del Health Center
  let systemStatus: 'green' | 'yellow' | 'red' = 'green';
  if (dbStatus === 'error' || printfulStatus === 'error') {
    systemStatus = 'red';
  } else if (!paypalConfigured) {
    systemStatus = 'yellow';
  }

  return NextResponse.json({
    status: systemStatus,
    timestamp,
    system: {
      nextVersion: '16.1.6',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || 'local-build-2026',
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      lastCheck: dbLastCheck,
    },
    printful: {
      status: printfulStatus,
      lastSync: printfulLastSync,
      lastWebhook: printfulLastWebhook,
      lastOrder: printfulLastOrder,
    },
    paypal: {
      status: paypalStatus,
      mode: process.env.PAYPAL_API?.includes('sandbox') ? 'sandbox' : 'production',
      setupInfo: 'Pendiente de configurar credenciales reales de producción.',
    },
    envVariables: envStatus,
    orders: ordersCount,
    logs: recentLogs,
  });
}
