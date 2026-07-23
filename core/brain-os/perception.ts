/**
 * Entrada Sensorial Percibida (Perception Event).
 * 
 * Representa la traducción limpia e independiente de cualquier canal de
 * entrada (chat, voz, webhook, calendario, archivos, sensores).
 */
export interface IPerceivedEvent {
  id: string;                  // UUID único de la percepción
  timestamp: Date;             // Cuándo ocurrió
  source: 'chat' | 'voice' | 'webhook' | 'system_event' | 'calendar' | 'file';
  rawPayloadSize: number;      // En bytes
  semanticContent: string;     // Representación semántica de la entrada
  vectorEmbedding?: number[];  // Opcional, para RAG
  metadata: Record<string, any>; // Atributos extra (ej. formato de imagen, IP origen)
}

/**
 * Interfaz del Perception Engine.
 * 
 * Implementa traductores para canalizar datos binarios u objetos crudos.
 */
export interface IPerceptionEngine {
  translateChatInput(userId: string, text: string): Promise<IPerceivedEvent>;
  translateVoiceInput(userId: string, audioBuffer: Buffer, format: string): Promise<IPerceivedEvent>;
  translateWebhookInput(topic: string, body: Record<string, any>): Promise<IPerceivedEvent>;
  translateFileInput(fileName: string, mimeType: string, contentBuffer: Buffer): Promise<IPerceivedEvent>;
}
