# Core Cognitive System (/core)

Este es el cerebro del ecosistema. Contiene el orquestador principal y los motores cognitivos independientes que dotan a Alpha de razonamiento, memoria, contexto, conocimientos, iniciativa y personalidad.

## Estructura de Directorios

*   **`alpha-core.ts`**: El director de orquesta maestro. Recibe la petición y coordina de forma secuencial la participación de cada motor cognitivo para procesar la petición y persistir la auditoría.
*   **`orchestrator.ts`**: Capa superior de envoltura de Alpha Core para llamadas directas desde las aplicaciones clientes.
*   **`config.ts`**: Ajustes dinámicos de los motores de la IA controlados por base de datos.
*   **`identity/`**: Configuración de identidad del asistente y proveedores de LLMs.
    *   `security-layer.ts`: Enmascaramiento y anonimización de datos privados del cliente (teléfonos, emails, secretos, headers de autenticación).
    *   `project-layer.ts`: Gestión de variables de contexto multi-proyecto (Alpha Addiction, Foedus, etc.).
    *   `providers/`: Capa abstracta REST para proveedores (OpenAI, Gemini).
*   **`memory/`**: Capa conversacional e historial.
    *   `memory-engine.ts`: Coordinador de los 5 niveles de memoria.
    *   `memory-manager.ts`: Recuperación de historial y resúmenes conversacionales.
    *   `db-memory.ts`: Persistencia física relacional de chats en PostgreSQL.
*   **`reasoning/`**: Razonamiento, planificación lógica y ejecución de herramientas.
    *   `reasoning-engine.ts`: Motor de decisión lógico y orquestación de prompts.
    *   `intent-analyzer.ts`: Clasificador predictivo de intenciones del usuario.
    *   `planner.ts`: Generador de planes y secuencias de herramientas.
    *   `skill-pipeline.ts`: Secuenciador y controlador de llamadas REST concurrentes de herramientas.
    *   `decision-engine.ts`: Selección dinámica del LLM y parámetros.
    *   `tools/` y `connectors/`: Capabilities (órdenes, finanzas, stock) y conectores de lectura.
*   **`initiative/`**: Proactividad e inicio autónomo.
    *   `event-engine.ts`: Monitoreo y escucha activa de eventos del backend para proponer acciones o lanzar alertas al administrador.
*   **`personality/`**: Guías de estilo, tono de lujo y Prompt Builder.
    *   `personality-engine.ts`: Forzado del tono refinado y sobrio de una marca de lujo.
    *   `prompt-builder.ts`: Ensamblado en tiempo real del prompt definitivo (Personalidad + Contexto + Grafo RAG + Reglas).
*   **`voice/`**: Procesamiento de audio bidireccional.
*   **`goals/`**: Sistema de objetivos.
    *   `skill-manager.ts`: Resolución de tareas complejas delegando en herramientas autorizadas por el rol del administrador.
*   **`context/`**: Información operativa del sistema.
    *   `context-engine.ts`: Variables contextuales de la sesión (Rol, administrador activo, entidad visualizada).
    *   `detector.ts`: Escucha activa de cambios de ruta del administrador.
*   **`knowledge/`**: Grafo de conocimiento y RAG relacional.
    *   `knowledge-manager.ts`: Operaciones de vecindad de grafos (Alpha Brain v1.0).
    *   `academy-manager.ts`: Recuperador de pautas, manuales y procedimientos sembrados en la base de datos (RAG de Academia).
    *   `logging-engine.ts`: Logs inalterables de auditoría técnica (`AI_CORE_EXECUTE`).
