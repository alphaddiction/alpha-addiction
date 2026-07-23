# Goals Subsystem (/core/goals)

Este módulo gestiona la definición, seguimiento y orquestación de objetivos del asistente **Alpha**.

## Arquitectura

*   **`skill-manager.ts`**: Validador de permisos de herramientas y controlador de capabilities de IA según el rol del administrador.
*   **Planificador de Objetivos**: Permite que Alpha desglose un objetivo complejo de negocio (ej. "Lanzar el drop Genesis mañana a las 10:00") en sub-tareas ejecutables mediante llamadas secuenciales de herramientas y verifique autónomamente el cumplimiento de cada una.
