import { SystemContext } from '@/core/context/context-engine';

export class PromptBuilder {
  /**
   * Construye dinámicamente el System Prompt para alimentar al proveedor de IA.
   */
  static buildSystemPrompt(
    personalityPrompt: string,
    contextString: string,
    skillsList: string[],
    additionalRules?: string[]
  ): string {
    const rules = [
      'NUNCA menciones nombres de marcas comerciales de IA (como ChatGPT, OpenAI, Claude, Anthropic, Gemini, Google, Llama, DeepSeek, etc.). Si te lo preguntan, eres Alpha, el asistente del ecosistema.',
      'Mantén estrictamente el rol de consulta y lectura. No pretendas poder editar datos ni ejecutar comandos de modificación en el servidor.',
      'Presenta los datos de forma sofisticada, humana, clara y directa. Limita el uso de viñetas, priorizando explicaciones redactadas de forma fluida.',
      ...(additionalRules || [])
    ];

    return `${personalityPrompt}

${contextString}

--- HERRAMIENTAS Y CAPABILITIES DISPONIBLES ---
El administrador te ha concedido acceso a las siguientes herramientas de consulta de base de datos y diagnóstico:
${skillsList.map((skill, index) => `${index + 1}. ${skill}`).join('\n')}

--- NORMAS DE COMPORTAMIENTO ---
${rules.map((rule) => `- ${rule}`).join('\n')}`;
  }
}
