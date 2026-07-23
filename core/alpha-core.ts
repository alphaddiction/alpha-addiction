import { AlphaCoreConfigManager } from '@/core/config';
import { ProjectLayer } from '@/core/identity/project-layer';
import { SecurityLayer } from '@/core/identity/security-layer';
import { ContextEngine, RouteContextData } from '@/core/context/context-engine';
import { MemoryEngine } from '@/core/memory/memory-engine';
import { SkillManager } from '@/core/goals/skill-manager';
import { PromptBuilder } from '@/core/personality/prompt-builder';
import { LoggingEngine } from '@/core/knowledge/logging-engine';
import { DecisionEngine } from '@/core/reasoning/decision-engine';
import { PersonalityEngine } from '@/core/personality/personality-engine';
import { ReasoningEngine } from '@/core/reasoning/reasoning-engine';
import { AiProviderFactory } from '@/core/identity/providers/factory';
import { AlphaAddictionConnector } from '@/core/reasoning/connectors/alpha-addiction-connector';
import { AiProviderConfig, AiResponse } from '@/shared/types/ai';
import { db } from '@/backend/database/db';

export class AlphaCore {
  private memory: MemoryEngine;
  private connector: AlphaAddictionConnector;

  constructor() {
    this.memory = new MemoryEngine();
    this.connector = new AlphaAddictionConnector();
  }

