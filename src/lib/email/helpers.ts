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
export function emailLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fdfbf7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1c1c1c;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #fdfbf7;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #eae6df;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 35px;
      border-bottom: 1px solid #eae6df;
      padding-bottom: 25px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #000000;
      text-decoration: none;
    }
    .logo span {
      color: #d4af37;
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: #111111;
      margin-top: 0;
      margin-bottom: 20px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #4a4a4a;
      margin-bottom: 20px;
    }
    .table-container {
      margin: 25px 0;
      border-top: 1px solid #eae6df;
      border-bottom: 1px solid #eae6df;
      padding: 15px 0;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
    }
    .item-table th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8a8a8a;
      padding-bottom: 8px;
    }
    .item-table td {
      font-size: 13px;
      padding: 8px 0;
      vertical-align: top;
    }
    .total-row td {
      font-weight: bold;
      border-top: 1px dashed #eae6df;
      padding-top: 12px;
      font-size: 14px;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background-color: #000000;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      border: 1px solid #000000;
    }
    .footer {
      margin-top: 45px;
      padding-top: 25px;
      border-top: 1px solid #eae6df;
      font-size: 11px;
      color: #8a8a8a;
      text-align: center;
      line-height: 1.5;
    }
    .footer a {
      color: #d4af37;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="https://alphaddiction.com" class="logo">ALPHA<span>ADDICTION</span></a>
      </div>
      ${bodyContent}
      <div class="footer">
        © ${new Date().getFullYear()} Alpha Addiction. Todos los derechos reservados.<br>
        Recibes este correo porque realizaste una acción en nuestra tienda.<br>
        <a href="https://alphaddiction.com/legal/privacidad">Política de Privacidad</a> · <a href="https://alphaddiction.com/legal/cookies">Política de Cookies</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
