import { ICognitiveState } from './cognitive-bus';

/**
 * Interfaz del Motor de Evolución Cognitiva (Evolution Engine).
 * 
 * Corre asíncronamente en segundo plano consolidando memoria,
 * hábitos y optimizando el Knowledge Graph.
 */
export interface IEvolutionEngine {
  /**
   * Procesa de forma offline los últimos estados de pensamiento
   * para consolidar lecciones aprendidas y podar ruido de RAG.
   */
  consolidateCognitiveStates(states: ICognitiveState[]): Promise<IEvolutionReport>;

  /**
   * Elimina o comprime recuerdos y chats antiguos cuyo
   * Cognitive Decay Score sea inferior al threshold configurado.
   */
  pruneDecayedMemories(decayThreshold: number): Promise<number>;

  /**
   * Busca incoherencias y nodos redundantes en el Grafo de Conocimiento,
   * procediendo a la fusión de entidades redundantes.
   */
  optimizeKnowledgeGraph(): Promise<void>;
}

export interface IEvolutionReport {
  timestamp: Date;
  patternsStrengthened: number;
  lessonsLearnedCount: number;
  redundantNodesFused: number;
  memoryBytesPruned: number;
}
