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

    // 3. Obtener pedidos pagados que cumplen los filtros
    const orderWhere: any = {
      OR: [
        { orderStatus: { in: ['paid', 'fulfillment_submitted', 'shipped'] } },
        { paymentStatus: 'pagado' }
      ]
    };
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
      where: orderWhere,
      include: {
        items: true
      }
    });

    // 4. Agrupar métricas
    const productStats: Record<string, { name: string; qty: number; revenue: number; ordersCount: Set<string> }> = {};
    const sizeStats: Record<string, number> = {};
    const colorStats: Record<string, number> = {};

    for (const order of orders) {
      for (const item of order.items) {
        // Si hay filtro de drop, ignorar items de otros productos
        if (dropId && !targetProductIds.includes(item.productId)) continue;

        // Estadísticas de producto
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.name,
            qty: 0,
            revenue: 0,
            ordersCount: new Set()
          };
        }
        const pStat = productStats[item.productId];
        pStat.qty += item.quantity;
        pStat.revenue += item.total;
        pStat.ordersCount.add(order.id);

        // Estadísticas de talla
        const sizeKey = item.size.trim().toUpperCase();
        sizeStats[sizeKey] = (sizeStats[sizeKey] || 0) + item.quantity;

        // Estadísticas de color
        const colorKey = item.color.trim();
        colorStats[colorKey] = (colorStats[colorKey] || 0) + item.quantity;
      }
    }

    // Formatear ranking de productos
    const productsRanking = Object.keys(productStats).map(id => ({
      id,
      name: productStats[id].name,
      quantitySold: productStats[id].qty,
      revenue: productStats[id].revenue,
      ordersCount: productStats[id].ordersCount.size
    })).sort((a, b) => b.quantitySold - a.quantitySold);

    // Formatear ranking de tallas
    const tallasRanking = Object.keys(sizeStats).map(size => ({
      size,
      quantitySold: sizeStats[size]
    })).sort((a, b) => b.quantitySold - a.quantitySold);

    // Formatear ranking de colores
    const coloresRanking = Object.keys(colorStats).map(color => ({
      color,
      quantitySold: colorStats[color]
    })).sort((a, b) => b.quantitySold - a.quantitySold);

    // Obtener "Más vendidos"
    const productoMasVendido = productsRanking[0] || null;
    const tallaMasVendida = tallasRanking[0] || null;
    const colorMasVendido = coloresRanking[0] || null;

    return NextResponse.json({
      success: true,
      range,
      dropId: dropId || null,
      productoMasVendido,
      tallaMasVendida,
      colorMasVendido,
      rankings: {
        products: productsRanking,
        sizes: tallasRanking,
        colors: coloresRanking
      }
    });
  } catch (error: any) {
    console.error('❌ [API Admin Analytics Products] Error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar analíticas de productos.' },
      { status: 500 }
    );
  }
}
