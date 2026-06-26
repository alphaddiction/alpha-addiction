import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Interceptar solicitudes dirigidas a rutas /admin
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('alpha_session')?.value;
    const isLoginPage = pathname === '/admin/login';

    if (!session && !isLoginPage) {
      // Usuario no autenticado intentando acceder a una ruta protegida
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (session && isLoginPage) {
      // Usuario ya autenticado intentando acceder a la pantalla de login
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

// Configurar el matcher para que solo intercepte las rutas del panel de administración
export const config = {
  matcher: ['/admin/:path*'],
};
