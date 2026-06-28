import { EventHandler } from '../types';
import { sendOrderReceived } from '../../email/send-email';
import { isSettingEnabled } from '../helpers';

export const handleOrderCreated: EventHandler<'ORDER_CREATED'> = async ({ orderId }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  if (emailsEnabled) {
    const res = await sendOrderReceived(orderId);
    return { success: res.success, message: res.success ? 'Email de pedido recibido enviado.' : res.error };
  }
  return { success: true, message: 'Automatización de emails desactivada.' };
};
