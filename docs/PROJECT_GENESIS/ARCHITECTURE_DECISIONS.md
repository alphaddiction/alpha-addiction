# Registro de Decisiones de Arquitectura (ADR) - Alpha

Este documento actúa como la bitácora oficial de las decisiones críticas de arquitectura e ingeniería de **Alpha**. Cada registro detalla el contexto, la decisión adoptada, las alternativas descartadas y las consecuencias técnicas a largo plazo.

---

## Índice de Decisiones (ADR)

*   **[ADR-001: Reestructuración Modular y Monorepo Lógico](#adr-001-reestructuracion-modular-y-monorepo-logico)** (Estado: *Aprobado*)
*   **[ADR-002: Arquitectura Basada en Cognitive Bus](#adr-002-arquitectura-basada-en-cognitive-bus)** (Estado: *Aprobado*)
*   **[ADR-003: Segregación Sensorial y Asíncrona (Perception & Evolution Engines)](#adr-003-segregacion-sensorial-y-asincrona-perception-evolution-engines)** (Estado: *Aprobado*)
*   **[ADR-004: Modelo Dinámico de Usuario Basado en Observaciones](#adr-004-modelo-dinamico-de-usuario-basado-en-observaciones)** (Estado: *Aprobado*)
*   **[ADR-005: Cortafuegos Constitucional y Security OS Segregado](#adr-005-cortafuegos-constitucional-y-security-os-segregado)** (Estado: *Aprobado*)
*   **[ADR-006: Sintonización y Deriva del Identity System](#adr-006-sintonizacion-y-deriva-del-identity-system)** (Estado: *Aprobado*)
*   **[ADR-007: Capa de Razonamiento Ético (ERL) y Resolución de Dilemas](#adr-007-capa-de-razonamiento-etico-erl-y-resolucion-de-dilemas)** (Estado: *Aprobado*)
*   **[ADR-008: Autoconocimiento Reflexivo Mediante el Self Model](#adr-008-autoconocimiento-reflexivo-mediante-el-self-model)** (Estado: *Aprobado*)

---

## ADR-001: Reestructuración Modular y Monorepo Lógico

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-23
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
El código original de Alpha mezclaba componentes visuales de Next.js, lógica cognitiva, persistencia en base de datos y utilidades en carpetas comunes (`src/lib` y `src/modules`). Esto limitaba la escalabilidad e impedía la modularización necesaria para desarrollar clientes independientes (ej. app móvil) o cambiar motores lógicos sin alterar la lógica de presentación.

### Decisión
Reorganizar físicamente todo el código del repositorio en 5 grandes bloques desacoplados:
1.  `/backend`: Lógica de bases de datos, APIs transaccionales, eventos y colas.
2.  `/core`: Los motores cognitivos del cerebro (Identity, Memory, Reasoning, etc.).
3.  `/apps`: Presentaciones de UI de canales (Admin portal, Web cliente, Mobile stub).
4.  `/shared`: Contratos comunes, tipos e interfaces compartidas.
5.  `/config`: Propiedades de entorno y constantes de marca globales.

### Consecuencias
*   **Positivas**:
    *   Bajo acoplamiento físico y alta cohesión temática.
    *   Facilidad para empaquetar o dockerizar motores cognitivos de forma independiente.
*   **Negativas**:
    *   Requirió actualizar los path aliases del compilador de TypeScript y ordenar los comodines en `tsconfig.json` para evitar colisiones con `@/*`.

---

## ADR-002: Arquitectura Basada en Cognitive Bus

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-24
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
En el diseño inicial, `BrainOS` dependía y coordinaba directamente a cada motor lúdico (llamadas secuenciales directas). Añadir nuevas capacidades lógicas (como un motor de detección de emociones o análisis sintáctico) obligaba a modificar el núcleo de orquestación de Brain OS, violando el principio Open-Closed de SOLID.

### Decisión
Implementar un **Cognitive Bus** centralizado. El flujo cognitivo de un mensaje se describe mediante un estado unificado (`ICognitiveState`) publicado en el bus. Los motores actúan como editores o suscriptores de canales específicos del bus, enriqueciendo el estado cognitivo de manera desacoplada.

### Consecuencias
*   **Positivas**:
    *   Acoplamiento cero entre motores cognitivos.
    *   Modularidad total: se pueden activar o desactivar sistemas cognitivos en caliente.
*   **Negativas**:
    *   Trazabilidad de depuración más compleja. Requiere un sistema estricto de identificadores únicos de correlación (`correlationId`) por turno de pensamiento.

---

## ADR-003: Segregación Sensorial y Asíncrona (Perception & Evolution Engines)

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-24
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
Los motores cognitivos principales debían enfrentarse a la conversión de ficheros binarios, lecturas de webhooks y flujos de voz al mismo tiempo que procesaban la lógica de razonamiento. Además, la consolidación a largo plazo y la poda de la base de datos de memoria semántica ralentizaban la respuesta en caliente del chat.

### Decisión
1.  Crear el **Perception Engine** para aislar el parseo sensorial. Traduce texto, voz, imágenes o webhooks a un objeto común `IPerceivedEvent`.
2.  Crear el **Evolution Engine** como un demonio asíncrono offline. En lugar de procesar lecciones complejas durante el chat, este motor asimila hábitos, pisa entidades redundantes del Grafo de Conocimiento y realiza la poda por decaimiento cognitivo en segundo plano.

### Consecuencias
*   **Positivas**:
    *   El motor de razonamiento de IA solo recibe datos semánticos limpios.
    *   Reducción drástica del tamaño del contexto de RAG y prevención de cuellos de botella en base de datos.

---

## ADR-004: Modelo Dinámico de Usuario Basado en Observaciones

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-24
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
Los asistentes convencionales guardan pares clave-valor estáticos (ej: "nombre del usuario = Juan"). No obstante, el comportamiento de un usuario cambia con el tiempo y está condicionado por patrones de uso y estilos de comunicación deducidos indirectamente.

### Decisión
Construir un **User Model** dinámico. El sistema registra continuamente `IUserObservation` (observaciones del comportamiento en base a clics, rechazos de planes, atajos y tono). Periódicamente, el `UserModelManager` consolida estas observaciones parciales en rasgos estables utilizando thresholds de confianza estadística.

### Consecuencias
*   **Positivas**:
    *   Alpha se adapta al estilo comunicativo y ritmo de trabajo del usuario sin necesidad de que este configure su perfil a mano.
*   **Negativas**:
    *   Requiere un almacenamiento de logs intermedios de comportamiento, requiriendo rutinas de borrado periódico de datos efímeros.

---

## ADR-005: Cortafuegos Constitucional y Security OS Segregado

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-24
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
En sistemas agenticos potentes, un ataque de inyección de prompt (jailbreak) puede engañar al LLM para que proponga borrar la base de datos, revelar API keys o vaciar stock. Tratar la seguridad como un único bloque dificulta el aislamiento en caso de brechas.

### Decisión
Separar la seguridad en tres áreas independientes con privilegios mínimos (Zero Trust):
1.  **Identity Security**: Autenticación RBAC y firmado de planes.
2.  **Data Security**: Cifrado AES-256 local y enmascaramiento previo de PII antes de enviar payloads a LLMs externos.
3.  **Behavior Security**: Un cortafuegos constitucional local y determinista que intercepta y audita todos los planes generados por la IA en el `CognitiveBus` antes de que se ejecuten capacidades transaccionales.

### Consecuencias
*   **Positivas**:
    *   Incluso si un atacante elude las directivas del prompt de LLM de terceros (Jailbreak exitoso), el plan propuesto será abortado de forma local por `BehaviorSecurity` antes de tocar el sistema físico.

---

## ADR-006: Sintonización y Deriva del Identity System

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-24
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
La identidad de Alpha (personalidad, tono y comportamiento) corre el riesgo de degradarse por jailbreaks, mimetismo de adulación al usuario (sycophancy) o sesgos durante conversaciones prolongadas a lo largo de los años. Necesitamos una definición consistente que el sistema use de guía y un mecanismo para alertar y revertir cualquier desalineación cognitiva.

### Decisión
1.  Crear **IDENTITY.md** como la fuente de verdad inmutable de Alpha (misión, invariants, estilo).
2.  Modelar el **Identity Vector** parametrizado con métricas de rasgo sintonizables (curiosidad, humildad, precisión, empatía, creatividad, paciencia, iniciativa).
3.  Diseñar conceptualmente el **Identity Drift Protection**: un subsistema en `BehaviorSecurity` que extrae el vector semántico del output de Alpha, evalúa desviaciones contra el perfil base, y genera alertas o resetea el vector de identidad si la deriva supera el 25%.

### Consecuencias
*   **Positivas**:
    *   Garantiza coherencia conductual en Alpha a lo largo de décadas.
    *   Permite calibrar la personalidad de Alpha sin alterar sus cimientos (The Seed).
*   **Negativas**:
    *   Requiere un paso adicional de auditoría de deriva semántica en el ciclo de salida, aumentando el coste de tokens del buffer de control.

---

## ADR-007: Capa de Razonamiento Ético (ERL) y Resolución de Dilemas

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-24
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
Los modelos de IA tradicionales toman decisiones optimizando métricas locales sin considerar consecuencias éticas, lo que puede inducir a tácticas comerciales de alta presión, inyecciones semánticas maliciosas o gasto descontrolado de presupuestos. El sistema necesita un intérprete intermedio que evalúe y justifique las decisiones complejas con una jerarquía de prioridades explícita.

### Decisión
1.  Crear **ETHICS.md** definiendo principios fundamentales (Honestidad, Transparencia, Prudencia) y una jerarquía inmutable de prioridades éticas.
2.  Diseñar la **Ethical Reasoning Layer (ERL)** en [`core/seed/ethics.ts`](file:///c:/Users/alber/alpha-addiction/core/seed/ethics.ts) para auditar los planes lógicos de la IA estimando su alineamiento ético (`EAI`) y emitiendo justificaciones criptográficas (`IEthicalDecisionLog`).

### Consecuencias
*   **Positivas**:
    *   Previene la manipulación y la pérdida de control financiero.
    *   Aporta auditabilidad matemática de cada acción autónoma.
*   **Negativas**:
    *   Introduce un paso secuencial extra en el pipeline de toma de decisiones antes de despachar acciones.

---

## ADR-008: Autoconocimiento Reflexivo Mediante el Self Model

*   **Estado**: Aprobado
*   **Fecha**: 2026-07-24
*   **Decisores**: Alber (Administrador), Antigravity (Arquitecto Principal)

### Contexto y Problema
Los agentes de IA convencionales carecen de introspección sobre su propio estado operativo (latencias de API, timeouts de bases de datos, límites de tokens o degradación del prompt). Esto causa fallos catastróficos cuando intentan ejecutar capacidades inaccesibles o proponen planes inconsistentes lógicamente entre turnos de conversación.

### Decisión
1.  Crear **SELF_MODEL.md** definiendo conceptualmente las áreas de autoconsciencia, límites de tolerancia a la incertidumbre y monitoreo de salud técnica de integraciones externas (PayPal, Printful, Resend).
2.  Definir en [`core/seed/self-model.ts`](file:///c:/Users/alber/alpha-addiction/core/seed/self-model.ts) las interfaces lógicas `ISelfModel` e `ISelfModelManager` para estructurar la telemetría introspectiva en el `CognitiveState` del Cognitive Bus.

### Consecuencias
*   **Positivas**:
    *   Alpha evita proponer planes irrealizables desactivando temporalmente capacidades rotas en el registro.
    *   Detección preventiva de inconsistencias factuales y de inyección semántica.
*   **Negativas**:
    *   Requiere computar métricas de salud técnica periódicas (latencias) y evaluar tokens en tiempo real, sumando sobrecarga de procesamiento local.



