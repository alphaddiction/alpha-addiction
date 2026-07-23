import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

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

    // 1. Construir filtros de fecha
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

    // 3. Construir filtros de pedidos
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

    // 4. Obtener pedidos que cumplen los criterios
    const orders = await db.order.findMany({
      where: orderWhere,
      include: {
        items: true
      }
    });

    // 5. Calcular métricas
    let totalRevenue = 0;
    let totalNetProfit = 0;
    let totalDiscountsApplied = 0;
    let paidOrdersCount = 0;
    let canceledOrdersCount = 0;
    let refundedOrdersCount = 0;
    let totalOrdersCount = orders.length;
    let totalProductsSold = 0;
    let ordersWithCouponsCount = 0;

    for (const order of orders) {
      const isPaid = ['paid', 'fulfillment_submitted', 'shipped'].includes(order.orderStatus) || order.paymentStatus === 'pagado';
      const isCanceled = order.orderStatus === 'canceled';
      const isRefunded = order.paymentStatus === 'reembolsado';

      if (isCanceled) canceledOrdersCount++;
      if (isRefunded) refundedOrdersCount++;

      if (isPaid) {
        paidOrdersCount++;
        
        // Si hay filtro por drop, calcular sobre los items del drop, si no sobre todo el pedido
        if (dropId) {
          const dropItems = order.items.filter(item => targetProductIds.includes(item.productId));
          const dropItemsCost = dropItems.reduce((acc, it) => acc + (it.costPrice * it.quantity), 0);
          const dropItemsRevenue = dropItems.reduce((acc, it) => acc + it.total, 0);
          
          totalRevenue += dropItemsRevenue;
          totalProductsSold += dropItems.reduce((acc, it) => acc + it.quantity, 0);
          
          // Costes netos proporcionales
          totalNetProfit += (dropItemsRevenue - dropItemsCost);
        } else {
          totalRevenue += order.total;
          totalNetProfit += order.netProfit;
          totalDiscountsApplied += order.discount;
          totalProductsSold += order.items.reduce((acc, item) => acc + item.quantity, 0);
          if (order.discountCode) {
            ordersWithCouponsCount++;
          }
        }
      }
    }

    // Calcular ticket medio de pedidos pagados
    const ticketMedio = paidOrdersCount > 0 ? (totalRevenue / paidOrdersCount) : 0;
    // Tasa de uso de cupones sobre pedidos pagados
    const tasaUsoCupones = paidOrdersCount > 0 ? (ordersWithCouponsCount / paidOrdersCount) * 100 : 0;

    return NextResponse.json({
      success: true,
      range,
      dropId: dropId || null,
      stats: {
        ticketMedio,
        pedidosTotales: totalOrdersCount,
        pedidosPagados: paidOrdersCount,
        pedidosCancelados: canceledOrdersCount,
        pedidosReembolsados: refundedOrdersCount,
        productosVendidos: totalProductsSold,
        descuentoTotal: totalDiscountsApplied,
        tasaUsoCupones,
        ingresosBrutos: totalRevenue,
        beneficioNeto: totalNetProfit
      }
    });
  } catch (error: any) {
    console.error('❌ [API Admin Analytics Advanced] Error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar analíticas avanzadas.' },
      { status: 500 }
    );
  }
}
