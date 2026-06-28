import { EventHandler } from '../types';
import { sendPaymentConfirmed } from '../../email/send-email';
import { isSettingEnabled } from '../helpers';
import { createPrintfulOrderFromInternalOrder } from '../../printful';
import { db } from '../../db';
import { dispatchEvent } from '../dispatcher';

export const handlePaymentConfirmed: EventHandler<'PAYMENT_CONFIRMED'> = async ({ orderId }) => {
  const emailsEnabled = await isSettingEnabled('enable_automatic_emails', true);
  let emailMsg = 'Email omitido.';
  
  if (emailsEnabled) {
    const emailRes = await sendPaymentConfirmed(orderId);
    emailMsg = emailRes.success ? 'Email de pago confirmado enviado.' : `Fallo email: ${emailRes.error}`;
  }

  const autoSubmit = await isSettingEnabled('auto_submit_to_printful', false);
  if (autoSubmit) {
    try {
      const printfulRes = await createPrintfulOrderFromInternalOrder(orderId);
      const printfulOrderId = printfulRes.result.id;

      await db.order.update({
        where: { id: orderId },
        data: {
          printfulOrderId,
          orderStatus: 'fulfillment_submitted',
          events: {
            create: {
              type: 'FULFILLMENT_SUBMITTED',
              message: `Pedido enviado automáticamente a Printful con ID #${printfulOrderId}`,
            },
          },
        },
      });

      // Disparar evento ORDER_SENT_TO_PRINTFUL
      await dispatchEvent('ORDER_SENT_TO_PRINTFUL', { orderId, printfulOrderId });
      return { success: true, message: `${emailMsg} | Pedido enviado a Printful #${printfulOrderId}` };
    } catch (err: any) {
      console.error(`❌ [Event Engine] Error en envío automático a Printful para ${orderId}:`, err);
      
      await db.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'fulfillment_failed',
          events: {
            create: {
              type: 'ERROR',
              message: `Fallo en envío automático a Printful: ${err.message}`,
            },
          },
        },
      });

      return { success: false, error: `Fallo Printful: ${err.message}`, message: emailMsg };
    }
  }

  return { success: true, message: `${emailMsg} | Envío automático a Printful desactivado.` };
};
