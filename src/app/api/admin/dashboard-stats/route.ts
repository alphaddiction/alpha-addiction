import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth-tokens';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('alpha_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const verified = await verifySessionToken(token);
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Ventas de hoy
    const ordersToday = await db.order.findMany({
      where: {
        createdAt: { gte: startOfToday },
        orderStatus: { not: 'canceled' }
      },
      select: { total: true }
    });
    const salesToday = ordersToday.reduce((sum, o) => sum + o.total, 0);

    // 2. Ventas del mes
    const ordersMonth = await db.order.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        orderStatus: { not: 'canceled' }
      },
      select: { total: true }
    });
    const salesMonth = ordersMonth.reduce((sum, o) => sum + o.total, 0);

    // 3. Pedidos por estados
    const statusCounts = await db.order.groupBy({
      by: ['orderStatus'],
      _count: true
    });

    let pendingCount = 0;
    let productionCount = 0;
    let shippedCount = 0;

    for (const group of statusCounts) {
      const status = group.orderStatus;
      if (status === 'paid' || status === 'draft' || status === 'fulfillment_failed') {
        pendingCount += group._count;
      } else if (status === 'fulfillment_submitted') {
        productionCount += group._count;
      } else if (status === 'shipped') {
        shippedCount += group._count;
      }
    }

    // 4. Incidencias abiertas (open, pending, replied)
    const openTicketsCount = await db.supportTicket.count({
      where: {
        status: { in: ['open', 'pending', 'replied'] }
      }
    });

    // 5. Clientes activos (direcciones de email únicas)
    const distinctEmails = await db.order.findMany({
      distinct: ['email'],
      select: { email: true }
    });
    const activeCustomers = distinctEmails.length;

    // 6. Registros en Waitlist
    const waitlistCount = await db.dropWaitlist.count();

    // 7. Integraciones
    const integrations = {
      paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      printful: !!(process.env.PRINTFUL_API_KEY && process.env.PRINTFUL_STORE_ID),
      resend: !!process.env.RESEND_API_KEY,
      sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      backups: process.env.ENABLE_BACKUPS === 'true',
    };

    // 8. Alertas
    const alerts = [];
    if (!integrations.sentry) {
      alerts.push('Sentry no está configurado en producción.');
    }
    if (process.env.ENABLE_TEST_PURCHASES === 'true') {
      alerts.push('Compras de prueba activadas en las variables de entorno.');
    }
    if (!integrations.paypal) {
      alerts.push('Credenciales de PayPal pendientes de configuración.');
    }
    if (!integrations.printful) {
      alerts.push('Credenciales de Printful pendientes de configuración.');
    }

    // 9. Estado de Salud (simulado rápido en base a alertas)
    let healthStatus = 'green';
    if (alerts.length > 0) {
      healthStatus = process.env.ENABLE_TEST_PURCHASES === 'true' ? 'red' : 'yellow';
    }

    return NextResponse.json({
      success: true,
      metrics: {
        salesToday,
        salesMonth,
        pendingCount,
        productionCount,
        shippedCount,
        openTicketsCount,
        activeCustomers,
        waitlistCount
      },
      integrations,
      alerts,
      healthStatus
    });

  } catch (error: any) {
    console.error('❌ [Dashboard Stats API GET] Error:', error);
    return NextResponse.json({
      error: 'Error del servidor.',
      message: error.message
    }, { status: 500 });
  }
}
