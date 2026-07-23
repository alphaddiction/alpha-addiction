import { AlphaAddictionConnector } from '@/core/reasoning/connectors/alpha-addiction-connector';

export class RouteContextDetector {
  private connector: AlphaAddictionConnector;

  constructor() {
    this.connector = new AlphaAddictionConnector();
  }

  /**
   * Analiza un path y recupera el contexto de negocio asociado de forma asíncrona.
   */
  async detectAndGetContext(pathname: string): Promise<Record<string, any> | null> {
    if (!pathname) return null;

    try {
      // 1. Contexto de Pedido específico: /admin/orders/[id] o similar
      const orderMatch = pathname.match(/\/admin\/orders\/([a-zA-Z0-9-]+)/);
      if (orderMatch) {
        const orderId = orderMatch[1];
        const orderDetail = await this.connector.getOrderDetail(orderId);
        if (orderDetail) {
          return {
            type: 'order',
            description: `El administrador está visualizando el Pedido #${orderDetail.orderNumber || orderDetail.id}`,
            data: orderDetail
          };
        }
      }

      // 2. Contexto de Soporte específico: /admin/support/[id] o similar
      const ticketMatch = pathname.match(/\/admin\/support\/([a-zA-Z0-9-]+)/);
      if (ticketMatch) {
        const ticketId = ticketMatch[1];
        const ticketDetail = await this.connector.getSupportTicketDetail(ticketId);
        if (ticketDetail) {
          return {
            type: 'support_ticket',
            description: `El administrador está visualizando el Ticket de Soporte #${ticketDetail.ticketNumber || ticketDetail.id} ("${ticketDetail.subject}")`,
            data: ticketDetail
          };
        }
      }

      // 3. Contexto de páginas generales
      if (pathname.includes('/admin/dashboard')) {
        return {
          type: 'mission_control',
          description: 'El administrador está en Mission Control (Dashboard Principal)'
        };
      }

      if (pathname.includes('/admin/monitoring')) {
        return {
          type: 'health_center',
          description: 'El administrador está en el Health Center (Salud del Sistema)'
        };
      }

      if (pathname.includes('/admin/comunicaciones')) {
        return {
          type: 'integration_hub',
          description: 'El administrador está en el Integration Hub (Consola de Comunicaciones)'
        };
      }

      if (pathname.includes('/admin/customers')) {
        return {
          type: 'customers_list',
          description: 'El administrador está en el listado de Clientes'
        };
      }

      if (pathname.includes('/admin/settings')) {
        return {
          type: 'settings',
          description: 'El administrador está en la configuración de la Tienda'
        };
      }

      // Contexto por defecto si es una sección de admin pero no específica
      if (pathname.startsWith('/admin')) {
        const section = pathname.split('/').filter(Boolean)[1] || 'general';
        return {
          type: 'admin_section',
          description: `El administrador está viendo la sección: "${section}"`
        };
      }

      return null;
    } catch (err) {
      console.error('❌ RouteContextDetector failed:', err);
      return null;
    }
  }
}
