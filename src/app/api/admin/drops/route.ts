import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

// Función helper para verificar autenticación de administrador
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  
  const verified = await verifySessionToken(token);
  return !!verified;
}

/**
 * POST /api/admin/drops - Crear un nuevo Drop
 */
export async function POST(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      mainImage,
      banner,
      videoUrl,
      status,
      openingAt,
      closingAt,
      primaryColor,
      order,
      metaTitle,
      metaDescription,
      visible,
      featured,
    } = body;

    if (!name || !slug || !description || !mainImage || !banner || !openingAt || !closingAt) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para crear el Drop.' }, { status: 400 });
    }

    const drop = await db.drop.create({
      data: {
        name,
        slug: slug.trim().toLowerCase(),
        description,
        mainImage,
        banner,
        videoUrl: videoUrl || null,
        status: status || 'DRAFT',
        openingAt: new Date(openingAt),
        closingAt: new Date(closingAt),
        primaryColor: primaryColor || '#d4af37',
        order: parseInt(order || 0, 10),
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        visible: visible !== undefined ? visible : true,
        featured: featured !== undefined ? featured : false,
      },
    });

    console.log(`🆕 [Admin Drops] Drop creado con éxito: ${drop.name}`);
    return NextResponse.json({ success: true, drop });
  } catch (error: any) {
    console.error('❌ [Admin Drops POST] Error creando drop:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/drops - Actualizar un Drop
 */
export async function PATCH(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, productIds, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del drop obligatorio.' }, { status: 400 });
    }

    // Campos válidos del modelo Drop en base de datos
    const allowedFields = [
      'name',
      'slug',
      'description',
      'mainImage',
      'banner',
      'videoUrl',
      'status',
      'openingAt',
      'closingAt',
      'primaryColor',
      'order',
      'metaTitle',
      'metaDescription',
      'visible',
      'featured'
    ];

    const sanitizedUpdates: any = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    // Convertir tipos de datos
    if (sanitizedUpdates.openingAt) sanitizedUpdates.openingAt = new Date(sanitizedUpdates.openingAt);
    if (sanitizedUpdates.closingAt) sanitizedUpdates.closingAt = new Date(sanitizedUpdates.closingAt);
    if (sanitizedUpdates.order !== undefined) sanitizedUpdates.order = parseInt(sanitizedUpdates.order, 10);
    if (sanitizedUpdates.slug) sanitizedUpdates.slug = sanitizedUpdates.slug.trim().toLowerCase();

    // Actualización de la cabecera del drop
    const drop = await db.drop.update({
      where: { id },
      data: sanitizedUpdates,
    });

    // Si se especifican IDs de productos, asociar a este drop y desvincular los demás
    if (productIds && Array.isArray(productIds)) {
      // 1. Quitar el drop anterior de todos los productos que pertenecían a este drop
      await db.product.updateMany({
        where: { dropId: id },
        data: { dropId: null },
      });

      // 2. Asignar este dropId a los productos elegidos
      await db.product.updateMany({
        where: { id: { in: productIds } },
        data: { dropId: id },
      });
    }

    console.log(`🔄 [Admin Drops] Drop actualizado con éxito: ${drop.name}`);
    return NextResponse.json({ success: true, drop });
  } catch (error: any) {
    console.error('❌ [Admin Drops PATCH] Error actualizando drop:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/drops - Eliminar un Drop
 */
export async function DELETE(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de drop obligatorio en query.' }, { status: 400 });
    }

    await db.drop.delete({
      where: { id },
    });

    console.log(`🗑️ [Admin Drops] Drop eliminado con éxito ID: ${id}`);
    return NextResponse.json({ success: true, message: 'Drop eliminado con éxito.' });
  } catch (error: any) {
    console.error('❌ [Admin Drops DELETE] Error eliminando drop:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}
