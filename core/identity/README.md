# Identity Subsystem (/core/identity)

Este módulo gestiona la definición, roles, secretos y la capa de traducción de los proveedores de LLM de Alpha.

## Estructura

*   **`security-layer.ts`**: Sanitizador de datos sensibles de la interacción.
*   **`project-layer.ts`**: Adaptabilidad multi-marca para el asistente de IA.
*   **`providers/`**: Traductores REST nativos para APIs externas.
    *   `base-provider.ts`: Contrato de integración `IAiProvider`.
    *   `openai-provider.ts`: Cliente REST crudo para OpenAI.
    *   `gemini-provider.ts`: Cliente REST crudo para Google Gemini.
    *   `factory.ts`: Resolutor e instanciador dinámico según configuraciones.
