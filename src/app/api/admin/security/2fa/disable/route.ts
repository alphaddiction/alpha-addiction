import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { verifyPassword, logAuditEvent } from '@/backend/auth/auth-node';
import { decryptSecret, verifyTotpToken, hashRecoveryCode } from '@/backend/auth/auth-2fa';

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

    const { password, code, recoveryCode } = await req.json();

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
      return NextResponse.json({ error: '2FA ya se encuentra desactivado.' }, { status: 400 });
    }

    let isAuthorizedToDisable = false;

    // Camino A: Uso de un código de recuperación
    if (recoveryCode && recoveryCode.trim() !== '') {
      const hashedInput = hashRecoveryCode(recoveryCode.trim());
      let savedHashes: string[] = [];
      try {
        savedHashes = JSON.parse(user.recoveryCodesHash || '[]');
      } catch {
        savedHashes = [];
      }

      const matchIdx = savedHashes.indexOf(hashedInput);
      if (matchIdx !== -1) {
        // Consumir el código
        savedHashes.splice(matchIdx, 1);
        
        await db.adminUser.update({
          where: { id: user.id },
          data: {
            recoveryCodesHash: JSON.stringify(savedHashes)
          }
        });

        isAuthorizedToDisable = true;
        await logAuditEvent(user.id, 'SECURITY_RECOVERY_CODE_USED', 'Código de recuperación utilizado para desactivar 2FA.', session.ipAddress, session.userAgent);
      } else {
        await logAuditEvent(user.id, '2FA_DISABLE_FAILED', 'Intento de desactivar 2FA con código de recuperación inválido.', session.ipAddress, session.userAgent);
        return NextResponse.json({ error: 'El código de recuperación no es válido.' }, { status: 400 });
      }
    } else {
      // Camino B: Contraseña actual + código TOTP
      if (!password || !code) {
        return NextResponse.json({ error: 'Debes proporcionar tu contraseña y código TOTP o un código de recuperación.' }, { status: 400 });
      }

      // Validar contraseña
      const isPasswordValid = verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        await logAuditEvent(user.id, '2FA_DISABLE_FAILED', 'Intento de desactivar 2FA: Contraseña incorrecta.', session.ipAddress, session.userAgent);
        return NextResponse.json({ error: 'La contraseña introducida es incorrecta.' }, { status: 400 });
      }

      // Validar código TOTP
      if (!user.twoFactorSecretEncrypted) {
        return NextResponse.json({ error: 'Secreto de segundo factor ausente.' }, { status: 400 });
      }

      const decryptedSecret = decryptSecret(user.twoFactorSecretEncrypted);
      const isOtpValid = verifyTotpToken(decryptedSecret, code.trim());

      if (!isOtpValid) {
        await logAuditEvent(user.id, '2FA_DISABLE_FAILED', 'Intento de desactivar 2FA: Código TOTP incorrecto.', session.ipAddress, session.userAgent);
        return NextResponse.json({ error: 'El código TOTP de 6 dígitos no es válido.' }, { status: 400 });
      }

      isAuthorizedToDisable = true;
    }

    if (isAuthorizedToDisable) {
      // Desactivar 2FA
      await db.adminUser.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecretEncrypted: null,
          twoFactorConfirmedAt: null,
          recoveryCodesHash: null,
          lastSecurityEventAt: new Date()
        }
      });

      await logAuditEvent(user.id, '2FA_DISABLED', 'Autenticación de doble factor desactivada correctamente.', session.ipAddress, session.userAgent);

      return NextResponse.json({
        success: true,
        message: '2FA desactivado correctamente.'
      });
    }

    return NextResponse.json({ error: 'Petición no autorizada.' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ [2FA Disable API] Error:', error);
    return NextResponse.json({
      error: 'Error al desactivar el 2FA.',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
