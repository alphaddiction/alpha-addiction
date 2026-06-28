import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';
import { sendSupportTicketClosed } from '@/lib/email/send-email';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  
  const verified = await verifySessionToken(token);
  return verified;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado.' }, { status: 404 });
    }

    // Obtener estadísticas y logs de acceso del cliente
    const accessLogs = await db.customerAccessLog.findMany({
      where: { email: ticket.customerEmail },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const accessStats = {
      totalAccesses: await db.customerAccessLog.count({ where: { email: ticket.customerEmail } }),
      tokenAccesses: await db.customerAccessLog.count({ where: { email: ticket.customerEmail, accessType: 'TOKEN' } }),
      otpAccesses: await db.customerAccessLog.count({ where: { email: ticket.customerEmail, accessType: 'OTP' } }),
      credentialsAccesses: await db.customerAccessLog.count({ where: { email: ticket.customerEmail, accessType: 'CREDENTIALS' } }),
      logs: accessLogs.map(l => ({
        id: l.id,
        createdAt: l.createdAt,
        accessType: l.accessType,
        orderNumber: l.orderNumber,
        ipAddress: l.ipAddress
      }))
    };

    return NextResponse.json({ ticket, customerAccess: accessStats });

  } catch (error: any) {
    console.error('❌ [Admin Support Detail GET] Error:', error);
    return NextResponse.json({ error: 'Error interno de servidor.' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, priority } = body;

    const existingTicket = await db.supportTicket.findUnique({ where: { id } });
    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket no encontrado.' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'closed' && existingTicket.status !== 'closed') {
        updateData.closedAt = new Date();
      } else if (status !== 'closed') {
        updateData.closedAt = null;
      }
    }
    if (priority) {
      updateData.priority = priority;
    }

    const updatedTicket = await db.supportTicket.update({
      where: { id },
      data: updateData
    });

    // Enviar email de cierre de ticket si aplica
    if (status === 'closed' && existingTicket.status !== 'closed') {
      try {
        await sendSupportTicketClosed(id);
      } catch (emailErr) {
        console.error('⚠️ [Admin Support PATCH] Error al enviar email de cierre:', emailErr);
      }
    }

    return NextResponse.json({ ticket: updatedTicket });

  } catch (error: any) {
    console.error('❌ [Admin Support Detail PATCH] Error:', error);
    return NextResponse.json({ error: 'Error interno de servidor.' }, { status: 500 });
  }
}
