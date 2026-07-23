# AI ABSTRACTION - Independencia Tecnológica de Proveedores LLM

## Capa de Abstracción de IA (AI Layer)

Para que Alpha no dependa de ningún proveedor comercial de modelos de lenguaje (OpenAI, Anthropic, Google, Llama local), se sitúa una capa de abstracción estricta en `/core/ai-layer/`.

El cerebro cognitivo de Alpha (`BrainOS`) nunca sabe qué modelo físico está ejecutando la inferencia. Toda comunicación se realiza a través de interfaces normalizadas.

---

## Contrato de Integración

Toda integración de LLM debe implementar la interfaz unificada:

```typescript
interface IAiModelProvider {
  providerName: string;        // Nombre del proveedor (ej. 'google_gemini')
  activeModelName: string;     // Identificador del modelo (ej. 'gemini-2.5-flash')
  
  // Solicitud de completado de chat estructurado
  generateChatCompletion(
    messages: IAiChatMessage[],
    options?: IAiCompletionOptions
  ): Promise<IAiModelResponse>;

  // Generación de vectores de características para RAG y Búsqueda Semántica
  generateEmbeddings(text: string): Promise<number[]>;
}
```

---

## Mapeo de Herramientas (Capabilities Mapping)

Si un modelo admite Native Tool Calling (llamadas a herramientas nativas) y otro no (modelos más pequeños o locales):
*   La capa de abstracción de IA traduce la estructura de parámetros de `ICapability` a la firma esperada del modelo nativo (por ejemplo, Tool Definitions de OpenAI o Gemini).
*   Si el modelo no soporta herramientas nativas, el `AiLayer` simula el comportamiento encapsulando la definición de herramientas en el prompt del sistema y parseando la salida JSON de forma segura en local.
