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
  `;
  return emailLayout(title, body);
}
