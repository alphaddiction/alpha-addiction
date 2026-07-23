import { db } from '@/backend/database/db';
import { sendDropLiveNotification } from '@/backend/notifications/email/send-email';

/**
 * Obtiene el valor de una configuración global del sistema con un fallback.
 */
export async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key }
    });
    if (!setting) {
      // Registrar por defecto si no existe
      await db.systemSetting.create({
        data: { key, value: defaultValue, description: `Configuración auto-generada para ${key}` }
      });
      return defaultValue;
    }
    return setting.value;
  } catch (e) {
    console.error(`Error al recuperar setting ${key}:`, e);
    return defaultValue;
  }
}

/**
 * Establece el valor de una configuración global.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  try {
    await db.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, description: `Configuración para ${key}` }
    });
  } catch (e) {
    console.error(`Error al guardar setting ${key}:`, e);
  }
}

/**
 * Comprueba si una configuración booleana está habilitada.
 */
export async function isSettingEnabled(key: string, defaultValue = true): Promise<boolean> {
  const val = await getSetting(key, defaultValue ? 'true' : 'false');
  return val.trim().toLowerCase() === 'true';
}

/**
 * Procesa la notificación por lotes de los usuarios de la lista de espera cuando un Drop pasa a Live.
 * Evita el envío masivo simultáneo dividiendo en lotes y marcando el estado de envío para evitar re-envíos.
 */
export async function processWaitlistNotificationsInBatches(
  dropId: string,
  dropName: string,
  dropSlug: string
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sentCount = 0;

  try {
    // 1. Buscar usuarios registrados en la lista de espera para este Drop que no han sido notificados
    const waitlist = await db.dropWaitlist.findMany({
      where: {
        dropId,
        status: { in: ['registered', 'pending'] }
      }
    });

    if (waitlist.length === 0) {
      return { sent: 0, errors: [] };
    }

    console.log(`✉️ [Waitlist Batch Processor] Iniciando envío para ${waitlist.length} usuarios del drop ${dropName}`);

    // Configuración de tamaño de lote (por ejemplo, 5 emails concurrentes)
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < waitlist.length; i += BATCH_SIZE) {
      const batch = waitlist.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            const emailResult = await sendDropLiveNotification(recipient.email, dropName, dropSlug);
            
            if (emailResult.success) {
              sentCount++;
              // Actualizar el estado a notificado en la base de datos
              await db.dropWaitlist.update({
                where: { id: recipient.id },
                data: { status: 'notified' }
              });
            } else {
              errors.push(`Fallo al enviar a ${recipient.email}: ${emailResult.error}`);
            }
          } catch (err: any) {
            errors.push(`Excepción al notificar a ${recipient.email}: ${err.message}`);
          }
        })
      );

      // Pequeña pausa opcional de 200ms entre lotes para no saturar SMTP/Resend
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (err: any) {
    console.error('❌ [Waitlist Batch Processor] Error crítico:', err);
    errors.push(`Error crítico en procesamiento: ${err.message}`);
  }

  return { sent: sentCount, errors };
}
