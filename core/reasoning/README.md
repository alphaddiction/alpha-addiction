# Reasoning Engine (/core/reasoning)

Este módulo gestiona la lógica de decisión, análisis de intenciones y planeamiento de Alpha.

## Componentes
*   **`reasoning-engine.ts`**: Motor de decisión lógico y enrutador principal de promts de sistema.
*   **`intent-analyzer.ts`**: Clasificación predictiva de la intención del usuario.
*   **`planner.ts`**: Secuenciador y planificador de capacidades (tools).
*   **`skill-pipeline.ts`**: Orquestación y ejecución de herramientas transaccionales.
*   **`tools/`**: Registro de herramientas y capacidades (órdenes, finanzas, stock, notificaciones, mission_control, health).
*   **`connectors/`**: Conectores de lectura eficientes de base de datos (`alpha-addiction-connector.ts`).
