import { EventType } from './types';

export const EVENTS: Record<EventType, { name: string; description: string }> = {
  ORDER_CREATED: {
    name: 'Pedido Creado (ORDER_CREATED)',
    description: 'Se dispara cuando se registra un nuevo pedido en estado de borrador.'
  },
  PAYMENT_CONFIRMED: {
    name: 'Pago Confirmado (PAYMENT_CONFIRMED)',
    description: 'Se dispara cuando el cliente completa el pago del pedido vía PayPal o se confirma manualmente.'
  },
  PAYMENT_FAILED: {
    name: 'Pago Fallido (PAYMENT_FAILED)',
    description: 'Se dispara cuando falla un intento de cargo o transacción.'
  },
  ORDER_SENT_TO_PRINTFUL: {
    name: 'Enviado a Printful (ORDER_SENT_TO_PRINTFUL)',
    description: 'Se dispara cuando la orden física es enlazada correctamente con el proveedor de dropshipping.'
  },
  ORDER_IN_PRODUCTION: {
    name: 'Pedido en Fabricación (ORDER_IN_PRODUCTION)',
    description: 'Se dispara cuando Printful inicia el proceso de impresión/costura de las prendas.'
  },
  ORDER_SHIPPED: {
    name: 'Pedido Enviado (ORDER_SHIPPED)',
    description: 'Se dispara cuando el paquete es despachado con código de seguimiento tracking de transporte.'
  },
  ORDER_DELIVERED: {
    name: 'Pedido Entregado (ORDER_DELIVERED)',
    description: 'Se dispara cuando el pedido llega al domicilio del comprador.'
  },
  DROP_COMING_SOON: {
    name: 'Drop en Próximamente (DROP_COMING_SOON)',
    description: 'Se dispara cuando una colección entra en fase de cuenta atrás.'
  },
  DROP_LIVE: {
    name: 'Drop Activo (DROP_LIVE)',
    description: 'Se dispara cuando un Drop se abre para ventas y notifica a los registrados en la waitlist.'
  },
  DROP_ENDED: {
    name: 'Drop Finalizado (DROP_ENDED)',
    description: 'Se dispara cuando se cumple la fecha límite o se cierra un lanzamiento.'
  },
  WAITLIST_REGISTERED: {
    name: 'Waitlist Registrado (WAITLIST_REGISTERED)',
    description: 'Se dispara cuando un usuario se apunta a la lista de espera de un Drop.'
  },
  COUPON_CREATED: {
    name: 'Cupón Creado (COUPON_CREATED)',
    description: 'Se dispara al dar de alta un nuevo código de descuento.'
  },
  COUPON_EXPIRED: {
    name: 'Cupón Expirado (COUPON_EXPIRED)',
    description: 'Se dispara cuando llega la fecha de fin de vigencia de un descuento.'
  },
  ORDER_REFUNDED: {
    name: 'Pedido Reembolsado (ORDER_REFUNDED)',
    description: 'Se dispara cuando se reembolsa el importe de una orden.'
  },
  CUSTOMER_DISPUTE: {
    name: 'Disputa de Cliente (CUSTOMER_DISPUTE)',
    description: 'Se dispara cuando el cliente abre una disputa o reclamación en la pasarela.'
  }
};
