import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPayPalWebhook } from '@/lib/paypal';
import { PayPalWebhookEvent } from '@/types/paypal';
import { sendOrderReceived, sendPaymentConfirmed, sendRefund, sendDispute } from '@/lib/email/send-email';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;

    // 1. Verificar la autenticidad de la firma con la API de PayPal
    const isValid = await verifyPayPalWebhook(headers, rawBody);
    if (!isValid) {
      console.error('❌ Error de validación de firma de Webhook de PayPal.');
      return new Response('Firma no autorizada.', { status: 401 });
    }

    const event = JSON.parse(rawBody) as PayPalWebhookEvent;
    console.log(`📥 Webhook de PayPal recibido [Tipo: ${event.event_type}] (ID: ${event.id})`);

    const resource = event.resource as any;
    if (!resource) {
      console.warn('⚠️ Webhook de PayPal sin datos de recurso. Ignorado.');
      return NextResponse.json({ success: true, message: 'No resource in payload' });
    }

    // Extraer identificadores posibles
    const paypalOrderId = resource.supplementary_data?.related_ids?.order_id || 
                          (event.resource_type === 'checkout-order' ? resource.id : undefined);
    const captureId = event.resource_type === 'capture' ? resource.id : undefined;
    const customId = resource.custom_id || resource.custom;

    // 2. Buscar el pedido en Neon PostgreSQL usando múltiples fallbacks
    let order = null;
    if (customId) {
      order = await db.order.findUnique({
        where: { id: customId },
      });
    }
    if (!order && paypalOrderId) {
      order = await db.order.findUnique({
        where: { paypalOrderId },
      });
    }
    if (!order && captureId) {
      order = await db.order.findFirst({
        where: { paypalCaptureId: captureId },
      });
    }

    if (!order) {
      console.error(`❌ Pedido no encontrado para customId: ${customId}, paypalOrderId: ${paypalOrderId}, captureId: ${captureId}`);
      // Respondemos con 202 para evitar reintentos infinitos por parte de PayPal
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 202 });
    }

    const orderId = order.id;
    let targetPaymentStatus = order.paymentStatus;
    let targetOrderStatus = order.orderStatus;
    let eventMessage = '';
    let eventType = `PAYPAL_${event.event_type.replace(/\./g, '_')}`;

    // 3. Mapear eventos de PayPal a estados internos de Neon y descripciones
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        eventMessage = `Orden aprobada en PayPal. ID Evento: ${event.id}`;
        if (targetPaymentStatus === 'pago_pendiente') {
          targetPaymentStatus = 'payment_pending';
        }
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        eventMessage = `Pago PayPal confirmado por webhook. ID Captura: ${resource.id}. ID Evento: ${event.id}`;
        targetPaymentStatus = 'paid';
        // Avanzar el pedido a 'paid' si estaba pendiente
        if (targetOrderStatus === 'pago_pendiente' || targetOrderStatus === 'draft') {
          targetOrderStatus = 'paid';
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        eventMessage = `Pago denegado por PayPal. Motivo: ${resource.status_details?.reason || 'Desconocido'}. ID Evento: ${event.id}`;
        targetPaymentStatus = 'payment_failed';
        targetOrderStatus = 'fulfillment_failed';
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        eventMessage = `Pago reembolsado por PayPal. ID Reembolso: ${resource.id}. ID Evento: ${event.id}`;
        targetPaymentStatus = 'refunded';
        targetOrderStatus = 'canceled';
        break;

      case 'PAYMENT.CAPTURE.REVERSED':
        eventMessage = `Pago revertido por PayPal. Motivo: ${resource.status_details?.reason || 'Desconocido'}. ID Evento: ${event.id}`;
        targetPaymentStatus = 'reversed';
        targetOrderStatus = 'canceled';
        break;

      case 'CUSTOMER.DISPUTE.CREATED':
        eventMessage = `Disputa abierta por el cliente en PayPal. ID Disputa: ${resource.dispute_id || '—'}. ID Evento: ${event.id}`;
        targetPaymentStatus = 'disputed';
        break;

      case 'CUSTOMER.DISPUTE.RESOLVED':
        eventMessage = `Disputa resuelta en PayPal. Estado: ${resource.status || 'Resuelta'}. ID Evento: ${event.id}`;
        // Si se resuelve a favor del comercio, marcamos como pagado, de lo contrario refunded/reversed
        if (resource.dispute_outcome?.outcome_code === 'RESOLVED_BUYER_FAVOUR') {
          targetPaymentStatus = 'refunded';
          targetOrderStatus = 'canceled';
        } else {
          targetPaymentStatus = 'paid';
        }
        break;

      default:
        console.log(`ℹ️ Evento de webhook de PayPal [${event.event_type}] no procesado.`);
        return NextResponse.json({ success: true, message: `Event ${event.event_type} ignored` });
    }

    // 4. Evitar duplicidad (Idempotencia)
    // Comprobar si ya se registró este evento exacto buscando el ID de evento de PayPal en el timeline
    const alreadyRegistered = await db.orderEvent.findFirst({
      where: {
        orderId,
        message: {
          contains: event.id,
        },
      },
    });

    if (alreadyRegistered) {
      console.log(`ℹ️ Evento de PayPal ${event.id} ya procesado anteriormente para el pedido ${order.orderNumber}. Omitiendo.`);
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    // 5. Actualizar base de datos Neon PostgreSQL
    console.log(`💾 Actualizando pedido ${order.orderNumber}. Estado Pago: ${targetPaymentStatus}, Estado Pedido: ${targetOrderStatus}`);

    const updateData: any = {
      paymentStatus: targetPaymentStatus,
      orderStatus: targetOrderStatus,
      events: {
        create: {
          type: eventType,
          message: eventMessage,
        },
      },
    };

    // Guardar el capture ID y order ID si no estaban presentes
    if (captureId && !order.paypalCaptureId) {
      updateData.paypalCaptureId = captureId;
    }
    if (paypalOrderId && !order.paypalOrderId) {
      updateData.paypalOrderId = paypalOrderId;
    }

    await db.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // 6. Disparar los correos correspondientes asíncronamente según el tipo de evento procesado
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      Promise.all([
        sendOrderReceived(orderId),
        sendPaymentConfirmed(orderId)
      ]).catch(err => console.error('⚠️ [Email Trigger] Error al disparar correos de pago completado por webhook:', err));
    } else if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      sendRefund(orderId).catch(err => console.error('⚠️ [Email Trigger] Error al disparar correo de reembolso:', err));
    } else if (event.event_type === 'CUSTOMER.DISPUTE.CREATED') {
      sendDispute(orderId).catch(err => console.error('⚠️ [Email Trigger] Error al disparar correo de disputa:', err));
    }

    return NextResponse.json({
      success: true,
      processed: true,
      orderNumber: order.orderNumber,
      paymentStatus: targetPaymentStatus,
    });
  } catch (error) {
    console.error('❌ Error crítico al procesar webhook de PayPal:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar el webhook', details: (error as Error).message },
      { status: 500 }
    );
  }
}
