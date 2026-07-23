export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'printful_submitted'
  | 'printful_production'
  | 'shipped'
  | 'delivered'
  | 'canceled'
  | 'refunded'
  | 'fulfillment_submitted'
  | 'fulfillment_failed';

export interface OrderItem {
  slug: string;
  name: string;
  priceEUR: number;
  size: string;
  color?: string;
  printfulVariantId?: number;
  qty: number;
  costPrice?: number; // Coste de producción unitario
  mockupUrl?: string; // Imagen del mockup de color
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
}

export interface OrderEvent {
  timestamp: string;
  event: string;
  notes?: string;
}

export interface Order {
  id: string; // ID interno del pedido (E.g. AA-123456)
  orderNumber?: string; // Número de pedido legible (E.g. AA-10001)
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingPrice: number;
  totalPrice: number;
  discount?: number; // Descuentos
  paymentMethod?: string; // Método de pago (E.g. PayPal)
  paymentStatus?: 'pending' | 'pago_pendiente' | 'payment_pending' | 'paid' | 'refunded' | 'failed' | 'payment_failed' | 'disputed' | 'reversed'; // Estado del pago
  printfulOrderId?: number; // ID de pedido en Printful
  paypalOrderId?: string; // ID de pedido en PayPal
  paypalCaptureId?: string;
  trackingNumber?: string;
  trackingCarrier?: string; // Tracking carrier (E.g. DHL)
  carrier?: string; // Legacy/Alias para compatibilidad
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
  internalNotes?: string; // Notas internas del administrador
  history?: OrderEvent[]; // Historial de eventos del pedido
  errorMessage?: string;
  totalCost?: number; // Coste de producción total
  netProfit?: number; // Beneficio neto total
  shippingCost?: number; // Coste de envío cobrado por Printful
}
