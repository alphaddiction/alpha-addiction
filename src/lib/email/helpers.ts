/**
 * Formatea un número decimal como precio en Euros.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/**
 * Formatea una fecha de objeto o string a un formato español legible.
 */
export function formatDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Valida de forma básica el formato de una dirección de correo.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

/**
 * Plantilla base HTML con diseño de lujo de la marca.
 */
export function emailLayout(title: string, bodyContent: string, recipientEmail?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@800;900&display=swap');

    body {
      margin: 0;
      padding: 0;
      background-color: #f5f5f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #262626;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f5f5f0;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e5e0;
      padding: 0;
      box-sizing: border-box;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
    }
    .top-nav {
      background-color: #121212;
      padding: 14px 20px;
      text-align: center;
      letter-spacing: 0.2em;
      font-size: 10px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      border-bottom: 2px solid #d4af37;
    }
    .top-nav a {
      color: #ffffff;
      text-decoration: none;
      margin: 0 12px;
    }
    .logo-container {
      padding: 40px 20px 32px 20px;
      text-align: center;
      background-color: #ffffff;
    }
    .logo-img {
      height: 42px;
      width: auto;
      max-width: 100%;
      display: block;
      margin: 0 auto;
      border: 0;
    }
    .content {
      padding: 0 48px 48px 48px;
    }
    .title {
      font-size: 22px;
      font-weight: 900;
      color: #0a0a0a;
      margin-top: 0;
      margin-bottom: 24px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-family: 'Montserrat', sans-serif;
      border-left: 4px solid #d4af37;
      padding-left: 16px;
    }
    .text {
      font-size: 14px;
      line-height: 1.8;
      color: #4a4a4a;
      margin-bottom: 24px;
    }
    .text strong {
      color: #0a0a0a;
    }
    .table-container {
      margin: 36px 0;
      border-top: 1px solid #e5e5e0;
      border-bottom: 1px solid #e5e5e0;
      padding: 10px 0;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
    }
    .item-table th {
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #8c8c8c;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e5e0;
    }
    .item-table td {
      font-size: 13px;
      padding: 12px 0;
      vertical-align: top;
      color: #262626;
      border-bottom: 1px solid #f5f5f0;
    }
    .total-row td {
      font-weight: bold;
      border-top: 1px dashed #e5e5e0;
      padding-top: 16px;
      font-size: 15px;
      color: #0a0a0a;
    }
    .btn-container {
      text-align: center;
      margin: 36px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0a0a0a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      border: none;
      font-family: 'Montserrat', sans-serif;
    }
    .brand-banner {
      background-color: #121212;
      border-top: 3px solid #d4af37;
      padding: 40px 32px;
      text-align: center;
      color: #ffffff;
      margin-top: 48px;
    }
    .brand-banner h3 {
      font-family: 'Montserrat', sans-serif;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.2em;
      margin: 0 0 10px 0;
      color: #ffffff;
    }
    .brand-banner p {
      font-size: 12px;
      color: #a3a3a3;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }
    .brand-banner .banner-btn {
      display: inline-block;
      background-color: #ffffff;
      color: #000000 !important;
      text-decoration: none;
      padding: 12px 28px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-family: 'Montserrat', sans-serif;
    }
    .footer {
      margin-top: 40px;
      font-size: 10px;
      color: #8c8c8c;
      text-align: center;
      line-height: 1.6;
      letter-spacing: 0.05em;
    }
    .footer a {
      color: #d4af37;
      text-decoration: none;
      font-weight: bold;
    }
    .social-links {
      text-align: center;
      margin-top: 24px;
      font-size: 10px;
      letter-spacing: 0.15em;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
    }
    .social-links a {
      color: #8c8c8c;
      text-decoration: none;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="top-nav">
        <a href="https://alphaddiction.com/drops">DROPS</a>
        <a href="https://alphaddiction.com/soporte">SOPORTE</a>
        <a href="https://alphaddiction.com/pedido">MI CUENTA</a>
      </div>
      <div class="logo-container">
        <a href="https://alphaddiction.com">
          <img src="https://alphaddiction.com/images/logos/logo.png" alt="ALPHA ADDICTION" class="logo-img" />
        </a>
      </div>
      <div class="content">
        ${bodyContent}
        
        <div class="brand-banner">
          <h3>DESIGNED FOR THE BOLD.</h3>
          <p>La adicción a ser el alfa. Confección artesanal, diseño técnico y stock estrictamente limitado.</p>
          <a href="https://alphaddiction.com/drops" class="banner-btn">VER COLECCIÓN</a>
        </div>

        <div class="social-links">
          <a href="https://instagram.com/alphaddiction">INSTAGRAM</a> ·
          <a href="https://tiktok.com/@alphaddiction">TIKTOK</a>
        </div>

        <div class="footer">
          © ${new Date().getFullYear()} Alpha Addiction. Todos los derechos reservados.<br>
          Recibes este correo porque realizaste una acción en nuestra tienda.<br>
          ${recipientEmail ? `<a href="https://alphaddiction.com/api/customer/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=marketing">Darse de baja</a> · ` : ''}<a href="https://alphaddiction.com/legal/privacidad">Política de Privacidad</a> · <a href="https://alphaddiction.com/legal/cookies">Política de Cookies</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
