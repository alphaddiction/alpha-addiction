# Context Engine (/core/context)

Este módulo gestiona la recopilación del contexto operativo de la sesión.

## Componentes
*   **`context-engine.ts`**: Reúne datos del administrador (ID, rol, permisos) y la marca o proyecto activo.
*   **`detector.ts`**: Escucha los cambios de ruta del administrador y lee datos de la entidad visualizada para inyectarla automáticamente en el System Prompt de Alpha.
