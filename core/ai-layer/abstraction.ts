/**
 * Capa de Abstracción de IA - Desacoplamiento e Independencia de LLM.
 */
export interface IAiChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface IAiCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  toolDefinitions?: IModelToolDefinition[];
}

export interface IModelToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // Estructura JSON Schema
}

export interface IAiModelResponse {
  content: string | null;
  latencyMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: {
    id: string;
    name: string;
    arguments: string; // JSON String
  }[];
}

/**
 * Proveedor Abstracto de Modelos de Lenguaje.
 */
export interface IAiModelProvider {
  providerName: string;
  activeModelName: string;

  /**
   * Genera una respuesta conversacional enriquecida asíncrona.
   */
  generateChatCompletion(
    messages: IAiChatMessage[],
    options?: IAiCompletionOptions
  ): Promise<IAiModelResponse>;

  /**
   * Genera embeddings vectoriales de texto para recuperación semántica (RAG).
   */
  generateEmbeddings(text: string): Promise<number[]>;
}
