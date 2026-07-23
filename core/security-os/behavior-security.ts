import { ICognitivePlan } from '../brain-os/cognitive-bus';

/**
 * Behavior Security - Cortafuegos de Comportamiento y Validaciones Constitucionales.
 */
export interface IBehaviorSecurity {
  /**
   * Examina un plan antes de su ejecución para evitar inyecciones maliciosas
   * o infracciones constitucionales graves de comportamiento.
   */
  evaluateProposedPlan(plan: ICognitivePlan): Promise<IBehaviorAuditResult>;

  /**
   * Registra y analiza los logs de anomalías del sistema.
   */
  logBehaviorAnomalies(report: IBehaviorAuditResult): Promise<void>;
}

export interface IBehaviorAuditResult {
  isSafe: boolean;
  scoreConstitutionViolation: number; // 0 (ninguna) a 100 (infracción total)
  flaggedCapabilities: string[];      // Habilidades bloqueadas
  threatsDetected: string[];           // ej. ['inyección_prompt', 'escalado_privilegios']
  justificationNotes: string;          // Explicación de la denegación
}
