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

export async function POST(
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
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'La nota interna no puede estar vacía.' }, { status: 400 });
    }

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado.' }, { status: 404 });
    }

    // Obtener correo del administrador que crea la nota
    const session = await db.adminSession.findUnique({
      where: { id: verified.sessionId },
      include: { user: true }
    });
    const adminEmail = session?.user?.email || 'soporte@alpha-addiction.com';

    // Insertar la nota y actualizar el ticket a pending
    const supportMessage = await db.$transaction(async (tx) => {
      const msg = await tx.supportMessage.create({
        data: {
          ticketId: id,
          senderType: 'agent',
          senderEmail: adminEmail,
          body: note.trim(),
          internalNote: true
        }
      });

      await tx.supportTicket.update({
        where: { id },
        data: { status: 'pending' }
      });

      return msg;
    });

    return NextResponse.json({ success: true, message: supportMessage });

  } catch (error: any) {
    console.error('❌ [Admin Support Note POST] Error:', error);
    return NextResponse.json({ error: 'Error interno de servidor.' }, { status: 500 });
  }
}
