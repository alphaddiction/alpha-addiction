import { IPerceivedEvent } from './perception';
import { IUserProfile } from '../user-model/user-profile';
import { IActionJustification } from '../seed/constitution';

/**
 * Estado Cognitivo Unificado en un Turno Conversacional de Alpha.
 * 
 * Fluye a través del Cognitive Bus y es enriquecido por los diferentes motores
 * (Perception ➔ Experience ➔ User Model ➔ Planner ➔ Behavior Security ➔ Action ➔ Reflection).
 */
export interface ICognitiveState {
  conversationId: string;
  turnId: string;
  perceivedEvent: IPerceivedEvent;
  
  // Monólogo interno e intenciones deducidas
  internalMonologue: string[];
  inferredIntent: string | null;
  uncertaintyScore: number; // 0.0 - 1.0
  
  // Enriquecimientos cognitivos de subsistemas
  experienceContext?: string; // Datos cargados por Experience/Knowledge Graph
  userModelContext?: Partial<IUserProfile>; // Modelo dinámico del usuario
  
  // Plan de acción propuesto por el Planner
  proposedPlan?: ICognitivePlan;
  
  // Validación de seguridad y justificación constitucional
  justification?: IActionJustification;
  isConstitutional: boolean;
  securityVerdict?: 'allow' | 'block' | 'needs_verification';
  
  // Salida generada y reflexiones finales
  outputResponse?: string;
  reflectionNotes?: string;
}

export interface ICognitivePlan {
  steps: {
    sequenceNumber: number;
    capabilityName: string;
    parameters: Record<string, any>;
    requiresAuthorization: boolean;
  }[];
  justification: string;
}

export type CognitiveBusListener = (state: ICognitiveState) => Promise<ICognitiveState> | ICognitiveState;

/**
 * Cognitive Bus Central de Alpha.
 * 
 * Permite la comunicación desacoplada y secuencial de los motores cognitivos del Brain.
 */
export class CognitiveBus {
  private listeners: Map<string, CognitiveBusListener[]> = new Map();

  /**
   * Registra un motor cognitivo para procesar eventos en un canal específico del bus.
   */
  subscribe(channel: string, listener: CognitiveBusListener): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(listener);
  }

  /**
   * Publica un estado en un canal y ejecuta secuencialmente los listeners registrados,
   * permitiendo que modifiquen o enriquezcan el estado cognitivo.
   */
  async publish(channel: string, state: ICognitiveState): Promise<ICognitiveState> {
    const list = this.listeners.get(channel) || [];
    let currentState = { ...state };
    
    for (const listener of list) {
      currentState = await listener(currentState);
    }
    
    return currentState;
  }
}
