import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyPortalSessionToken } from '@/lib/portal-auth';
import { maskEmail, maskPhone, maskAddress } from '@/lib/lookup-auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('client_portal_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'No autorizado. Sesión ausente.' }, { status: 401 });
    }

    const email = await verifyPortalSessionToken(sessionToken);
    if (!email) {
      return NextResponse.json({ error: 'Sesión expirada o inválida.' }, { status: 401 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Buscar todos los pedidos del correo
    const orders = await db.order.findMany({
      where: {
        email: cleanEmail
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enmascarar información sensible en los pedidos antes de responder
    const maskedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency,
      email: maskEmail(order.email),
      phone: order.phone ? maskPhone(order.phone) : null,
      name: order.name,
      addressLine1: maskAddress(order.addressLine1),
      addressLine2: order.addressLine2 ? maskAddress(order.addressLine2) : null,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
      country: order.country,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        mockupUrl: item.mockupUrl
      }))
    }));

    return NextResponse.json({
      success: true,
      email: maskEmail(cleanEmail),
      orders: maskedOrders
    });

  } catch (error: any) {
    console.error('❌ [Portal Orders GET] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
