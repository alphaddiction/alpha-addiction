import { SkillManager } from '../core/skill-manager';
import { TimeoutManager } from './timeout-manager';
import { SkillExecutionResult } from './confidence-engine';

export interface SkillMetadata {
  name: string;
  description: string;
  permissions: string[];
  dependencies: string[];
  priority: number;
  timeoutMs: number;
  cacheable: boolean;
  estimatedCostUSD: number;
  version: string;
}

export interface PipelineResult {
  toolName: string;
  success: boolean;
  result: any;
  durationMs: number;
  error?: string | null;
}

export class SkillPipeline {
  // Metadatos declarativos de todas las Skills del sistema
  private static metadataRegistry: Record<string, SkillMetadata> = {
    get_orders: {
      name: 'get_orders',
      description: 'Consulta el estado y detalles de pedidos por id o email.',
      permissions: ['admin', 'support'],
      dependencies: [],
      priority: 1,
      timeoutMs: 5000,
      cacheable: true,
      estimatedCostUSD: 0.0001,
      version: '1.1.0'
    },
    get_customers: {
      name: 'get_customers',
      description: 'Obtiene información de clientes registrados y miembros en waitlists.',
      permissions: ['admin', 'support'],
      dependencies: [],
      priority: 2,
      timeoutMs: 5000,
      cacheable: true,
      estimatedCostUSD: 0.0001,
      version: '1.1.0'
    },
    get_finance: {
      name: 'get_finance',
      description: 'Calcula ingresos brutos, gastos de producción, comisiones y beneficio neto.',
      permissions: ['admin'],
      dependencies: ['get_orders'], // Finance depende de Orders para calcular con precisión en Tool Chaining
      priority: 3,
      timeoutMs: 6000,
      cacheable: true,
      estimatedCostUSD: 0.0002,
      version: '1.1.0'
    },
    get_health: {
      name: 'get_health',
      description: 'Revisa las métricas del sistema y latencias de conexión externas (PayPal, Printful).',
      permissions: ['admin'],
      dependencies: [],
      priority: 4,
      timeoutMs: 4000,
      cacheable: true,
      estimatedCostUSD: 0.0001,
      version: '1.1.0'
    },
    get_notifications: {
      name: 'get_notifications',
      description: 'Filtra alertas de errores críticos y notificaciones de aviso del servidor.',
      permissions: ['admin'],
      dependencies: [],
      priority: 5,
      timeoutMs: 4000,
      cacheable: false,
      estimatedCostUSD: 0.0001,
      version: '1.1.0'
    },
    get_mission_control: {
      name: 'get_mission_control',
      description: 'Resumen consolidado general (KPI) del ecommerce para la consola principal.',
      permissions: ['admin', 'support'],
      dependencies: [],
      priority: 0,
      timeoutMs: 5000,
      cacheable: true,
      estimatedCostUSD: 0.0002,
      version: '1.1.0'
    }
  };

  /**
   * Ejecuta secuencialmente una lista de herramientas, resolviendo dependencias mediante Tool Chaining
   * y controlando timeouts de manera tolerante a fallos individuales.
   */
  static async execute(
    tools: string[],
    adminRole: string,
    queryArgs: any = {},
    chainDepth = 0
  ): Promise<PipelineResult[]> {
    const results: PipelineResult[] = [];
    const maxChainDepth = 3;

    if (chainDepth > maxChainDepth) {
      console.warn(`⚠️ [SkillPipeline] Max tool chaining depth of ${maxChainDepth} reached. Aborting chaining.`);
      return [];
    }

    for (const toolName of tools) {
      const meta = this.metadataRegistry[toolName];
      if (!meta) {
        results.push({
          toolName,
          success: false,
          result: { error: `La herramienta "${toolName}" no está registrada en el metadata.` },
          durationMs: 0,
          error: 'Not registered'
        });
        continue;
      }

      const startTime = performance.now();
      let executionResult: any;
      let isSuccess = true;
      let errorMsg: string | null = null;

      // 1. Resolver dependencias (Tool Chaining) si las hay
      const resolvedDependenciesData: Record<string, any> = {};
      if (meta.dependencies && meta.dependencies.length > 0) {
        console.log(`🔗 [SkillPipeline] Tool "${toolName}" requires chaining of: ${meta.dependencies.join(', ')}`);
        const depResults = await this.execute(meta.dependencies, adminRole, queryArgs, chainDepth + 1);
        
        for (const dep of depResults) {
          if (dep.success) {
            resolvedDependenciesData[dep.toolName] = dep.result;
          }
        }
      }

      // 2. Ejecutar la herramienta controlando el timeout individual
      try {
        const timeoutLimit = meta.timeoutMs || 5000;
        
        // Unir argumentos de la consulta con datos obtenidos de las dependencias encadenadas
        const toolArgs = {
          ...queryArgs,
          _chainedData: resolvedDependenciesData
        };

        const executionPromise = SkillManager.executeSkill(toolName, toolArgs, adminRole);
        const fallbackValue = { error: `Timeout alcanzado al ejecutar la herramienta "${toolName}" (${timeoutLimit}ms).` };

        executionResult = await TimeoutManager.runWithTimeout(
          executionPromise,
          timeoutLimit,
          fallbackValue
        );

        if (executionResult && executionResult.error) {
          isSuccess = false;
          errorMsg = executionResult.error;
        }
      } catch (err: any) {
        isSuccess = false;
        errorMsg = err.message || 'Falla de ejecución de la herramienta';
        executionResult = { error: `Error interno al ejecutar la herramienta: ${errorMsg}` };
      }

      const durationMs = Math.round(performance.now() - startTime);

      results.push({
        toolName,
        success: isSuccess,
        result: executionResult,
        durationMs,
        error: errorMsg
      });
    }

    return results;
  }

  /**
   * Obtiene la declaración de metadatos de todas las herramientas registradas.
   */
  static getRegistryMetadata(): SkillMetadata[] {
    return Object.values(this.metadataRegistry);
  }
}
