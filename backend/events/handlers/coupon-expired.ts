import { EventHandler } from '@/backend/events/types';
import { db } from '@/backend/database/db';

export const handleCouponExpired: EventHandler<'COUPON_EXPIRED'> = async ({ couponId, code }) => {
  await db.discount.update({
    where: { id: couponId },
    data: { status: 'INACTIVE' }
  });
  return { success: true, message: `Cupón ${code} desactivado automáticamente por expiración.` };
};
