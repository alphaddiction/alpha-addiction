import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPortalOtpEmail } from '@/lib/email/send-email';

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const requestRateLimits = new Map<string, RateLimitEntry>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of requestRateLimits.entries()) {
      if (now > entry.resetAt) {
        requestRateLimits.delete(ip);
      }
    }
  }, 10 * 60 * 1000);
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    const now = Date.now();
    const limitEntry = requestRateLimits.get(ip);
    const windowMs = 10 * 60 * 1000; // 10 min
    const maxAttempts = 5;

    if (limitEntry && now < limitEntry.resetAt) {
      if (limitEntry.attempts >= maxAttempts) {
        const minutesLeft = Math.ceil((limitEntry.resetAt - now) / 60000);
        return NextResponse.json(
          { error: `Demasiadas peticiones. Por favor, espera ${minutesLeft} minutos.` },
          { status: 429 }
        );
      }
      limitEntry.attempts++;
    } else {
      requestRateLimits.set(ip, { attempts: 1, resetAt: now + windowMs });
    }

    const { email } = await req.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'El correo electrónico es obligatorio.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificar si existe algún pedido asociado a este correo
    const hasOrders = await db.order.findFirst({
      where: { email: cleanEmail }
    });

    // 2. Generar el código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // 3. Registrar el código OTP en la base de datos
    await db.supportOtp.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
        ipAddress: ip
      }
    });

    // 4. Si el correo no tiene pedidos asociados, no enviamos email pero devolvemos éxito (simulado)
    // para evitar que atacantes enumeren qué correos han comprado en la tienda.
    if (!hasOrders) {
      console.log(`🔍 [OTP Request] Correo simulado (no existen pedidos): ${cleanEmail}`);
      return NextResponse.json({
        success: true,
        message: 'Código de verificación enviado correctamente a tu correo.'
      });
    }

    // 5. Enviar el correo electrónico con el código OTP
    try {
      await sendPortalOtpEmail(cleanEmail, code);
      console.log(`✅ [OTP Request] Código generado y enviado a ${cleanEmail}`);
    } catch (emailErr) {
      console.error('⚠️ [OTP Request] Error al enviar el correo:', emailErr);
      return NextResponse.json(
        { error: 'Error al enviar el correo electrónico de verificación.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Código de verificación enviado correctamente a tu correo.'
    });

  } catch (error: any) {
    console.error('❌ [OTP Request API] Error general:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
