import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, signSessionToken } from '@/lib/auth-tokens';

/**
 * Proxy de Next.js 16 (Middleware) para la protección de rutas administrativas y endurecimiento de seguridad.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';

  // 1. Protección contra ataques CSRF para métodos de mutación (POST, PUT, PATCH, DELETE)
  const isWebhook = pathname.startsWith('/api/webhooks/') || pathname.includes('/webhook');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !isWebhook) {
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new NextResponse('Fallo de validación CSRF (Origen no coincidente).', { status: 403 });
        }
      } catch {
        return new NextResponse('Fallo de validación CSRF (Origen inválido).', { status: 403 });
      }
    } else if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) {
          return new NextResponse('Fallo de validación CSRF (Referer no coincidente).', { status: 403 });
        }
      } catch {
        return new NextResponse('Fallo de validación CSRF (Referer inválido).', { status: 403 });
      }
    }
  }

  // 2. Restricción opcional por IP Allowlist
  const allowedIpsEnv = process.env.ADMIN_ALLOWED_IPS;
  if (allowedIpsEnv && allowedIpsEnv.trim() !== '') {
    const allowedIps = allowedIpsEnv.split(',').map(ip => ip.trim());
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    
    if (!allowedIps.includes(clientIp)) {
      console.warn(`🛑 [SECURITY BLOCK] Intento de acceso bloqueado para la IP no autorizada: ${clientIp}`);
      return new NextResponse('Acceso denegado. Dirección IP no autorizada.', { status: 403 });
    }
  }

  // 3. Protección de rutas administrativas (/admin/*)
  if (pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get('alpha_session')?.value;
    const isLoginPage = pathname === '/admin/login';

    // A. Si no hay cookie de sesión
    if (!sessionToken) {
      if (!isLoginPage) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      return applySecurityHeaders(NextResponse.next());
    }

    // B. Si hay cookie, verificar firma y expiración
    const verified = await verifySessionToken(sessionToken);

    if (!verified) {
      // Token inválido, alterado o expirado por inactividad
      if (!isLoginPage) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.set('alpha_session', '', { path: '/', maxAge: 0 });
        return applySecurityHeaders(response);
      }
      const response = NextResponse.next();
      response.cookies.set('alpha_session', '', { path: '/', maxAge: 0 });
      return applySecurityHeaders(response);
    }

    // C. Token es válido. Redirigir si intenta ir a login estando autenticado
    if (isLoginPage) {
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // D. Implementación de Sliding Session (Renovación automática en actividad)
    const response = NextResponse.next();
    
    // Generar un nuevo token extendido por 15 minutos
    const newExpiresAt = Date.now() + 15 * 60 * 1000;
    const renewedToken = await signSessionToken(verified.sessionId, newExpiresAt);

    response.cookies.set('alpha_session', renewedToken, {
      path: '/',
      maxAge: 15 * 60, // 15 minutos en segundos
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return applySecurityHeaders(response);
  }

  return applySecurityHeaders(NextResponse.next());
}

/**
 * Inyecta las cabeceras estándar de seguridad OWASP en la respuesta.
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // Cabecera CSP robusta pero segura para el runtime de Next.js
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.sandbox.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://files.cdn.printful.com https://static.cdn.printful.com https://www.paypalobjects.com; connect-src 'self' https://api-m.sandbox.paypal.com https://api-m.paypal.com https://api.printful.com; frame-src 'self' https://www.sandbox.paypal.com https://www.paypal.com;"
  );
  
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'], // Proteger tanto páginas como APIs
};
