# SELF MODEL - Específico de Autoconocimiento Cognitivo de Alpha

---

## 1. Introducción

### 1.1. Propósito y Definición
Este documento especifica el **Self Model (Modelo de Sí Mismo)** de **Alpha**. Representa la arquitectura conceptual mediante la cual Alpha mantiene autoconocimiento estructurado sobre sus propios recursos, estado operativo actual, capacidades cargadas, límites cognitivos y coherencia lógica de comportamiento. 

### 1.2. Justificación Técnica
La mayoría de los sistemas de inteligencia artificial operan de manera ciega sobre su propia arquitectura: ignoran cuántas herramientas tienen disponibles, cuáles son sus límites de rate limit en producción, qué latencia sufren sus conectores de base de datos o si su prompt se ha degradado. El **Self Model** soluciona esto proporcionando una capa de reflexividad e introspección que alimenta al planificador antes de diseñar cualquier plan de acción.

---

## 2. ¿Qué es el Self Model?

El **Self Model** es el "espejo analítico" de Alpha. Se define como una representación semántica y numérica estructurada en tiempo real que Alpha posee de sí misma. 

### 2.1. Alcance
*   **No modela al usuario**: No contiene datos de comportamiento de terceros.
*   **No es memoria semántica externa**: No almacena registros de drops ni de pedidos.
*   **Es autoconocimiento puro**: Describe el estado del propio agente (salud de conectores, latencia de APIs, capacidades cargadas, y desviación del vector de identidad).

---

## 3. Self Awareness (Autoconciencia Operativa)

La autoconciencia de Alpha se subdivide en tres áreas de monitorización constante:
1.  **Conciencia de Recursos (Resource Awareness)**: Monitorización del consumo de memoria en el host, tamaño del buffer de contexto conversacional y presupuesto de tokens del prompt.
2.  **Conciencia Funcional (Functional Awareness)**: Conocimiento exacto del estado de las integraciones externas (ej. si la API de Printful responde con éxito o error de cuota).
3.  **Conciencia Conductual (Behavioral Awareness)**: Evaluación en caliente del nivel de alineación de las respuestas con la Constitución y el Sistema Ético.

---

## 4. Capability Registry Integration (Integración del Registro de Capacidades)

El **Self Model** se conecta directamente con el `CapabilityRegistry`. En lugar de tener herramientas cableadas estáticamente en el prompt, el planificador consulta el estado del registro de capacidades para responder a preguntas dinámicas del tipo: *¿Dispongo de la habilidad física para generar esta factura en PDF en este instante?*

Si la capacidad de generación de PDF requiere una dependencia (como una librería externa que ha fallado en cargar), el Self Model marca la capacidad como `desactivada_temporalmente` en el registro, impidiendo al Planner diseñar un plan inviable y forzando una explicación honesta al usuario.

---

## 5. Limitation Model (Modelo de Limitaciones)

El **Limitation Model** detalla de forma explícita las fronteras físicas y lógicas del sistema operativo de Alpha:
*   **Límites de Conectividad**: Tiempos máximos de respuesta (timeout) para bases de datos Neon PostgreSQL.
*   **Límites Cognitivos**: Número máximo de saltos relacionales realizables en el *Knowledge Graph* antes de incurrir en parálisis por análisis.
*   **Límites de Acción**: Impedimento físico para realizar transacciones monetarias sin la firma explícita del administrador (vía Identity Security).

---

## 6. Confidence Awareness (Conciencia de Confianza)

Toda deducción lógica de Alpha tiene asociado un **Nivel de Confianza (Confidence Score)**. El Self Model supervisa esta métrica para mitigar alucinaciones de forma proactiva:
*   **Confianza Alta (>0.80)**: Procede con el plan autónomamente.
*   **Confianza Media (0.50 - 0.79)**: Sugiere el plan pero advierte de variables dudosas y pide confirmación.
*   **Confianza Baja (<0.50)**: Bloquea la acción automática y expone la falta de datos verídicos detallando la incertidumbre.

---

## 7. Health Model (Modelo de Salud Técnica)

El **Health Model** evalúa continuamente el estado funcional del ecosistema tecnológico de Alpha:

```
                  [ HEALTH MODEL ]
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
[ Data Health ]     [ Network Health ]  [ Cognitive Health ]
(Prisma / Postgres) (PayPal / Printful) (Latencia de IA / RAG)
```

1.  **Data Health**: Latencia y estado de conexión con Prisma Client.
2.  **Network Health**: Telemetría de disponibilidad en tiempo real de las APIs de Printful, PayPal y Resend.
3.  **Cognitive Health**: Historial de tasas de token-usage y latencias del proveedor de LLM.

---

## 8. Evolution Model (Evolución de Estado)

