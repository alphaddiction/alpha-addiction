import { db } from '@/backend/database/db';
import { dispatchEvent } from './dispatcher';
import { isSettingEnabled } from './helpers';

/**
 * Motor de tareas cron programadas.
 * Evalúa transiciones automáticas de Drops (DRAFT/COMING_SOON -> LIVE -> ENDED) y desactivación de cupones.
 * Puede ser invocado de forma manual (admin), local (scheduler local) o mediante webhooks (Vercel Cron).
 */
export async function runScheduledTasks(): Promise<{
  dropsProcessed: number;
  couponsExpired: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let dropsProcessed = 0;
  let couponsExpired = 0;

  try {
    const automationsActive = await isSettingEnabled('enable_automations', true);
    if (!automationsActive) {
      console.log('⏰ [Scheduler] Automatizaciones desactivadas globalmente. Omitiendo tareas.');
      return { dropsProcessed: 0, couponsExpired: 0, errors: ['Automatizaciones desactivadas globalmente.'] };
    }

    const now = new Date();

    // === 1. PROCESAR TRANSICIONES AUTOMÁTICAS DE DROPS ===
    
    // A. Apertura automática de Drops (DRAFT/COMING_SOON -> LIVE)
    const autoOpenEnabled = await isSettingEnabled('auto_open_drops', true);
    if (autoOpenEnabled) {
      const dropsToOpen = await db.drop.findMany({
        where: {
          status: { in: ['DRAFT', 'COMING_SOON'] },
          openingAt: { lte: now },
          closingAt: { gt: now }
        }
      });

      for (const drop of dropsToOpen) {
        try {
          console.log(`⏰ [Scheduler] Apertura automática detectada para Drop: ${drop.name}`);
          
          // Actualizar estado en base de datos
          await db.drop.update({
            where: { id: drop.id },
            data: { status: 'LIVE' }
          });
          
          // Despachar el evento DROP_LIVE (que se encargará de mandar correos en lotes)
          await dispatchEvent('DROP_LIVE', { dropId: drop.id });
          dropsProcessed++;
        } catch (err: any) {
          console.error(`❌ [Scheduler] Error abriendo drop ${drop.name}:`, err);
          errors.push(`Error abriendo drop ${drop.name}: ${err.message}`);
        }
      }
    }

    // B. Cierre automático de Drops (LIVE -> ENDED)
    const autoCloseEnabled = await isSettingEnabled('auto_close_drops', true);
    if (autoCloseEnabled) {
      const dropsToClose = await db.drop.findMany({
        where: {
          status: 'LIVE',
          closingAt: { lte: now }
        }
      });

      for (const drop of dropsToClose) {
        try {
          console.log(`⏰ [Scheduler] Cierre automático detectado para Drop: ${drop.name}`);
          
          await db.drop.update({
            where: { id: drop.id },
            data: { status: 'ENDED' }
          });

          await dispatchEvent('DROP_ENDED', { dropId: drop.id });
          dropsProcessed++;
        } catch (err: any) {
          console.error(`❌ [Scheduler] Error cerrando drop ${drop.name}:`, err);
          errors.push(`Error cerrando drop ${drop.name}: ${err.message}`);
        }
      }
    }

    // === 2. DESACTIVAR CUPONES EXPIRADOS ===
    const discountsToExpire = await db.discount.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lte: now }
      }
    });

    for (const discount of discountsToExpire) {
      try {
        console.log(`⏰ [Scheduler] Expiración automática de cupón detectada: ${discount.code}`);
        
        await db.discount.update({
          where: { id: discount.id },
          data: { status: 'INACTIVE' }
        });

        await dispatchEvent('COUPON_EXPIRED', { couponId: discount.id, code: discount.code });
        couponsExpired++;
      } catch (err: any) {
        console.error(`❌ [Scheduler] Error expirando cupón ${discount.code}:`, err);
        errors.push(`Error expirando cupón ${discount.code}: ${err.message}`);
      }
    }

  } catch (err: any) {
    console.error('❌ [Scheduler] Error general de ejecución:', err);
    errors.push(`Error general de ejecución: ${err.message}`);
  }

  return {
    dropsProcessed,
    couponsExpired,
    errors
  };
}
