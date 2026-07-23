import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { runScheduledTasks } from '@/backend/events/scheduler';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  const verified = await verifySessionToken(token);
  return !!verified;
}

/**
 * POST /api/admin/events/run - Ejecutar manualmente las tareas programadas (Scheduler)
 */
export async function POST(req: Request) {
  try {
    // Para simplificar, permitimos la llamada si el usuario es un administrador autenticado
    // O si se provee una cabecera de autorización cron de Vercel/sistema (para producción).
    const isAuthed = await checkAdminAuth();
    const cronSecret = req.headers.get('Authorization');
    const isValidCronCall = cronSecret === `Bearer ${process.env.CRON_SECRET || 'local_secret'}`;

    if (!isAuthed && !isValidCronCall) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    console.log('⏰ [API Admin Events Run] Iniciando ejecución manual/programada del Scheduler...');
    const result = await runScheduledTasks();
    console.log('⏰ [API Admin Events Run] Finalizada con resultado:', result);

    return NextResponse.json({
      success: true,
      message: 'Scheduler ejecutado correctamente.',
      result
    });
  } catch (error: any) {
    console.error('❌ [API Admin Events Run] Error ejecutando tareas:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}
