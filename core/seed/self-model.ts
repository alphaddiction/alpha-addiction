/**
 * Contratos de TypeScript para el Self Model de Alpha (Autoconocimiento).
 */

export interface ISelfAwareness {
  memoryUsageBytes: number;
  contextTokensUsed: number;
  contextTokensLimit: number;
  activeModelProvider: string;
  activeModelName: string;
}

export interface ILimitationModel {
  timeoutMsLimit: number;
  maxSubGraphDepth: number;
  maxConcurrentProcesses: number;
  financialApprovalThresholdEur: number;
}

export interface IApiHealthStatus {
  apiName: string;
  isAvailable: boolean;
  latencyMs: number;
  lastChecked: Date;
  errorCount24h: number;
}

export interface ISelfModel {
  awareness: ISelfAwareness;
  limitations: ILimitationModel;
  apiHealth: IApiHealthStatus[];
  consistencyScore: number; // 0.0 - 1.0
  activeCapabilities: string[]; // Nombres de capabilities autorizadas activas
}

/**
 * Interfaz del gestor del Self Model.
 */
export interface ISelfModelManager {
  /**
   * Obtiene la foto de estado actual del autoconocimiento de Alpha.
   */
  getCurrentSelfModel(): Promise<ISelfModel>;

  /**
   * Actualiza el estado de disponibilidad y latencia de una API externa.
   */
  updateApiHealth(apiName: string, isAvailable: boolean, latencyMs: number): Promise<void>;

  /**
   * Evalúa la consistencia de una respuesta generada contra el historial reciente.
   */
  verifyResponseConsistency(generatedResponse: string, turnHistoryContext: string): Promise<boolean>;
}
