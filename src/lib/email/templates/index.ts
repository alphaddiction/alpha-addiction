import { emailLayout, formatPrice, formatDate } from '../helpers';

interface OrderItemInfo {
  name: string;
  size: string;
  color?: string | null;
  quantity: number;
  price: number;
}

interface OrderInfo {
  orderNumber: string;
  createdAt: Date | string;
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  subtotal: number;
  discount: number;
  total: number;
  items: OrderItemInfo[];
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  secureToken?: string | null;
}

/**
 * Renderiza la tabla de artículos en formato HTML.
 */
function renderItemsTable(items: OrderItemInfo[], subtotal: number, discount: number, total: number): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td>
        <strong>${item.name}</strong><br>
        <span style="font-size: 11px; color: #8a8a8a;">Talla: ${item.size} ${item.color ? `· Color: ${item.color}` : ''}</span>
      </td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right; font-family: monospace;">${formatPrice(item.price)}</td>
      <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatPrice(item.price * item.quantity)}</td>
    </tr>`
    )
    .join('');

  return `
    <div class="table-container">
      <table class="item-table">
        <thead>
          <tr>
            <th style="width: 50%;">Artículo</th>
            <th style="width: 15%; text-align: center;">Cant.</th>
            <th style="width: 15%; text-align: right;">Precio</th>
            <th style="width: 20%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="2" style="border-top: 1px dashed #eae6df; padding-top: 15px;"></td>
            <td style="text-align: right; color: #8a8a8a; font-size: 12px; font-weight: normal; border-top: 1px dashed #eae6df; padding-top: 15px;">Subtotal</td>
            <td style="text-align: right; font-family: monospace; border-top: 1px dashed #eae6df; padding-top: 15px;">${formatPrice(subtotal)}</td>
          </tr>
          ${
            discount > 0
              ? `
          <tr>
            <td colspan="2"></td>
            <td style="text-align: right; color: #d43737; font-size: 12px;">Descuento</td>
            <td style="text-align: right; font-family: monospace; color: #d43737; font-weight: bold;">-${formatPrice(discount)}</td>
          </tr>`
              : ''
          }
          <tr>
            <td colspan="2"></td>
            <td style="text-align: right; font-size: 14px; font-weight: bold; border-top: 1px solid #000000; padding-top: 12px;">TOTAL VENTA</td>
            <td style="text-align: right; font-family: monospace; font-size: 16px; font-weight: bold; color: #d4af37; border-top: 1px solid #000000; padding-top: 12px;">${formatPrice(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renderiza el botón interactivo para consultar el estado del pedido.
 */
function renderConsultBtn(orderNumber: string, secureToken?: string | null): string {
  const url = secureToken
    ? `https://alphaddiction.com/pedido/${orderNumber}?token=${secureToken}`
    : `https://alphaddiction.com/pedido/${orderNumber}`;
  return `
    <div class="btn-container">
      <a href="${url}" target="_blank" class="btn">Consultar mi pedido</a>
    </div>
  `;
}

/**
 * 1. Pedido Recibido
 */
export function getReceivedEmail(order: OrderInfo): string {
  const title = 'Hemos recibido tu pedido';
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">Muchas gracias por tu compra en Alpha Addiction. Hemos registrado tu pedido <strong>#${order.orderNumber}</strong> con éxito y se encuentra en estado de pago pendiente en nuestro sistema central.</p>
    <p class="text"><strong>Detalles del pedido:</strong></p>
    <p class="text" style="font-size: 12px; font-mono: true; color: #8a8a8a;">Fecha: ${formatDate(order.createdAt)}</p>
    
    ${renderItemsTable(order.items, order.subtotal, order.discount, order.total)}

    <p class="text">Una vez confirmemos la recepción de tu pago por PayPal, iniciaremos la preparación y fabricación de tus prendas de diseño exclusivo.</p>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 2. Pago Confirmado
 */
export function getPaymentConfirmedEmail(order: OrderInfo): string {
  const title = 'Pago confirmado';
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">Te confirmamos que hemos recibido correctamente el pago para tu pedido <strong>#${order.orderNumber}</strong>. ¡Muchas gracias por tu confianza!</p>
    <p class="text"><strong>Resumen de tu compra:</strong></p>
    
    ${renderItemsTable(order.items, order.subtotal, order.discount, order.total)}

    <p class="text"><strong>¿Cuáles son los próximos pasos?</strong></p>
    <ol class="text" style="padding-left: 20px;">
      <li>Enviaremos tu pedido a los servidores de Printful para comenzar la fabricación de las prendas.</li>
      <li>Una vez finalizado el control de calidad y empaquetado, se procederá al envío del paquete.</li>
      <li>Te enviaremos otro correo electrónico con el número de seguimiento (tracking) para que controles la entrega en todo momento.</li>
    </ol>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 3. Pedido Enviado a Printful (En fabricación)
 */
export function getProductionEmail(order: OrderInfo): string {
  const title = 'Estamos preparando tu pedido';
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">Tu pedido <strong>#${order.orderNumber}</strong> ya ha entrado en la fase de producción en fábrica. Nuestro equipo de soporte e impresión de Printful está confeccionando tus artículos personalizados con la máxima calidad.</p>
    <p class="text">Te notificaremos tan pronto como tus prendas salgan del centro de distribución hacia tu domicilio.</p>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 4. Pedido Enviado (En camino)
 */
export function getShippedEmail(order: OrderInfo): string {
  const title = 'Tu pedido ya está en camino';
  const trackingNumber = order.trackingNumber || '—';
  const trackingUrl = order.trackingUrl || '#';

  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">¡Excelentes noticias! Tus prendas exclusivas de la orden <strong>#${order.orderNumber}</strong> han superado el control de calidad y ya se encuentran en camino a tu domicilio.</p>
    
    <div style="background-color: #fdfbf7; border: 1px solid #eae6df; padding: 20px; margin: 25px 0; text-align: center; font-family: monospace; font-size: 13px;">
      <span style="color: #8a8a8a; uppercase; display: block; font-size: 10px; letter-spacing: 0.1em; margin-bottom: 5px;">Código de Seguimiento</span>
      <strong style="font-size: 16px; color: #111111; display: block; margin-bottom: 15px;">${trackingNumber}</strong>
      
      <div class="btn-container" style="margin: 0;">
        <a href="${trackingUrl}" target="_blank" class="btn">Seguir Envío</a>
      </div>
    </div>

    <p class="text">El transportista asignado gestionará la entrega en los próximos días. Asegúrate de que haya alguien disponible en la dirección de entrega.</p>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 5. Pedido Entregado
 */
export function getDeliveredEmail(order: OrderInfo): string {
  const title = 'Pedido entregado';
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">El transportista nos ha notificado que tu pedido <strong>#${order.orderNumber}</strong> ha sido entregado correctamente en tu dirección.</p>
    <p class="text">Esperamos que disfrutes de tus nuevas prendas exclusivas. Si te encantan, no dudes en etiquetarnos en tus redes sociales con el hashtag <strong>#AlphaAddiction</strong>.</p>
    <p class="text">Si tienes cualquier consulta sobre tus prendas o necesitas asistencia, responde directamente a este correo.</p>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 6. Pedido Cancelado
 */
export function getCanceledEmail(order: OrderInfo): string {
  const title = 'Pedido cancelado';
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">Te informamos que tu pedido <strong>#${order.orderNumber}</strong> ha sido cancelado en nuestro sistema.</p>
    <p class="text">Si se ha debido a un error o deseas volver a tramitar la compra, puedes acceder a nuestro catálogo en cualquier momento o ponerte en contacto con nuestro servicio de atención al cliente.</p>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 7. Reembolso Procesado
 */
export function getRefundEmail(order: OrderInfo): string {
  const title = 'Reembolso procesado';
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">Te informamos que hemos procesado con éxito un reembolso para tu pedido <strong>#${order.orderNumber}</strong>.</p>
    <div style="background-color: #fdfbf7; border: 1px solid #eae6df; padding: 20px; margin: 25px 0; text-align: center;">
      <span style="color: #8a8a8a; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Importe Reembolsado</span>
      <strong style="font-size: 20px; color: #d4af37; font-family: monospace;">${formatPrice(order.total)}</strong>
    </div>
    <p class="text">El reembolso se abonará directamente en la misma cuenta de PayPal que utilizaste para realizar el pago. Dependiendo de PayPal, el importe se verá reflejado en tu saldo o tarjeta en un plazo de 2 a 5 días hábiles.</p>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 8. Disputa Registrada
 */
export function getDisputeEmail(order: OrderInfo): string {
  const title = 'Disputa registrada';
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${order.name}</strong>,</p>
    <p class="text">Hemos recibido la notificación de una disputa en curso a través de PayPal para tu pedido <strong>#${order.orderNumber}</strong>.</p>
    <p class="text">Nuestro equipo de soporte está revisando el historial de transacciones, empaquetado y fabricación para ayudarte a resolver cualquier inconveniente con la mayor brevedad posible.</p>
    <p class="text">Si deseas acelerar la resolución o tienes información adicional, no dudes en responder directamente a este correo electrónico para hablar con nuestro equipo.</p>
    ${renderConsultBtn(order.orderNumber, order.secureToken)}
  `;
  return emailLayout(title, body);
}

/**
 * 9. Confirmación de Registro en Waitlist
 */
export function getWaitlistConfirmationEmail(dropName: string): string {
  const title = 'Te has unido a la lista de espera';
  const body = `
    <h2 class="title" style="color: #d4af37; font-size: 20px; text-transform: uppercase; tracking-wider: true;">${title}</h2>
    <p class="text">Hola,</p>
    <p class="text">Te confirmamos que te has registrado con éxito en la lista de espera oficial de nuestro próximo lanzamiento exclusivo: <strong>${dropName}</strong>.</p>
    <p class="text">Serás de las primeras personas en recibir una notificación directa y el enlace exclusivo de acceso en cuanto el drop pase a estar activo en nuestra tienda online.</p>
    <p class="text">Recuerda que las unidades son estrictamente limitadas y se asignarán por orden de llegada.</p>
    <div style="margin-top: 30px; padding: 15px; border-left: 2px solid #d4af37; background-color: #fcfbfa; font-style: italic;" class="text">
      "Designed for the bold. Addicted to the alpha."
    </div>
  `;
  return emailLayout(title, body);
}

export function getDropLiveNotificationEmail(dropName: string, dropSlug: string): string {
  const title = '¡El Drop ya está activo!';
  const body = `
    <h2 class="title" style="color: #d4af37; font-size: 20px; text-transform: uppercase; tracking-wider: true;">¡${dropName} está LIVE!</h2>
    <p class="text">Hola,</p>
    <p class="text">El momento ha llegado. El lanzamiento exclusivo <strong>${dropName}</strong> ya está abierto públicamente en nuestra tienda.</p>
    <p class="text">Como estabas en la lista de espera, tienes acceso prioritario para adquirir tus prendas exclusivas antes de que se agote el stock virtual.</p>
    <div class="btn-container" style="margin: 25px 0; text-align: center;">
      <a href="https://alphaddiction.com/drops/${dropSlug}" target="_blank" class="btn" style="background-color: #d4af37; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; tracking-spacing: 0.1em; display: inline-block;">Acceder al Lanzamiento</a>
    </div>
    <p class="text" style="font-size: 11px; color: #8a8a8a; margin-top: 20px;">Las unidades de este lanzamiento son estrictamente limitadas. Si tienes un cupón exclusivo, puedes aplicarlo directamente en el checkout.</p>
  `;
  return emailLayout(title, body);
}

/**
 * 11. Confirmación de Ticket de Soporte Recibido
 */
export function getTicketReceivedEmail(ticketNumber: string, customerName: string, subject: string, category: string): string {
  const title = `Hemos recibido tu solicitud ${ticketNumber}`;
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${customerName}</strong>,</p>
    <p class="text">Hemos recibido correctamente tu solicitud de soporte con código de seguimiento <strong>${ticketNumber}</strong>.</p>
    <p class="text"><strong>Resumen del caso:</strong></p>
    <ul class="text" style="padding-left: 20px;">
      <li><strong>Categoría:</strong> ${category}</li>
      <li><strong>Asunto:</strong> ${subject}</li>
    </ul>
    <p class="text">Nuestro equipo de soporte revisará tu solicitud y te responderá a la mayor brevedad posible.</p>
    <p class="text" style="font-size: 11px; color: #8a8a8a; margin-top: 20px;">Por favor, no respondas a este correo. Recibirás una notificación en cuanto tengamos novedades de tu ticket.</p>
  `;
  return emailLayout(title, body);
}

/**
 * 12. Respuesta de Soporte del Equipo
 */
export function getTicketRepliedEmail(ticketNumber: string, customerName: string, replyBody: string, originalSubject: string): string {
  const title = `Respuesta a tu solicitud ${ticketNumber}`;
  const cleanBody = replyBody.replace(/\n/g, '<br>');
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${customerName}</strong>,</p>
    <p class="text">El equipo de soporte de Alpha Addiction ha respondido a tu solicitud <strong>${ticketNumber}</strong> (<em>${originalSubject}</em>):</p>
    
    <div style="background-color: #f7f5f0; border-left: 3px solid #d4af37; padding: 15px; margin: 20px 0; font-size: 14px; color: #1c1c1c; line-height: 1.6;">
      ${cleanBody}
    </div>

    <p class="text">Si necesitas aportar más detalles o continuar la conversación, puedes ponerte en contacto con nosotros indicando el número de tu solicitud.</p>
  `;
  return emailLayout(title, body);
}

/**
 * 13. Solicitud de Soporte Cerrada
 */
export function getTicketClosedEmail(ticketNumber: string, customerName: string, originalSubject: string): string {
  const title = `Solicitud de soporte resuelta ${ticketNumber}`;
  const body = `
    <h2 class="title">${title}</h2>
    <p class="text">Hola <strong>${customerName}</strong>,</p>
    <p class="text">Te informamos que hemos marcado tu solicitud de soporte <strong>${ticketNumber}</strong> (<em>${originalSubject}</em>) como <strong>Resuelta y Cerrada</strong> en nuestros sistemas.</p>
    <p class="text">Esperamos haber resuelto tu consulta de forma satisfactoria. Si tienes cualquier otra duda, puedes abrir una nueva solicitud desde nuestro formulario de contacto en cualquier momento.</p>
    <p class="text">¡Gracias por formar parte de Alpha Addiction!</p>
  `;
  return emailLayout(title, body);
}

/**
 * 14. Código de Acceso OTP al Portal
 */
export function getPortalOtpEmail(code: string): string {
  const title = `Tu código de acceso temporal`;
  const body = `
    <h2 class="title" style="font-family: serif; color: #f5f5f0; font-size: 20px; text-transform: uppercase; margin-bottom: 20px;">${title}</h2>
    <p class="text">Hola,</p>
    <p class="text">Has solicitado acceder al Portal Inteligente de Clientes de Alpha Addiction. Utiliza el siguiente código de verificación temporal de 6 cifras:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d4af37; font-family: monospace; border: 1px solid rgba(212, 175, 55, 0.3); padding: 12px 30px; background-color: rgba(255, 255, 255, 0.02); display: inline-block;">
        ${code}
      </span>
    </div>

    <p class="text">Este código es de <strong>un solo uso</strong> y caducará en <strong>10 minutos</strong>. Si tú no has solicitado este acceso, puedes ignorar este correo de forma segura.</p>
    <p class="text" style="font-size: 11px; color: #8a8a8a; margin-top: 25px; border-t: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">Por motivos de seguridad, nunca compartas este código con nadie.</p>
  `;
  return emailLayout(title, body);
}



