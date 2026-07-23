import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifyTemporary2faToken, signSessionToken } from '@/backend/auth/auth-tokens';
import { decryptSecret, verifyTotpToken, hashRecoveryCode } from '@/backend/auth/auth-2fa';
import { createSessionRecord, logAuditEvent } from '@/backend/auth/auth-node';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const tempToken = cookieStore.get('alpha_2fa_pending')?.value;

    if (!tempToken) {
      return NextResponse.json({
        error: 'Sesión temporal expirada.',
        message: 'Tu tiempo límite de 5 minutos ha expirado. Por favor, reintroduce tu usuario y contraseña.'
      }, { status: 401 });
    }

    // 1. Verificar firma del token temporal
    const userId = await verifyTemporary2faToken(tempToken);
    if (!userId) {
      return NextResponse.json({
        error: 'Sesión temporal inválida o alterada.',
        message: 'Reintroduce tus credenciales.'
      }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || code.trim() === '') {
      return NextResponse.json({ error: 'El código de verificación es obligatorio.' }, { status: 400 });
    }

    // 2. Buscar el usuario de administración
    const user = await db.adminUser.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ error: 'Operación no válida.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const normalizedCode = code.trim().toUpperCase();
    const isRecoveryCode = normalizedCode.includes('-') && normalizedCode.length === 9;

    let isCodeValid = false;

    if (isRecoveryCode) {
      // Caso A: Código de recuperación (AAAA-BBBB)
      const hashedInput = hashRecoveryCode(normalizedCode);
      let savedHashes: string[] = [];
      try {
        savedHashes = JSON.parse(user.recoveryCodesHash || '[]');
      } catch {
        savedHashes = [];
      }

      const matchIdx = savedHashes.indexOf(hashedInput);
      if (matchIdx !== -1) {
        isCodeValid = true;
        
        // Consumir el código
        savedHashes.splice(matchIdx, 1);
        
        await db.adminUser.update({
          where: { id: user.id },
          data: {
            recoveryCodesHash: JSON.stringify(savedHashes),
            twoFactorLastUsedAt: new Date(),
            lastSecurityEventAt: new Date()
          }
        });

        await logAuditEvent(user.id, 'SECURITY_RECOVERY_CODE_USED', 'Código de recuperación consumido para inicio de sesión exitoso.', ip, userAgent);
      } else {
        await logAuditEvent(user.id, '2FA_VERIFICATION_FAILED', 'Intento de login con código de recuperación inválido.', ip, userAgent);
      }
    } else {
      // Caso B: Código TOTP de 6 dígitos
      if (!user.twoFactorSecretEncrypted) {
        return NextResponse.json({ error: 'Secreto de segundo factor no configurado.' }, { status: 400 });
      }

      const decryptedSecret = decryptSecret(user.twoFactorSecretEncrypted);
      isCodeValid = verifyTotpToken(decryptedSecret, normalizedCode);

      if (isCodeValid) {
        // Actualizar último uso
        await db.adminUser.update({
          where: { id: user.id },
          data: {
            twoFactorLastUsedAt: new Date()
          }
        });
      } else {
        await logAuditEvent(user.id, '2FA_VERIFICATION_FAILED', 'Intento de login con código TOTP incorrecto.', ip, userAgent);
      }
    }

    if (!isCodeValid) {
      return NextResponse.json({
        error: 'Código inválido.',
        message: 'El código de seguridad introducido es incorrecto o ha caducado.'
      }, { status: 401 });
    }

    // 3. Crear sesión real de administrador (15 minutos)
    const sessionExpiresMinutes = 15;
    const expiresAtMs = Date.now() + sessionExpiresMinutes * 60 * 1000;
    const sessionId = await createSessionRecord(user.id, ip, userAgent, 0.0104);

    // 4. Firmar el token de sesión real
    const signedToken = await signSessionToken(sessionId, expiresAtMs);

    // 5. Registrar login exitoso
    await logAuditEvent(user.id, 'LOGIN_SUCCESS_2FA', `Inicio de sesión verificado por 2FA. Rol: ${user.role}`, ip, userAgent);

    // 6. Configurar cookies: Guardar sesión y borrar temporal de 2FA
    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role
      }
    });

    // Establecer sesión principal
    response.cookies.set('alpha_session', signedToken, {
      path: '/',
      maxAge: 15 * 60,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    // Eliminar cookie temporal de 2FA
    response.cookies.set('alpha_2fa_pending', '', {
      path: '/',
      maxAge: 0
    });

    return response;

  } catch (error: any) {
    console.error('❌ [Admin Login 2FA API] Error:', error);
    return NextResponse.json({
      error: 'Error interno en la autenticación 2FA.',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
