import { db } from '@/backend/database/db';
import { IAiTool } from './base-tool';

export class MissionControlTool implements IAiTool {
  name = 'get_mission_control';
  description = 'Permite consultar el resumen completo del negocio: métricas clave de ventas, pedidos, soporte (tickets abiertos), suscripciones a la waitlist y estado de salud operativa global.';
  parameters = {
    type: 'object' as const,
    properties: {}
  };

  async execute(): Promise<any> {
    try {
      // 1. Pedidos y ventas
      const orders = await db.order.findMany({
        where: { orderStatus: { not: 'canceled' }, paymentStatus: 'pagado' },
        select: { total: true }
      });
      const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

      // Pedidos hoy
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayOrdersCount = await db.order.count({
        where: { createdAt: { gte: todayStart } }
      });

      // 2. Tickets de soporte
      const openTicketsCount = await db.supportTicket.count({
        where: { status: { in: ['open', 'pending'] } }
      });

      // 3. Waitlist
      const totalWaitlistCount = await db.dropWaitlist.count();

      // 4. Estado de servicios
      const services = await db.systemHealth.findMany();
      const offlineCount = services.filter(s => s.status === 'offline').length;
      const degradedCount = services.filter(s => s.status === 'degraded').length;

      return {
        summary: {
          totalSalesEUR: Number(totalSales.toFixed(2)),
          totalOrdersCount: orders.length,
          todayOrdersCount,
          openSupportTickets: openTicketsCount,
          totalWaitlistUsers: totalWaitlistCount,
          systemStatus: offlineCount > 0 ? 'critical' : degradedCount > 0 ? 'degraded' : 'online',
          servicesCount: services.length,
          offlineServices: offlineCount,
          degradedServices: degradedCount
        }
      };
    } catch (err: any) {
      console.error('❌ MissionControlTool error:', err);
      return { error: 'Error interno al generar el resumen de Mission Control.' };
    }
  }
}
