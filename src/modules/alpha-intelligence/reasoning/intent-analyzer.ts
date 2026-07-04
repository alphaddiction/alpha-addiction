export type UserIntent =
  | 'consultar'
  | 'comparar'
  | 'resumir'
  | 'explicar'
  | 'diagnosticar'
  | 'recomendar'
  | 'buscar'
  | 'navegar'
  | 'configurar'
  | 'analizar'
  | 'calcular';

export interface IntentResult {
  intent: UserIntent;
  confidence: number; // 0 to 1
}

export class IntentAnalyzer {
  private static rules: Array<{ intent: UserIntent; keywords: string[] }> = [
    {
      intent: 'calcular',
      keywords: ['calcula', 'suma', 'resta', 'porcentaje', 'cuánto es', 'beneficio neto', 'coste', 'total']
    },
    {
      intent: 'comparar',
      keywords: ['compara', 'diferencia', 'versus', 'vs', 'mejor que', 'peor que', 'relación entre']
    },
    {
      intent: 'resumir',
      keywords: ['resume', 'resumen', 'síntesis', 'en pocas palabras', 'brevemente', 'consolidado']
    },
    {
      intent: 'diagnosticar',
      keywords: ['diagnóstico', 'error', 'falla', 'caído', 'offline', 'degradado', 'problema', 'health']
    },
    {
      intent: 'recomendar',
      keywords: ['recomienda', 'sugiere', 'qué hacer', 'consejo', 'estrategia', 'sugerencia']
    },
    {
      intent: 'buscar',
      keywords: ['busca', 'encuentra', 'dónde está', 'localiza', 'filtrar por', 'filtrado', 'email', 'pedido']
    },
    {
      intent: 'analizar',
      keywords: ['analiza', 'análisis', 'patrón', 'tendencia', 'evolución', 'comportamiento']
    },
    {
      intent: 'configurar',
      keywords: ['configura', 'activa', 'desactiva', 'cambia el ajuste', 'ajustes', 'settings']
    },
    {
      intent: 'navegar',
      keywords: ['ir a', 'llévame', 'pantalla', 'sección', 'ver módulo']
    },
    {
      intent: 'explicar',
      keywords: ['explica', 'cómo funciona', 'por qué', 'qué significa', 'definición']
    },
    {
      intent: 'consultar',
      keywords: ['muestra', 'ver', 'dame', 'listado', 'quién', 'qué', 'cuántos']
    }
  ];

  /**
   * Analiza semánticamente la consulta del usuario para clasificar las intenciones detectadas.
   */
  static analyze(query: string): IntentResult[] {
    const cleanQuery = query.toLowerCase().trim();
    const results: IntentResult[] = [];

    for (const rule of this.rules) {
      let matches = 0;
      for (const keyword of rule.keywords) {
        if (cleanQuery.includes(keyword)) {
          matches++;
        }
      }

      if (matches > 0) {
        // Calcular score de confianza simple en base a coincidencias
        const score = Math.min(1.0, 0.4 + matches * 0.2);
        results.push({ intent: rule.intent, confidence: score });
      }
    }

    // Si no coincide con ninguna regla, por defecto clasificar como "consultar" con confianza básica
    if (results.length === 0) {
      results.push({ intent: 'consultar', confidence: 0.5 });
    }

    // Ordenar de mayor a menor confianza
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}
