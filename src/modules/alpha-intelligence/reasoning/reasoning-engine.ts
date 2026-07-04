import { db } from '@/lib/db';
import { IntentAnalyzer } from './intent-analyzer';
import { Planner } from './planner';
import { SkillPipeline, PipelineResult } from './skill-pipeline';
import { CacheEngine } from './cache-engine';
import { ConfidenceEngine } from './confidence-engine';
import { ContextOptimizer } from './context-optimizer';
import { TokenManager } from './token-manager';
import { PromptBuilder } from '../core/prompt-builder';
import { PersonalityEngine } from '../core/personality-engine';
import { AiProviderFactory } from '../providers/factory';
import { SecurityLayer } from '../core/security-layer';
import { LoggingEngine } from '../core/logging-engine';
import { ContextEngine, RouteContextData } from '../core/context-engine';
import { AiProviderConfig, AiResponse } from '../types';

export interface ReasoningConfig {
  enabled: boolean;
  plannerEnabled: boolean;
  cacheEnabled: boolean;
  confidenceEnabled: boolean;
  debugEnabled: boolean;
  timeoutEnabled: boolean;
  chainingEnabled: boolean;
}

export class ReasoningEngine {
  /**
   * Obtiene la configuración del motor de razonamiento desde SystemSettings.
   */
  static async getConfig(): Promise<ReasoningConfig> {
    try {
      const records = await db.systemSetting.findMany({
        where: { key: { startsWith: 'ai_reasoning_' } }
      });

      const settings = records.reduce((acc, r) => {
        acc[r.key] = r.value === 'true';
        return acc;
      }, {} as Record<string, boolean>);

      return {
        enabled: settings['ai_reasoning_enabled'] !== false,
        plannerEnabled: settings['ai_reasoning_planner_enabled'] !== false,
        cacheEnabled: settings['ai_reasoning_cache_enabled'] !== false,
        confidenceEnabled: settings['ai_reasoning_confidence_enabled'] !== false,
        debugEnabled: settings['ai_reasoning_debug_enabled'] !== false,
        timeoutEnabled: settings['ai_reasoning_timeout_enabled'] !== false,
        chainingEnabled: settings['ai_reasoning_chaining_enabled'] !== false
      };
    } catch (_) {
      return {
        enabled: true,
        plannerEnabled: true,
        cacheEnabled: true,
        confidenceEnabled: true,
        debugEnabled: true,
        timeoutEnabled: true,
        chainingEnabled: true
      };
    }
  }

