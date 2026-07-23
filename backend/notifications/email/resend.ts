import { getEnv } from '@/shared/utils/validations';
import { ResendResponse } from './types';
import { createNotification } from '@/backend/notifications/service';

/**
 * Cliente HTTP ligero y directo para enviar correos usando la API REST de Resend.
 */
export async function sendViaResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; resendId?: string; error?: string; latencyMs: number }> {
  const env = getEnv();
  const startTime = Date.now();

  const from = env.EMAIL_FROM || 'Alpha Addiction <no-reply@alphaddiction.com>';
  const replyTo = env.EMAIL_REPLY_TO || undefined;

  // Si estamos en entorno de desarrollo con una clave de pruebas/mock, simulamos el envío exitoso
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 'MOCK_RESEND_API_KEY') {
    const latencyMs = Date.now() - startTime;
    console.log(`✉️ [MOCK RESEND] Enviando correo simulado a: ${to}`);
    console.log(`   Asunto: "${subject}"`);
    return {
      success: true,
      resendId: `mock-email-id-${Date.now()}`,
      latencyMs,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    const latencyMs = Date.now() - startTime;
    const data = (await response.json()) as ResendResponse;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `Error HTTP Resend [${response.status}]: ${response.statusText}`;
      console.error('❌ Error de API de Resend:', data.error);

      createNotification({
        type: 'email_error',
        title: 'Error de envío de email',
        message: `Fallo al enviar correo a ${to}. Razón: ${errorMsg}`,
        severity: 'error',
        module: 'email',
        metadata: { recipient: to, error: errorMsg }
      }).catch(err => console.error('⚠️ [Resend Notification Error]:', err));

      return {
        success: false,
        error: errorMsg,
        latencyMs,
      };
    }

    return {
      success: true,
      resendId: data.id,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = (error as Error).message;
    console.error('❌ Error de red/excepción al enviar con Resend:', error);

    createNotification({
      type: 'email_error',
      title: 'Excepción de red al enviar email',
      message: `Error al enviar correo a ${to}. Detalle: ${errorMsg}`,
      severity: 'critical',
      module: 'email',
      metadata: { recipient: to, error: errorMsg }
    }).catch(err => console.error('⚠️ [Resend Notification Error]:', err));

    return {
      success: false,
      error: errorMsg,
      latencyMs,
    };
  }
}
