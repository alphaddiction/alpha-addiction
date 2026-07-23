import { EventHandler } from '@/backend/events/types';

export const handleCouponCreated: EventHandler<'COUPON_CREATED'> = async ({ code }) => {
  return { success: true, message: `Cupón ${code} registrado en el sistema.` };
};
