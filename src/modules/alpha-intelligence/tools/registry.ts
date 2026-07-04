import { db } from '@/lib/db';
import { IAiTool } from './base-tool';
import { OrdersTool } from './orders-tool';
import { CustomersTool } from './customers-tool';
import { FinanceTool } from './finance-tool';
import { HealthTool } from './health-tool';
import { NotificationsTool } from './notifications-tool';
import { MissionControlTool } from './mission-control-tool';

export class AiToolRegistry {
  private static allTools: Record<string, () => IAiTool> = {
    get_orders: () => new OrdersTool(),
    get_customers: () => new CustomersTool(),
    get_finance: () => new FinanceTool(),
    get_health: () => new HealthTool(),
    get_notifications: () => new NotificationsTool(),
    get_mission_control: () => new MissionControlTool()
  };

  /**
   * Obtiene la lista de herramientas habilitadas según SystemSettings.
   */
  static async getActiveTools(): Promise<IAiTool[]> {
    try {
      const settings = await db.systemSetting.findMany({
        where: {
          key: {
            in: [
              'ai_tool_orders',
              'ai_tool_customers',
              'ai_tool_finance',
              'ai_tool_health',
              'ai_tool_notifications',
              'ai_tool_mission_control'
            ]
          }
        }
      });

      const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value === 'true';
        return acc;
      }, {} as Record<string, boolean>);

      const activeTools: IAiTool[] = [];

      if (settingsMap['ai_tool_orders'] !== false) activeTools.push(this.allTools.get_orders());
      if (settingsMap['ai_tool_customers'] !== false) activeTools.push(this.allTools.get_customers());
      if (settingsMap['ai_tool_finance'] !== false) activeTools.push(this.allTools.get_finance());
      if (settingsMap['ai_tool_health'] !== false) activeTools.push(this.allTools.get_health());
      if (settingsMap['ai_tool_notifications'] !== false) activeTools.push(this.allTools.get_notifications());
      if (settingsMap['ai_tool_mission_control'] !== false) activeTools.push(this.allTools.get_mission_control());

      return activeTools;
    } catch (err) {
      console.error('❌ Error loading active tools from registry:', err);
      // Fallback
      return Object.values(this.allTools).map(fn => fn());
    }
  }

  static getTool(name: string): IAiTool | null {
    const fn = this.allTools[name];
    return fn ? fn() : null;
  }
}
