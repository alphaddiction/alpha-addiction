import { AiToolRegistry } from '../tools/registry';
import { IAiTool } from '../tools/base-tool';
import { SecurityLayer } from './security-layer';

export class SkillManager {
  /**
   * Resuelve y filtra las herramientas habilitadas para el administrador
   * de acuerdo con la configuración y sus permisos de seguridad.
   */
  static async getAvailableSkills(userRole: string): Promise<IAiTool[]> {
    try {
      const activeTools = await AiToolRegistry.getActiveTools();
      
      // Filtrar las herramientas de acuerdo a la capa de seguridad
      return activeTools.filter((tool) => {
        // Mapeamos el nombre técnico al tipo simplificado de seguridad
        let secName = tool.name;
        if (tool.name.startsWith('get_')) {
          secName = tool.name.substring(4); // get_orders -> orders
        }
        return SecurityLayer.checkPermissions(secName, userRole);
      });
    } catch (err) {
      console.error('❌ [SkillManager] Failed to fetch tools from registry:', err);
      return [];
    }
  }

  /**
   * Ejecuta una herramienta específica validando los permisos del usuario.
   */
  static async executeSkill(
    toolName: string,
    args: any,
    userRole: string
  ): Promise<any> {
    let secName = toolName;
    if (toolName.startsWith('get_')) {
      secName = toolName.substring(4);
    }

    if (!SecurityLayer.checkPermissions(secName, userRole)) {
      return { error: 'Acceso Denegado: No tienes permisos suficientes para realizar esta consulta.' };
    }

    const tool = AiToolRegistry.getTool(toolName);
    if (!tool) {
      return { error: `La herramienta "${toolName}" no está activa o disponible.` };
    }

    return await tool.execute(args);
  }
}
