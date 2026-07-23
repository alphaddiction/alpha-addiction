/**
 * Flujo Evolutivo de la Experiencia de Alpha.
 * 
 * Modela las etapas de maduración del conocimiento.
 */
export interface IObservation {
  id: string;
  timestamp: Date;
  userId: string;
  sourceEventId: string;
  category: 'behavior' | 'preference' | 'logistics' | 'technical';
  statement: string; // Observación cruda (ej: "Rechazó la sugerencia de cupón")
}

export interface IEventLog {
  id: string;
  timestamp: Date;
  eventType: string; // ej. 'order_placed', 'drop_failure'
  description: string;
  involvedEntities: string[]; // IDs de nodos del Knowledge Graph
}

export interface ILessonLearned {
  id: string;
  timestamp: Date;
  contextCondition: string; // Condición del plan
  actionTaken: string;
  resultSuccess: boolean;
  synthesizedLesson: string; // Conclusión cognitiva (ej: "No lanzar correos de drop de noche")
  confidenceScore: number;
}

export interface IBehaviorPattern {
  id: string;
  userId: string;
  frequencyScore: number; // 0-100
  patternType: 'weekly_activity' | 'tonal_preference' | 'operational_flow';
  ruleDescription: string; // ej: "Prefiere resúmenes ejecutivos los lunes"
}

export interface IExperienceEngine {
  /**
   * Registra una observación inmediata en caliente.
   */
  logObservation(obs: IObservation): Promise<void>;

  /**
   * Recupera las lecciones aprendidas y patrones aplicables al contexto semántico de entrada.
   */
  retrieveExperienceContext(semanticQuery: string): Promise<{
    lessons: ILessonLearned[];
    patterns: IBehaviorPattern[];
  }>;

  /**
   * Destila el log de eventos en patrones y lecciones asíncronas.
   */
  synthesizeExperience(): Promise<void>;
}
