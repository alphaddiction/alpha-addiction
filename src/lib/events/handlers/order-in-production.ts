import { EventHandler } from '../types';
import { db } from '../../db';

export const handleOrderInProduction: EventHandler<'ORDER_IN_PRODUCTION'> = async ({ orderId }) => {
  await db.orderEvent.create({
    data: {
      orderId,
      type: 'PRODUCTION',
      message: 'Printful ha comenzado la fabricación del pedido.'
    }
  });
  return { success: true, message: 'Estado de fabricación registrado en el pedido.' };
};
