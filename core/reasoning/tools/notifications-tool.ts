import { db } from '@/backend/database/db';
import { IAiTool } from './base-tool';

export class NotificationsTool implements IAiTool {
  name = 'get_notifications';
  description = 'Permite consultar las notificaciones, alertas de incidencias, errores de integración o eventos operativos recientes del sistema.';
  parameters = {
    type: 'object' as const,
    properties: {
      severity: {
        type: 'string',
        description: 'Filtrar por severidad de la alerta: "info", "success", "warning", "error", "critical".'
      },
      limit: {
        type: 'integer',
        description: 'Número máximo de notificaciones a retornar (por defecto 5, máximo 20).'
      }
    }
  };

  async execute(args: { severity?: string; limit?: number }): Promise<any> {
    try {
      const limit = Math.min(args.limit || 5, 20);

      const whereClause: any = {};
      if (args.severity) {
        whereClause.severity = args.severity;
      }

      const notifications = await db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          severity: true,
          status: true,
          module: true,
          createdAt: true
        }
      });

      const unreadCount = await db.notification.count({
        where: { status: 'unread' }
      });

      return {
        unreadCount,
        notificationsCount: notifications.length,
        notifications
      };
    } catch (err: any) {
      console.error('❌ NotificationsTool error:', err);
      return { error: 'Error interno al consultar notificaciones.' };
    }
  }
}
