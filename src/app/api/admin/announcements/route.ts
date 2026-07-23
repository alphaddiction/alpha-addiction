import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

// Helper de autenticación administrativa
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  
  const verified = await verifySessionToken(token);
  return !!verified;
}

export async function GET() {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    // Auto-seed si no hay registros automáticos
    const autoCount = await db.announcement.count({ where: { type: 'AUTOMATIC' } });
    if (autoCount === 0) {
      await db.announcement.createMany({
        data: [
          {
            id: 'auto-low-stock',
            type: 'AUTOMATIC',
            category: 'LOW_STOCK',
            title: 'Alerta Stock Bajo',
            text: '🔥 ¡Últimas unidades! Solo quedan {stock} prendas de {product} en stock',
            active: false,
            priority: 20,
            order: 0,
            displayMode: 'CONTINUOUS',
            config: { threshold: 8, backgroundColor: '#111111', textColor: '#D4AF37', speed: 15, fontSize: '11px', height: 40, showIcon: true, separator: '·' }
          },
          {
            id: 'auto-drop-countdown',
            type: 'AUTOMATIC',
            category: 'DROP_COUNTDOWN',
            title: 'Cuenta Atrás Drop',
            text: '⏳ ¡Últimos días! El lanzamiento {drop} finaliza en {hours} horas',
            active: false,
            priority: 25,
            order: 1,
            displayMode: 'CONTINUOUS',
            config: { thresholdHours: 48, backgroundColor: '#111111', textColor: '#D4AF37', speed: 15, fontSize: '11px', height: 40, showIcon: true, separator: '·' }
          },
          {
            id: 'auto-free-shipping',
            type: 'AUTOMATIC',
            category: 'FREE_SHIPPING',
            title: 'Promoción Envío Gratis',
            text: '🚚 Envío gratuito en España y Portugal para compras superiores a 100€',
            active: false,
            priority: 15,
            order: 2,
            displayMode: 'CONTINUOUS',
            config: { backgroundColor: '#111111', textColor: '#D4AF37', speed: 15, fontSize: '11px', height: 40, showIcon: true, separator: '·' }
          }
        ]
      });
    }

    const announcements = await db.announcement.findMany({
      orderBy: [
        { type: 'asc' }, // Primero MANUAL, luego AUTOMATIC
        { priority: 'desc' },
        { order: 'asc' }
      ]
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('❌ [API Admin Announcements GET] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al obtener anuncios.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      category,
      title,
      text,
      icon,
      url,
      openInNewTab,
      priority,
      order,
      displayMode,
      active,
      startsAt,
      endsAt,
      config,
      autoConditions,
    } = body;

    if (!title || !text) {
      return NextResponse.json(
        { error: 'El título y el texto son campos obligatorios.' },
        { status: 400 }
      );
    }

    const newAnnouncement = await db.announcement.create({
      data: {
        type: type || 'MANUAL',
        category: category || 'PROMOTION',
        title,
        text,
        icon: icon || null,
        url: url || null,
        openInNewTab: !!openInNewTab,
        priority: priority !== undefined ? parseInt(priority, 10) : 0,
        order: order !== undefined ? parseInt(order, 10) : 0,
        displayMode: displayMode || 'CONTINUOUS',
        active: active !== undefined ? !!active : true,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        config: config || {},
        autoConditions: autoConditions || {},
      },
    });

    return NextResponse.json({ success: true, announcement: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error('❌ [API Admin Announcements POST] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al crear el anuncio.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      type,
      category,
      title,
      text,
      icon,
      url,
      openInNewTab,
      priority,
      order,
      displayMode,
      active,
      startsAt,
      endsAt,
      config,
      autoConditions,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'El ID del anuncio es obligatorio.' }, { status: 400 });
    }

    const announcement = await db.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return NextResponse.json({ error: 'El anuncio especificado no existe.' }, { status: 404 });
    }

    const updatedAnnouncement = await db.announcement.update({
      where: { id },
      data: {
        type: type !== undefined ? type : announcement.type,
        category: category !== undefined ? category : announcement.category,
        title: title !== undefined ? title : announcement.title,
        text: text !== undefined ? text : announcement.text,
        icon: icon !== undefined ? (icon || null) : announcement.icon,
        url: url !== undefined ? (url || null) : announcement.url,
        openInNewTab: openInNewTab !== undefined ? !!openInNewTab : announcement.openInNewTab,
        priority: priority !== undefined ? parseInt(priority, 10) : announcement.priority,
        order: order !== undefined ? parseInt(order, 10) : announcement.order,
        displayMode: displayMode !== undefined ? displayMode : announcement.displayMode,
        active: active !== undefined ? !!active : announcement.active,
        startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : announcement.startsAt,
        endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : announcement.endsAt,
        config: config !== undefined ? config : announcement.config,
        autoConditions: autoConditions !== undefined ? autoConditions : announcement.autoConditions,
      },
    });

    return NextResponse.json({ success: true, announcement: updatedAnnouncement });
  } catch (error) {
    console.error('❌ [API Admin Announcements PUT] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al modificar el anuncio.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID del anuncio es obligatorio.' }, { status: 400 });
    }

    await db.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Anuncio eliminado correctamente.' });
  } catch (error) {
    console.error('❌ [API Admin Announcements DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al eliminar el anuncio.' },
      { status: 500 }
    );
  }
}
