import { DbMemoryManager } from '@/core/memory/db-memory';
import { AiConversation, AiMessage } from '@/shared/types/ai';

export interface MemoryTier {
  version: string;
  name: string;
  implemented: boolean;
}

export class MemoryEngine {
  private dbMemory: DbMemoryManager;
  
  // Detalle de la evolución de la memoria en la arquitectura Alpha Core
  static readonly TIERS: MemoryTier[] = [
    { version: 'v1', name: 'Historial de Conversación Relacional', implemented: true },
    { version: 'v2', name: 'Memoria Temporal (Sesiones Cortas)', implemented: false },
    { version: 'v3', name: 'Memoria Contextual (Entidades Recientes)', implemented: false },
    { version: 'v4', name: 'Memoria entre Proyectos (Ecosistema)', implemented: false },
    { version: 'v5', name: 'Memoria Permanente (Vectorial/RAG)', implemented: false }
  ];

  constructor() {
    this.dbMemory = new DbMemoryManager();
  }

  /**
   * Carga el historial de conversación (Memoria v1)
   */
  async loadConversationalHistory(conversationId: string): Promise<AiMessage[]> {
    const conversation = await this.dbMemory.getConversation(conversationId);
    return conversation?.messages || [];
  }

  /**
   * Registra un mensaje en la memoria conversacional
   */
  async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      model?: string | null;
      latencyMs?: number | null;
      contextPath?: string | null;
    }
  ): Promise<AiMessage> {
    return await this.dbMemory.addMessage(conversationId, role, content, metadata);
  }

  /**
   * Hooks/mecanismos preparados para las futuras versiones de memoria
   */
  async getTemporalMemory(conversationId: string): Promise<Record<string, any>> {
    // Reservado para v2 (por ejemplo, variables temporales de sesión corta)
    return {};
  }

  async getContextualMemory(projectId: string, entityId: string): Promise<Record<string, any>> {
    // Reservado para v3 (entidades vistas recientemente o guardadas en caché)
    return {};
  }

  async getPermanentMemory(userId: string): Promise<string[]> {
    // Reservado para v5 (hechos permanentes recordados del usuario a largo plazo)
    return [];
  }
}
