import { db } from '@/backend/database/db';
import { SecurityLayer } from '@/core/identity/security-layer';

export interface CoreLogEntry {
  conversationId: string;
  projectId: string;
  provider: string;
  model: string;
  latencyMs: number;
  toolsUsed: string[];
  success: boolean;
  error?: string | null;
}

export class LoggingEngine {
  /**
   * Registra una auditoría detallada de la ejecución de Alpha Core en la base de datos.
   */
  static async logExecution(entry: CoreLogEntry): Promise<void> {
    try {
      // Sanitizamos el log por seguridad antes de escribirlo
      const sanitizedEntry = SecurityLayer.sanitizeOutput(entry);

      await db.auditLog.create({
        data: {
          action: 'AI_CORE_EXECUTE',
          details: JSON.stringify({
            conversationId: sanitizedEntry.conversationId,
            projectId: sanitizedEntry.projectId,
            provider: sanitizedEntry.provider,
            model: sanitizedEntry.model,
            durationMs: sanitizedEntry.latencyMs,
            tools: sanitizedEntry.toolsUsed,
            success: sanitizedEntry.success,
            error: sanitizedEntry.error || null,
            timestamp: new Date().toISOString()
          })
        }
      });
      console.log(`🤖 [Alpha Core Log] Processed in ${entry.latencyMs}ms. Provider: ${entry.provider}. Success: ${entry.success}`);
    } catch (err) {
      console.error('❌ [LoggingEngine] Failed to write core execute audit log:', err);
    }
  }
}
