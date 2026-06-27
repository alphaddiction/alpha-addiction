import { db } from '../db';
import { sendViaResend } from './resend';
import { EmailType } from './types';
import * as templates from './templates';
import { isValidEmail } from './helpers';

interface SendEmailResult {
  success: boolean;
  emailLogId?: string;
  error?: string;
  duplicated?: boolean;
}

/**
 * Función genérica interna para procesar y enviar un correo transaccional,
 * garantizando la idempotencia, validación de destinatario y persistencia en Neon.
 */
async function sendTransactionalEmail(
  orderId: string,
  emailType: EmailType,
  subject: string,
  getHtmlContent: (orderInfo: any) => string
): Promise<SendEmailResult> {
  try {
    // 1. Evitar duplicidad: Comprobar si ya se envió este tipo de email con éxito para este pedido
    const alreadySent = await db.emailLog.findFirst({
      where: {
        orderId,
        emailType,
        status: 'success',
      },
    });

    if (alreadySent) {
      console.log(`ℹ️ [Email Service] Correo de tipo ${emailType} ya enviado con éxito para el pedido ${orderId}. Omitiendo.`);
      return { success: true, duplicated: true };
    }

    // 2. Buscar datos detallados del pedido en Neon
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`❌ [Email Service] No se encontró el pedido ${orderId} en Neon PostgreSQL.`);
      return { success: false, error: 'Pedido no encontrado' };
    }

    const recipient = order.email;

    // 3. Validar email del destinatario
    if (!recipient || !isValidEmail(recipient)) {
      console.error(`❌ [Email Service] Destinatario inválido o ausente para el pedido ${order.orderNumber}: "${recipient}"`);
      
      // Guardar registro de fallo en la auditoría
      const log = await db.emailLog.create({
        data: {
          orderId,
          emailType,
          recipient: recipient || '—',
          subject,
          status: 'failed',
          errorMessage: 'Destinatario de correo inválido o ausente',
        },
      });

      return { success: false, error: 'Email inválido', emailLogId: log.id };
    }

    // Mapear al formato esperado por las plantillas
    const orderInfo = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      name: order.name,
      email: order.email,
      addressLine1: order.addressLine1,
      city: order.city,
      postalCode: order.postalCode,
      country: order.country,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      items: order.items.map((i) => ({
        name: i.name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        price: i.price,
      })),
    };

    // 4. Renderizar plantilla React a HTML
    const html = getHtmlContent(orderInfo);

    // 5. Enviar usando el cliente de Resend
    console.log(`✉️ [Email Service] Enviando correo [${emailType}] a ${recipient}...`);
    const resendResult = await sendViaResend(recipient, subject, html);

    // 6. Registrar resultado en Neon PostgreSQL
    const log = await db.emailLog.create({
      data: {
        orderId,
        emailType,
        recipient,
        subject,
        status: resendResult.success ? 'success' : 'failed',
        errorMessage: resendResult.error || null,
      },
    });

    if (!resendResult.success) {
      console.error(`❌ [Email Service] Fallo al enviar correo [${emailType}] a ${recipient}: ${resendResult.error}`);
      return { success: false, error: resendResult.error, emailLogId: log.id };
    }

    console.log(`✅ [Email Service] Correo [${emailType}] enviado con éxito a ${recipient}. ID Log: ${log.id}`);
    return { success: true, emailLogId: log.id };
  } catch (error) {
    console.error(`❌ [Email Service] Error crítico al procesar correo [${emailType}] para ${orderId}:`, error);
    
    // Intento de registrar error en base de datos si la conexión a la base de datos funciona
    try {
      await db.emailLog.create({
        data: {
          orderId,
          emailType,
          recipient: '—',
          subject,
          status: 'failed',
          errorMessage: `Excepción crítica: ${(error as Error).message}`,
        },
      });
    } catch (dbErr) {
      console.error('❌ [Email Service] Imposible escribir registro de error en base de datos:', dbErr);
    }

    return { success: false, error: (error as Error).message };
  }
}

/**
 * 1. Envía el email "Hemos recibido tu pedido"
 */
export async function sendOrderReceived(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'RECEIVED',
    'Hemos recibido tu pedido',
    templates.getReceivedEmail
  );
}

/**
 * 2. Envía el email "Pago confirmado"
 */
export async function sendPaymentConfirmed(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'PAYMENT_CONFIRMED',
    'Pago confirmado',
    templates.getPaymentConfirmedEmail
  );
}

/**
 * 3. Envía el email "Estamos preparando tu pedido" (Producción Printful)
 */
export async function sendOrderInProduction(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'PRODUCTION',
    'Estamos preparando tu pedido',
    templates.getProductionEmail
  );
}

/**
 * 4. Envía el email "Tu pedido ya está en camino" (Enviado con tracking)
 */
export async function sendOrderShipped(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'SHIPPED',
    'Tu pedido ya está en camino',
    templates.getShippedEmail
  );
}

/**
 * 5. Envía el email "Pedido entregado"
 */
export async function sendOrderDelivered(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'DELIVERED',
    'Pedido entregado',
    templates.getDeliveredEmail
  );
}

/**
 * 6. Envía el email "Pedido cancelado"
 */
export async function sendOrderCanceled(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'CANCELED',
    'Pedido cancelado',
    templates.getCanceledEmail
  );
}

/**
 * 7. Envía el email "Reembolso procesado"
 */
export async function sendRefund(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'REFUNDED',
    'Reembolso procesado',
    templates.getRefundEmail
  );
}

/**
 * 8. Envía el email "Disputa registrada"
 */
export async function sendDispute(orderId: string): Promise<SendEmailResult> {
  return sendTransactionalEmail(
    orderId,
    'DISPUTE',
    'Disputa registrada',
    templates.getDisputeEmail
  );
}
