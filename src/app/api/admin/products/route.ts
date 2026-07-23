import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

// Helper de autenticación admin
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  
  const verified = await verifySessionToken(token);
  return !!verified;
}

/**
 * PATCH /api/admin/products - Actualizar un producto (y su stock virtual) en Neon
 */
export async function PATCH(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, priceEUR, dropId, status, colorVariants, descriptionShort } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del producto obligatorio.' }, { status: 400 });
    }

    const updates: any = {};
    if (priceEUR !== undefined) updates.priceEUR = parseFloat(priceEUR);
    if (dropId !== undefined) updates.dropId = dropId || null;
    if (status !== undefined) updates.status = status;
    if (colorVariants !== undefined) updates.colorVariants = colorVariants;
    if (descriptionShort !== undefined) updates.descriptionShort = descriptionShort;

    const product = await db.product.update({
      where: { id },
      data: updates,
    });

    console.log(`🛡️ [Admin Products] Producto ${product.name} (${product.id}) actualizado.`);
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('❌ [Admin Products PATCH] Error actualizando producto:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}
