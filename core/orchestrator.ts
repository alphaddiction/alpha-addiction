import { AlphaCore } from './alpha-core';
import { AiResponse } from '@/shared/types/ai';

export class AlphaIntelligenceOrchestrator {
  private core: AlphaCore;

  constructor() {
    this.core = new AlphaCore();
  }

  /**
   * Procesa un mensaje del usuario dentro de una conversación delegando en Alpha Core.
   */
  async processUserMessage(
    conversationId: string,
    userMessageContent: string,
    routeContext?: any | null,
    contextPath?: string
  ): Promise<AiResponse> {
    return await this.core.processRequest(
      conversationId,
      userMessageContent,
      routeContext,
      contextPath,
      'Alberto',
      'admin',
      'alpha-addiction'
    );
  }

  /**
   * Genera un saludo dinámico y personalizado delegando en Alpha Core.
   */
  async generateSmartGreeting(adminName = 'Alberto'): Promise<string> {
    return await this.core.generateSystemGreeting(adminName, 'admin', 'alpha-addiction');
  }
}
