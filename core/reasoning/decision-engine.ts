export interface DecisionStrategy {
  modelSuggestion: string;
  temperatureSuggestion: number;
  reason: string;
}

export class DecisionEngine {
  /**
   * Decide la mejor estrategia de ejecución (sugerencia de modelo y parámetros)
   * basado en la longitud del prompt, complejidad del historial y tipo de herramientas a usar.
   */
  static evaluateExecutionStrategy(
    promptLength: number,
    activeToolsCount: number,
    provider: string
  ): DecisionStrategy {
    // Preparación para futuras decisiones de reasoning complejas
    if (activeToolsCount > 4) {
      return {
        modelSuggestion: provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o',
        temperatureSuggestion: 0.2, // Temperatura más baja para precisión en múltiples herramientas
        reason: 'Uso intensivo de herramientas operativas requiere precisión factual baja.'
      };
    }

    return {
      modelSuggestion: provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o',
      temperatureSuggestion: 0.7,
      reason: 'Baja densidad de herramientas. Ejecución equilibrada estándar.'
    };
  }
}
