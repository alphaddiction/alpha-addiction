import { AiProviderConfig, AiResponse } from '@/shared/types/ai';

export interface IAiProvider {
  generateResponse(
    systemPrompt: string,
    messages: {
      role: string;
      content: string;
      name?: string;
      toolCallId?: string;
      toolCalls?: any[];
    }[],
    config: AiProviderConfig
  ): Promise<AiResponse>;
}
