import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  const verified = await verifySessionToken(token);
  return !!verified;
}

export async function GET(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';
    const dropId = searchParams.get('dropId') || '';

    // 1. Filtros de fecha
    let dateFilter: any = undefined;
    if (range === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (range === '7days') {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: start };
    } else if (range === '30days') {
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: start };
    } else if (range === 'this_month') {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    }

    // 2. Resolver productos del drop si aplica
    let targetProductIds: string[] = [];
    if (dropId) {
      const productsInDrop = await db.product.findMany({
        where: { dropId },
        select: { id: true }
      });
      targetProductIds = productsInDrop.map(p => p.id);
    }

    // 3. Obtener todos los pedidos que cumplen los filtros (sin incluir borradores a menos que se solicite, pero incluyamos todos)
    const orderWhere: any = {};
    if (dateFilter) {
      orderWhere.createdAt = dateFilter;
    }
    if (dropId) {
      orderWhere.items = {
        some: {
          productId: { in: targetProductIds }
        }
      };
    }

    const orders = await db.order.findMany({
      where: orderWhere
    });

    // 4. Calcular métricas de logística
    let enviadosPrintful = 0;
    let enProduccion = 0;
    let enviados = 0;
    let conError = 0;

    // Resumen de estados
    const statusCounts: Record<string, number> = {
      draft: 0,
      paid: 0,
      fulfillment_submitted: 0,
      fulfillment_failed: 0,
      shipped: 0,
      canceled: 0
    };

    for (const order of orders) {
      const status = order.orderStatus.toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (order.printfulOrderId) {
        enviadosPrintful++;
        if (['paid', 'fulfillment_submitted'].includes(order.orderStatus)) {
          enProduccion++;
        }
      }
      if (order.orderStatus === 'shipped') {
        enviados++;
      }
      if (order.orderStatus === 'fulfillment_failed') {
        conError++;
      }
    }

    // Convertir el resumen de estados a lista
    const estadosResumen = Object.keys(statusCounts).map(status => ({
      status: status.toUpperCase(),
      count: statusCounts[status]
    }));

    return NextResponse.json({
      success: true,
      range,
      dropId: dropId || null,
      stats: {
        pedidosEnviadosPrintful: enviadosPrintful,
        pedidosEnProduccion: enProduccion,
        pedidosEnviados: enviados,
        pedidosConError: conError
      },
      estadosResumen
    });
  } catch (error: any) {
    console.error('❌ [API Admin Analytics Fulfillment] Error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar analíticas de logística.' },
      { status: 500 }
    );
  }
}
