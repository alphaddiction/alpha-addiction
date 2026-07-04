import { db } from '@/lib/db';
import { ContextSanitizer } from '../utils/sanitizer';

export class AlphaAddictionConnector {
  /**
   * Obtiene un resumen consolidado y seguro del estado completo del negocio.
   */
  async getSystemSummary(): Promise<Record<string, any>> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Pedidos y Facturación
      const orders = await db.order.findMany({
        where: {
          orderStatus: { not: 'canceled' }
        },
        select: {
          total: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true
        }
      });

      const totalRevenue = orders
        .filter((o) => o.paymentStatus === 'paid' || o.orderStatus === 'paid' || o.orderStatus === 'shipped')
        .reduce((sum, o) => sum + o.total, 0);

      const todayOrders = orders.filter((o) => o.createdAt >= startOfToday);

      // 2. Incidentes de soporte abiertos
      const openTicketsCount = await db.supportTicket.count({
        where: { status: { in: ['open', 'pending'] } }
      });

      // 3. Estado de Salud (Health Center)
      const healthAlertsCount = await db.systemHealth.count({
        where: { status: { not: 'online' } }
      });

      // 4. Integraciones (Integration Hub)
      const integrations = await db.systemHealth.findMany({
        select: {
          serviceName: true,
          status: true,
          responseTime: true
        }
      });

      // 5. Registros en Waitlist
      const waitlistCount = await db.dropWaitlist.count();

      // 6. Alertas / Notificaciones recientes
      const recentNotifications = await db.notification.findMany({
        where: { status: 'unread' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          title: true,
          message: true,
          severity: true,
          createdAt: true
        }
      });

      const summary = {
        totalRevenue: `${totalRevenue.toFixed(2)} EUR`,
        totalOrdersCount: orders.length,
        todayOrdersCount: todayOrders.length,
        openTicketsCount,
        healthAlertsCount,
        integrations: integrations.map((i) => ({
          service: i.serviceName,
          status: i.status,
          latencyMs: i.responseTime
        })),
        waitlistCount,
        recentUnreadAlerts: recentNotifications.map((n) => ({
          title: n.title,
          message: n.message,
          severity: n.severity,
          time: n.createdAt.toISOString()
        }))
      };

      // Retornar información totalmente sanitizada
      return ContextSanitizer.sanitizeObject(summary);
    } catch (err: any) {
      console.error('❌ AlphaAddictionConnector.getSystemSummary failed:', err);
      return { error: 'No se pudieron recuperar las métricas operativas.' };
    }
  }

  /**
   * Busca información detallada de un pedido específico por ID o número de pedido.
   */
  async getOrderDetail(orderIdentifier: string): Promise<any | null> {
    try {
      const order = await db.order.findFirst({
        where: {
          OR: [
            { id: orderIdentifier },
            { orderNumber: orderIdentifier }
          ]
        },
        include: {
          items: {
            select: {
              name: true,
              size: true,
              color: true,
              quantity: true,
              price: true,
              total: true
            }
          },
          events: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              type: true,
              message: true,
              createdAt: true
            }
          }
        }
      });

      if (!order) return null;

      const safeOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        currency: order.currency,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        createdAt: order.createdAt,
        items: order.items,
        events: order.events
      };

      return ContextSanitizer.sanitizeObject(safeOrder);
    } catch (err) {
      console.error('❌ AlphaAddictionConnector.getOrderDetail failed:', err);
      return null;
    }
  }

  /**
   * Busca información detallada de un ticket de soporte específico por ID o número.
   */
  async getSupportTicketDetail(ticketIdentifier: string): Promise<any | null> {
    try {
      const ticket = await db.supportTicket.findFirst({
        where: {
          OR: [
            { id: ticketIdentifier },
            { ticketNumber: ticketIdentifier }
          ]
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 15,
            select: {
              senderType: true,
              body: true,
              createdAt: true
            }
          }
        }
      });

      if (!ticket) return null;

      const safeTicket = {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        category: ticket.category,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        source: ticket.source,
        createdAt: ticket.createdAt,
        messages: ticket.messages
      };

      return ContextSanitizer.sanitizeObject(safeTicket);
    } catch (err) {
      console.error('❌ AlphaAddictionConnector.getSupportTicketDetail failed:', err);
      return null;
    }
  }
}
