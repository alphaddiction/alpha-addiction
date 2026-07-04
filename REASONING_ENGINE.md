# Alpha Reasoning Engine v1.2 — Motor de Razonamiento y Pipeline de Skills Inteligentes

Bienvenido a la documentación de **Alpha Reasoning Engine (v1.2)**, el motor de razonamiento lógico descentralizado de Alpha Intelligence. 

A partir de esta fase, los modelos de lenguaje comercial (como Gemini o GPT) dejan de tomar decisiones directas de enrutamiento o selección de herramientas en el ecosistema. Toda la inteligencia operativa, la secuenciación de planes de acción, la gestión de caché y el enlazado de dependencias (Tool Chaining) pertenecen exclusivamente a Alpha. El LLM se reduce a su función óptima: **redactar e interpretar la respuesta final basada en datos verificados y consolidados previamente**.

---

## 📐 Pipeline y Flujo del Motor de Razonamiento

Toda petición de usuario es procesada mediante el siguiente pipeline secuencial estructurado:

```
[Usuario (Consulta)]
   │
   ▼
[Alpha Core]
   │
   ▼
[Reasoning Engine]
   │
   ├─► [Intent Analyzer] ──► (Clasificación de intenciones semánticas: comparar, resumir, calcular...)
   │
   ├─► [Planner] ──────────► (Construcción de plan secuencial de ejecución de herramientas)
   │
   ├─► [Skill Pipeline] ───► (Ejecución tolerante a fallos con Timeouts individuales y Tool Chaining)
   │
   ├─► [Cache Engine] ─────► (Almacén en memoria con TTL de 30s e invalidación activa por cambios en DB)
   │
   ├─► [Context Optimizer] ➔ (Limpieza y truncado de campos de contexto para ahorro de tokens)
   │
   ├─► [Confidence Engine] ➔ (Cálculo del score de fiabilidad de los datos de respuesta de 0 a 100%)
   │
   ▼
[Prompt Builder + AI Provider] (Gemini / OpenAI) ──► (Redacción de la respuesta humana final)
   │
   ▼
[Debug Mode Block] ──────► (Inyección de telemetrías del Core para Administradores)
   │
   ▼
[Respuesta al Usuario]
```

---

## ⚙️ Arquitectura de Componentes

Todos los módulos residen de forma independiente en [`src/modules/alpha-intelligence/reasoning/`](file:///c:/Users/alber/alpha-addiction/src/modules/alpha-intelligence/reasoning/):

### 1. Intent Analyzer (`intent-analyzer.ts`)
*   Clasifica de manera semántica la consulta del usuario en 11 categorías de intenciones (ej. `calcular`, `diagnosticar`, `buscar`, `comparar`, `resumir`). Asigna porcentajes de confianza en base a coincidencias.

### 2. Planner (`planner.ts`)
*   Diseña el plan secuencial de dependencias de herramientas. Excluye de forma activa herramientas innecesarias reduciendo el tiempo de ejecución y el coste de llamadas.

### 3. Skill Pipeline & Tool Chaining (`skill-pipeline.ts`)
*   Ejecuta las herramientas requeridas de manera coordinada.
*   **Tool Chaining**: Permite que una herramienta declare dependencias complejas (ej. `get_finance` requiere datos previos de `get_orders`) resolviéndolas automáticamente hasta una profundidad máxima de 3 para evitar bucles circulares.
*   **Manejo de Errores y Timeouts**: Cada herramienta cuenta con un tiempo límite de ejecución individual (`timeout-manager.ts`). Si falla o supera el tiempo, se recupera el pipeline ignorando el error o continuando con datos parciales. Nunca bloquea toda la respuesta.

### 4. Cache Engine (`cache-engine.ts`)
*   Almacena en caché en memoria las respuestas del sistema.
*   **Invalidación Proactiva**: Además de un TTL temporal estándar de 30 segundos, comprueba el timestamp de la última actualización en base de datos (pedidos, tickets, waitlists) antes de servir un registro. Si existen nuevos eventos, invalida la caché instantáneamente.

### 5. Confidence Engine (`confidence-engine.ts`)
*   Evalúa la exactitud y fiabilidad de la respuesta resultante. Deduce un score en porcentaje (0-100%) penalizando fallos de herramientas, consultas demasiado vagas y premiando la presencia de variables de contexto precisas.

### 6. Context Optimizer (`context-optimizer.ts`)
*   Analiza los objetos y respuestas JSON arrojados por las herramientas y recorta campos innecesarios (UUIDs, timestamps redundantes, logs extensos) antes de alimentar al LLM para optimizar el gasto de tokens.

### 7. Token & Timeout Managers (`token-manager.ts` / `timeout-manager.ts`)
*   Realizan la limitación y medición del consumo de recursos. El Token Manager calcula el gasto financiero exacto estimado en dólares de acuerdo con los ratios de precios del modelo de IA utilizado.

---

## 🎛️ Configuración y Diagnóstico

### Variables de Configuración en DB
*   `ai_reasoning_enabled`: Activa globalmente el motor de razonamiento lógico.
*   `ai_reasoning_planner_enabled`: Habilita la secuenciación dinámica del planificador.
*   `ai_reasoning_cache_enabled`: Permite la optimización mediante caché inteligente.
*   `ai_reasoning_confidence_enabled`: Habilita el cálculo del score de confianza.
*   `ai_reasoning_debug_enabled`: Habilita la inyección del bloque de depuración.
*   `ai_reasoning_timeout_enabled`: Establece límites estrictos de tiempo por herramienta.
*   `ai_reasoning_chaining_enabled`: Habilita el encadenamiento de dependencias.

### Debug Mode (Bloque Colapsable)
Si `ai_reasoning_debug_enabled` está activo y el usuario tiene el rol de administrador, Alpha inyectará automáticamente un bloque colapsable HTML `<details>` al final de sus respuestas detallando:
*   Intención semántica detectada.
*   Pasos del Planificador.
*   Herramientas ejecutadas o descartadas.
*   Score de Confianza exacto.
*   Indicador de Caché (HIT/MISS).
*   Tokens consumidos y coste financiero en dólares estimado.
*   Latencia total en milisegundos.

---

## 🗺️ Roadmap de Evolución

*   **v1 (Fase Actual) — Reasoning**: Pipeline secuencial de planes estructurados, Tool Chaining, invalidación de caché por base de datos, optimización de tokens y debug logs.
*   **v2 — Adaptive Planning**: Ajustes dinámicos del plan a mitad de ejecución según los resultados intermedios obtenidos.
*   **v3 — Autonomous Skills**: Descubrimiento y registro desatendido de nuevas capacidades expuestas.
*   **v4 — Long-Term Memory**: Memoria persistente a largo plazo.
*   **v5 — Voice**: Integración de audio y voz natural.
*   **v6 — Agents**: Flujos cooperativos multi-agente en paralelo.
*   **v7 — Automation**: Disparo desatendido de automatizaciones por eventos del sistema.
*   **v8 — Multiempresa**: Despliegue descentralizado de consolas corporativas.
