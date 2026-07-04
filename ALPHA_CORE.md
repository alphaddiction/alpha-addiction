# Alpha Core v1 (The Brain) — Arquitectura y Documentación de Coordinación

Bienvenido a la documentación técnica de **Alpha Core (The Brain)**, el motor de coordinación central y desacoplado que actúa como el cerebro de **Alpha Intelligence**.

A partir de la versión v1 Premium, todas las interacciones con los modelos de inteligencia artificial y el flujo de datos del sistema pasan obligatoriamente por Alpha Core, garantizando la independencia del proveedor LLM utilizado, la seguridad de la información confidencial y el comportamiento estructurado de consulta del ecommerce.

---

## 📐 Flujo General del Sistema

Toda petición realizada por un administrador al asistente inteligente sigue el pipeline estructurado de motores coordinados por el núcleo:

```
[Usuario]
   │
   ▼
[AlphaCore] ──► [Security Layer] ──► (Scrubbing de secretos de entrada)
   │
   ├──────────► [Context Engine] ──► (Agregación de ruta del panel, proyecto, rol)
   │
   ├──────────► [Memory Engine]  ──► (Carga de historial relacional de Postgres)
   │
   ├──────────► [Skill Manager]  ──► (Filtrado de herramientas según permisos)
   │
   ├──────────► [Personality Engine] ➔ (Formatear guías de tono elegante y minimalista)
   │
   ├──────────► [Prompt Builder] ──► (Ensamblado dinámico del System Prompt final)
   │
   ├──────────► [Decision Engine] ──► (Evaluación inteligente de estrategia de modelo)
   │
   ▼
[AI Provider Layer] (Llamada REST a Gemini / OpenAI)
   │
   ├──────────► (Loop de ejecución de herramientas invocando al Skill Manager si procede)
   │
   ▼
[Respuesta del LLM]
   │
   ├──────────► [Security Layer] ──► (Scrubbing de secretos de salida)
   │
   ├──────────► [Memory Engine]  ──► (Persistencia de la respuesta en base de datos)
   │
   ├──────────► [Logging Engine] ──► (Auditoría inalterable en AuditLog)
   │
   ▼
[Usuario (Frontend UI)]
```

---

## ⚙️ Módulos y Responsabilidades del Cerebro

### 1. Alpha Core (`alpha-core.ts`)
*   **Responsabilidad**: Orquestador maestro. Es el único punto de entrada de la petición, coordinando el orden secuencial del pipeline de ejecución, manejando excepciones y garantizando la coherencia global del sistema.

### 2. Personality Engine (`personality-engine.ts`)
*   **Responsabilidad**: Diseñar y forzar la personalidad de "Alpha". Define el tono refinado, silencioso y seguro de una marca de lujo, impidiendo cualquier mención a GPT/Gemini o motores de IA comerciales subyacentes.

### 3. Context Engine (`context-engine.ts`)
*   **Responsabilidad**: Reunir en tiempo real las variables contextuales operativas de la sesión del administrador: ID de administrador, rol de permisos, proyecto activo, y detector dinámico de la página/entidad enfocada.

### 4. Memory Engine (`memory-engine.ts`)
*   **Responsabilidad**: Administrar la traza conversacional. Está estructurado en 5 niveles de evolución:
    *   `v1` (Conversacional activa): Historial relacional en PostgreSQL.
    *   `v2` (Temporal): Datos efímeros de sesión corta.
    *   `v3` (Contextual): Memoria de entidades visualizadas recientemente.
    *   `v4` (Cross-Proyecto): Memoria compartida del ecosistema.
    *   `v5` (Permanente): Memoria vectorial persistente.

### 5. Prompt Builder (`prompt-builder.ts`)
*   **Responsabilidad**: Eliminar prompts estáticos gigantes. Combina dinámicamente: Personalidad + Contexto + Habilidades + Reglas del Sistema en un único prompt ensamblado al momento del execute.

### 6. Skill Manager (`skill-manager.ts`)
*   **Responsabilidad**: Administrar las Capabilities (herramientas). Filtra qué herramientas están activas en base de datos y compara sus firmas de seguridad con el rol del administrador solicitante.

### 7. Security Layer (`security-layer.ts`)
*   **Responsabilidad**: Evitar fugas de secretos y API keys. Sanitiza recursivamente strings y estructuras de objetos, y enmascara datos personales de clientes (direcciones, emails) antes de transferir datos al LLM.

### 8. Logging Engine (`logging-engine.ts`)
*   **Responsabilidad**: Almacenar auditorías detalladas (`AI_CORE_EXECUTE`) indicando la hora, duración en milisegundos, herramientas ejecutadas, proveedor utilizado y estado de éxito, sin registrar credenciales ni secretos.

### 9. Event Engine (`event-engine.ts`)
*   **Responsabilidad**: Broker interno preparado para emitir y registrar eventos del negocio (ej: `order_created`, `waitlist_join`) dentro de la infraestructura del Core.

### 10. Scheduler (`scheduler.ts`)
*   **Responsabilidad**: Planificador programado en segundo plano (cron stubs) para ejecutar verificaciones de salud operativa del ecosistema de forma autónoma.

### 11. Project Layer (`project-layer.ts`)
*   **Responsabilidad**: Soporte multi-proyecto. Resuelve variables y nombres de dominio del ecosistema (Alpha Addiction, IAbly, Foedus, etc.), evitando acoplar el Core a una sola marca.

### 12. Decision Engine (`decision-engine.ts`)
*   **Responsabilidad**: Planificación inteligente de enrutado. Decidirá qué modelo o parámetros utilizar en base a la densidad de herramientas solicitadas.

---

## 📊 Integración y Monitorización Administrativa

### Configuración por Base de Datos
Cada uno de los motores dispone de una variable de configuración sembrada en la base de datos:
*   `ai_core_enabled` (Global)
*   `ai_core_personality_enabled`
*   `ai_core_context_enabled`
*   `ai_core_memory_enabled`
*   `ai_core_logging_enabled`
*   `ai_core_security_enabled`
*   `ai_core_skills_enabled`
*   `ai_core_events_enabled`
*   `ai_core_scheduler_enabled`

### Health Center
El Health Center incluye una tarjeta interactiva dedicada a **Alpha Core**, mostrando:
*   **Estado General**: Verde (Healthy), Amarillo (Degraded si hay más de 3 motores inactivos), Rojo (Inactivo).
*   **Métricas**: Latencia de coordinación en milisegundos y contador de errores del Core.
*   **Última Ejecución**: Reporte del timestamp del último execute.
*   **Módulos Activos**: Listado legible de motores activos en base de datos.

---

## 🗺️ Roadmap de Evolución

*   **v1 (Fase Actual) — Core**: Pipeline estructurado de motores coordinados, seguridad, personalidad y multi-proyecto.
*   **v2 — Skills**: Automatización de despacho de nuevas capacidades dinámicas de escritura controlada.
*   **v3 — Reasoning**: Razonamiento lógico avanzado y enrutamiento predictivo.
*   **v4 — Memory**: Activación de memoria permanente y contextual.
*   **v5 — Voice**: Canales bidireccionales y mandos mediante voz.
*   **v6 — Agents**: Redes multi-agente operando en paralelo.
*   **v7 — Automation**: Automatización de operaciones desatendidas.
*   **v8 — Multiempresa**: Consola de mando centralizada para el ecosistema completo.
