import { db } from '@/backend/database/db';

export interface CreateNotificationParams {
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  module: 'orders' | 'paypal' | 'printful' | 'email' | 'support' | 'waitlist' | 'automations' | 'backups' | 'sentry' | 'marketing';
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Tipos de notificaciones que soportan consolidación para evitar ruido
const CONSOLIDABLE_TYPES = [
  'email_error',
  'automation_error',
  'waitlist_registered',
  'sentry_error',
  'paypal_webhook_error',
  'printful_webhook_error'
];

/**
 * Crea una nueva notificación o consolida una existente si es repetitiva y no ha sido leída.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const isConsolidable = CONSOLIDABLE_TYPES.includes(params.type);
    
    if (isConsolidable) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      // Buscar una notificación no leída del mismo tipo creada en los últimos 10 minutos
      const existing = await db.notification.findFirst({
        where: {
          type: params.type,
          status: 'unread',
          createdAt: { gte: tenMinutesAgo },
          // Agrupar waitlist por Drop (entityId)
          ...(params.type === 'waitlist_registered' && params.entityId ? { entityId: params.entityId } : {})
        }
      });

      if (existing) {
        const metadata = (existing.metadata as Record<string, any>) || {};
        const newCount = (metadata.count || 1) + 1;

        let newTitle = existing.title;
        let newMessage = existing.message;

        // Formatear títulos y mensajes consolidados
        if (params.type === 'email_error') {
          newTitle = `${newCount} errores de envío de email`;
          newMessage = `Se han detectado ${newCount} fallos al enviar correos desde el servidor. Revisa los logs.`;
        } else if (params.type === 'automation_error') {
          newTitle = `${newCount} fallos en automatizaciones`;
          newMessage = `El motor de automatizaciones ha registrado ${newCount} errores en la última ventana.`;
        } else if (params.type === 'waitlist_registered') {
          newTitle = `${newCount} nuevos interesados en Waitlist`;
          newMessage = `Hay ${newCount} nuevos registrados en la lista de espera para la colección "${params.metadata?.dropName || 'lanzamiento'}".`;
        } else if (params.type === 'sentry_error') {
          newTitle = `${newCount} alertas de error de Sentry`;
          newMessage = `Sentry ha reportado ${newCount} excepciones críticas en el servidor.`;
        } else {
          newTitle = `${params.title} (${newCount})`;
          newMessage = `${params.message} (Detectado ${newCount} veces recientemente).`;
        }

        return await db.notification.update({
          where: { id: existing.id },
          data: {
            title: newTitle,
            message: newMessage,
            createdAt: new Date(),
            metadata: {
              ...metadata,
              count: newCount,
              lastOccurredAt: new Date().toISOString()
            }
          }
        });
      }
    }

    // Si no es consolidable o no hay registros recientes, creamos una nueva
    return await db.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity,
        status: 'unread',
        module: params.module,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        actionUrl: params.actionUrl || null,
        metadata: {
          ...(params.metadata || {}),
          count: 1
        }
      }
    });
  } catch (err) {
    console.error('❌ [Notification Service] Error al crear notificación:', err);
  }
}

/**
 * Marca una notificación como leída.
 */
export async function markAsRead(id: string) {
  return await db.notification.update({
    where: { id },
    data: {
      status: 'read',
      readAt: new Date()
    }
  });
}

/**
 * Marca todas las notificaciones no leídas como leídas.
 */
export async function markAllAsRead() {
  return await db.notification.updateMany({
    where: { status: 'unread' },
    data: {
      status: 'read',
      readAt: new Date()
    }
  });
}

/**
 * Archiva una notificación.
 */
export async function archiveNotification(id: string) {
  return await db.notification.update({
    where: { id },
    data: {
      status: 'archived'
    }
  });
}

/**
 * Obtiene el contador de notificaciones no leídas.
 */
export async function getUnreadCount(): Promise<number> {
  return await db.notification.count({
    where: { status: 'unread' }
  });
}

/**
 * Obtiene las últimas notificaciones ordenadas por fecha.
 */
export async function getLatestNotifications(limit = 5) {
  return await db.notification.findMany({
    where: { status: { in: ['unread', 'read'] } },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
