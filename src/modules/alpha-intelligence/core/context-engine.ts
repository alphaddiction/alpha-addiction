import { ProjectLayer, ProjectContext } from './project-layer';

export interface RouteContextData {
  type?: string;
  description?: string;
  data?: any;
}

export interface SystemContext {
  project: ProjectContext;
  adminUser: {
    name: string;
    role: string;
  };
  route?: {
    path?: string;
    description?: string;
    entityType?: string;
    entityId?: string;
  } | null;
  timestamp: string;
}

export class ContextEngine {
  /**
   * Construye el contexto operativo dinámico de la petición.
   */
  static buildContext(
    projectId: string,
    adminName: string,
    adminRole: string,
    routeData?: RouteContextData | null,
    contextPath?: string
  ): SystemContext {
    const project = ProjectLayer.getProject(projectId);
    
    let pathInfo = null;
    if (routeData || contextPath) {
      pathInfo = {
        path: contextPath || '',
        description: routeData?.description || 'Navegación general',
        entityType: routeData?.type || undefined,
        entityId: routeData?.type === 'order' ? routeData.data?.orderNumber : (routeData?.type === 'support_ticket' ? routeData.data?.id : undefined)
      };
    }

    return {
      project,
      adminUser: {
        name: adminName || 'Alberto',
        role: adminRole || 'admin'
      },
      route: pathInfo,
      timestamp: new Date().toLocaleString('es-ES')
    };
  }

  /**
   * Transforma el contexto en un string estructurado para el prompt del LLM.
   */
  static formatContextToString(context: SystemContext, summaryData: any): string {
    let result = `--- CONTEXTO OPERATIVO DEL SISTEMA (TIEMPO REAL) ---\n`;
    result += `Fecha/Hora: ${context.timestamp}\n`;
    result += `Proyecto Activo: ${context.project.name} (${context.project.domain}) - ${context.project.description}\n`;
    result += `Administrador: ${context.adminUser.name} (Rol: ${context.adminUser.role})\n`;
    
    if (context.route) {
      result += `\n--- PANTALLA ACTUAL EN EL PANEL ---\n`;
      result += `Ruta/URL: ${context.route.path || 'N/A'}\n`;
      result += `Descripción de pantalla: ${context.route.description || 'N/A'}\n`;
      if (context.route.entityType && context.route.entityId) {
        result += `Entidad enfocada: [${context.route.entityType}] ID: ${context.route.entityId}\n`;
      }
    }

    if (summaryData) {
      result += `\n--- DATOS DE RESUMEN OPERATIVO ---\n${JSON.stringify(summaryData, null, 2)}\n`;
    }

    return result;
  }
}
