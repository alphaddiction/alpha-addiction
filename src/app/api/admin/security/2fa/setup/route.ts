import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';
import { generate2faSecret, generateQrCodeUrl, encryptSecret } from '@/lib/auth-2fa';
import { logAuditEvent } from '@/lib/auth-node';

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

    // 1. Buscar la sesión en base de datos para obtener el usuario
    const session = await db.adminSession.findUnique({
      where: { id: verified.sessionId },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    }

    const user = session.user;

    // 2. Generar el secreto TOTP
    const { secret, otpauthUrl } = generate2faSecret(user.email);

    // 3. Cifrar el secreto antes de guardarlo en la base de datos
    const encryptedSecret = encryptSecret(secret);

    // 4. Guardar temporalmente en el usuario (sin confirmar)
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        twoFactorSecretEncrypted: encryptedSecret,
        lastSecurityEventAt: new Date()
      }
    });

    // 5. Generar código QR
    const qrCodeUrl = await generateQrCodeUrl(otpauthUrl);

    // 6. Registrar en logs de auditoría
    await logAuditEvent(user.id, '2FA_SETUP_INITIATED', 'Se ha iniciado la configuración de segundo factor y generado el secreto.', session.ipAddress, session.userAgent);

    return NextResponse.json({
      success: true,
      manualKey: secret,
      qrCodeUrl
    });

  } catch (error: any) {
    console.error('❌ [2FA Setup API] Error:', error);
    return NextResponse.json({
      error: 'Error al iniciar la configuración del 2FA.',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
