import { db } from '@/backend/database/db';
import { AiConversation, AiMessage } from '@/shared/types/ai';

export class DbMemoryManager {
  /**
   * Obtiene una lista de conversaciones activas ordenadas por actualización.
   */
  async listConversations(project = 'alpha-addiction'): Promise<AiConversation[]> {
    try {
      const records = await db.aiConversation.findMany({
        where: {
          project,
          status: 'active'
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      return records as unknown as AiConversation[];
    } catch (err) {
      console.error('❌ DbMemoryManager.listConversations failed:', err);
      return [];
    }
  }

  /**
   * Obtiene los detalles de una conversación incluyendo su historial de mensajes.
   */
  async getConversation(id: string): Promise<AiConversation | null> {
    try {
      const record = await db.aiConversation.findFirst({
        where: {
          id,
          status: 'active'
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
      return record as unknown as AiConversation | null;
    } catch (err) {
      console.error('❌ DbMemoryManager.getConversation failed:', err);
      return null;
    }
  }

  /**
   * Crea una nueva conversación en el sistema.
   */
  async createConversation(project = 'alpha-addiction', title = 'Nueva conversación'): Promise<AiConversation> {
    try {
      const record = await db.aiConversation.create({
        data: {
          project,
          title,
          status: 'active'
        }
      });
      return record as unknown as AiConversation;
    } catch (err: any) {
      console.error('❌ DbMemoryManager.createConversation failed:', err);
      throw new Error(err.message || 'No se pudo crear la conversación en base de datos.');
    }
  }

  /**
   * Elimina lógicamente una conversación marcándola como 'deleted'.
   */
  async deleteConversation(id: string): Promise<boolean> {
    try {
      await db.aiConversation.update({
        where: { id },
        data: { status: 'deleted' }
      });
      return true;
    } catch (err) {
      console.error('❌ DbMemoryManager.deleteConversation failed:', err);
      return false;
    }
  }

  /**
   * Registra un mensaje de chat en el historial de la conversación.
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      model?: string | null;
      latencyMs?: number | null;
      contextPath?: string | null;
    }
  ): Promise<AiMessage> {
    try {
      // 1. Crear el mensaje
      const record = await db.aiMessage.create({
        data: {
          conversationId,
          role,
          content,
          model: metadata?.model || null,
          latencyMs: metadata?.latencyMs || null,
          contextPath: metadata?.contextPath || null
        }
      });

      // 2. Actualizar el updatedAt de la conversación para ordenación
      await db.aiConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      return record as unknown as AiMessage;
    } catch (err: any) {
      console.error('❌ DbMemoryManager.addMessage failed:', err);
      throw new Error(err.message || 'No se pudo guardar el mensaje en el historial.');
    }
  }
}
