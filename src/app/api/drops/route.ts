import { NextResponse } from 'next/server';
import { getDbDrops } from '@/lib/drops';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const drops = await getDbDrops();
    return NextResponse.json(drops);
  } catch (error) {
    console.error('❌ [API Drops] Error al recuperar drops:', error);
    return NextResponse.json(
      { error: 'Error del servidor.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
