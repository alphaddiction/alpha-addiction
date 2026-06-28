import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';

// Helper de autenticación administrativa
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  
  const verified = await verifySessionToken(token);
  return !!verified;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar si el Drop existe
    const drop = await db.drop.findUnique({
      where: { id },
    });

    if (!drop) {
      return NextResponse.json({ error: 'El drop no existe.' }, { status: 404 });
    }

    // Obtener los registrados en la lista de espera
    const waitlist = await db.dropWaitlist.findMany({
      where: { dropId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        origin: true,
        status: true,
        createdAt: true,
        confirmedAt: true,
        ipHash: true,
        userAgentHash: true,
      },
    });

    return NextResponse.json(waitlist);
  } catch (error) {
    console.error('❌ [API Admin Drops Waitlist] Error crítico:', error);
    return NextResponse.json(
      { error: 'Error del servidor.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
