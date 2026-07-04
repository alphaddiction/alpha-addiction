import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPrintfulWebhookSignature } from '@/lib/printful';
import { PrintfulWebhookEvent } from '@/types/printful';
import { sendOrderInProduction, sendOrderShipped } from '@/lib/email/send-email';
import { createNotification } from '@/lib/notifications/service';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-printful-signature');

    // 1. Validar la seguridad de la firma HMAC
    const isValid = verifyPrintfulWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('❌ Error de validación de firma de Webhook de Printful.');
      
      createNotification({
        type: 'printful_webhook_error',
        title: 'Firma inválida en Webhook Printful',
        message: 'Se ha recibido una llamada al webhook de Printful con una firma criptográfica HMAC inválida o no configurada.',
        severity: 'error',
        module: 'printful'
      }).catch(err => console.error('⚠️ [Printful Webhook Notification]:', err));

      return new Response('Firma no autorizada.', { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PrintfulWebhookEvent;
    console.log(`📥 Webhook de Printful recibido [Tipo: ${payload.type}]`);

    const orderData = payload.data?.order;
    if (!orderData) {
      console.warn('⚠️ Webhook de Printful sin datos de pedido. Ignorado.');
      return NextResponse.json({ success: true, message: 'No order data in payload' });
    }

    const externalId = orderData.external_id; // UUID del pedido en Neon
    const printfulId = orderData.id;         // ID numérico de Printful

    // 2. Buscar el pedido en Neon PostgreSQL
    let order = null;
    if (externalId) {
      order = await db.order.findUnique({
        where: { id: externalId },
      });
    }

    if (!order && printfulId) {
      order = await db.order.findFirst({
        where: { printfulOrderId: printfulId },
      });
    }

    if (!order) {
      console.error(`❌ Pedido no encontrado en Neon para external_id: ${externalId} o printfulId: ${printfulId}`);
      // Respondemos con 200/202 para evitar que Printful reintente infinitamente un pedido inexistente
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 202 });
    }

    const orderId = order.id;
    let targetStatus = order.orderStatus;
    let eventMessage = '';
    let eventType = 'WEBHOOK_RECEIVED';
    let trackingUpdate: any = null;

    // 3. Mapear eventos de Printful a estados y eventos locales
    switch (payload.type) {
      case 'order_created':
        eventMessage = 'Pedido registrado en los servidores de Printful (Borrador)';
        // Si el estado sigue siendo paid, lo avanzamos a printful_submitted
        if (targetStatus === 'paid' || targetStatus === 'draft') {
          targetStatus = 'printful_submitted';
        }
        break;

      case 'order_approved':
        targetStatus = 'printful_production';
        eventMessage = 'Pedido aprobado por Printful. Iniciado el proceso de fabricación.';
        eventType = 'FULFILLMENT_IN_PRODUCTION';
        break;

      case 'package_shipped':
        targetStatus = 'shipped';
        const shipment = payload.data.shipment;
        const trackingNumber = shipment?.tracking_number || '';
        const trackingUrl = shipment?.tracking_url || '';
        const trackingCarrier = shipment?.carrier || '';

        trackingUpdate = {
          trackingNumber,
          trackingUrl,
        };

        eventMessage = `Pedido enviado por Printful. Transportista: ${trackingCarrier}. Seguimiento: ${trackingNumber}`;
        eventType = 'FULFILLMENT_SHIPPED';
        break;

      case 'order_canceled':
        targetStatus = 'canceled';
        eventMessage = 'Pedido cancelado directamente en el panel de Printful.';
        eventType = 'FULFILLMENT_CANCELED';
        break;

      case 'order_failed':
        targetStatus = 'fulfillment_failed';
        eventMessage = `Error de envío en Printful. Estado del pedido: ${orderData.status}`;
        eventType = 'FULFILLMENT_FAILED';
        break;

      case 'order_put_hold':
        eventMessage = 'Pedido puesto en espera (HOLD) por Printful.';
        eventType = 'FULFILLMENT_HOLD';
        break;

      case 'order_remove_hold':
        eventMessage = 'Retención (HOLD) de pedido eliminada en Printful.';
        eventType = 'FULFILLMENT_RESUMED';
        break;

      case 'package_returned':
        targetStatus = 'fulfillment_failed';
        eventMessage = 'El paquete ha sido devuelto a la fábrica por el transportista.';
        eventType = 'FULFILLMENT_RETURNED';
        break;

      default:
        console.log(`ℹ️ Evento de webhook [${payload.type}] no mapeado.`);
        return NextResponse.json({ success: true, message: `Event ${payload.type} ignored` });
    }

    // 4. Evitar duplicar el procesamiento del mismo estado (Idempotencia)
    // Buscamos si ya se registró este evento exacto en el historial del pedido
    const alreadyRegistered = await db.orderEvent.findFirst({
      where: {
        orderId,
        type: eventType,
        message: eventMessage,
      },
    });

    if (alreadyRegistered) {
      console.log(`ℹ️ Evento ${eventType} ya registrado anteriormente para el pedido ${order.orderNumber}. Omitiendo.`);
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    // 5. Aplicar actualizaciones en Neon PostgreSQL
    console.log(`💾 Actualizando pedido ${order.orderNumber}. Nuevo estado: ${targetStatus}`);

    await db.order.update({
      where: { id: orderId },
      data: {
        orderStatus: targetStatus,
        printfulOrderId: printfulId, // Asegurarnos de tener el ID de Printful guardado
        ...(trackingUpdate || {}),
        events: {
          create: {
            type: eventType,
            message: eventMessage,
          },
        },
      },
    });

    // 6. Disparar los correos correspondientes asíncronamente según el tipo de evento procesado
    if (payload.type === 'order_approved') {
      sendOrderInProduction(orderId).catch(err => console.error('⚠️ [Email Trigger] Error al disparar correo de orden en fabricación:', err));
    } else if (payload.type === 'package_shipped') {
      sendOrderShipped(orderId).catch(err => console.error('⚠️ [Email Trigger] Error al disparar correo de orden enviada:', err));
    }

    return NextResponse.json({
      success: true,
      processed: true,
      orderNumber: order.orderNumber,
      newStatus: targetStatus,
    });
  } catch (error) {
    console.error('❌ Error crítico al procesar webhook de Printful:', error);

    createNotification({
      type: 'printful_webhook_error',
      title: 'Fallo crítico en Webhook Printful',
      message: `Excepción al procesar webhook: ${(error as Error).message}`,
      severity: 'error',
      module: 'printful'
    }).catch(err => console.error('⚠️ [Printful Webhook Notification]:', err));

    return NextResponse.json(
      { error: 'Error interno al procesar el webhook', details: (error as Error).message },
      { status: 500 }
    );
  }
}
