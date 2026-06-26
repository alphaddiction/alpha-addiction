export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'fulfillment_submitted'
  | 'fulfillment_failed'
  | 'shipped'
  | 'canceled';

export interface OrderItem {
  slug: string;
  name: string;
  priceEUR: number;
  size: string;
  qty: number;
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

export interface Order {
  id: string; // Local Order ID
  paypalOrderId: string;
  paypalCaptureId?: string;
  printfulOrderId?: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingPrice: number;
  totalPrice: number;
  status: OrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}
