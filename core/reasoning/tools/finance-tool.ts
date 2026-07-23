import { db } from '@/backend/database/db';
import { IAiTool } from './base-tool';

export class FinanceTool implements IAiTool {
  name = 'get_finance';
  description = 'Permite consultar información financiera: ingresos totales, facturación de hoy, esta semana o este mes, ganancias o beneficio neto, y volumen de ventas de pedidos pagados.';
  parameters = {
    type: 'object' as const,
    properties: {
      period: {
        type: 'string',
        description: 'Período financiero a consultar: "today" (hoy), "week" (esta semana), "month" (este mes) o "all" (histórico completo).',
        enum: ['today', 'week', 'month', 'all']
      }
    }
  };

  async execute(args: { period?: 'today' | 'week' | 'month' | 'all' }): Promise<any> {
    try {
      const period = args.period || 'all';
      const now = new Date();
      let startDate: Date | null = null;

      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const whereClause: any = {
        orderStatus: { not: 'canceled' },
        paymentStatus: 'pagado'
      };

      if (startDate) {
        whereClause.createdAt = { gte: startDate };
      }

      const orders = await db.order.findMany({
        where: whereClause,
        select: {
          total: true,
          totalCost: true,
          netProfit: true,
          shipping: true,
          discount: true
        }
      });

      const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
      const totalCost = orders.reduce((sum, o) => sum + o.totalCost, 0);
      const totalProfit = orders.reduce((sum, o) => sum + o.netProfit, 0);

      return {
        period,
        startDate: startDate ? startDate.toISOString() : 'all-time',
        ordersCount: orders.length,
        totalSalesEUR: Number(totalSales.toFixed(2)),
        totalCostEUR: Number(totalCost.toFixed(2)),
        netProfitEUR: Number(totalProfit.toFixed(2))
      };
    } catch (err: any) {
      console.error('❌ FinanceTool error:', err);
      return { error: 'Error interno al consultar finanzas.' };
    }
  }
}
