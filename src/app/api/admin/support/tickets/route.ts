import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  
  const verified = await verifySessionToken(token);
  return verified;
}

export async function GET(req: Request) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const query = searchParams.get('q');
    
    // Filtros de búsqueda
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (query) {
      where.OR = [
        { ticketNumber: { contains: query, mode: 'insensitive' } },
        { customerEmail: { contains: query, mode: 'insensitive' } },
        { customerName: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
      ];
    }

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Formatear respuesta con el último mensaje incluido para vista rápida
    const formattedTickets = tickets.map(ticket => {
      const lastMsg = ticket.messages[0] || null;
      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.customerName,
        customerEmail: ticket.customerEmail,
        category: ticket.category,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        source: ticket.source,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        closedAt: ticket.closedAt,
        orderNumber: ticket.orderNumber,
        lastMessageBody: lastMsg ? lastMsg.body : 'Sin mensajes',
        lastMessageSender: lastMsg ? lastMsg.senderType : null,
        lastMessageAt: lastMsg ? lastMsg.createdAt : null,
      };
    });

    return NextResponse.json({ tickets: formattedTickets });

  } catch (error: any) {
    console.error('❌ [Admin Support GET] Error listing tickets:', error);
    return NextResponse.json({ error: 'Error interno de servidor.' }, { status: 500 });
  }
}
