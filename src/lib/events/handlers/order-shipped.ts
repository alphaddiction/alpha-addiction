import { EventHandler } from '../types';
import { sendOrderShipped } from '../../email/send-email';
import { isSettingEnabled } from '../helpers';

export const handleOrderShipped: EventHandler<'ORDER_SHIPPED'> = async ({ orderId }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  if (emailsEnabled) {
    const res = await sendOrderShipped(orderId);
    return { success: res.success, message: res.success ? 'Email de envío con tracking despachado.' : res.error };
  }
  return { success: true, message: 'Emails automáticos desactivados.' };
};
