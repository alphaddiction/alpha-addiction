import { EventHandler } from '@/backend/events/types';
import { sendDispute } from '@/backend/notifications/email/send-email';
import { isSettingEnabled } from '../helpers';

export const handleCustomerDispute: EventHandler<'CUSTOMER_DISPUTE'> = async ({ orderId }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  if (emailsEnabled) {
    const res = await sendDispute(orderId);
    return { success: res.success, message: res.success ? 'Email de disputa enviado.' : res.error };
  }
  return { success: true, message: 'Emails automáticos desactivados.' };
};
