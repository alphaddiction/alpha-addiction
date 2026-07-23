import { NextResponse } from 'next/server';
import { processInboundEmail, InboundEmailPayload } from '@/backend/notifications/email/inbound-processor';

// Helper para extraer nombre y correo del formato "Nombre <email@example.com>"
function parseFromHeader(fromStr: string): { name?: string; email: string } {
  const match = fromStr.match(/^(.*?)\s*<([^>]+)>/);
  if (match) {
    return {
      name: match[1]?.trim().replace(/^["']|["']$/g, '') || undefined,
      email: match[2]?.trim().toLowerCase() || '',
    };
  }
  return {
    email: fromStr.trim().toLowerCase(),
  };
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Resend envía las webhooks con la estructura { type: "email.received", data: { ... } } o directa
    const emailData = payload.data || payload;

    if (!emailData || !emailData.from || !emailData.subject) {
      console.warn('⚠️ [Resend Inbound Webhook] Petición inválida o faltan campos obligatorios.');
      return NextResponse.json({ error: 'Faltan campos obligatorios (from o subject)' }, { status: 400 });
    }

    const { name: fromName, email: fromEmail } = parseFromHeader(emailData.from);
    const toEmail = Array.isArray(emailData.to) ? emailData.to[0] : emailData.to || 'support@alphaddiction.com';

    // Normalizar cabeceras a minúsculas
    const rawHeaders = emailData.headers || {};
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawHeaders)) {
      headers[k.toLowerCase()] = String(v);
    }

    // Identificar Message-ID e In-Reply-To
    const messageId = emailData.last_message_id || emailData.message_id || headers['message-id'] || `inbound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@alphaddiction.com`;
    const inReplyTo = headers['in-reply-to'] || emailData.in_reply_to || undefined;
    const references = headers['references'] || emailData.references || undefined;

    // Validación básica de spoofing/SPF/DKIM en cabeceras si estuvieran presentes
    const spfHeader = headers['received-spf'] || '';
    if (spfHeader && !spfHeader.toLowerCase().includes('pass')) {
      console.warn(`🛡️ [Resend Inbound Webhook] Posible suplantación de identidad (SPF fallido) de ${fromEmail}.`);
    }

    const emailPayload: InboundEmailPayload = {
      fromName,
      fromEmail,
      toEmail,
      subject: emailData.subject,
      textBody: emailData.text,
      htmlBody: emailData.html,
      messageId,
      inReplyTo,
      references,
      headers,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
    };

    const result = await processInboundEmail(emailPayload);

    return NextResponse.json({
      success: true,
      action: result.action,
      ticketId: result.ticketId,
      messageId: result.messageId,
    });
  } catch (err: any) {
    console.error('❌ [Resend Inbound Webhook] Error al recibir webhook de correo:', err);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor al procesar el email entrante.',
      message: err.message,
    }, { status: 500 });
  }
}
