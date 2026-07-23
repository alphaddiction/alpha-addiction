import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { destroySessionRecord, logAuditEvent } from '@/backend/auth/auth-node';

/**
 * POST /api/admin/logout
 * 
 * Invalida la sesión activa en el almacén de datos y elimina la cookie de sesión
 * del navegador, cerrando el acceso del administrador.
 */
export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    
    // Extraer token alpha_session de las cookies de la petición
    const sessionToken = req.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('alpha_session='))
      ?.split('=')[1];

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (sessionToken) {
      const verified = await verifySessionToken(sessionToken);
      if (verified) {
        // Destruir la sesión en la base de datos o memoria
        await destroySessionRecord(verified.sessionId);
        await logAuditEvent(null, 'LOGOUT_SUCCESS', `Cierre de sesión para la sesión: ${verified.sessionId}`, ip, userAgent);
      }
    }

    // Preparar respuesta para eliminar la cookie
    const response = NextResponse.json({ success: true, message: 'Sesión cerrada con éxito.' });
    
    response.cookies.set('alpha_session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'strict',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('❌ [Admin Logout API] Error al cerrar sesión:', error);
    return NextResponse.json(
      { error: 'Fallo interno al procesar el cierre de sesión' },
      { status: 500 }
    );
  }
}
