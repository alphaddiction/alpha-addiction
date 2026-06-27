import { NextResponse } from 'next/server';
import { validateUserCredentials, createSessionRecord, logAuditEvent } from '@/lib/auth-node';
import { signSessionToken } from '@/lib/auth-tokens';

/**
 * POST /api/admin/login
 * 
 * Recibe las credenciales de administrador, las verifica y emite un token de sesión
 * firmado criptográficamente que se guarda en una cookie segura HttpOnly.
 */
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    // Obtener IP y User-Agent de la solicitud
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const now = Date.now();

    // 1. Comprobar si la IP está bloqueada por rate limit
    const attempts = loginAttempts.get(ip);
    if (attempts && attempts.blockedUntil > now) {
      const minutesLeft = Math.ceil((attempts.blockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente. Reintenta en ${minutesLeft} minutos.` },
        { status: 429 }
      );
    }

    // 2. Validar las credenciales
    const user = await validateUserCredentials(email, password);
    
    if (!user) {
      // Registrar intento fallido en base de datos
      await logAuditEvent(null, 'LOGIN_FAILED', `Intento de acceso fallido para el email: ${email}`, ip, userAgent);
      
      const count = (attempts?.count || 0) + 1;
      let blockedUntil = 0;
      if (count >= 5) {
        blockedUntil = now + 15 * 60 * 1000; // Bloqueo de 15 minutos
        console.warn(`🛑 [SECURITY] IP ${ip} bloqueada por 15 minutos debido a 5 intentos fallidos consecutivas.`);
      }
      loginAttempts.set(ip, { count, blockedUntil });

      return NextResponse.json(
        { error: 'Las credenciales proporcionadas no son válidas. Revisa e inténtalo de nuevo.' },
        { status: 401 }
      );
    }

    // Resetear contador de intentos fallidos para la IP al ingresar con éxito
    loginAttempts.delete(ip);

    // 3. Generar sesión en el almacén de datos (DB con fallback en memoria)
    // El token de sesión expira en 15 minutos de inactividad iniciales
    const sessionExpiresMinutes = 15;
    const expiresAtMs = Date.now() + sessionExpiresMinutes * 60 * 1000;
    const sessionId = await createSessionRecord(user.id, ip, userAgent, 0.0104); // Aprox 15 mins en días (15 / 1440)

    // 4. Generar token firmado compatible con el proxy de Next.js Edge
    const signedToken = await signSessionToken(sessionId, expiresAtMs);

    // 5. Registrar login exitoso en logs de auditoría
    await logAuditEvent(user.id, 'LOGIN_SUCCESS', `Inicio de sesión exitoso. Rol: ${user.role}`, ip, userAgent);

    // 6. Devolver respuesta con la cookie HttpOnly configurada
    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('alpha_session', signedToken, {
      path: '/admin',
      maxAge: 15 * 60, // 15 minutos (en segundos)
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('❌ [Admin Login API] Error en el proceso de autenticación:', error);
    return NextResponse.json(
      { error: 'Fallo interno al procesar el inicio de sesión', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
