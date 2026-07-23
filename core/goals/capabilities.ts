import { Schema } from 'zod';

export interface IExecutionContext {
  adminId: string;
  role: string;
  projectId: string;
  correlationId: string; // ID de seguimiento cognitivo del bus
}

/**
 * Interfaz fundamental de una Capability (Habilidad Autorizada).
 */
export interface ICapability {
  name: string;                // Nombre identificador (ej: 'create_discount_coupon')
  description: string;         // Descripción semántica para el Planner de IA
  parameterSchema: Schema;     // Esquema de entrada de parámetros (Zod)
  requiredPermissions: string[]; // Permisos necesarios del rol de administrador
  constitutionalCost: number;   // Coste de riesgo constitucional (0-100)
  rateLimitPerMinute: number;  // Tasa operativa de rate limiting
  
  /**
   * Ejecuta físicamente la habilidad interactuando con el backend.
   */
  execute(params: any, context: IExecutionContext): Promise<any>;
}

/**
 * Registro Centralizado de Habilidades de Alpha.
 */
export class CapabilityRegistry {
  private registry: Map<string, ICapability> = new Map();

  /**
   * Registra una nueva habilidad modular.
   */
  register(capability: ICapability): void {
    if (this.registry.has(capability.name)) {
      throw new Error(`[CapabilityRegistry] Capability already registered: ${capability.name}`);
    }
    this.registry.set(capability.name, capability);
  }

  /**
   * Obtiene la firma y especificaciones de una habilidad.
   */
  get(name: string): ICapability | undefined {
    return this.registry.get(name);
  }

  /**
   * Lista todas las habilidades disponibles para ser presentadas al Planner cognitivo.
   */
  listAll(): ICapability[] {
    return Array.from(this.registry.values());
  }
}
