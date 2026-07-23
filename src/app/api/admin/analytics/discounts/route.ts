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

    // 3. Obtener pedidos pagados que aplican cupones
    const orderWhere: any = {
      discountCode: { not: null },
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
      where: orderWhere
    });

    // 4. Agrupar cupones
    const couponStats: Record<string, { code: string; uses: number; totalDiscount: number; totalRevenue: number }> = {};

    for (const order of orders) {
      const code = order.discountCode || 'UNKNOWN';
      if (!couponStats[code]) {
        couponStats[code] = {
          code,
          uses: 0,
          totalDiscount: 0,
          totalRevenue: 0
        };
      }
      const stat = couponStats[code];
      stat.uses++;
      stat.totalDiscount += order.discount;
      stat.totalRevenue += order.total;
    }

    // Ordenar ranking de cupones
    const cuponesRanking = Object.keys(couponStats).map(code => ({
      code,
      uses: couponStats[code].uses,
      totalDiscount: couponStats[code].totalDiscount,
      totalRevenue: couponStats[code].totalRevenue
    })).sort((a, b) => b.uses - a.uses);

    const cuponMasUsado = cuponesRanking[0] || null;

    return NextResponse.json({
      success: true,
      range,
      dropId: dropId || null,
      cuponMasUsado,
      rankings: {
        coupons: cuponesRanking
      }
    });
  } catch (error: any) {
    console.error('❌ [API Admin Analytics Discounts] Error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar analíticas de cupones.' },
      { status: 500 }
    );
  }
}
