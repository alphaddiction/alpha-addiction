export type EventType =
  | 'ORDER_CREATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'ORDER_SENT_TO_PRINTFUL'
  | 'ORDER_IN_PRODUCTION'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'DROP_COMING_SOON'
  | 'DROP_LIVE'
  | 'DROP_ENDED'
  | 'WAITLIST_REGISTERED'
  | 'COUPON_CREATED'
  | 'COUPON_EXPIRED'
  | 'ORDER_REFUNDED'
  | 'CUSTOMER_DISPUTE';

export interface EventPayloads {
  ORDER_CREATED: { orderId: string };
  PAYMENT_CONFIRMED: { orderId: string };
  PAYMENT_FAILED: { orderId: string };
  ORDER_SENT_TO_PRINTFUL: { orderId: string; printfulOrderId: number };
  ORDER_IN_PRODUCTION: { orderId: string };
  ORDER_SHIPPED: { orderId: string; trackingNumber: string; trackingUrl: string };
  ORDER_DELIVERED: { orderId: string };
  DROP_COMING_SOON: { dropId: string };
  DROP_LIVE: { dropId: string };
  DROP_ENDED: { dropId: string };
  WAITLIST_REGISTERED: { waitlistId: string; email: string; dropName: string };
  COUPON_CREATED: { couponId: string; code: string };
  COUPON_EXPIRED: { couponId: string; code: string };
  ORDER_REFUNDED: { orderId: string };
  CUSTOMER_DISPUTE: { orderId: string };
}

export type EventHandler<T extends EventType> = (
  data: EventPayloads[T]
) => Promise<{ success: boolean; message?: string; error?: string }>;