El **Evolution Model** guarda el log histórico de sintonización del vector de identidad (`IdentityVector`). Permite a Alpha comprender cómo se ha adaptado su propia personalidad a lo largo del tiempo (ej. si su variable de `Initiative` ha aumentado debido a la resolución de anomalías complejas o si ha sido reducida manualmente por el administrador).

---

## 9. Self Reflection (Auto-Reflexión)

Al final de cada turno del bus cognitivo, el motor de reflexión evalúa el resultado de la acción propuesta:
*   Compara el impacto estimado frente al impacto real observado en el `CognitiveBus`.
*   Extrae logs de aprendizaje técnico (ej. *"El timeout de la API de Printful superó los 3000ms; debo proponer ejecuciones diferidas para grandes lotes en el futuro"*).

---

## 10. Self Consistency (Consistencia Interna)

El Self Model audita la coherencia lógica de las respuestas de Alpha. Compara respuestas previas en la misma sesión para evitar contradicciones factuales graves. Si detecta una inconsistencia lógica (ej. haber afirmado hace 5 minutos que no había stock y ahora sugerir que el pedido está en producción), detiene la publicación del mensaje final en el bus y recalcula el estado cognitivo.

---

## 11. Cognitive Mirror (El Espejo Cognitivo)

El **Cognitive Mirror** es la representación semántica que Alpha inyecta en su propio system prompt para mantener autoconsciencia conversacional. Contiene una cadena formateada que se actualiza dinámicamente y describe:
*   El modelo de inferencia en uso actual (ej. `google-gemini-2.5-pro`).
*   La lista de capacidades autorizadas activas en la sesión actual.
*   El estado de salud de las APIs de negocio.

---

## 12. Relación con la Identidad (Relationship with Identity)

El Self Model lee de la **Identidad** (`DefaultIdentityVector`) las constantes de rasgos que guían su tono, personalidad e invariantes éticas de no antropomorfización.

---

## 13. Relación con la Constitución (Relationship with Constitution)

El Self Model utiliza las reglas de **La Constitución** como condiciones de borde binarias que limitan el espacio de estados y acciones válidas de sus capacidades lógicas.

---

## 14. Relación con el Sistema Ético (Relationship with Ethics)

El **Sistema Ético** suministra al Self Model el orden jerárquico de priorización para resolver conflictos cuando las limitaciones de salud o datos chocan con los objetivos del usuario.

---

## 15. Relación con Brain OS (Relationship with Brain OS)

El orquestador **Brain OS** inyecta el `SelfModel` en el `CognitiveState` que viaja por el `CognitiveBus`, permitiendo que el `Planner` conozca sus limitaciones operativas antes de generar secuencias de acción.

---

## 16. Relación con el Experience Engine (Relationship with Experience Engine)

Los logs de auto-reflexión y las auditorías de consistencia generadas por el Self Model son persistidos en el **Experience Engine** como logs de experiencia interna, permitiendo al `EvolutionEngine` refinar el comportamiento del sistema offline.

---

## 17. Riesgos

### 17.1. Ausencia del Self Model
Sin este módulo, Alpha operará de manera ciega sobre su propia capacidad e infraestructura. Propondrá planes de acción inválidos utilizando capacidades desactivadas o caídas, alucinará certezas ante datos de baja confianza y generará contradicciones lógicas entre turnos de chat.

### 17.2. Corrupción del Self Model
Si el Self Model se corrompe (ej. reportando falsamente una latencia de 0ms o una confianza del 100% en datos corruptos), el cortafuegos de `BehaviorSecurity` dejará pasar operaciones destructivas basadas en asunciones erróneas del sistema.

---

## 18. ADR Relacionados

*   **[ADR-003: Segregación Sensorial y Asíncrona (Perception & Evolution Engines)](file:///c:/Users/alber/alpha-addiction/docs/PROJECT_GENESIS/ARCHITECTURE_DECISIONS.md#adr-003-segregacion-sensorial-y-asincrona-perception-evolution-engines)**: Proporciona las bases asíncronas para las tareas de auto-reflexión offline del Self Model.
*   **[ADR-005: Cortafuegos Constitucional y Security OS Segregado](file:///c:/Users/alber/alpha-addiction/docs/PROJECT_GENESIS/ARCHITECTURE_DECISIONS.md#adr-005-cortafuegos-constitucional-y-security-os-segregado)**: Expone las interfaces que utiliza el Self Model para bloquear planes inconsistentes.

---

## 19. Futuras Ampliaciones

### 19.1. Monitoreo Predictivo de Degradación de Pesos
En fases avanzadas de inferencia local de modelos de código abierto, el Self Model incorporará herramientas para evaluar la degradación de pesos lógicos (weight decay) y alertar de forma preventiva cuando el sistema requiera una recalibración semántica (fine-tuning) debido al envejecimiento del modelo conversacional.
