import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';

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

    // 2. Buscar el pedido interno en Neon PostgreSQL por el paypalOrderId único
    const order = await db.order.findUnique({
      where: { paypalOrderId },
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
