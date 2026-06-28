import { EventHandler } from '../types';
import { sendOrderDelivered } from '../../email/send-email';
import { isSettingEnabled } from '../helpers';

export const handleOrderDelivered: EventHandler<'ORDER_DELIVERED'> = async ({ orderId }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  if (emailsEnabled) {
    const res = await sendOrderDelivered(orderId);
    return { success: res.success, message: res.success ? 'Email de entrega final enviado.' : res.error };
  }
  return { success: true, message: 'Emails automáticos desactivados.' };
};
