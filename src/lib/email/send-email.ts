import { db } from '../db';
import { sendViaResend } from './resend';
import { EmailType } from './types';
import * as templates from './templates';
import { isValidEmail } from './helpers';
import { generateSecureOrderToken } from '../portal-auth';

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

    // Generar o recuperar token seguro de 30 días para enlace rápido
    let secureToken = '';
    try {
      secureToken = await generateSecureOrderToken(order.orderNumber, order.email);
    } catch (tokErr) {
      console.error('⚠️ [Email Service] Error al generar active token para email:', tokErr);
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
      secureToken, // Inyectar token seguro
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

/**
 * 9. Envía el email de confirmación de registro en la lista de espera de un Drop
 */
export async function sendWaitlistConfirmation(email: string, dropName: string): Promise<any> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, error: 'Email inválido' };
    }

    const html = templates.getWaitlistConfirmationEmail(dropName, cleanEmail);
    const subject = `Te avisaremos cuando salga ${dropName}`;
    const result = await sendViaResend(cleanEmail, subject, html);
    
    // Registrar el envío en EmailLog sin asociarlo a un orderId (ya que es para la waitlist)
    try {
      await db.emailLog.create({
        data: {
          recipient: cleanEmail,
          subject,
          emailType: 'WAITLIST_CONFIRMATION',
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error || null,
        }
      });
    } catch (dbErr) {
      console.error('Error logging waitlist email to db:', dbErr);
    }

    return result;
  } catch (error: any) {
    console.error('Error sending waitlist confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 10. Envía el correo "El drop ya está activo" a los inscritos en la waitlist
 */
export async function sendDropLiveNotification(email: string, dropName: string, dropSlug: string): Promise<any> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, error: 'Email inválido' };
    }

    const html = templates.getDropLiveNotificationEmail(dropName, dropSlug, cleanEmail);
    const subject = `🔥 ¡Ya está activo: ${dropName}!`;
    const result = await sendViaResend(cleanEmail, subject, html);
    
    try {
      await db.emailLog.create({
        data: {
          recipient: cleanEmail,
          subject,
          emailType: 'DROP_LIVE_NOTIFICATION',
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error || null,
        }
      });
    } catch (dbErr) {
      console.error('Error logging drop live waitlist email to db:', dbErr);
    }

    return result;
  } catch (error: any) {
    console.error('Error sending drop live notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 11. Envía el email de confirmación de ticket recibido
 */
export async function sendSupportTicketReceived(ticketId: string): Promise<SendEmailResult> {
  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId }
    });
    if (!ticket) {
      return { success: false, error: 'Ticket no encontrado' };
    }

    // Comprobar si ya se envió este tipo de email con éxito para este ticket
    const alreadySent = await db.emailLog.findFirst({
      where: {
        recipient: ticket.customerEmail,
        subject: { contains: ticket.ticketNumber },
        emailType: 'SUPPORT_TICKET_RECEIVED',
        status: 'success',
      },
    });
    if (alreadySent) {
      return { success: true, duplicated: true };
    }

    const html = templates.getTicketReceivedEmail(ticket.ticketNumber, ticket.customerName, ticket.subject, ticket.category);
    const subject = `Hemos recibido tu solicitud ${ticket.ticketNumber}`;
    const resendResult = await sendViaResend(ticket.customerEmail, subject, html);

    const log = await db.emailLog.create({
      data: {
        recipient: ticket.customerEmail,
        subject,
        emailType: 'SUPPORT_TICKET_RECEIVED',
        status: resendResult.success ? 'success' : 'failed',
        errorMessage: resendResult.error || null,
        orderId: ticket.orderId || null,
      },
    });

    return { success: resendResult.success, emailLogId: log.id, error: resendResult.error };
  } catch (error: any) {
    console.error('Error sending support ticket received email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 12. Envía la respuesta del equipo al cliente
 */
export async function sendSupportTicketReplied(ticketId: string, replyBody: string): Promise<SendEmailResult> {
  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId }
    });
    if (!ticket) {
      return { success: false, error: 'Ticket no encontrado' };
    }

    const html = templates.getTicketRepliedEmail(ticket.ticketNumber, ticket.customerName, replyBody, ticket.subject);
    const subject = `Respuesta a tu solicitud ${ticket.ticketNumber}`;
    const resendResult = await sendViaResend(ticket.customerEmail, subject, html);

    const log = await db.emailLog.create({
      data: {
        recipient: ticket.customerEmail,
        subject,
        emailType: 'SUPPORT_TICKET_REPLIED',
        status: resendResult.success ? 'success' : 'failed',
        errorMessage: resendResult.error || null,
        orderId: ticket.orderId || null,
      },
    });

    return { success: resendResult.success, emailLogId: log.id, error: resendResult.error };
  } catch (error: any) {
    console.error('Error sending support ticket replied email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 13. Envía el email de ticket cerrado
 */
export async function sendSupportTicketClosed(ticketId: string): Promise<SendEmailResult> {
  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId }
    });
    if (!ticket) {
      return { success: false, error: 'Ticket no encontrado' };
    }

    // Comprobar si ya se envió este tipo de email con éxito para este ticket
    const alreadySent = await db.emailLog.findFirst({
      where: {
        recipient: ticket.customerEmail,
        subject: { contains: ticket.ticketNumber },
        emailType: 'SUPPORT_TICKET_CLOSED',
        status: 'success',
      },
    });
    if (alreadySent) {
      return { success: true, duplicated: true };
    }

    const html = templates.getTicketClosedEmail(ticket.ticketNumber, ticket.customerName, ticket.subject);
    const subject = `Solicitud de soporte resuelta ${ticket.ticketNumber}`;
    const resendResult = await sendViaResend(ticket.customerEmail, subject, html);

    const log = await db.emailLog.create({
      data: {
        recipient: ticket.customerEmail,
        subject,
        emailType: 'SUPPORT_TICKET_CLOSED',
        status: resendResult.success ? 'success' : 'failed',
        errorMessage: resendResult.error || null,
        orderId: ticket.orderId || null,
      },
    });

    return { success: resendResult.success, emailLogId: log.id, error: resendResult.error };
  } catch (error: any) {
    console.error('Error sending support ticket closed email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 14. Envía el email con el código OTP temporal para acceso al portal
 */
export async function sendPortalOtpEmail(email: string, code: string): Promise<SendEmailResult> {
  try {
    const html = templates.getPortalOtpEmail(code);
    const subject = `Tu código de acceso temporal a Alpha Addiction`;
    const resendResult = await sendViaResend(email, subject, html);

    const log = await db.emailLog.create({
      data: {
        recipient: email,
        subject,
        emailType: 'PORTAL_OTP',
        status: resendResult.success ? 'success' : 'failed',
        errorMessage: resendResult.error || null,
        orderId: null,
      },
    });

    return { success: resendResult.success, emailLogId: log.id, error: resendResult.error };
  } catch (error: any) {
    console.error('Error sending portal OTP email:', error);
    return { success: false, error: error.message };
  }
}



