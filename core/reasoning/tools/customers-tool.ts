import { db } from '@/backend/database/db';
import { IAiTool } from './base-tool';

export class CustomersTool implements IAiTool {
  name = 'get_customers';
  description = 'Permite consultar información sobre los clientes registrados: buscar un cliente por email o por nombre, listar los últimos clientes registrados y obtener el número total de clientes únicos (del histórico de pedidos o listas de espera).';
  parameters = {
    type: 'object' as const,
    properties: {
      email: {
        type: 'string',
        description: 'El correo electrónico del cliente a buscar.'
      },
      name: {
        type: 'string',
        description: 'El nombre o parte del nombre del cliente a buscar.'
      },
      action: {
        type: 'string',
        description: 'La acción a realizar: "list" (listar clientes recientes) o "count" (obtener totales).',
        enum: ['list', 'count']
      },
      limit: {
        type: 'integer',
        description: 'Número máximo de clientes a retornar (por defecto 5, máximo 20).'
      }
    }
  };

  async execute(args: { email?: string; name?: string; action?: 'list' | 'count'; limit?: number }): Promise<any> {
    try {
      const limit = Math.min(args.limit || 5, 20);

      // 1. Buscar por email
      if (args.email) {
        const email = args.email.trim().toLowerCase();
        
        // Buscar en pedidos
        const orders = await db.order.findMany({
          where: { email: { equals: email, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
          select: {
            name: true,
            orderNumber: true,
            total: true,
            orderStatus: true,
            createdAt: true
          }
        });

        // Buscar en waitlists
        const waitlists = await db.dropWaitlist.findMany({
          where: { email: { equals: email, mode: 'insensitive' } },
          include: { drop: { select: { name: true } } }
        });

        if (orders.length === 0 && waitlists.length === 0) {
          return { message: `No se encontró ningún cliente con el email ${email}` };
        }

        return {
          email,
          name: orders[0]?.name || waitlists[0]?.name || 'Usuario registrado',
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, o) => sum + (o.orderStatus !== 'canceled' ? o.total : 0), 0),
          recentOrders: orders,
          waitlists: waitlists.map(w => ({
            dropName: w.drop.name,
            status: w.status,
            createdAt: w.createdAt
          }))
        };
      }

      // 2. Buscar por nombre
      if (args.name) {
        const searchName = args.name.trim();

        const orders = await db.order.findMany({
          where: { name: { contains: searchName, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
          select: {
            name: true,
            email: true,
            orderNumber: true,
            total: true,
            createdAt: true
          },
          take: limit
        });

        const waitlists = await db.dropWaitlist.findMany({
          where: { name: { contains: searchName, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
          select: {
            name: true,
            email: true,
            createdAt: true
          },
          take: limit
        });

        return {
          query: searchName,
          foundInOrders: orders,
          foundInWaitlists: waitlists
        };
      }

      // 3. Obtener el conteo total de clientes únicos
      if (args.action === 'count') {
        const orderEmails = await db.order.findMany({
          select: { email: true },
          distinct: ['email']
        });
        const waitlistEmails = await db.dropWaitlist.findMany({
          select: { email: true },
          distinct: ['email']
        });

        const uniqueEmails = new Set([
          ...orderEmails.map((o) => o.email.toLowerCase()),
          ...waitlistEmails.map((w) => w.email.toLowerCase())
        ]);

        return {
          totalUniqueCustomers: uniqueEmails.size,
          customersFromOrders: orderEmails.length,
          customersFromWaitlist: waitlistEmails.length
        };
      }

      // 4. Acción por defecto: Listar últimos clientes registrados/activos
      const recentOrders = await db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          name: true,
          email: true,
          createdAt: true
        }
      });

      const recentWaitlist = await db.dropWaitlist.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          name: true,
          email: true,
          createdAt: true
        }
      });

      return {
        recentCustomersFromOrders: recentOrders,
        recentCustomersFromWaitlist: recentWaitlist
      };
    } catch (err: any) {
      console.error('❌ CustomersTool error:', err);
      return { error: 'Error interno al consultar clientes.' };
    }
  }
}
