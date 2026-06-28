import { EventHandler } from '../types';
import { db } from '../../db';

export const handleCouponExpired: EventHandler<'COUPON_EXPIRED'> = async ({ couponId, code }) => {
  await db.discount.update({
    where: { id: couponId },
    data: { status: 'INACTIVE' }
  });
  return { success: true, message: `Cupón ${code} desactivado automáticamente por expiración.` };
};
