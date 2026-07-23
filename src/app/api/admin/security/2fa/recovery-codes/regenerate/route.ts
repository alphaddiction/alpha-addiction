import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { generateRecoveryCodes } from '@/backend/auth/auth-2fa';
import { logAuditEvent } from '@/backend/auth/auth-node';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function POST() {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    // 1. Obtener la sesión y el usuario
    const session = await db.adminSession.findUnique({
      where: { id: verified.sessionId },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    }

    const user = session.user;

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: 'Debes habilitar 2FA antes de regenerar códigos de recuperación.' }, { status: 400 });
    }

    // 2. Generar códigos de recuperación
    const { plain: recoveryCodesPlain, hashes: recoveryCodesHashes } = generateRecoveryCodes();

    // 3. Guardar códigos de recuperación en base de datos
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        recoveryCodesHash: JSON.stringify(recoveryCodesHashes),
        lastSecurityEventAt: new Date()
      }
    });

    // 4. Registrar en logs de auditoría
    await logAuditEvent(user.id, 'SECURITY_RECOVERY_CODES_REGENERATED', 'Códigos de recuperación regenerados correctamente.', session.ipAddress, session.userAgent);

    return NextResponse.json({
      success: true,
      message: 'Códigos de recuperación regenerados con éxito.',
      recoveryCodes: recoveryCodesPlain
    });

  } catch (error: any) {
    console.error('❌ [2FA Recovery Codes Regenerate API] Error:', error);
    return NextResponse.json({
      error: 'Error al regenerar los códigos de recuperación.',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