  /**
   * Carga la configuración del proveedor de IA (mantenido por compatibilidad externa).
   */
  private async getProviderConfig(): Promise<AiProviderConfig> {
    try {
      const records = await db.systemSetting.findMany({
        where: {
          key: {
            in: [
              'ai_provider',
              'ai_model',
              'ai_temperature',
              'ai_max_tokens',
              'ai_api_key'
            ]
          }
        }
      });

      const settings = records.reduce((acc, r) => {
        acc[r.key] = r.value;
        return acc;
      }, {} as Record<string, string>);

      const provider = settings['ai_provider'] || process.env.AI_PROVIDER || 'openai';
      const model = settings['ai_model'] || process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o');
      const temperature = parseFloat(settings['ai_temperature'] || process.env.AI_TEMPERATURE || '0.7');
      const maxTokens = parseInt(settings['ai_max_tokens'] || process.env.AI_MAX_TOKENS || '2048', 10);
      
      let apiKey = settings['ai_api_key'] || '';
      if (!apiKey) {
        apiKey = provider === 'gemini' 
          ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || '') 
          : (process.env.OPENAI_API_KEY || '');
      }
 
      return {
        provider,
        model,
        temperature,
        maxTokens,
        apiKey
      };
    } catch (_) {
      const provider = process.env.AI_PROVIDER || 'openai';
      return {
        provider,
        model: process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
        apiKey: provider === 'gemini' 
          ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || '') 
          : (process.env.OPENAI_API_KEY || '')
      };
    }
  }

  /**
   * Punto de entrada principal para procesar consultas de usuarios coordinando
   * todos los submódulos de Alpha Core.
   */
  async processRequest(
    conversationId: string,
    rawUserMessage: string,
    routeContext?: RouteContextData | null,
    contextPath?: string,
    adminName = 'Alberto',
    adminRole = 'admin',
    projectId = 'alpha-addiction'
  ): Promise<AiResponse> {
    const startTime = performance.now();
    const config = await AlphaCoreConfigManager.getConfig();
    const aiConfig = await this.getProviderConfig();

    const toolsUsed: string[] = [];
    let success = true;
    let errorMsg: string | null = null;

    // Desviar al Reasoning Engine si está activo en la base de datos
    try {
      const reasoningSetting = await db.systemSetting.findUnique({
        where: { key: 'ai_reasoning_enabled' }
      });
      if (reasoningSetting?.value === 'true') {
        return await ReasoningEngine.executeReasoning(
          conversationId,
          rawUserMessage,
          routeContext || null,
          contextPath,
          adminRole,
          projectId
        );
      }
    } catch (routeErr) {
      console.warn('⚠️ [AlphaCore] Failed to evaluate reasoning engine switch:', routeErr);
    }

    try {
      // 1. Capa de Seguridad (Sanitizar entrada)
      const userMessageContent = config.securityEnabled
        ? SecurityLayer.sanitizeInput(rawUserMessage)
        : rawUserMessage;

      // 2. Motor de Memoria (Cargar historial)
      let history: any[] = [];
      if (config.memoryEnabled) {
        const storedMessages = await this.memory.loadConversationalHistory(conversationId);
        history = storedMessages.map((m) => ({
          role: m.role,
          content: m.content,
          toolCallId: m.toolCallId || undefined,
          name: m.name || undefined,
          toolCalls: m.toolCalls || undefined
        }));
      }

      // Guardar mensaje de usuario en base de datos si está activo
      if (config.memoryEnabled) {
        await this.memory.saveMessage(conversationId, 'user', userMessageContent, {
          contextPath
        });
      }

      // Evitar duplicados en el payload enviado al LLM
      const lastMsg = history[history.length - 1];
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessageContent) {
        history.push({ role: 'user', content: userMessageContent });
      }

      // 3. Motor de Contexto
      let contextString = '';
      if (config.contextEnabled) {
        const systemSummary = await this.connector.getSystemSummary();
        const routeContextObj = ContextEngine.buildContext(
          projectId,
          adminName,
          adminRole,
          routeContext,
          contextPath
        );
        contextString = ContextEngine.formatContextToString(routeContextObj, systemSummary);
      }

      // 4. Gestor de Habilidades (Skills)
      let activeTools: any[] = [];
      if (config.skillsEnabled) {
        activeTools = await SkillManager.getAvailableSkills(adminRole);
      }

      // 5. Motor de Personalidad & Constructor de Prompts
      let systemPrompt = '';
      if (config.personalityEnabled) {
        const personalityPrompt = PersonalityEngine.getPersonalityPrompt({
          name: 'Alpha'
        });
        
        const toolsDeclarations = activeTools.map(
          (t) => `[${t.name}]: ${t.description}. Parámetros: ${JSON.stringify(t.parameters)}`
        );

        systemPrompt = PromptBuilder.buildSystemPrompt(
          personalityPrompt,
          contextString,
          toolsDeclarations
        );
      } else {
        systemPrompt = contextString;
      }

      // 6. Capa del Proveedor de IA
      const provider = AiProviderFactory.getProvider(aiConfig.provider);

      // Evaluar estrategia inteligente en Decision Engine (Preparación)
      const strategy = DecisionEngine.evaluateExecutionStrategy(
        systemPrompt.length,
        activeTools.length,
        aiConfig.provider
      );

      // 7. Loop de ejecución de herramientas (Function Calling)
      let aiResponse = await provider.generateResponse(systemPrompt, history, {
        ...aiConfig,
        model: strategy.modelSuggestion || aiConfig.model,
        temperature: strategy.temperatureSuggestion || aiConfig.temperature,
        tools: activeTools
      });

      let loopCount = 0;
      const maxLoops = 3;

      while (aiResponse.toolCalls && aiResponse.toolCalls.length > 0 && loopCount < maxLoops) {
        loopCount++;

        history.push({
          role: 'assistant',
          content: aiResponse.content || '',
          toolCalls: aiResponse.toolCalls
        });

        for (const tc of aiResponse.toolCalls) {
          toolsUsed.push(tc.function.name);
          const toolStartTime = performance.now();
          let result: any;
          let toolError: string | undefined = undefined;

          try {
            let parsedArgs = tc.function.arguments;
            if (typeof parsedArgs === 'string') {
              parsedArgs = JSON.parse(parsedArgs);
            }
            // Ejecución vía SkillManager controlada por permisos
            result = await SkillManager.executeSkill(tc.function.name, parsedArgs, adminRole);
          } catch (err: any) {
            result = { error: 'No he podido procesar la consulta en este momento.' };
            toolError = err.message || 'Unknown error';
          }

          const toolDuration = Math.round(performance.now() - toolStartTime);

          // Escribir log de auditoría del execute de herramienta
          try {
            await db.auditLog.create({
              data: {
                action: 'AI_TOOL_EXECUTE',
                details: JSON.stringify({
                  tool: tc.function.name,
                  durationMs: toolDuration,
                  success: !toolError,
                  error: toolError || null,
                  args: tc.function.arguments
                })
              }
            });
          } catch (logErr) {
            console.error('Failed to log AI tool execute:', logErr);
          }

          history.push({
            role: 'tool',
            toolCallId: tc.id,
            name: tc.function.name,
            content: typeof result === 'string' ? result : JSON.stringify(result)
          });
        }

        aiResponse = await provider.generateResponse(systemPrompt, history, {
          ...aiConfig,
          tools: activeTools
        });
      }

      // 8. Capa de Seguridad (Sanitizar salida)
      if (config.securityEnabled && aiResponse.content) {
        aiResponse.content = SecurityLayer.sanitizeOutput(aiResponse.content);
      }

      // 9. Guardar respuesta del asistente en memoria
      if (config.memoryEnabled && !aiResponse.error) {
        await this.memory.saveMessage(conversationId, 'assistant', aiResponse.content, {
          model: aiResponse.model,
          latencyMs: aiResponse.latencyMs,
          contextPath
        });
      }

      return aiResponse;

    } catch (err: any) {
      success = false;
      errorMsg = err.message || 'Error desconocido del núcleo';
      console.error('❌ [AlphaCore Error]:', err);
      return {
        content: 'Error: Alpha Core no pudo procesar tu solicitud debido a una falla interna de coordinación.',
        latencyMs: 0,
        model: 'unknown',
        error: errorMsg || 'Core Failure'
      };
    } finally {
      // 10. Motor de Logs
      if (config.loggingEnabled) {
        const duration = Math.round(performance.now() - startTime);
        await LoggingEngine.logExecution({
          conversationId,
          projectId,
          provider: aiConfig.provider,
          model: aiConfig.model,
          latencyMs: duration,
          toolsUsed,
          success,
          error: errorMsg
        });
      }
    }
  }

  /**
   * Genera un saludo inteligente y personalizado utilizando el contexto y
   * la identidad elegantes de Alpha.
   */
  async generateSystemGreeting(adminName = 'Alberto', adminRole = 'admin', projectId = 'alpha-addiction'): Promise<string> {
    try {
      const config = await AlphaCoreConfigManager.getConfig();
      const aiConfig = await this.getProviderConfig();

      if (!config.enabled) {
        return `Hola ${adminName}. He revisado el sistema de Alpha Addiction y se encuentra en línea. ¿En qué puedo ayudarte hoy?`;
      }

      const systemSummary = await this.connector.getSystemSummary();
      const provider = AiProviderFactory.getProvider(aiConfig.provider);

      const greetingPrompt = `Genera un saludo inicial dinámico, sumamente elegante, humano y conciso para el administrador "${adminName}" (Rol: "${adminRole}").
Revisa las métricas de estado actual y haz un brevísimo resumen fluido en un par de párrafos cortos.
No uses viñetas ni guiones.

Métricas actuales:
- Facturación: ${systemSummary.totalRevenue}
- Pedidos totales: ${systemSummary.totalOrdersCount}
- Pedidos hoy: ${systemSummary.todayOrdersCount}
- Soporte: ${systemSummary.openTicketsCount} tickets abiertos
- Alertas de salud del sistema: ${systemSummary.healthAlertsCount}
- Waitlist: ${systemSummary.waitlistCount} registros`;

      const aiResponse = await provider.generateResponse(
        config.personalityEnabled ? PersonalityEngine.getPersonalityPrompt({ name: 'Alpha' }) : 'Eres Alpha.',
        [{ role: 'user', content: greetingPrompt }],
        { ...aiConfig, temperature: 0.8, maxTokens: 400 }
      );

      return aiResponse.content;
    } catch (err) {
      console.error('❌ [AlphaCore smart greeting failed]:', err);
      return `Hola Alberto.\n\nHe revisado el sistema de Alpha Addiction y se encuentra en línea. ¿En qué puedo ayudarte hoy?`;
    }
  }
}
