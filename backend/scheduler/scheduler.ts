export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  lastRunAt?: Date;
  nextRunAt: Date;
  status: 'idle' | 'running' | 'failed' | 'success';
}

export class Scheduler {
  private static tasks: ScheduledTask[] = [
    {
      id: 'system_health_check',
      name: 'Verificación diaria de salud del ecosistema',
      cronExpression: '0 8 * * *', // Todos los días a las 8:00 AM
      nextRunAt: new Date(Date.now() + 86400000),
      status: 'idle'
    },
    {
      id: 'business_report_anomalies',
      name: 'Análisis nocturno de anomalías de facturación',
      cronExpression: '0 2 * * *', // Todos los días a las 2:00 AM
      nextRunAt: new Date(Date.now() + 43200000),
      status: 'idle'
    }
  ];

  /**
   * Obtiene la lista de tareas programadas.
   */
  static getScheduledTasks(): ScheduledTask[] {
    return this.tasks;
  }

  /**
   * Fuerza la ejecución manual de una tarea de diagnóstico.
   */
  static async forceRunTask(taskId: string): Promise<boolean> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.status = 'running';
    try {
      console.log(`⏱️ [Alpha Scheduler] Executing background task manually: "${task.name}"`);
      // Simular ejecución
      await new Promise((resolve) => setTimeout(resolve, 500));
      task.lastRunAt = new Date();
      task.status = 'success';
      return true;
    } catch (_) {
      task.status = 'failed';
      return false;
    }
  }
}
