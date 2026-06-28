import { EventHandler } from '../types';
import { sendOrderInProduction } from '../../email/send-email';
import { isSettingEnabled } from '../helpers';

export const handleOrderSentToPrintful: EventHandler<'ORDER_SENT_TO_PRINTFUL'> = async ({ orderId }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  if (emailsEnabled) {
    const res = await sendOrderInProduction(orderId);
    return { success: res.success, message: res.success ? 'Email de preparación enviado.' : res.error };
  }
  return { success: true, message: 'Emails automáticos desactivados.' };
};
