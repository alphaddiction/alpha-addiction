import { EventHandler } from '@/backend/events/types';
import { sendRefund } from '@/backend/notifications/email/send-email';
import { isSettingEnabled } from '../helpers';

export const handleOrderRefunded: EventHandler<'ORDER_REFUNDED'> = async ({ orderId }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  if (emailsEnabled) {
    const res = await sendRefund(orderId);
    return { success: res.success, message: res.success ? 'Email de reembolso enviado.' : res.error };
  }
  return { success: true, message: 'Emails automáticos desactivados.' };
};
