import { EventHandler } from '../types';
import { sendWaitlistConfirmation } from '../../email/send-email';
import { isSettingEnabled } from '../helpers';

export const handleWaitlistRegistered: EventHandler<'WAITLIST_REGISTERED'> = async ({ email, dropName }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  if (emailsEnabled) {
    const res = await sendWaitlistConfirmation(email, dropName);
    return { success: res.success, message: res.success ? 'Email de confirmación de waitlist enviado.' : res.error };
  }
  return { success: true, message: 'Emails automáticos desactivados.' };
};
