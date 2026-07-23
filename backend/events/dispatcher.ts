import { db } from '@/backend/database/db';
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

    // Disparar notificaciones correspondientes
    if (result.success) {
      dispatchNotificationForEvent(eventType, data).catch(nErr => 
        console.error('⚠️ [Event Engine] Error al notificar evento:', nErr)
      );
    } else {
      createNotification({
        type: 'automation_error',
        title: `Fallo en automatización [${eventType}]`,
        message: `Error al procesar el evento ${eventType}: ${result.error || 'Desconocido'}.`,
        severity: 'error',
        module: 'automations'
      }).catch(nErr => console.error('⚠️ [Event Engine] Error al registrar error de automatización:', nErr));
    }

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

    // Registrar notificación de excepción crítica en automatización
    createNotification({
      type: 'automation_error',
      title: `Error crítico en automatización [${eventType}]`,
      message: `Excepción al procesar ${eventType}: ${errorMsg}.`,
      severity: 'critical',
      module: 'automations'
    }).catch(nErr => console.error('⚠️ [Event Engine] Error al registrar excepción de automatización:', nErr));

    return { success: false, error: errorMsg };
  }
}

import { createNotification } from '@/backend/notifications/service';
import { formatPrice } from '@/backend/notifications/email/helpers';

async function dispatchNotificationForEvent(eventType: EventType, data: any) {
  try {
    if (eventType === 'ORDER_CREATED') {
      const order = await db.order.findUnique({ where: { id: data.orderId } });
      if (order) {
        await createNotification({
          type: 'order_created',
          title: `Nuevo pedido ${order.orderNumber}`,
          message: `Se ha registrado un nuevo pedido por valor de ${formatPrice(order.total)}.`,
          severity: 'info',
          module: 'orders',
          entityType: 'Order',
          entityId: order.id,
          actionUrl: `/admin/orders`,
        });
      }
    } else if (eventType === 'PAYMENT_CONFIRMED') {
      const order = await db.order.findUnique({ where: { id: data.orderId } });
      if (order) {
        await createNotification({
          type: 'payment_confirmed',
          title: `Pago confirmado: ${order.orderNumber}`,
          message: `El cobro de ${formatPrice(order.total)} ha sido procesado correctamente vía ${order.paymentMethod.toUpperCase()}.`,
          severity: 'success',
          module: 'paypal',
          entityType: 'Order',
          entityId: order.id,
          actionUrl: `/admin/orders`,
        });
      }
    } else if (eventType === 'PAYMENT_FAILED') {
      const order = await db.order.findUnique({ where: { id: data.orderId } });
      if (order) {
        await createNotification({
          type: 'payment_failed',
          title: `Pago fallido: ${order.orderNumber}`,
          message: `El cobro del pedido ha fallado en la pasarela PayPal.`,
          severity: 'critical',
          module: 'paypal',
          entityType: 'Order',
          entityId: order.id,
          actionUrl: `/admin/orders`,
        });
      }
    } else if (eventType === 'ORDER_SENT_TO_PRINTFUL') {
      const order = await db.order.findUnique({ where: { id: data.orderId } });
      if (order) {
        await createNotification({
          type: 'order_sent_to_printful',
          title: `Pedido enviado a Printful`,
          message: `El pedido ${order.orderNumber} ha sido lanzado a confección en Printful. ID de Printful: ${data.printfulOrderId}.`,
          severity: 'info',
          module: 'printful',
          entityType: 'Order',
          entityId: order.id,
          actionUrl: `/admin/orders`,
        });
      }
    } else if (eventType === 'ORDER_SHIPPED') {
      const order = await db.order.findUnique({ where: { id: data.orderId } });
      if (order) {
        await createNotification({
          type: 'order_shipped',
          title: `Pedido enviado: ${order.orderNumber}`,
          message: `El pedido ya está en reparto. Código de seguimiento: ${data.trackingNumber}.`,
          severity: 'success',
          module: 'printful',
          entityType: 'Order',
          entityId: order.id,
          actionUrl: `/admin/orders`,
        });
      }
    } else if (eventType === 'WAITLIST_REGISTERED') {
      await createNotification({
        type: 'waitlist_registered',
        title: `Nuevo registro en Waitlist`,
        message: `El correo ${data.email} se ha unido a la lista de espera del Drop "${data.dropName}".`,
        severity: 'info',
        module: 'waitlist',
        entityType: 'DropWaitlist',
        entityId: data.waitlistId,
        actionUrl: `/admin/drops`,
        metadata: { dropName: data.dropName }
      });
    } else if (eventType === 'COUPON_EXPIRED') {
      await createNotification({
        type: 'coupon_expired',
        title: `Cupón caducado: ${data.code}`,
        message: `El código de descuento ${data.code} ha caducado o alcanzado su límite de usos.`,
        severity: 'warning',
        module: 'marketing',
        entityType: 'Discount',
        entityId: data.couponId,
        actionUrl: `/admin/discounts`,
      });
    }
  } catch (err) {
    console.error('⚠️ [Dispatcher Notification] Error al procesar notificación de evento:', err);
  }
}
