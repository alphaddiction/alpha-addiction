import { NextResponse } from 'next/server';
import { validateUserCredentials, createSessionRecord, logAuditEvent } from '@/lib/auth-node';
import { signSessionToken } from '@/lib/auth-tokens';

/**
 * POST /api/admin/login
 * 
 * Recibe las credenciales de administrador, las verifica y emite un token de sesión
 * firmado criptográficamente que se guarda en una cookie segura HttpOnly.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    // 1. Validar las credenciales
    const user = await validateUserCredentials(email, password);
    
    // Obtener IP y User-Agent de la solicitud
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (!user) {
      // Registrar intento fallido
      await logAuditEvent(null, 'LOGIN_FAILED', `Intento de acceso fallido para el email: ${email}`, ip, userAgent);
      
      return NextResponse.json(
        { error: 'Las credenciales proporcionadas no son válidas. Revisa e inténtalo de nuevo.' },
        { status: 401 }
      );
    }

    // 2. Generar sesión en el almacén de datos (DB con fallback en memoria)
    const expiresDays = 1;
    const expiresAtMs = Date.now() + expiresDays * 24 * 60 * 60 * 1000;
    const sessionId = await createSessionRecord(user.id, ip, userAgent, expiresDays);

    // 3. Generar token firmado compatible con el proxy de Next.js Edge
    const signedToken = await signSessionToken(sessionId, expiresAtMs);

    // 4. Registrar login exitoso en logs de auditoría
    await logAuditEvent(user.id, 'LOGIN_SUCCESS', `Inicio de sesión exitoso. Rol: ${user.role}`, ip, userAgent);

    // 5. Devolver respuesta con la cookie HttpOnly configurada
    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('alpha_session', signedToken, {
      path: '/admin',
      maxAge: 86400, // 24 horas (en segundos)
      sameSite: 'strict',
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
