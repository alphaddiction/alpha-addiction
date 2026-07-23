import { saveCustomerConsent } from '@/backend/notifications/email/consents';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type') || 'marketing';

    if (!email) {
      return new Response('Falta el correo electrónico.', { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const consentType = type === 'newsletter' ? 'newsletter' : 'marketing';

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Registrar la revocación (accepted = false) en el histórico
    await saveCustomerConsent({
      email: cleanEmail,
      consentType,
      accepted: false,
      ipAddress,
      userAgent,
      legalTextVersion: 'v1.0',
    });

    // Renderizar página HTML de confirmación acorde a la paleta de la web
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suscripción Cancelada - Alpha Addiction</title>
  <style>
    body {
      background-color: #f5f5f0;
      color: #262626;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      text-align: center;
      padding: 100px 20px;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      max-width: 480px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e5e0;
      border-top: 4px solid #d4af37;
      padding: 48px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }
    h1 {
      font-size: 20px;
      font-weight: 900;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    p {
      font-size: 14px;
      color: #4a4a4a;
      line-height: 1.8;
      margin-bottom: 36px;
    }
    .btn {
      display: inline-block;
      background-color: #0a0a0a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #d4af37;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Suscripción Cancelada</h1>
    <p>
      El correo electrónico <strong>${cleanEmail}</strong> ha sido dado de baja con éxito de la lista de envío de <strong>${consentType === 'newsletter' ? 'Contenido e Inspiración' : 'Novedades y Descuentos'}</strong> de Alpha Addiction.
    </p>
    <a href="https://alphaddiction.com" class="btn">Volver a la Tienda</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err: any) {
    console.error('❌ Error al procesar baja de correo:', err);
    return new Response('Error interno del servidor', { status: 500 });
  }
}
