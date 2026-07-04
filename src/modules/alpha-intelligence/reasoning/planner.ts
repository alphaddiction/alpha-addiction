import { IntentResult } from './intent-analyzer';

export interface PlanStep {
  toolName: string;
  reason: string;
}

export interface ExecutionPlan {
  steps: PlanStep[];
  reasoningSteps: string[];
}

export class Planner {
  /**
   * Crea un plan secuencial de ejecución de herramientas.
   * Selecciona únicamente las herramientas requeridas por la consulta del usuario.
   */
  static createPlan(query: string, intents: IntentResult[]): ExecutionPlan {
    const cleanQuery = query.toLowerCase();
    const steps: PlanStep[] = [];
    const reasoningSteps: string[] = [];

    // 1. Detección implícita basada en IDs o correos específicos en la query
    const hasOrderPattern = /aa-\d{5}/.test(cleanQuery);
    const hasEmailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleanQuery);

    if (hasOrderPattern) {
      steps.push({
        toolName: 'get_orders',
        reason: 'Se ha detectado un formato de número de pedido (AA-XXXXX) en la consulta.'
      });
      reasoningSteps.push('Identificar número de pedido e invocar get_orders.');
    }

    if (hasEmailPattern) {
      steps.push({
        toolName: 'get_customers',
        reason: 'Se ha detectado un formato de correo electrónico en la consulta.'
      });
      reasoningSteps.push('Identificar correo del cliente e invocar get_customers.');
    }

    // 2. Detección basada en las intenciones semánticas detectadas
    for (const item of intents) {
      if (item.confidence < 0.3) continue; // Descartar intenciones muy dudosas

      switch (item.intent) {
        case 'calcular':
        case 'analizar':
          if (cleanQuery.includes('finanzas') || cleanQuery.includes('ingreso') || cleanQuery.includes('beneficio') || cleanQuery.includes('dinero') || cleanQuery.includes('coste')) {
            if (!steps.some((s) => s.toolName === 'get_finance')) {
              steps.push({
                toolName: 'get_finance',
                reason: 'Consulta analítica de ingresos, comisiones o beneficios.'
              });
              reasoningSteps.push('Requerir métricas financieras consolidadas (get_finance).');
            }
          }
          if (cleanQuery.includes('pedido') || cleanQuery.includes('venta')) {
            if (!steps.some((s) => s.toolName === 'get_orders')) {
              steps.push({
                toolName: 'get_orders',
                reason: 'Consulta analítica sobre el historial de pedidos.'
              });
              reasoningSteps.push('Requerir listado de pedidos (get_orders).');
            }
          }
          break;

        case 'diagnosticar':
          if (cleanQuery.includes('error') || cleanQuery.includes('alerta') || cleanQuery.includes('notificación') || cleanQuery.includes('incidencia')) {
            if (!steps.some((s) => s.toolName === 'get_notifications')) {
              steps.push({
                toolName: 'get_notifications',
                reason: 'Diagnóstico solicitado sobre incidencias o logs de errores.'
              });
              reasoningSteps.push('Requerir logs de incidencias de servidores (get_notifications).');
            }
          }
          if (!steps.some((s) => s.toolName === 'get_health')) {
            steps.push({
              toolName: 'get_health',
              reason: 'Diagnóstico general de la infraestructura y latencias.'
            });
            reasoningSteps.push('Requerir estado de servicios del Health Center (get_health).');
          }
          break;

        case 'buscar':
          if (cleanQuery.includes('cliente') || cleanQuery.includes('waitlist') || cleanQuery.includes('espera') || cleanQuery.includes('usuario')) {
            if (!steps.some((s) => s.toolName === 'get_customers')) {
              steps.push({
                toolName: 'get_customers',
                reason: 'Búsqueda explícita sobre clientes o lista de espera.'
              });
              reasoningSteps.push('Buscar detalles del perfil de cliente (get_customers).');
            }
          } else {
            // Si busca pedidos
            if (!steps.some((s) => s.toolName === 'get_orders')) {
              steps.push({
                toolName: 'get_orders',
                reason: 'Búsqueda general sobre transacciones y estado de envíos.'
              });
              reasoningSteps.push('Buscar pedido específico (get_orders).');
            }
          }
          break;

        case 'resumir':
          if (!steps.some((s) => s.toolName === 'get_mission_control')) {
            steps.push({
              toolName: 'get_mission_control',
              reason: 'Resumen consolidado global solicitado de la operación.'
            });
            reasoningSteps.push('Solicitar KPI agregados de Mission Control (get_mission_control).');
          }
          break;
      }
    }

    // 3. Fallback: si no se ha asignado ninguna herramienta, cargar el resumen general
    if (steps.length === 0) {
      steps.push({
        toolName: 'get_mission_control',
        reason: 'Consulta general informativa. Se provee resumen operacional básico.'
      });
      reasoningSteps.push('Carga por defecto del panel operacional general.');
    }

    return {
      steps,
      reasoningSteps
    };
  }
}
