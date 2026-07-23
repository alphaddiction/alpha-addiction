import { IAiProvider } from './base-provider';
import { OpenAiProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';

export class AiProviderFactory {
  static getProvider(providerName: string): IAiProvider {
    switch (providerName?.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      case 'openai':
      default:
        return new OpenAiProvider();
    }
  }
}
