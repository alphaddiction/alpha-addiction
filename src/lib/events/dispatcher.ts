import { db } from '../db';
import { isSettingEnabled } from './helpers';
import { EventType, EventPayloads } from './types';

// Importar todos los handlers
import { handleOrderCreated } from './handlers/order-created';
import { handlePaymentConfirmed } from './handlers/payment-confirmed';
import { handlePaymentFailed } from './handlers/payment-failed';
import { handleOrderSentToPrintful } from './handlers/order-sent-to-printful';
import { handleOrderInProduction } from './handlers/order-in-production';
import { handleOrderShipped } from './handlers/order-shipped';
import { handleOrderDelivered } from './handlers/order-delivered';
import { handleDropComingSoon } from './handlers/drop-coming-soon';
import { handleDropLive } from './handlers/drop-live';
import { handleDropEnded } from './handlers/drop-ended';
import { handleWaitlistRegistered } from './handlers/waitlist-registered';
import { handleCouponCreated } from './handlers/coupon-created';
import { handleCouponExpired } from './handlers/coupon-expired';
import { handleOrderRefunded } from './handlers/order-refunded';
import { handleCustomerDispute } from './handlers/customer-dispute';

// Mapa de registro de handlers
const REGISTRY: Record<EventType, (data: any) => Promise<{ success: boolean; message?: string; error?: string }>> = {
  ORDER_CREATED: handleOrderCreated,
  PAYMENT_CONFIRMED: handlePaymentConfirmed,
  PAYMENT_FAILED: handlePaymentFailed,
  ORDER_SENT_TO_PRINTFUL: handleOrderSentToPrintful,
  ORDER_IN_PRODUCTION: handleOrderInProduction,
  ORDER_SHIPPED: handleOrderShipped,
  ORDER_DELIVERED: handleOrderDelivered,
  DROP_COMING_SOON: handleDropComingSoon,
  DROP_LIVE: handleDropLive,
  DROP_ENDED: handleDropEnded,
  WAITLIST_REGISTERED: handleWaitlistRegistered,
  COUPON_CREATED: handleCouponCreated,
  COUPON_EXPIRED: handleCouponExpired,
  ORDER_REFUNDED: handleOrderRefunded,
  CUSTOMER_DISPUTE: handleCustomerDispute,
};

/**
 * Despacha un evento del sistema de forma síncrona/secuencial para garantizar la trazabilidad de logs.
 * Evalúa las configuraciones y registra el resultado en la tabla AutomationLog de Neon.
 */
export async function dispatchEvent<T extends EventType>(
  eventType: T,
  data: EventPayloads[T]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const startTime = Date.now();
  console.log(`📡 [Event Engine] Dispatching event [${eventType}]...`);

  try {
    // 1. Comprobar si el motor de automatizaciones está activado
    const automationsEnabled = await isSettingEnabled('enable_automations', true);
    if (!automationsEnabled) {
      const msg = 'Ignorado: Motor de automatizaciones desactivado globalmente.';
      console.log(`📡 [Event Engine] [${eventType}] ${msg}`);
      
      // Registrar log de evento omitido
      await db.automationLog.create({
        data: {
          eventType,
          status: 'SUCCESS',
          message: msg,
          durationMs: 0
        }
      });
      return { success: true, message: msg };
    }

    // 2. Obtener el handler correspondiente
    const handler = REGISTRY[eventType];
    if (!handler) {
      const errorMsg = `No se encontró handler registrado para el evento ${eventType}`;
      console.error(`❌ [Event Engine] ${errorMsg}`);
      
      await db.automationLog.create({
        data: {
          eventType,
          status: 'FAILED',
          error: errorMsg,
          message: 'Error de configuración del motor.',
          durationMs: 0
        }
      });
      return { success: false, error: errorMsg };
    }

    // 3. Ejecutar handler y cronometrar duración
    const result = await handler(data);
    const durationMs = Date.now() - startTime;

    // 4. Registrar resultado en Neon
    await db.automationLog.create({
      data: {
        eventType,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message || 'Ejecutado con éxito.',
        error: result.error || null,
        durationMs
      }
    });

    console.log(`✅ [Event Engine] Event [${eventType}] processed in ${durationMs}ms. Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    return result;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err.message || String(err);
    console.error(`❌ [Event Engine] Error crítico procesando [${eventType}]:`, err);

    try {
      await db.automationLog.create({
        data: {
          eventType,
          status: 'FAILED',
          error: errorMsg,
          message: 'Error crítico / Excepción no controlada.',
          durationMs
        }
      });
    } catch (dbErr) {
      console.error('❌ [Event Engine] No se pudo guardar el log de error crítico en la base de datos:', dbErr);
    }

    return { success: false, error: errorMsg };
  }
}