  /**
   * Carga la configuración básica del proveedor IA.
   */
  private static async getProviderConfig(): Promise<AiProviderConfig> {
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
   * Ejecuta el pipeline completo de razonamiento lógico antes de interrogar al LLM.
   */
  static async executeReasoning(
    conversationId: string,
    query: string,
    routeContext: RouteContextData | null,
    contextPath?: string,
    adminRole = 'admin',
    projectId = 'alpha-addiction'
  ): Promise<AiResponse> {
    const startTime = Date.now();
    const config = await this.getConfig();
    const aiConfig = await this.getProviderConfig();

    let cacheHit = false;
    let confidenceScore = 100;
    let intentsFound: any[] = [];
    let reasoningSteps: string[] = [];
    let selectedSkills: string[] = [];
    let pipelineResults: PipelineResult[] = [];

    // Guardar mensaje de usuario en base de datos
    try {
      await db.aiMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: query,
          contextPath
        }
      });
      await db.aiConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
    } catch (saveErr) {
      console.error('⚠️ [ReasoningEngine] Failed to save user message to PostgreSQL:', saveErr);
    }

    // Detección automática de oportunidades de aprendizaje (Learning Opportunities Detector)
    const lowerQuery = query.toLowerCase().trim();
    const learningTriggers = ['recuerda que', 'a partir de ahora', 'decisión:', 'esto es una regla'];
    if (learningTriggers.some(trigger => lowerQuery.includes(trigger))) {
      try {
        const autoDetectSetting = await db.systemSetting.findUnique({
          where: { key: 'ai_core_academy_autodetect' }
        });
        if (autoDetectSetting?.value !== 'false') {
          let cleanContent = query;
          for (const trigger of learningTriggers) {
            cleanContent = cleanContent.replace(new RegExp(trigger, 'gi'), '');
          }
          cleanContent = cleanContent.replace(/^[:\s,.-]+/, '').trim();
          
          const { AcademyManager } = await import('../academy/academy-manager');
          await AcademyManager.suggestLearningOpportunity(
            projectId,
            'Conversación Administrativa',
            `Regla conversacional detectada automáticamente`,
            cleanContent
          );
        }
      } catch (autoErr) {
        console.warn('⚠️ [ReasoningEngine] Failed to auto-suggest learning opportunity:', autoErr);
      }
    }

    // 1. Capa de Caché
    const cacheKey = `reasoning:${projectId}:${conversationId}:${query.toLowerCase().trim()}`;
    if (config.cacheEnabled) {
      const cached = await CacheEngine.get(cacheKey);
      if (cached) {
        cacheHit = true;
        return {
          content: cached.content,
          latencyMs: Date.now() - startTime,
          model: cached.model || aiConfig.model,
          confidence: cached.confidence
        };
      }
    }

    // 2. Intent Analyzer (Comprensión de intención semántica)
    intentsFound = IntentAnalyzer.analyze(query);

    // 3. Planner (Construir plan de ejecución secuencial de herramientas)
    const plan = Planner.createPlan(query, intentsFound);
    selectedSkills = plan.steps.map((s) => s.toolName);
    reasoningSteps = plan.reasoningSteps;

    // Extraer argumentos implícitos en la query (email y orderNumber)
    const emailMatch = query.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const orderMatch = query.match(/aa-\d{5}/i);

    const queryArgs: any = {};
    if (emailMatch) queryArgs.email = emailMatch[0];
    if (orderMatch) queryArgs.orderNumber = orderMatch[0].toUpperCase();

    // 4. Skill Pipeline (Ejecución controlada de herramientas)
    pipelineResults = await SkillPipeline.execute(selectedSkills, adminRole, queryArgs);

    // 5. Context Optimizer & Confidence Engine
    const optimizedResults = pipelineResults.map((r) => ({
      toolName: r.toolName,
      success: r.success,
      data: ContextOptimizer.optimize(r.result)
    }));

    if (config.confidenceEnabled) {
      const execResults = pipelineResults.map((r) => ({
        toolName: r.toolName,
        success: r.success,
        durationMs: r.durationMs,
        error: r.error
      }));
      confidenceScore = ConfidenceEngine.calculateConfidence(query, execResults, !!routeContext);
    }

    // 6. Ensamblar Prompt Optimizado
    const personalityPrompt = PersonalityEngine.getPersonalityPrompt({ name: 'Alpha' });
    
    // Obtener contexto de ruta
    const activeRouteContext = ContextEngine.buildContext(
      projectId,
      'Alberto',
      adminRole,
      routeContext,
      contextPath
    );
    // Obtener memorias y decisiones históricas del proyecto
    let retrievedKnowledge = '';
    const coreMemorySetting = await db.systemSetting.findUnique({
      where: { key: 'ai_core_memory_enabled' }
    });
    if (coreMemorySetting?.value !== 'false') {
      const { MemoryManager } = await import('../memory/memory-manager');
      const memories = await MemoryManager.retrieveRelevantMemories(projectId, query);
      if (memories.length > 0) {
        retrievedKnowledge = `\n--- CONOCIMIENTO Y DECISIONES RECORDADAS (MEMORIA) ---\n` +
          memories.map((m) => `- [${m.type.toUpperCase()}] ${m.value}`).join('\n') + '\n';
      }
    }

    // Obtener conocimiento del grafo (Knowledge Graph)
    let retrievedGraph = '';
    const coreBrainSetting = await db.systemSetting.findUnique({
      where: { key: 'ai_core_brain_enabled' }
    });
    if (coreBrainSetting?.value !== 'false') {
      try {
        const { KnowledgeManager } = await import('../brain/knowledge-manager');
        retrievedGraph = await KnowledgeManager.buildContextFromGraph(projectId, query);
      } catch (graphErr) {
        console.warn('⚠️ [ReasoningEngine] Failed to retrieve graph context:', graphErr);
      }
    }

    // Obtener pautas y procedimientos de la academia (Academy)
    let retrievedAcademy = '';
    const coreAcademySetting = await db.systemSetting.findUnique({
      where: { key: 'ai_core_academy_enabled' }
    });
    if (coreAcademySetting?.value !== 'false') {
      try {
        const { AcademyManager } = await import('../academy/academy-manager');
        retrievedAcademy = await AcademyManager.retrieveAcademyContext(projectId, query);
      } catch (academyErr) {
        console.warn('⚠️ [ReasoningEngine] Failed to retrieve academy context:', academyErr);
      }
    }

    const contextString = ContextEngine.formatContextToString(
      activeRouteContext,
      {
        reasoningPlan: reasoningSteps,
        confidenceScore: `${confidenceScore}%`,
        pipelineOutputs: optimizedResults
      }
    ) + retrievedKnowledge + retrievedGraph + retrievedAcademy;

    const prompt = PromptBuilder.buildSystemPrompt(
      personalityPrompt,
      contextString,
      selectedSkills.map((s) => `${s} (Datos precargados en el contexto)`)
    );

    // 7. Llamar al proveedor de IA para redactar la respuesta final
    const provider = AiProviderFactory.getProvider(aiConfig.provider);
    
    // Solo cargamos el historial conversacional reciente para ahorrar tokens si está activo
    const recentHistory = await db.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 6
    });
    
    const formattedHistory = recentHistory.reverse().map((m) => ({
      role: m.role as any,
      content: m.content
    }));

    formattedHistory.push({ role: 'user', content: query });

    const aiResponse = await provider.generateResponse(prompt, formattedHistory, {
      ...aiConfig,
      temperature: 0.3 // Temperatura más baja para respuestas precisas basadas en datos
    });

    const latencyMs = Date.now() - startTime;

    // Calcular costes de tokens
    const promptTokens = prompt.length / 4; // Estimación burda de tokens
    const completionTokens = (aiResponse.content || '').length / 4;
    const tokenMetrics = TokenManager.getMetrics(
      promptTokens,
      completionTokens,
      aiResponse.model || aiConfig.model,
      aiConfig.provider
    );

    // 8. Debug Mode para administradores
    let finalContent = aiResponse.content;
    if (config.debugEnabled && adminRole === 'admin') {
      const debugCollapsible = `

<details class="border border-white/10 bg-[#0d0d0d] p-3 text-[9px] font-mono text-[var(--muted)] leading-relaxed mt-6 cursor-pointer">
  <summary class="font-bold text-[#f5f5f0] text-[10px] select-none">🤖 ALPHA CORE REASONING DEBUG</summary>
  <div class="space-y-1.5 mt-2 pt-2 border-t border-white/5">
    <div><strong>Intención Detectada:</strong> ${intentsFound.map((i) => `${i.intent} (${Math.round(i.confidence * 100)}%)`).join(', ')}</div>
    <div><strong>Pasos del Planificador:</strong> ${reasoningSteps.join(' ➔ ')}</div>
    <div><strong>Herramientas Ejecutadas:</strong> ${selectedSkills.join(', ') || 'Ninguna'}</div>
    <div><strong>Score de Confianza:</strong> ${confidenceScore}%</div>
    <div><strong>Tasa de Acierto de Caché:</strong> ${cacheHit ? 'HIT ⚡' : 'MISS ❌'}</div>
    <div><strong>Consumo Estimado:</strong> ${promptTokens.toFixed(0)} prompt tokens, ${completionTokens.toFixed(0)} completion tokens (Coste: $${tokenMetrics.costUSD.toFixed(5)})</div>
    <div><strong>Latencia Total:</strong> ${latencyMs}ms</div>
  </div>
</details>`;
      finalContent += debugCollapsible;
    }

    const cleanedContent = SecurityLayer.sanitizeOutput(finalContent);

    const response: AiResponse = {
      content: cleanedContent,
      latencyMs,
      model: aiResponse.model || aiConfig.model,
      confidence: confidenceScore,
      error: aiResponse.error
    };

    // Guardar respuesta final en memoria conversacional
    await db.aiMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: cleanedContent,
        model: response.model,
        latencyMs,
        contextPath
      }
    });

    // Guardar en la caché de consulta
    if (config.cacheEnabled && !response.error) {
      CacheEngine.set(cacheKey, {
        key: cacheKey,
        data: response,
        createdAt: Date.now()
      });
    }

    // Clasificar y guardar memorias de forma activa si se detectan ganchos explícitos
    if (coreMemorySetting?.value !== 'false') {
      try {
        const { MemoryManager } = await import('../memory/memory-manager');
        const userLower = query.toLowerCase();
        
        if (
          userLower.includes('recuerda:') ||
          userLower.includes('decisión:') ||
          userLower.includes('decidimos:') ||
          userLower.includes('apunta:') ||
          userLower.includes('preferencia:')
        ) {
          const cleanVal = query
            .replace(/^(recuerda:|decisión:|decidimos:|apunta:|preferencia:)/i, '')
            .trim();
          
          if (cleanVal.length > 5) {
            const classified = MemoryManager.classifyMemory(cleanVal, projectId);
            await MemoryManager.setMemory(classified);
          }
        }
      } catch (memErr) {
        console.error('⚠️ [ReasoningEngine] Failed to save runtime memories:', memErr);
      }
    }

    // Registrar auditoría de razonamiento
    try {
      await db.auditLog.create({
        data: {
          action: 'AI_REASONING_EXECUTE',
          details: JSON.stringify({
            conversationId,
            projectId,
            latencyMs,
            confidenceScore,
            cacheHit,
            intents: intentsFound.map((i) => i.intent),
            skills: selectedSkills,
            costUSD: tokenMetrics.costUSD
          })
        }
      });
    } catch (auditErr) {
      console.error('Failed to log reasoning execute:', auditErr);
    }

    return response;
  }
}
