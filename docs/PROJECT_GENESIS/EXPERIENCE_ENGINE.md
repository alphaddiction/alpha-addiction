# EXPERIENCE ENGINE - Flujo Evolutivo de Conocimiento y Grafo de Propiedades

## El Flujo Evolutivo de la Experiencia

El **Experience Engine** no almacena recuerdos planos. Trata la información como un organismo vivo que evoluciona progresivamente a través de las siguientes etapas:

```
[ Observations ] (Observaciones individuales de chat, rutas y clics)
       │
       ▼
  [ Events ] (Sucesos confirmados del e-commerce o interacciones completas)
       │
       ▼
  [ Lessons ] (Lecciones extraídas por reflexión ante éxitos o fallos)
       │
       ▼
 [ Patterns ] (Hábitos recurrentes y regularidades temporales identificadas)
       │
       ▼
 [ Knowledge ] (Entidades y relaciones consolidadas en el Grafo de Propiedades)
       │
       ▼
[ Understanding ] (Modelo semántico global y empatía contextual con el usuario)
```

---

## Integración del Grafo de Conocimiento (Knowledge Graph)

Para comprender relaciones de múltiples niveles sin la degradación del rendimiento de bases SQL planas, Alpha utiliza un **Grafo de Propiedades (Property Graph)**.

### Estructura del Grafo

1.  **Nodos (Entities)**: Representan conceptos del e-commerce y del usuario.
    *   *Tipos*: `Usuario`, `Proyecto`, `Drop`, `Pedido`, `Cliente`, `Objetivo`, `Hábito`.
    *   *Atributos*: `id`, `importanceScore`, `lastSeen`, `confidenceRating`.
2.  **Bordes (Edges / Relationships)**: Conexiones dirigidas y tipadas.
    *   *Tipos*: `PERTENECE_A`, `ASOCIADO_CON`, `PLANIFICA_PARA`, `DISEÑA_UN`, `PREFIERE_TIPO`.

### RAG Basado en Grafos (Graph RAG)

Cuando el `ReasoningEngine` planifica:
1.  Busca coincidencias fonéticas o vectoriales con las entidades semilla en la consulta.
2.  Camina el grafo a 1 y 2 saltos de distancia para recuperar las relaciones adyacentes.
3.  Escribe un resumen semántico de relaciones (ej: `"Genesis [Drop] PERTENECE_A Alpha Addiction [Proyecto] UTILIZA Printful [Proveedor]"`) y lo inyecta en el prompt contextual, anulando alucinaciones del LLM.
