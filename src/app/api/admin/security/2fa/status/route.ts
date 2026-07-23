import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function GET() {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { id: verified.sessionId },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    }

    const user = session.user;

    let recoveryCodesCount = 0;
    try {
      const hashes = JSON.parse(user.recoveryCodesHash || '[]');
      recoveryCodesCount = hashes.length;
    } catch {
      recoveryCodesCount = 0;
    }

    return NextResponse.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorConfirmedAt: user.twoFactorConfirmedAt,
      twoFactorLastUsedAt: user.twoFactorLastUsedAt,
      lastSecurityEventAt: user.lastSecurityEventAt,
      email: user.email,
      role: user.role,
      recoveryCodesCount
    });

  } catch (error: any) {
    console.error('❌ [2FA Status GET API] Error:', error);
    return NextResponse.json({ error: 'Error al recuperar estado de 2FA.' }, { status: 500 });
  }
}
