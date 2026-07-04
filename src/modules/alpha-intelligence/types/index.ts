export interface AiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
  model?: string | null;
  latencyMs?: number | null;
  contextPath?: string | null;
  createdAt: Date;
}

export interface AiConversation {
  id: string;
  project: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: AiMessage[];
}

export interface AiProviderConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  tools?: any[]; // Array of tool declarations
}

export interface AiResponse {
  content: string;
  latencyMs: number;
  model: string;
  error?: string;
  confidence?: number;
  toolCalls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}
