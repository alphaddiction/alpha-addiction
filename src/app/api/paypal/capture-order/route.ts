import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';
import { dispatchEvent } from '@/lib/events/dispatcher';
import { decrementVirtualStock } from '@/lib/products';
import { recordDiscountRedemption } from '@/lib/discounts';

export async function POST(req: Request) {
  try {
    const { paypalOrderId } = await req.json();

    if (!paypalOrderId) {
      return NextResponse.json({ error: 'El ID de la orden de PayPal es obligatorio.' }, { status: 400 });
    }

    console.log(`Capturing PayPal payment for order ID: ${paypalOrderId}...`);

    // 1. Capturar el cobro en la API de PayPal Sandbox
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      console.error(`❌ PayPal capture status was not COMPLETED: ${captureResult.status}`);
      return NextResponse.json(
        { error: `El pago no pudo ser completado. Estado de PayPal: ${captureResult.status}` },
        { status: 400 }
      );
    }

    const captureId = captureResult.purchase_units[0]?.payments?.captures?.[0]?.id;
    if (!captureId) {
      console.warn('⚠️ No capture ID returned from PayPal capture result.');
    }

    // 2. Buscar el pedido interno en Neon PostgreSQL por el paypalOrderId único (e incluir items)
    const order = await db.order.findUnique({
      where: { paypalOrderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`❌ No internal order found for PayPal ID: ${paypalOrderId}`);
      return NextResponse.json(
        { error: 'No se encontró el pedido correspondiente en el sistema OMS.' },
        { status: 404 }
      );
    }

    console.log(`✅ Associated internal order found: ${order.orderNumber} (ID: ${order.id}). Updating status...`);

    // 3. Actualizar el pedido en la base de datos de Neon
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'pagado',
        orderStatus: 'paid', // O 'processing' (Procesando)
        paypalCaptureId: captureId || null,
        events: {
          create: {
            type: 'PAYMENT_CONFIRMED',
            message: 'Pago PayPal confirmado',
          },
        },
      },
    });

    console.log(`✅ Order ${order.orderNumber} marked as PAID in Neon PostgreSQL.`);

    // 3a. Registrar redención del cupón si existe
    if (order.discountId) {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
      await recordDiscountRedemption(order.id, order.discountId, clientIp);
    }

    // 3b. Reducir stock virtual de las variantes correspondientes
    if (order.items && Array.isArray(order.items)) {
      for (const item of (order.items as any[])) {
        if (item.productId && item.sku) {
          try {
            await decrementVirtualStock(item.productId, item.sku, item.quantity);
          } catch (stErr) {
            console.error(`⚠️ [Stock Decrement] Fallo al reducir stock para ${item.productId} SKU ${item.sku}:`, stErr);
          }
        }
      }
    }

    // 4. Disparar evento de pago confirmado en el Event Engine de forma asíncrona sin bloquear la respuesta
    dispatchEvent('PAYMENT_CONFIRMED', { orderId: order.id })
      .catch(err => console.error('⚠️ [Event Engine] Error al despachar PAYMENT_CONFIRMED en capture-order:', err));

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paypalCaptureId: captureId,
      status: 'paid',
    });
  } catch (error) {
    console.error('❌ Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Fallo al procesar y confirmar la transacción en el servidor.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
