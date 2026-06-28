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

    // 2. Obtener drops filtrados (si dropId está especificado, solo ese drop)
    const dropWhere: any = {};
    if (dropId) {
      dropWhere.id = dropId;
    }
    const drops = await db.drop.findMany({
      where: dropWhere,
      include: {
        products: true
      }
    });

    // 3. Obtener pedidos pagados que cumplen los filtros de fecha
    const orderWhere: any = {
      OR: [
        { orderStatus: { in: ['paid', 'fulfillment_submitted', 'shipped'] } },
        { paymentStatus: 'pagado' }
      ]
    };
    if (dateFilter) {
      orderWhere.createdAt = dateFilter;
    }

    const orders = await db.order.findMany({
      where: orderWhere,
      include: {
        items: true
      }
    });

    // 4. Calcular métricas por Drop
    const dropsRanking = await Promise.all(drops.map(async (drop) => {
      const dropProductIds = drop.products.map(p => p.id);
      
      let revenue = 0;
      let quantitySold = 0;
      let salesCount = 0;

      // Calcular ventas del drop
      for (const order of orders) {
        const dropItems = order.items.filter(item => dropProductIds.includes(item.productId));
        if (dropItems.length > 0) {
          salesCount++;
          quantitySold += dropItems.reduce((acc, it) => acc + it.quantity, 0);
          revenue += dropItems.reduce((acc, it) => acc + it.total, 0);
        }
      }

      // Obtener waitlist count
      const waitlistUsers = await db.dropWaitlist.findMany({
        where: { dropId: drop.id },
        select: { email: true }
      });
      const waitlistEmails = [...new Set(waitlistUsers.map(w => w.email.trim().toLowerCase()))];
      const waitlistCount = waitlistEmails.length;

      // Calcular conversión de waitlist a compra (usuarios registrados en la waitlist que compraron productos de este drop)
      let buyersCount = 0;
      if (waitlistEmails.length > 0) {
        const buyers = await db.order.findMany({
          where: {
            email: { in: waitlistEmails },
            OR: [
              { orderStatus: { in: ['paid', 'fulfillment_submitted', 'shipped'] } },
              { paymentStatus: 'pagado' }
            ],
            items: {
              some: {
                productId: { in: dropProductIds }
              }
            }
          },
          select: { email: true }
        });
        const uniqueBuyerEmails = new Set(buyers.map(b => b.email.trim().toLowerCase()));
        buyersCount = uniqueBuyerEmails.size;
      }
      
      const conversionRate = waitlistCount > 0 ? (buyersCount / waitlistCount) * 100 : 0;

      return {
        id: drop.id,
        name: drop.name,
        slug: drop.slug,
        revenue,
        quantitySold,
        salesCount,
        waitlistCount,
        conversionRate
      };
    }));

    // Ordenar por ingresos del drop descendente
    dropsRanking.sort((a, b) => b.revenue - a.revenue);

    // Drop más vendido e ingresos más altos
    const dropMasVendido = dropsRanking[0] || null;

    // Drop con más waitlist
    const dropsByWaitlist = [...dropsRanking].sort((a, b) => b.waitlistCount - a.waitlistCount);
    const dropMasWaitlist = dropsByWaitlist[0] || null;

    // Conversión waitlist global a compra de los drops
    const totalWaitlistCount = dropsRanking.reduce((acc, d) => acc + d.waitlistCount, 0);
    const avgConversionRate = dropsRanking.length > 0 
      ? dropsRanking.reduce((acc, d) => acc + d.conversionRate, 0) / dropsRanking.length
      : 0;

    return NextResponse.json({
      success: true,
      range,
      dropId: dropId || null,
      dropMasVendido,
      dropMasWaitlist,
      globalWaitlistCount: totalWaitlistCount,
      avgConversionRate,
      rankings: {
        drops: dropsRanking
      }
    });
  } catch (error: any) {
    console.error('❌ [API Admin Analytics Drops] Error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar analíticas de drops.' },
      { status: 500 }
    );
  }
}
