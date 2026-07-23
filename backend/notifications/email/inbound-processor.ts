import { db } from '@/backend/database/db';
import { sendSupportTicketReceived } from './send-email';
import { createNotification } from '@/backend/notifications/service';

export interface InboundEmailPayload {
  fromName?: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  messageId: string;
  inReplyTo?: string;
  references?: string;
  ipAddress?: string;
  headers?: Record<string, string>;
  spamScore?: number;
}

/**
 * Procesa un correo entrante estandarizado para actualizar un ticket existente o crear uno nuevo.
 */
export async function processInboundEmail(email: InboundEmailPayload): Promise<{
  success: boolean;
  action: 'ignored' | 'appended' | 'created';
  ticketId?: string;
  messageId?: string;
  error?: string;
}> {
  const cleanEmail = email.fromEmail.trim().toLowerCase();
  const cleanSubject = email.subject.trim();
  const cleanTextBody = email.textBody?.trim() || '';
  const cleanHtmlBody = email.htmlBody?.trim() || '';
  const messageId = email.messageId.trim();

  console.log(`✉️ [Inbound Processor] Procesando correo de: ${cleanEmail} | Asunto: "${cleanSubject}"`);

  // 1. Evitar bucles y remitentes del propio dominio de soporte
  const domain = cleanEmail.split('@')[1] || '';
  if (
    domain === 'alphaddiction.com' ||
    cleanEmail.includes('no-reply') ||
    cleanEmail.includes('noreply') ||
    cleanEmail.includes('support@')
  ) {
    console.log(`⚠️ [Inbound Processor] Correo ignorado para evitar loops (remitente: ${cleanEmail}).`);
    return { success: true, action: 'ignored', error: 'Ignorado para evitar bucles de correo.' };
  }

  // Detectar correos autogenerados en cabeceras
  const headers = email.headers || {};
  const autoSubmitted = headers['auto-submitted'] || '';
  const precedence = headers['precedence'] || '';
  if (
    autoSubmitted.toLowerCase().includes('auto-replied') ||
    autoSubmitted.toLowerCase().includes('auto-generated') ||
    precedence.toLowerCase().includes('bulk') ||
    precedence.toLowerCase().includes('list') ||
    headers['x-autoreply']
  ) {
    console.log(`⚠️ [Inbound Processor] Correo ignorado detectado como auto-respuesta / boletín.`);
    return { success: true, action: 'ignored', error: 'Ignorado por cabeceras de auto-respuesta.' };
  }

  // 2. Control de duplicados por messageId
  const existingMessage = await db.supportMessage.findFirst({
    where: { messageId }
  });
  if (existingMessage) {
    console.log(`⚠️ [Inbound Processor] Correo duplicado detectado (Message-ID: ${messageId}).`);
    return { success: true, action: 'ignored', error: 'Mensaje duplicado ya registrado.' };
  }

  // 3. Buscar correspondencia con hilos de ticket existentes
  let matchedTicket = null;

  // A. Comprobar por inReplyTo o references
  const threadIds = [];
  if (email.inReplyTo) threadIds.push(email.inReplyTo.trim());
  if (email.references) {
    const refs = email.references.split(/[\s,]+/).map(r => r.trim()).filter(Boolean);
    threadIds.push(...refs);
  }

  if (threadIds.length > 0) {
    const previousMessage = await db.supportMessage.findFirst({
      where: {
        messageId: { in: threadIds }
      },
      include: { ticket: true }
    });
    if (previousMessage && previousMessage.ticket) {
      matchedTicket = previousMessage.ticket;
      console.log(`📌 [Inbound Processor] Hilo detectado mediante Message-ID / References. Ticket: ${matchedTicket.ticketNumber}`);
    }
  }

  // B. Comprobar por patrón TK-XXXXX en el Asunto
  if (!matchedTicket) {
    const ticketMatch = cleanSubject.match(/TK-(\d{5,})/i);
    if (ticketMatch) {
      const ticketNum = ticketMatch[0].toUpperCase();
      const ticketByNum = await db.supportTicket.findUnique({
        where: { ticketNumber: ticketNum }
      });
      if (ticketByNum) {
        matchedTicket = ticketByNum;
        console.log(`📌 [Inbound Processor] Hilo detectado mediante código TK en asunto: ${ticketNum}`);
      }
    }
  }

  // 4. Si se encuentra un hilo existente, añadir el mensaje al Ticket
  if (matchedTicket) {
    const updatedStatus = 'open'; // Reabrir siempre en open al recibir respuesta del cliente

    const newMessage = await db.$transaction(async (tx) => {
      // Registrar mensaje
      const msg = await tx.supportMessage.create({
        data: {
          ticketId: matchedTicket.id,
          senderType: 'customer',
          senderEmail: cleanEmail,
          body: cleanTextBody || cleanHtmlBody.replace(/<[^>]*>/g, ''),
          htmlBody: cleanHtmlBody || null,
          messageId,
          inReplyTo: email.inReplyTo || null,
          references: email.references || null,
          internalNote: false
        }
      });

      // Actualizar estado del ticket
      await tx.supportTicket.update({
        where: { id: matchedTicket.id },
        data: {
          status: updatedStatus,
          updatedAt: new Date()
        }
      });

      return msg;
    });

    console.log(`✅ [Inbound Processor] Mensaje añadido con éxito al ticket ${matchedTicket.ticketNumber}.`);

    // Notificar la anexión al hilo
    createNotification({
      type: 'support_message_appended',
      title: `Nuevo mensaje en ticket ${matchedTicket.ticketNumber}`,
      message: `El cliente ${cleanEmail} ha respondido a la consulta: "${matchedTicket.subject}".`,
      severity: 'info',
      module: 'support',
      entityType: 'SupportTicket',
      entityId: matchedTicket.id,
      actionUrl: `/admin/support/${matchedTicket.id}`
    }).catch(err => console.error('⚠️ [Inbound Notification] Error al crear notificación:', err));

    return { success: true, action: 'appended', ticketId: matchedTicket.id, messageId: newMessage.id };
  }

  // 5. Si no se encuentra hilo, crear un nuevo Ticket
  console.log(`🆕 [Inbound Processor] No se encontró hilo de ticket. Creando nuevo Ticket...`);

  // Buscar pedido para enlazar automáticamente si el asunto o cuerpo mencionan AA-XXXXX
  let orderId: string | null = null;
  let orderNumber: string | null = null;
  const orderMatch = (cleanSubject + ' ' + cleanTextBody).match(/AA-(\d{5,})/i);
  if (orderMatch) {
    const matchedOrderNum = orderMatch[0].toUpperCase();
    const order = await db.order.findUnique({
      where: { orderNumber: matchedOrderNum }
    });
    if (order) {
      orderId = order.id;
      orderNumber = order.orderNumber;
      console.log(`🔗 [Inbound Processor] Enlazando automáticamente con el pedido: ${orderNumber}`);
    }
  }

  // Asignar prioridad de forma automática en base a palabras clave
  let priority = 'normal';
  const urgentKeywords = ['urgente', 'disputa', 'cancelar', 'reembolso', 'fraude', 'estafa', 'mal servicio'];
  const highKeywords = ['error', 'fallo', 'problema', 'malo', 'roto', 'defecto', 'no puedo pagar', 'no funciona'];

  const searchContent = (cleanSubject + ' ' + cleanTextBody).toLowerCase();
  if (urgentKeywords.some(kw => searchContent.includes(kw))) {
    priority = 'urgent';
  } else if (highKeywords.some(kw => searchContent.includes(kw))) {
    priority = 'high';
  }

  // Categoría por palabras clave básicas
  let category = 'Otro';
  if (searchContent.includes('envío') || searchContent.includes('seguimiento') || searchContent.includes('tracking') || searchContent.includes('en camino')) {
    category = 'Envío';
  } else if (searchContent.includes('devolución') || searchContent.includes('devolver') || searchContent.includes('talla')) {
    category = 'Devolución';
  } else if (searchContent.includes('pago') || searchContent.includes('paypal') || searchContent.includes('cobro')) {
    category = 'Pago';
  } else if (searchContent.includes('pedido') || searchContent.includes('compra')) {
    category = 'Pedido';
  }

  // Generar ticketNumber secuencial TK-XXXXX
  const lastTicket = await db.supportTicket.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  let nextNum = 10001;
  if (lastTicket && lastTicket.ticketNumber.startsWith('TK-')) {
    const numStr = lastTicket.ticketNumber.replace('TK-', '');
    const parsed = parseInt(numStr, 10);
    if (!isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  }
  const ticketNumber = `TK-${nextNum}`;

  const customerName = email.fromName || cleanEmail.split('@')[0] || 'Cliente Inbound';

  const newTicket = await db.$transaction(async (tx) => {
    const t = await tx.supportTicket.create({
      data: {
        ticketNumber,
        customerEmail: cleanEmail,
        customerName,
        orderId,
        orderNumber,
        category,
        subject: cleanSubject || 'Consulta por correo',
        status: 'open',
        priority,
        source: 'email'
      }
    });

    await tx.supportMessage.create({
      data: {
        ticketId: t.id,
        senderType: 'customer',
        senderEmail: cleanEmail,
        body: cleanTextBody || cleanHtmlBody.replace(/<[^>]*>/g, ''),
        htmlBody: cleanHtmlBody || null,
        messageId,
        inReplyTo: email.inReplyTo || null,
        references: email.references || null,
        internalNote: false
      }
    });

    return t;
  });

  console.log(`✅ [Inbound Processor] Nuevo Ticket creado con éxito: ${newTicket.ticketNumber}`);

  // Notificar nuevo ticket creado
  createNotification({
    type: 'support_ticket_created',
    title: `Nuevo ticket ${newTicket.ticketNumber}`,
    message: `Consulta recibida de ${customerName} (${cleanEmail}) sobre "${category}".`,
    severity: priority === 'urgent' ? 'critical' : (priority === 'high' ? 'error' : 'info'),
    module: 'support',
    entityType: 'SupportTicket',
    entityId: newTicket.id,
    actionUrl: `/admin/support/${newTicket.id}`
  }).catch(err => console.error('⚠️ [Inbound Notification] Error al crear notificación de ticket nuevo:', err));

  // Enviar confirmación al cliente de forma asíncrona
  sendSupportTicketReceived(newTicket.id).catch(err => {
    console.error(`⚠️ [Inbound Processor] Fallo al enviar confirmación de ticket recibido a ${cleanEmail}:`, err);
  });

  return { success: true, action: 'created', ticketId: newTicket.id, messageId };
}
