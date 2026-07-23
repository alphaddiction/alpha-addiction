import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  const verified = await verifySessionToken(token);
  return !!verified;
}

/**
 * GET /api/admin/events/history - Obtener historial de ejecuciones y logs de automatizaciones
 */
export async function GET() {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const history = await db.automationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // Retornar las últimas 100 ejecuciones
    });

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error('❌ [API Admin Events History] Error:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}
