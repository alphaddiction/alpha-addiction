import { db } from '@/backend/database/db';
import { SecurityLayer } from '@/core/identity/security-layer';

export type MemoryType = 'session' | 'preference' | 'decision' | 'recommendation' | 'project';

export interface MemoryData {
  id?: string;
  project: string;
  type: MemoryType;
  key: string;
  value: string;
  importance: number; // 0-100
  expiration?: Date | null;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MemoryManager {
  private static defaultThreshold = 40;

  /**
   * Guarda o actualiza un elemento de memoria en PostgreSQL enmascarando cualquier secreto.
   */
  static async setMemory(data: MemoryData): Promise<MemoryData> {
    // Sanitizar por privacidad
    const cleanValue = SecurityLayer.sanitizeInput(data.value);
    
    // Si la importancia es menor que el umbral configurado, no persistirla
    const threshold = await this.getThresholdConfig();
    if (data.importance < threshold) {
      console.log(`🧠 [MemoryManager] Discarded memory "${data.key}" due to low importance score (${data.importance} < ${threshold})`);
      return data;
    }

    const record = await db.aiMemory.upsert({
      where: { key: data.key },
      create: {
        project: data.project,
        type: data.type,
        key: data.key,
        value: cleanValue,
        importance: data.importance,
        expiration: data.expiration || null,
        metadata: data.metadata ? (data.metadata as any) : null
      },
      update: {
        value: cleanValue,
        importance: data.importance,
        expiration: data.expiration || null,
        metadata: data.metadata ? (data.metadata as any) : null
      }
    });

    console.log(`🧠 [MemoryManager] Saved "${data.type}" memory: "${data.key}" (Importance: ${data.importance})`);
    return {
      ...record,
      metadata: record.metadata || undefined
    } as unknown as MemoryData;
  }

  /**
   * Recupera una memoria por su clave única.
   */
  static async getMemory(key: string): Promise<MemoryData | null> {
    const record = await db.aiMemory.findUnique({ where: { key } });
    if (!record) return null;

    // Verificar si ha caducado
    if (record.expiration && new Date(record.expiration).getTime() < Date.now()) {
      await db.aiMemory.delete({ where: { key } });
      console.log(`🧠 [MemoryManager] Deleted expired memory key: "${key}"`);
      return null;
    }

    return {
      ...record,
      metadata: record.metadata || undefined
    } as unknown as MemoryData;
  }

  /**
   * Elimina una memoria.
   */
  static async deleteMemory(key: string): Promise<boolean> {
    try {
      await db.aiMemory.delete({ where: { key } });
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Recupera memorias relacionadas semánticamente mediante comparación de palabras clave.
   * Deja lista la firma para integraciones futuras con embeddings vectoriales.
   */
  static async retrieveRelevantMemories(project: string, query: string): Promise<MemoryData[]> {
    const startTime = performance.now();
    try {
      const activeMemories = await db.aiMemory.findMany({
        where: {
          project,
          OR: [
            { expiration: null },
            { expiration: { gt: new Date() } }
          ]
        }
      });

      const cleanQuery = query.toLowerCase().trim();
      const queryTerms = cleanQuery.split(/\s+/).filter((t) => t.length > 3);

      const matched = activeMemories.filter((mem) => {
        const memText = `${mem.key} ${mem.value} ${mem.type}`.toLowerCase();
        
        // Coincidencia exacta de términos en la consulta
        if (memText.includes(cleanQuery)) return true;

        // Coincidencia por palabras clave
        return queryTerms.some((term) => memText.includes(term));
      });

      const duration = Math.round(performance.now() - startTime);
      console.log(`🧠 [MemoryManager] Retrieved ${matched.length} memories in ${duration}ms for query "${query}"`);

      // Registrar auditoría de búsqueda semántica
      try {
        await db.auditLog.create({
          data: {
            action: 'AI_MEMORY_RETRIEVE',
            details: JSON.stringify({
              query,
              resultsCount: matched.length,
              durationMs: duration
            })
          }
        });
      } catch (_) {}

      return matched.map((m) => ({
        ...m,
        metadata: m.metadata || undefined
      })) as unknown as MemoryData[];
    } catch (err) {
      console.error('❌ Failed to retrieve memories:', err);
      return [];
    }
  }

  /**
   * Clasifica automáticamente un fragmento de conversación e infiere su importancia, tipo y expiración.
   */
  static classifyMemory(text: string, project = 'alpha-addiction'): MemoryData {
    const cleanText = text.toLowerCase().trim();
    let type: MemoryType = 'session';
    let importance = 30; // score base
    let expiration: Date | null = null;

    // Inferencia de tipo por palabras clave
    if (cleanText.includes('prefiere') || cleanText.includes('gusta') || cleanText.includes('idioma') || cleanText.includes('modo')) {
      type = 'preference';
      importance = 80;
    } else if (cleanText.includes('decidimos') || cleanText.includes('decisión') || cleanText.includes('acuerdo') || cleanText.includes('cambiamos') || cleanText.includes('lanzamiento')) {
      type = 'decision';
      importance = 90;
    } else if (cleanText.includes('recomiendo') || cleanText.includes('auditoría') || cleanText.includes('mejorar') || cleanText.includes('sugiero')) {
      type = 'recommendation';
      importance = 70;
    } else if (cleanText.includes('roadmap') || cleanText.includes('drop') || cleanText.includes('arquitectura')) {
      type = 'project';
      importance = 75;
    }

    // Configurar caducidad según el tipo
    if (type === 'session') {
      expiration = new Date(Date.now() + 1800000); // Caduca en 30 minutos
    }

    // Crear clave en base a hash simple o contenido descriptivo corto
    const cleanKey = cleanText.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    const key = `mem:${project}:${type}:${cleanKey}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      project,
      type,
      key,
      value: text,
      importance,
      expiration
    };
  }

  /**
   * Proceso periódico (Scheduler) para consolidar y limpiar memorias expiradas.
   */
  static async consolidateMemories(): Promise<{ expiredCleaned: number }> {
    try {
      const res = await db.aiMemory.deleteMany({
        where: {
          expiration: {
            lt: new Date()
          }
        }
      });
      console.log(`🧹 [MemoryManager] Consolidator deleted ${res.count} expired memory records.`);
      return { expiredCleaned: res.count };
    } catch (err) {
      console.error('❌ [MemoryManager] Consolidation failed:', err);
      return { expiredCleaned: 0 };
    }
  }

  /**
   * Obtiene el umbral mínimo de importancia configurado en la base de datos.
   */
  private static async getThresholdConfig(): Promise<number> {
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: 'ai_memory_threshold' }
      });
      return setting ? parseInt(setting.value, 10) : this.defaultThreshold;
    } catch (_) {
      return this.defaultThreshold;
    }
  }
}
