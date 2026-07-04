import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth-tokens';
import { markAllAsRead, markAsRead, archiveNotification, getUnreadCount } from '@/lib/notifications/service';

// GET: Obtener listado filtrado y paginado de notificaciones
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('alpha_session')?.value;
    const isAdmin = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const status = searchParams.get('status') || 'all'; // 'unread', 'read', 'archived', 'all'
    const severity = searchParams.get('severity') || 'all';
    const moduleFilter = searchParams.get('module') || 'all';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    // Construcción del filtro para Prisma
    const whereClause: any = {};

    // Filtrado de estados (por defecto omitimos archivadas a menos que se pidan explícitamente)
    if (status === 'all') {
      whereClause.status = { in: ['unread', 'read'] };
    } else if (status !== 'any') {
      whereClause.status = status;
    }

    if (severity !== 'all') {
      whereClause.severity = severity;
    }

    if (moduleFilter !== 'all') {
      whereClause.module = moduleFilter;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Consulta en base de datos
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where: whereClause })
    ]);

    const unreadCount = await getUnreadCount();

    return NextResponse.json({
      success: true,
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount
    });

  } catch (err: any) {
    console.error('❌ [Notifications GET API Error]:', err);
    return NextResponse.json({
      success: false,
      error: 'Error interno al consultar notificaciones.',
      message: err.message
    }, { status: 500 });
  }
}

// POST: Procesar acciones bulk e individuales
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('alpha_session')?.value;
    const isAdmin = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ids } = body;

    if (action === 'mark_all_read') {
      await markAllAsRead();
      return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas.' });
    }

    if (action === 'mark_read') {
      if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: 'Falta array de ids' }, { status: 400 });
      }
      for (const id of ids) {
        await markAsRead(id);
      }
      return NextResponse.json({ success: true, message: 'Notificaciones marcadas como leídas.' });
    }

    if (action === 'archive') {
      if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: 'Falta array de ids' }, { status: 400 });
      }
      for (const id of ids) {
        await archiveNotification(id);
      }
      return NextResponse.json({ success: true, message: 'Notificaciones archivadas.' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (err: any) {
    console.error('❌ [Notifications POST API Error]:', err);
    return NextResponse.json({
      success: false,
      error: 'Error interno al ejecutar acción en notificaciones.',
      message: err.message
    }, { status: 500 });
  }
}
