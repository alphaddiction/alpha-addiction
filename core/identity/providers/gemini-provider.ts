import { IAiProvider } from './base-provider';
import { AiProviderConfig, AiResponse } from '@/shared/types/ai';

export class GeminiProvider implements IAiProvider {
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
    const apiKey = config.apiKey || 
      process.env.GEMINI_API_KEY || 
      process.env.GOOGLE_API_KEY || 
      process.env.GOOGLE_AI_API_KEY || 
      '';
    let model = config.model || 'gemini-1.5-flash';
    if (model === 'gemini-1.5-flash') {
      model = 'gemini-flash-latest';
    }

    if (!apiKey) {
      return {
        content: '⚠️ Error: API Key de Gemini no configurada.',
        latencyMs: 0,
        model,
        error: 'Missing API Key'
      };
    }

    try {
      const safeParse = (str: string) => {
        try {
          return JSON.parse(str);
        } catch (_) {
          return str;
        }
      };

      const contents: any[] = [];
      for (const m of messages) {
        if (m.role === 'tool' || m.role === 'function') {
          contents.push({
            role: 'function',
            parts: [{
              functionResponse: {
                name: m.name || '',
                response: { result: typeof m.content === 'string' ? safeParse(m.content) : m.content }
              }
            }]
          });
        } else if (m.role === 'assistant') {
          const parts: any[] = [];
          if (m.content) {
            parts.push({ text: m.content });
          }
          if (m.toolCalls) {
            for (const tc of m.toolCalls) {
              parts.push({
                functionCall: {
                  name: tc.function.name,
                  args: safeParse(tc.function.arguments)
                }
              });
            }
          }
          contents.push({
            role: 'model',
            parts
          });
        } else {
          contents.push({
            role: 'user',
            parts: [{ text: m.content }]
          });
        }
      }

      // Si no hay mensajes, Gemini requiere al menos uno para no dar error
      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: 'Hola' }] });
      }

      const bodyPayload: any = {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 2048
        }
      };

      if (config.tools && config.tools.length > 0) {
        bodyPayload.tools = [{
          functionDeclarations: config.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }))
        }];
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify(bodyPayload)
        }
      );

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);

        let friendlyMessage = `⚠️ Error al conectar con el motor de IA (Código: ${response.status}).`;
        let errorDetails = '';
        try {
          const errObj = JSON.parse(errorText);
          errorDetails = errObj.error?.message || errorText;
          const status = response.status;
          if (status === 400 || status === 404) {
            friendlyMessage = `⚠️ Error: El modelo de IA "${model}" no existe o no es compatible con la API de Google (Código: ${status}).`;
          } else if (status === 403) {
            friendlyMessage = `⚠️ Error: Clave de API inválida, inactiva o sin permisos para el proyecto (Código: ${status}).`;
          } else if (status === 429) {
            friendlyMessage = `⚠️ Error: Límite de cuota superado o demasiadas peticiones en curso (Código: ${status}).`;
          }
        } catch (_) {
          errorDetails = errorText;
        }

        return {
          content: friendlyMessage,
          latencyMs,
          model,
          error: `Gemini returned status ${response.status}: ${errorDetails}`
        };
      }

      const data = await response.json();
      const firstCandidate = data.candidates?.[0];
      const parts = firstCandidate?.content?.parts || [];
      let content = '';
      const toolCalls: any[] = [];

      for (const part of parts) {
        if (part.text) {
          content += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call_${Math.random().toString(36).substring(7)}`,
            type: 'function',
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args || {})
            }
          });
        }
      }

      const resObj: any = {
        content: content || (toolCalls.length > 0 ? '' : 'No se recibió respuesta.'),
        latencyMs,
        model
      };

      if (toolCalls.length > 0) {
        resObj.toolCalls = toolCalls;
      }

      return resObj;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      console.error('❌ Gemini request exception:', err);
      return {
        content: '⚠️ Error: No se pudo contactar con el servicio de Gemini.',
        latencyMs,
        model,
        error: err.message || 'Unknown Exception'
      };
    }
  }
}
