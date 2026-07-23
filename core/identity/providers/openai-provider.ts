import { IAiProvider } from './base-provider';
import { AiProviderConfig, AiResponse } from '@/shared/types/ai';

export class OpenAiProvider implements IAiProvider {
  async generateResponse(
    systemPrompt: string,
    messages: {
      role: string;
      content: string;
      name?: string;
      toolCallId?: string;
      toolCalls?: any[];
    }[],
    config: AiProviderConfig
  ): Promise<AiResponse> {
    const startTime = performance.now();
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';

    if (!apiKey) {
      return {
        content: 'Error: API Key de OpenAI no configurada.',
        latencyMs: 0,
        model: config.model || 'unknown',
        error: 'Missing API Key'
      };
    }

    try {
      const formattedMessages: any[] = [];
      if (systemPrompt) {
        formattedMessages.push({ role: 'system', content: systemPrompt });
      }

      for (const m of messages) {
        if (m.role === 'tool') {
          formattedMessages.push({
            role: 'tool',
            tool_call_id: m.toolCallId,
            name: m.name,
            content: m.content
          });
        } else if (m.role === 'assistant' && m.toolCalls) {
          formattedMessages.push({
            role: 'assistant',
            content: m.content || null,
            tool_calls: m.toolCalls
          });
        } else {
          formattedMessages.push({
            role: m.role === 'function' ? 'tool' : m.role,
            content: m.content
          });
        }
      }

      const bodyPayload: any = {
        model: config.model || 'gpt-4o',
        messages: formattedMessages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048
      };

      if (config.tools && config.tools.length > 0) {
        bodyPayload.tools = config.tools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        }));
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', response.status, errorText);
        return {
          content: `Error al conectar con el motor de IA (Código: ${response.status}).`,
          latencyMs,
          model: config.model,
          error: `OpenAI returned status ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message;
      const content = choice?.content || '';
      const toolCalls = choice?.tool_calls;

      return {
        content,
        latencyMs,
        model: data.model || config.model,
        toolCalls: toolCalls
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      console.error('❌ OpenAI request exception:', err);
      return {
        content: 'No se pudo contactar con el servicio de IA.',
        latencyMs,
        model: config.model,
        error: err.message || 'Unknown Exception'
      };
    }
  }
}
