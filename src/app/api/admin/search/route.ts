import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth-tokens';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q) {
      return NextResponse.json({
        orders: [],
        products: [],
        drops: [],
        tickets: [],
        logs: []
      });
    }

    // 1. Buscar Pedidos (Order)
    const orders = await db.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { paypalOrderId: { contains: q, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        name: true,
        email: true,
        total: true,
        orderStatus: true
      }
    });

    // 2. Buscar Productos (Product)
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        priceEUR: true
      }
    });

    // 3. Buscar Drops (Drop)
    const drops = await db.drop.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      }
    });

    // 4. Buscar Tickets de Soporte (SupportTicket)
    const tickets = await db.supportTicket.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: q, mode: 'insensitive' } },
          { subject: { contains: q, mode: 'insensitive' } },
          { customerEmail: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 6,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true
      }
    });

    // 5. Buscar Audit Logs (AuditLog)
    const logs = await db.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { details: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true
      }
    });

    // Devolver resultados agrupados
    return NextResponse.json({
      orders: orders.map(o => ({
        id: o.id,
        title: `Pedido ${o.orderNumber}`,
        subtitle: `${o.name} (${o.email}) - ${o.total.toFixed(2)}€`,
        url: `/admin/orders?search=${o.orderNumber}`
      })),
      products: products.map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `Categoría: ${p.category} | ${p.priceEUR.toFixed(2)}€`,
        url: `/admin/products`
      })),
      drops: drops.map(d => ({
        id: d.id,
        title: `Lanzamiento: ${d.name}`,
        subtitle: `Estado: ${d.status}`,
        url: `/admin/drops`
      })),
      tickets: tickets.map(t => ({
        id: t.id,
        title: `Ticket ${t.ticketNumber}: ${t.subject}`,
        subtitle: `Estado: ${t.status.toUpperCase()} | Prioridad: ${t.priority.toUpperCase()}`,
        url: `/admin/support/${t.id}`
      })),
      logs: logs.map(l => ({
        id: l.id,
        title: l.action,
        subtitle: `${l.details ? l.details.substring(0, 50) + '...' : ''} - ${new Date(l.createdAt).toLocaleDateString('es-ES')}`,
        url: `/admin/logs`
      }))
    });

  } catch (error: any) {
    console.error('❌ [Search API GET] Error:', error);
    return NextResponse.json({
      error: 'Error del servidor.',
      message: error.message
    }, { status: 500 });
  }
}
