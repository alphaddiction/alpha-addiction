# Initiative Subsystem (/core/initiative)

Este módulo dota a **Alpha** de comportamiento proactivo e iniciativa.

## Funcionamiento Propuesto

*   **`event-engine.ts`**: Escucha activamente el bus de eventos de negocio en `/backend/events`.
*   **Decisión Proactiva**: Ante ciertos patrones (ej. tres carritos abandonados con el mismo artículo, o cola de waitlist superando el stock disponible), el motor proactivo evalúa si debe iniciar una conversación con el administrador en el Drawer del panel de control para sugerir una acción automatizada.
