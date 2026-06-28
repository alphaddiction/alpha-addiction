import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendSupportTicketReceived } from '@/lib/email/send-email';

// Interface para el control de rate limit en memoria
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const contactRateLimits = new Map<string, RateLimitEntry>();

// Limpieza de rate limit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of contactRateLimits.entries()) {
      if (now > entry.resetAt) {
        contactRateLimits.delete(ip);
      }
    }
  }, 10 * 60 * 1000); // Cada 10 minutos
}

// Helper para sanitizar HTML básico
function sanitizeString(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

const ALLOWED_CATEGORIES = [
  'Duda general',
  'Pedido',
  'Envío',
  'Devolución',
  'Pago',
  'Producto',
  'Otro'
];

export async function POST(req: Request) {
  try {
    // 1. Rate Limit por IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const now = Date.now();
    const entry = contactRateLimits.get(ip);
    const windowMs = 10 * 60 * 1000; // 10 minutos
    const maxAttempts = 5;

    if (entry && now < entry.resetAt) {
      if (entry.attempts >= maxAttempts) {
        const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
        return NextResponse.json(
          { error: `Demasiados mensajes enviados. Por favor, vuelve a intentarlo en ${minutesLeft} minutos.` },
          { status: 429 }
        );
      }
      entry.attempts++;
    } else {
      contactRateLimits.set(ip, { attempts: 1, resetAt: now + windowMs });
    }

    // 2. Obtener y validar datos del cuerpo de la petición
    const body = await req.json();
    const { name, email, category, subject, message, orderNumber } = body;

    const cleanName = sanitizeString(name);
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanCategory = sanitizeString(category);
    const cleanSubject = sanitizeString(subject);
    const cleanMessage = sanitizeString(message);
    const cleanOrderNumber = orderNumber ? sanitizeString(orderNumber).toUpperCase() : null;

    if (!cleanName || !cleanEmail || !cleanCategory || !cleanSubject || !cleanMessage) {
      return NextResponse.json({ error: 'Por favor, rellena todos los campos obligatorios.' }, { status: 400 });
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json({ error: 'El correo electrónico proporcionado no es válido.' }, { status: 400 });
    }

    if (!ALLOWED_CATEGORIES.includes(cleanCategory)) {
      return NextResponse.json({ error: 'Categoría no válida.' }, { status: 400 });
    }

    // 3. Verificación del pedido (si se proporciona)
    let orderId: string | null = null;
    let associatedOrderNumber: string | null = null;

    if (cleanOrderNumber) {
      const order = await db.order.findUnique({
        where: { orderNumber: cleanOrderNumber }
      });

      // No permitir enumeración: si el pedido no existe o el correo de compra no coincide,
      // lanzamos un error idéntico sin dar pistas de si la orden existe.
      if (!order || order.email.toLowerCase() !== cleanEmail) {
        return NextResponse.json(
          { error: 'El número de pedido no coincide con el correo electrónico de compra proporcionado.' },
          { status: 400 }
        );
      }

      orderId = order.id;
      associatedOrderNumber = order.orderNumber;
    }

    // 4. Generar ticketNumber secuencial TK-XXXXX
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

    // 5. Crear el ticket y el primer mensaje en una transacción
    const ticket = await db.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          ticketNumber,
          customerEmail: cleanEmail,
          customerName: cleanName,
          orderId,
          orderNumber: associatedOrderNumber,
          category: cleanCategory,
          subject: cleanSubject,
          status: 'open',
          priority: 'normal',
          source: 'web'
        }
      });

      await tx.supportMessage.create({
        data: {
          ticketId: newTicket.id,
          senderType: 'customer',
          senderEmail: cleanEmail,
          body: cleanMessage,
          internalNote: false
        }
      });

      return newTicket;
    });

    // 6. Enviar confirmación al cliente por email si Resend está activo
    try {
      await sendSupportTicketReceived(ticket.id);
    } catch (emailErr) {
      console.error('⚠️ [Contact API] Error al enviar email de confirmación:', emailErr);
    }

    return NextResponse.json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      message: 'Ticket de soporte creado correctamente.'
    });

  } catch (error: any) {
    console.error('❌ [Contact API] Error al crear ticket de soporte:', error);
    return NextResponse.json({ error: 'Ha ocurrido un error interno en el servidor.' }, { status: 500 });
  }
}
