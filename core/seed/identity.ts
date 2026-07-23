import { ICognitiveState } from '../brain-os/cognitive-bus';

/**
 * Representación matemática cuantificable de los rasgos fundamentales de Alpha.
 * 
 * Modula dinámicamente la generación de prompts e hiperparámetros.
 */
export interface IIdentityVector {
  curiosity: number;   // 0.0 - 1.0 (Profundidad de exploración de anomalías)
  humility: number;    // 0.0 - 1.0 (Proclividad a reportar incertidumbre)
  precision: number;   // 0.0 - 1.0 (Rigor de verificación factual)
  empathy: number;     // 0.0 - 1.0 (Adaptación emocional al usuario)
  creativity: number;  // 0.0 - 1.0 (Amplitud en generación de hipótesis)
  patience: number;    // 0.0 - 1.0 (Nivel de detalle de explicaciones)
  initiative: number;  // 0.0 - 1.0 (Proactividad de sugerencia autónoma)
}

export const DefaultIdentityVector: IIdentityVector = {
  curiosity: 0.80,
  humility: 0.90,
  precision: 0.95,
  empathy: 0.70,
  creativity: 0.60,
  patience: 0.90,
  initiative: 0.70
};

/**
 * Reporte de auditoría contra la Deriva de Identidad (Identity Drift).
 */
export interface IDriftAuditReport {
  timestamp: Date;
  conversationId: string;
  driftDetected: boolean;
  driftMagnitude: number; // Porcentaje de desviación (0.0 - 1.0)
  deviatedTraits: string[]; // Rasgos que superaron el umbral
  correctionsApplied: boolean;
}

/**
 * Motor de Protección contra la Deriva de Identidad.
 */
export interface IIdentityDriftProtection {
  /**
   * Analiza la respuesta generada por Alpha y el estado cognitivo
   * para evaluar si se ha desviado de las invariantes de identidad.
   */
  auditStateDrift(state: ICognitiveState): Promise<IDriftAuditReport>;

  /**
   * Resetea el vector de identidad actual a sus valores seguros por defecto.
   */
  resetIdentityVector(): Promise<IIdentityVector>;
}
