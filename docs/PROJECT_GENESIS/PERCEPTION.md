# PERCEPTION ENGINE - Estandarización de Entradas Sensoriales

## Propósito

El **Perception Engine** es la frontera sensorial de Alpha. Su responsabilidad es capturar cualquier fuente de datos (texto del chat, voz del administrador, imágenes de prendas, ficheros adjuntos, eventos del sistema Webhook, eventos de calendario o lecturas de base de datos) y traducirla a un formato común e independiente denominado `IPerceivedEvent`.

---

## Estructura de Salida Estandarizada

Toda señal percibida por Alpha se traduce a la siguiente representación:

```typescript
interface IPerceivedEvent {
  id: string;                  // UUID único de percepción
  timestamp: string;           // Fecha exacta del evento
  source: Perceptionsource;    // 'chat' | 'voice' | 'webhook' | 'system_event' | 'calendar' | 'file'
  rawPayloadSize: number;      // Tamaño original del payload
  semanticContent: string;     // Transcripción textual o representación semántica
  vectorEmbedding?: number[];  // Representación vectorial del evento sensorial
  metadata: Record<string, any>; // Atributos específicos (ej. formato de imagen, origen IP, ID de pedido)
}
```

---

## Ventajas de Desacoplamiento

*   **Independencia del Cerebro**: El orquestador `BrainOS` nunca recibe cabeceras HTTP crudas, flujos binarios multipart o archivos mp3 directamente.
*   **Facilidad de Extensión**: Si se decide añadir un canal de entrada de visión por cámara o sensores de stock físicos, solo se debe construir un traductor en el `PerceptionEngine` que convierta la lectura a un `IPerceivedEvent`.
