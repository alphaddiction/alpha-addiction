export class ContextOptimizer {
  /**
   * Optimiza y recorta datos del contexto para reducir tokens y maximizar precisión del LLM.
   */
  static optimize(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      // Si es un array largo, recortar a máximo 15 registros para evitar saturar tokens
      const sliced = data.slice(0, 15);
      return sliced.map((item) => this.optimize(item));
    }

    if (typeof data === 'object') {
      const optimized: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // 1. Filtrar campos innecesarios y metadata redundante
        if (
          lowerKey === 'id' ||
          lowerKey.includes('timestamp') ||
          lowerKey.includes('updatedat') ||
          lowerKey.includes('schema') ||
          lowerKey.includes('password')
        ) {
          continue;
        }

        // 2. Limitar longitud de strings gigantes (ej. logs largos)
        if (typeof value === 'string' && value.length > 300) {
          optimized[key] = value.substring(0, 290) + '... [TRUNCADO]';
          continue;
        }

        optimized[key] = this.optimize(value);
      }

      return optimized;
    }

    return data;
  }
}
