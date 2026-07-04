import { db } from '@/lib/db';

export interface AlphaCoreConfig {
  enabled: boolean;
  personalityEnabled: boolean;
  contextEnabled: boolean;
  memoryEnabled: boolean;
  loggingEnabled: boolean;
  securityEnabled: boolean;
  skillsEnabled: boolean;
  eventsEnabled: boolean;
  schedulerEnabled: boolean;
}

export class AlphaCoreConfigManager {
  static async getConfig(): Promise<AlphaCoreConfig> {
    try {
      const records = await db.systemSetting.findMany({
        where: {
          key: {
            startsWith: 'ai_core_'
          }
        }
      });

      const settings = records.reduce((acc, r) => {
        acc[r.key] = r.value === 'true';
        return acc;
      }, {} as Record<string, boolean>);

      return {
        enabled: settings['ai_core_enabled'] !== false, // default true
        personalityEnabled: settings['ai_core_personality_enabled'] !== false,
        contextEnabled: settings['ai_core_context_enabled'] !== false,
        memoryEnabled: settings['ai_core_memory_enabled'] !== false,
        loggingEnabled: settings['ai_core_logging_enabled'] !== false,
        securityEnabled: settings['ai_core_security_enabled'] !== false,
        skillsEnabled: settings['ai_core_skills_enabled'] !== false,
        eventsEnabled: settings['ai_core_events_enabled'] !== false,
        schedulerEnabled: settings['ai_core_scheduler_enabled'] !== false
      };
    } catch (_) {
      // Fallback defaults
      return {
        enabled: true,
        personalityEnabled: true,
        contextEnabled: true,
        memoryEnabled: true,
        loggingEnabled: true,
        securityEnabled: true,
        skillsEnabled: true,
        eventsEnabled: true,
        schedulerEnabled: true
      };
    }
  }
}
