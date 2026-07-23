import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { ensureInitialDropsSeeded } from '@/shared/models/drops';

export const dynamic = 'force-dynamic';

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

    await ensureInitialDropsSeeded();
    const products = await db.product.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        drop: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('❌ [API Admin Products List] Error listing products:', error);
    return NextResponse.json({ error: 'Error del servidor.', message: error.message }, { status: 500 });
  }
}
