import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signLookupToken, checkLookupRateLimit } from '@/lib/lookup-auth';

export async function POST(req: Request) {
  try {
    // 1. Obtener la IP del cliente para aplicar el Rate Limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';

    const limit = checkLookupRateLimit(ip);
    if (!limit.allowed) {
      console.warn(`⚠️ [Lookup API] Rate Limit excedido para la IP: ${ip}`);
      const minutesRemaining = Math.ceil((limit.resetTime - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: 'Demasiados intentos.',
          message: `Has superado el límite de búsquedas. Por favor, inténtalo de nuevo en ${minutesRemaining} minutos.`,
        },
        { status: 429 }
      );
    }

    // 2. Extraer parámetros del cuerpo
    const { email, orderNumber } = await req.json();

    if (!email || !orderNumber) {
      return NextResponse.json(
        { error: 'Email y número de pedido obligatorios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    // 3. Buscar el pedido en Neon PostgreSQL
    const order = await db.order.findUnique({
      where: { orderNumber: cleanOrderNumber },
    });

    // 4. Validación: debe existir y el correo coincidir exactamente
    if (!order || order.email.trim().toLowerCase() !== cleanEmail) {
      console.warn(`🔍 [Lookup API] Intento fallido para pedido "${cleanOrderNumber}" con email "${cleanEmail}" (IP: ${ip})`);
      // Mensaje genérico para evitar enumeración de pedidos
      return NextResponse.json(
        { error: 'No encontrado.', message: 'El número de pedido o el correo electrónico no son correctos.' },
        { status: 404 }
      );
    }

    // 5. Generar token firmado
    const token = await signLookupToken(order.orderNumber, order.email);

    // 6. Registrar evento en el historial del pedido (Neon)
    await db.order.update({
      where: { id: order.id },
      data: {
        events: {
          create: {
            type: 'CUSTOMER_LOOKUP',
            message: 'El cliente consultó el estado del pedido desde el portal público',
          },
        },
      },
    });

    console.log(`✅ [Lookup API] Consulta exitosa. Pedido: ${order.orderNumber} (IP: ${ip})`);

    // 7. Responder e inyectar la cookie firmada
    const response = NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });

    // Duración de la cookie: 30 minutos (sincronizado con la vigencia del token)
    response.cookies.set(`order_lookup_session_${order.orderNumber}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60, // 30 minutos en segundos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ [Lookup API] Error procesando búsqueda de pedido:', error);
    return NextResponse.json(
      { error: 'Error del servidor.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
