import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth-tokens';

/**
 * Proxy de Next.js 16 (Middleware) para la protección de rutas administrativas.
 * 
 * Intercepta todas las peticiones dirigidas a /admin/* y verifica la firma 
 * criptográfica y vigencia del token de la cookie de sesión.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo interceptar si es una ruta bajo /admin
  if (pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get('alpha_session')?.value;
    const isLoginPage = pathname === '/admin/login';

    // 1. Si no hay cookie de sesión
    if (!sessionToken) {
      // En producción redirigir forzosamente, en desarrollo permitir acceso para pruebas cómodas
      if (process.env.NODE_ENV === 'production' && !isLoginPage) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // 2. Si hay cookie, verificar firma y expiración de forma asíncrona
    const verified = await verifySessionToken(sessionToken);

    if (!verified) {
      // Token inválido, corrupto o expirado
      if (process.env.NODE_ENV === 'production' && !isLoginPage) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        // Limpiar cookie corrupta/expirada
        response.cookies.set('alpha_session', '', { path: '/admin', maxAge: 0 });
        return response;
      }
      // En desarrollo, limpiar la cookie inválida y permitir el paso
      const response = NextResponse.next();
      response.cookies.set('alpha_session', '', { path: '/admin', maxAge: 0 });
      return response;
    }

    // 3. Token es válido
    if (isLoginPage) {
      // Redirigir a dashboard si intenta loguearse estando ya autenticado
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
