import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transitionDropStatuses } from '@/lib/drops';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(req: Request, { params }: Props) {
  try {
    const { slug } = await params;
    
    // Ejecutar transiciones automáticas antes de responder
    await transitionDropStatuses();

    const drop = await db.drop.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      include: {
        products: true,
      },
    });

    if (!drop) {
      return NextResponse.json(
        { error: 'Drop no encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json(drop);
  } catch (error) {
    console.error('❌ [API Drops Detail] Error al recuperar drop:', error);
    return NextResponse.json(
      { error: 'Error del servidor.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
