import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const settings = [
    { key: 'ai_enabled', value: 'true', description: 'Enable Alpha Intelligence assistant' },
    { key: 'ai_provider', value: 'gemini', description: 'AI LLM provider' },
    { key: 'ai_model', value: 'gemini-2.5-flash', description: 'AI model name' },
    { key: 'ai_temperature', value: '0.7', description: 'AI model creativity temperature' },
    { key: 'ai_max_tokens', value: '2048', description: 'AI max completion tokens' },
    { key: 'ai_api_key', value: '', description: 'Custom overriding API key' },
    { key: 'ai_tool_orders', value: 'true', description: 'Enable Orders Tool' },
    { key: 'ai_tool_customers', value: 'true', description: 'Enable Customers Tool' },
    { key: 'ai_tool_finance', value: 'true', description: 'Enable Finance Tool' },
    { key: 'ai_tool_health', value: 'true', description: 'Enable Health Tool' },
    { key: 'ai_tool_notifications', value: 'true', description: 'Enable Notifications Tool' },
    { key: 'ai_tool_mission_control', value: 'true', description: 'Enable Mission Control Tool' },
    
    // Alpha Core variables
    { key: 'ai_core_enabled', value: 'true', description: 'Enable Alpha Core brain coordination' },
    { key: 'ai_core_personality_enabled', value: 'true', description: 'Enable Personality Engine styling' },
    { key: 'ai_core_context_enabled', value: 'true', description: 'Enable Context Engine dynamic prompts' },
    { key: 'ai_core_memory_enabled', value: 'true', description: 'Enable Memory Engine conversation trace' },
    { key: 'ai_core_logging_enabled', value: 'true', description: 'Enable Logging Engine execution telemetries' },
    { key: 'ai_core_security_enabled', value: 'true', description: 'Enable Security Layer input/output scrubbing' },
    { key: 'ai_core_skills_enabled', value: 'true', description: 'Enable Skill Manager dispatch checks' },
    { key: 'ai_core_events_enabled', value: 'true', description: 'Enable Event Engine queue broker' },
    { key: 'ai_core_scheduler_enabled', value: 'true', description: 'Enable Scheduler background jobs' },
    
    // Alpha Reasoning variables
    { key: 'ai_reasoning_enabled', value: 'true', description: 'Enable Reasoning Engine' },
    { key: 'ai_reasoning_planner_enabled', value: 'true', description: 'Enable Planner tool routing' },
    { key: 'ai_reasoning_cache_enabled', value: 'true', description: 'Enable Cache Engine' },
    { key: 'ai_reasoning_confidence_enabled', value: 'true', description: 'Enable Confidence Engine scoring' },
    { key: 'ai_reasoning_debug_enabled', value: 'true', description: 'Enable Debug Mode collapsible' },
    { key: 'ai_reasoning_timeout_enabled', value: 'true', description: 'Enable timeout boundaries per tool' },
    { key: 'ai_reasoning_chaining_enabled', value: 'true', description: 'Enable Tool Chaining dependency execution' }
  ];

  for (const s of settings) {
    const exists = await db.systemSetting.findUnique({ where: { key: s.key } });
    if (!exists) {
      await db.systemSetting.create({
        data: { key: s.key, value: s.value, description: s.description }
      });
    }
  }

  console.log('✅ Alpha & Core settings configured in DB successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => {
  db.$disconnect();
});
