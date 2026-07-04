import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPayPalOrder } from '@/lib/paypal';
import { OrderItem } from '@/types/order';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth-tokens';

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // Check system mode in database
    const systemModeSetting = await db.systemSetting.findUnique({
      where: { key: 'system_mode' }
    });
    const systemMode = systemModeSetting?.value || 'development';

    if (systemMode === 'production_verification') {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('alpha_session')?.value;
      const isAdmin = sessionToken ? await verifySessionToken(sessionToken) : null;

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Acceso denegado.', message: 'La tienda se encuentra en modo de verificación. Solo los administradores pueden realizar compras.' },
          { status: 403 }
        );
      }
    }

    if (!orderId) {
      return NextResponse.json({ error: 'El ID del pedido es obligatorio.' }, { status: 400 });
    }

    // 1. Buscar el pedido en Neon PostgreSQL
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'No se encontró el pedido en el sistema central.' }, { status: 404 });
    }

    // 2. Validar que esté en estado 'pago_pendiente'
    if (order.paymentStatus !== 'pago_pendiente') {
      return NextResponse.json(
        { error: `El pedido no está pendiente de pago. Estado actual: ${order.paymentStatus}` },
        { status: 400 }
      );
    }

    // 3. Mapear artículos de la base de datos al formato OrderItem de la pasarela
    const orderItems: OrderItem[] = order.items.map((item) => ({
      slug: item.productId,
      name: item.name,
      priceEUR: item.price,
      size: item.size,
      color: item.color || undefined,
      printfulVariantId: item.printfulVariantId || undefined,
      qty: item.quantity,
      costPrice: item.costPrice || undefined,
      mockupUrl: item.mockupUrl || undefined,
    }));

    // 4. Reconstruir objeto ShippingAddress a partir de las columnas planas de Neon
    const nameParts = order.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const shippingAddress = {
      firstName,
      lastName,
      email: order.email,
      phone: order.phone || undefined,
      address: order.addressLine1,
      city: order.city,
      province: order.state || '',
      postalCode: order.postalCode,
      country: order.country,
    };

    console.log(`Creating PayPal order for legible order number: ${order.orderNumber} (Neon UUID: ${orderId})...`);

    // 5. Crear la orden de PayPal consumiendo el subtotal y descuento del servidor
    const paypalOrder = await createPayPalOrder(
      orderId,
      order.orderNumber,
      orderItems,
      shippingAddress,
      order.subtotal,
      order.discount
    );

    // 6. Guardar el ID de PayPal de forma segura en Neon y registrar el evento
    await db.order.update({
      where: { id: orderId },
      data: {
        paypalOrderId: paypalOrder.id,
        events: {
          create: {
            type: 'PAYMENT_PENDING',
            message: `Orden de pago PayPal creada: ${paypalOrder.id}`,
          },
        },
      },
    });

    console.log(`✅ PayPal order associated: ${paypalOrder.id} to order number ${order.orderNumber}`);

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
      status: paypalOrder.status,
    });
  } catch (error) {
    console.error('❌ Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Error al inicializar la orden con PayPal.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
