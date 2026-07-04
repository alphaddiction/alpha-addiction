import { db } from '@/lib/db';
import { IAiTool } from './base-tool';

export class HealthTool implements IAiTool {
  name = 'get_health';
  description = 'Permite consultar el estado de salud operativa del sistema: servicios conectados (PayPal, Printful, base de datos Neon, SMTP), alertas activas, latencia de servicios y score general.';
  parameters = {
    type: 'object' as const,
    properties: {}
  };

  async execute(): Promise<any> {
    try {
      const services = await db.systemHealth.findMany();

      const offlineCount = services.filter((s) => s.status === 'offline').length;
      const degradedCount = services.filter((s) => s.status === 'degraded').length;
      const totalServices = services.length;

      let score = 100;
      if (totalServices > 0) {
        const onlineCount = services.filter((s) => s.status === 'online').length;
        score = Math.round((onlineCount / totalServices) * 100);
      }

      return {
        healthScore: score,
        status: score === 100 ? 'healthy' : score >= 75 ? 'degraded' : 'critical',
        totalServices,
        offlineCount,
        degradedCount,
        services: services.map((s) => ({
          serviceName: s.serviceName,
          status: s.status,
          responseTimeMs: s.responseTime,
          lastChecked: s.lastChecked
        }))
      };
    } catch (err: any) {
      console.error('❌ HealthTool error:', err);
      return { error: 'Error interno al consultar la salud del sistema.' };
    }
  }
}
