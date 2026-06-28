import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';
import { EVENTS } from '@/lib/events/events';
import { getSetting, setSetting } from '@/lib/events/helpers';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  const verified = await verifySessionToken(token);
  return !!verified;
}

/**
 * GET /api/admin/events - Obtener lista de eventos, configuración actual y estadísticas
 */
export async function GET() {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    // 1. Obtener configuraciones del motor
    const settings = {
      enable_automations: await getSetting('enable_automations', 'true'),
      auto_submit_to_printful: await getSetting('auto_submit_to_printful', 'false'),
      enable_automatic_emails: await getSetting('enable_automatic_emails', 'true'),
      auto_open_drops: await getSetting('auto_open_drops', 'true'),
      auto_close_drops: await getSetting('auto_close_drops', 'true'),
    };

    // 2. Obtener estadísticas del motor en base a AutomationLog
    const totalRuns = await db.automationLog.count();
    const errorCount = await db.automationLog.count({ where: { status: 'FAILED' } });
    const lastRunLog = await db.automationLog.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const avgDurationObj = await db.automationLog.aggregate({
      where: { status: 'SUCCESS' },
      _avg: {
        durationMs: true
      }
    });
    const avgDurationMs = avgDurationObj._avg.durationMs || 0;

    // Calcular eventos/notificaciones pendientes en waitlist
    const pendingNotifications = await db.dropWaitlist.count({
      where: { status: { in: ['registered', 'pending'] } }
    });

    // Contar cuántas automatizaciones están configuradas como activas
    const activeAutomationsCount = Object.values(settings).filter(v => v === 'true').length;

    const stats = {
      totalRuns,
      errorCount,
      lastEvent: lastRunLog ? {
        eventType: lastRunLog.eventType,
        status: lastRunLog.status,
        createdAt: lastRunLog.createdAt,
        message: lastRunLog.message,
        error: lastRunLog.error
      } : null,
      pendingEvents: pendingNotifications,
      avgDurationMs: Math.round(avgDurationMs),
      activeAutomationsCount
    };

    return NextResponse.json({
      success: true,
      events: EVENTS,
      settings,
      stats
    });
  } catch (error: any) {
    console.error('❌ [API Admin Events GET] Error:', error);
    return NextResponse.json({ error: 'Error interno de servidor.', message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/events - Guardar configuración de automatizaciones
 */
export async function POST(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { settings } = await req.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Payload de configuración inválido.' }, { status: 400 });
    }

    // Guardar cada setting proporcionado
    for (const key of Object.keys(settings)) {
      await setSetting(key, String(settings[key]));
    }

    return NextResponse.json({ success: true, message: 'Configuraciones actualizadas con éxito.' });
  } catch (error: any) {
    console.error('❌ [API Admin Events POST] Error:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}
