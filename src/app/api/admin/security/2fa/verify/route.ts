import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';
import { decryptSecret, verifyTotpToken, generateRecoveryCodes } from '@/lib/auth-2fa';
import { logAuditEvent } from '@/lib/auth-node';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function POST(req: Request) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || code.trim().length !== 6) {
      return NextResponse.json({ error: 'El código de verificación de 6 dígitos es obligatorio.' }, { status: 400 });
    }

    // 1. Obtener sesión y usuario
    const session = await db.adminSession.findUnique({
      where: { id: verified.sessionId },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    }

    const user = session.user;

    if (!user.twoFactorSecretEncrypted) {
      return NextResponse.json({ error: 'Secreto 2FA no iniciado. Llama primero al endpoint de configuración.' }, { status: 400 });
    }

    // 2. Descifrar el secreto de base de datos
    const decryptedSecret = decryptSecret(user.twoFactorSecretEncrypted);

    // 3. Verificar código TOTP
    const isValid = verifyTotpToken(decryptedSecret, code.trim());

    if (!isValid) {
      await logAuditEvent(user.id, '2FA_VERIFICATION_FAILED', 'Intento de confirmación de 2FA fallido (código erróneo).', session.ipAddress, session.userAgent);
      return NextResponse.json({ error: 'El código introducido no es válido. Compruébalo e inténtalo de nuevo.' }, { status: 400 });
    }

    // 4. Generar códigos de recuperación
    const { plain: recoveryCodesPlain, hashes: recoveryCodesHashes } = generateRecoveryCodes();

    // 5. Activar 2FA en el perfil del usuario
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorConfirmedAt: new Date(),
        recoveryCodesHash: JSON.stringify(recoveryCodesHashes),
        lastSecurityEventAt: new Date()
      }
    });

    // 6. Registrar en logs de auditoría
    await logAuditEvent(user.id, '2FA_ENABLED', 'Autenticación de doble factor habilitada correctamente.', session.ipAddress, session.userAgent);

    return NextResponse.json({
      success: true,
      message: '2FA activado con éxito.',
      recoveryCodes: recoveryCodesPlain
    });

  } catch (error: any) {
    console.error('❌ [2FA Verify API] Error:', error);
    return NextResponse.json({
      error: 'Error al verificar el código de segundo factor.',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
