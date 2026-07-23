import { NextResponse } from 'next/server';
import { db } from '@/backend/database/db';
import { signPortalSessionToken } from '@/backend/auth/portal-auth';

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const verifyRateLimits = new Map<string, RateLimitEntry>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of verifyRateLimits.entries()) {
      if (now > entry.resetAt) {
        verifyRateLimits.delete(ip);
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
    const limitEntry = verifyRateLimits.get(ip);
    const windowMs = 10 * 60 * 1000;
    const maxAttempts = 10; // Más margen para escribir códigos

    if (limitEntry && now < limitEntry.resetAt) {
      if (limitEntry.attempts >= maxAttempts) {
        const minutesLeft = Math.ceil((limitEntry.resetAt - now) / 60000);
        return NextResponse.json(
          { error: `Demasiados intentos fallidos. Por favor, espera ${minutesLeft} minutos.` },
          { status: 429 }
        );
      }
      limitEntry.attempts++;
    } else {
      verifyRateLimits.set(ip, { attempts: 1, resetAt: now + windowMs });
    }

    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'El correo electrónico y el código son obligatorios.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Buscar el último código OTP generado para este correo que no haya sido usado y no haya expirado
    const otpRecord = await db.supportOtp.findFirst({
      where: {
        email: cleanEmail,
        used: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'El código de verificación ha expirado o no es válido. Vuelve a solicitar otro.' },
        { status: 400 }
      );
    }

    // 2. Comprobar código
    if (otpRecord.code !== cleanCode) {
      const nextAttempts = otpRecord.attempts + 1;
      const maxCodeAttempts = 5;

      if (nextAttempts >= maxCodeAttempts) {
        // Invalidar el código por exceso de intentos
        await db.supportOtp.update({
          where: { id: otpRecord.id },
          data: { used: true, attempts: nextAttempts }
        });
        return NextResponse.json(
          { error: 'Código invalidado debido a demasiados intentos fallidos. Solicita uno nuevo.' },
          { status: 400 }
        );
      } else {
        await db.supportOtp.update({
          where: { id: otpRecord.id },
          data: { attempts: nextAttempts }
        });
        return NextResponse.json(
          { error: `Código incorrecto. Te quedan ${maxCodeAttempts - nextAttempts} intentos.` },
          { status: 400 }
        );
      }
    }

    // 3. Código correcto: marcar como usado y registrar acceso
    await db.supportOtp.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Calcular el tiempo de autenticación en segundos
    const durationSeconds = Math.round((Date.now() - otpRecord.createdAt.getTime()) / 1000);
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Guardar el log de acceso
    await db.customerAccessLog.create({
      data: {
        email: cleanEmail,
        accessType: 'OTP',
        durationSeconds,
        ipAddress: ip,
        userAgent
      }
    });

    // 4. Firmar token de sesión del portal
    const sessionToken = await signPortalSessionToken(cleanEmail);

    // 5. Inyectar la cookie
    const response = NextResponse.json({
      success: true,
      message: 'Sesión iniciada correctamente.'
    });

    response.cookies.set('client_portal_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 horas
      path: '/'
    });

    console.log(`✅ [OTP Verify] Acceso exitoso para ${cleanEmail} (IP: ${ip})`);
    return response;

  } catch (error: any) {
    console.error('❌ [OTP Verify API] Error general:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
