import { EventHandler } from '@/backend/events/types';
import { db } from '@/backend/database/db';

export const handlePaymentFailed: EventHandler<'PAYMENT_FAILED'> = async ({ orderId }) => {
  await db.orderEvent.create({
    data: {
      orderId,
      type: 'PAYMENT_FAILED',
      message: 'Fallo detectado en el intento de pago de PayPal.'
    }
  });
  return { success: true, message: 'Fallo de pago registrado en eventos del pedido.' };
};
