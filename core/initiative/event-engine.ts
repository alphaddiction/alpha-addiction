export interface AiSystemEvent {
  id: string;
  type: 'order_created' | 'customer_registered' | 'ticket_urgent' | 'system_error' | 'drop_live' | 'waitlist_join';
  projectId: string;
  title: string;
  payload: any;
  createdAt: Date;
}

export class EventEngine {
  private static eventLog: AiSystemEvent[] = [];

  /**
   * Dispara un evento interno en el sistema Alpha Core.
   */
  static emit(event: Omit<AiSystemEvent, 'id' | 'createdAt'>): AiSystemEvent {
    const fullEvent: AiSystemEvent = {
      ...event,
      id: `evt_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date()
    };

    this.eventLog.push(fullEvent);
    console.log(`🔔 [Alpha Core Event] Emitted type: "${fullEvent.type}" in project: "${fullEvent.projectId}"`);
    
    // Aquí es donde en el futuro se conectarán las automatizaciones o alarmas proactivas
    
    return fullEvent;
  }

  /**
   * Recupera el historial de eventos registrados recientemente.
   */
  static getRecentEvents(limit = 50): AiSystemEvent[] {
    return this.eventLog.slice(-limit).reverse();
  }
}
