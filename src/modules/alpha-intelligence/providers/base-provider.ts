import { AiProviderConfig, AiResponse } from '../types';

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
