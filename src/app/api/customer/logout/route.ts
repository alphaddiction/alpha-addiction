import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    const response = NextResponse.json({
      success: true,
      message: 'Sesión del portal cerrada correctamente.'
    });

    // Eliminar la cookie
    response.cookies.delete('client_portal_session');

    return response;
  } catch (error: any) {
    console.error('❌ [Portal Logout POST] Error:', error);
    return NextResponse.json({ error: 'Error al cerrar sesión.' }, { status: 500 });
  }
}
