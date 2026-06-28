import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, dropId } = await req.json();

    if (!email || !dropId) {
      return NextResponse.json(
        { error: 'Email y ID de drop requeridos.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validar formato del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Formato de email inválido.' },
        { status: 400 }
      );
    }

    // Comprobar existencia del Drop
    const dropExists = await db.drop.findUnique({
      where: { id: dropId },
    });

    if (!dropExists) {
      return NextResponse.json(
        { error: 'El drop especificado no existe.' },
        { status: 404 }
      );
    }

    // Insertar en la lista de espera (evitar duplicados usando upsert o try-catch)
    try {
      await db.dropWaitlist.create({
        data: {
          dropId,
          email: cleanEmail,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Registro ya existente (Unique constraint) - responder con éxito de todos modos para discreción de datos
        return NextResponse.json({
          success: true,
          message: 'Ya estabas registrado en la lista de espera de este drop. ¡Te notificaremos!',
        });
      }
      throw e;
    }

    console.log(`✉️ [Waitlist API] Registro de email exitoso en lista de espera de Drop: ${dropExists.name} (${cleanEmail})`);

    return NextResponse.json({
      success: true,
      message: 'Te has suscrito con éxito. Te avisaremos en cuanto el drop esté disponible.',
    });
  } catch (error) {
    console.error('❌ [API Waitlist Drop] Error al suscribir a lista de espera:', error);
    return NextResponse.json(
      { error: 'Error del servidor.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
