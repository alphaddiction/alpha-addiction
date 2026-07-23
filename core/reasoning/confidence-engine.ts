export interface SkillExecutionResult {
  toolName: string;
  success: boolean;
  durationMs: number;
  error?: string | null;
}

export class ConfidenceEngine {
  /**
   * Calcula el porcentaje de confianza global del procesamiento de la respuesta.
   */
  static calculateConfidence(
    query: string,
    results: SkillExecutionResult[],
    routeContextActive: boolean
  ): number {
    let score = 95; // Confianza base inicial

    // 1. Penalización si hay fallos en herramientas
    if (results.length > 0) {
      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount > 0) {
        score -= (failedCount / results.length) * 40; // Penaliza hasta un 40% si fallan herramientas
      }
    } else {
      // Si no se ejecutó ninguna herramienta, la consulta es puramente conversacional
      score = 80;
    }

    // 2. Bonus si el contexto de la ruta está activo y coincide
    if (routeContextActive) {
      score = Math.min(100, score + 10);
    }

    // 3. Penalización por ambigüedad
    const cleanQuery = query.toLowerCase();
    const isVague =
      cleanQuery.length < 10 ||
      (cleanQuery.includes('dame detalles') && !/aa-\d{5}/.test(cleanQuery) && !cleanQuery.includes('@'));

    if (isVague) {
      score -= 20;
    }

    // Asegurar límites entre 0 y 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
