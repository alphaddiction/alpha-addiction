# BRAIN OS - El Sistema Operativo Cognitivo y el Cognitive Bus

## Concepto del Ecosistema

**Brain OS** no es una clase monolítica de orquestación. Es un runtime cognitivo que monitoriza un bus de datos desacoplado denominado **Cognitive Bus**. 

Los motores no se llaman directamente entre sí. En lugar de eso, leen y publican mensajes y estados parciales en el bus cognitivo. Esto permite que nuevos motores se añadan de forma transparente al pipeline de toma de decisiones.

---

## Flujo del Bus Cognitivo (Cognitive Bus Flow)

```
[Entrada Sensorial] ➔ [Perception Engine]
                           │
                           ▼
                    (Publica PerceivedEvent)
                           │
                           ▼
                   [ COGNITIVE BUS ]
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
[Experience]         [User Model]          [Security OS]
(Enriquece con Graph) (Evalúa hábitos)      (Sanitiza PII)
      │                    │                    │
      └────────────────────┼────────────────────┘
                           │
                           ▼
                   [ COGNITIVE BUS ]
                           │
                           ▼
                       [Planner]
             (Genera Plan de Capacidades)
                           │
                           ▼
                   [ COGNITIVE BUS ]
                           │
                           ▼
                 [Behavior Security]
             (Valida constitucionalidad)
                           │
                           ▼
                   [ COGNITIVE BUS ]
                           │
                           ▼
                       [Action]
             (Ejecuta habilidades físicas)
                           │
                           ▼
                   [ COGNITIVE BUS ]
                           │
                           ▼
                      [Reflection]
             (Aprende del resultado de la acción)
```

---

## El Ciclo del Decision Pipeline (10 Etapas)

1.  **Percepción (Perception)**: Traduce entradas crudas a un evento común.
2.  **Comprensión (Understanding)**: Entiende la semántica y contexto inmediato de la petición.
3.  **Experiencia (Experience)**: Carga recuerdos, lecciones y relaciones históricas.
4.  **Modelo de Usuario (User Model)**: Modula la respuesta según preferencias y perfil dinámico.
5.  **Objetivos (Goals)**: Identifica qué metas se intentan alcanzar.
6.  **Evaluación de Riesgos (Risk Assessment)**: Analiza el peligro operativo de la acción.
7.  **Planificación (Planning)**: Genera la secuencia óptima de capacidades del registro.
8.  **Justificación (Justification)**: Documenta constitucionalmente *por qué* es lícito proceder.
9.  **Acción (Action)**: Ejecuta las capacidades de forma física.
10. **Reflexión (Reflection)**: Evalúa el éxito del plan y extrae conclusiones.
