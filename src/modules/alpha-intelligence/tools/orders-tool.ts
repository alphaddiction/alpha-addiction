import { db } from '@/lib/db';
import { IAiTool } from './base-tool';

export class OrdersTool implements IAiTool {
  name = 'get_orders';
  description = 'Permite consultar información sobre pedidos: lista de pedidos recientes, buscar un pedido específico por su número de pedido, filtrar por estado (pendiente, enviado, pagado, cancelado) y comprobar el estado actual.';
  parameters = {
    type: 'object' as const,
    properties: {
      orderNumber: {
        type: 'string',
        description: 'El número de pedido legible a buscar (ej. "AA-10001", "AA-10002").'
      },
      status: {
        type: 'string',
        description: 'Filtrar pedidos por estado: "draft", "paid", "shipped", "canceled", "fulfillment_submitted", "fulfillment_failed".'
      },
      limit: {
        type: 'integer',
        description: 'Número máximo de pedidos a listar (por defecto 5, máximo 20).'
      }
    }
  };

  async execute(args: { orderNumber?: string; status?: string; limit?: number }): Promise<any> {
    try {
      const limit = Math.min(args.limit || 5, 20);

      // 1. Buscar un pedido específico
      if (args.orderNumber) {
        const order = await db.order.findUnique({
          where: { orderNumber: args.orderNumber },
          include: {
            items: true,
            events: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        });

        if (!order) {
          return { error: `No se encontró ningún pedido con el número ${args.orderNumber}` };
        }

        // Sanitización estricta por seguridad
        return {
          orderNumber: order.orderNumber,
          email: order.email,
          name: order.name,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          currency: order.currency,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: order.items.map((i) => ({
            name: i.name,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            price: i.price,
            total: i.total
          })),
          events: order.events.map((e) => ({
            type: e.type,
            message: e.message,
            createdAt: e.createdAt
          }))
        };
      }

      // 2. Listar y filtrar pedidos
      const whereClause: any = {};
      if (args.status) {
        whereClause.orderStatus = args.status;
      }

      const orders = await db.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          orderNumber: true,
          email: true,
          name: true,
          orderStatus: true,
          paymentStatus: true,
          total: true,
          currency: true,
          createdAt: true
        }
      });

      return {
        count: orders.length,
        orders
      };
    } catch (err: any) {
      console.error('❌ OrdersTool error:', err);
      return { error: 'Error interno al consultar pedidos.' };
    }
  }
}
