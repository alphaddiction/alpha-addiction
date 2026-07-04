# Alpha Brain v1.0 — Motor de Grafo de Conocimiento (Knowledge Engine)

Bienvenido a la documentación técnica de **Alpha Brain (v1.0)**, el Knowledge Engine diseñado para estructurar el conocimiento del negocio mediante entidades y relaciones relacionales.

A diferencia del Memory Engine, que almacena y recupera declaraciones textuales independientes ("hechos recordados"), Alpha Brain modela el ecosistema de negocio completo como un **grafo de propiedades relacionales** (Property Graph). Esto le permite a Alpha deducir conexiones de segundo o tercer nivel para dar respuestas contextualmente coherentes (RAG basado en grafos).

---

## 📐 Estructura del Grafo de Propiedades

El grafo está compuesto por dos elementos primarios:

### 1. Entidades (Nodos / Entities)
Cada entidad representa un elemento conceptual o físico del ecommerce. Cada nodo cuenta con:
*   `id`: Identificador único UUID.
*   `type`: Tipo de entidad (`Proyecto`, `Producto`, `Drop`, `Cliente`, `Pedido`, `Proveedor`, `Integración`, etc.).
*   `name`: Nombre legible (ej: "Genesis", "Printful API").
*   `description`: Explicación detallada o hechos clave del nodo.
*   `version`: Historial de actualizaciones (versionado automático incremental).
*   `metadata`: Objeto de configuración adicional.
*   `importance`: Puntuación de confianza (0-100).
*   `source`: Origen del conocimiento (`system`, `admin`, `api`, `memory`).

### 2. Relaciones (Bordes / Edges)
Las relaciones conectan dos entidades de forma dirigida y tipada.
*   `type`: Nombre de la conexión (`PERTENECE_A`, `UTILIZA`, `DEPENDE_DE`, `CONECTA_CON`, `PRODUCIDO_POR`, `ASOCIADO_A`, etc.).
*   `sourceEntityId`: Nodo origen.
*   `targetEntityId`: Nodo destino.

---

## 🛠️ RAG Context Builder basado en Grafos

Cuando el Reasoning Engine intercepta una consulta del administrador:
1.  **Sembrado de Semillas**: Analiza el texto de entrada y extrae términos clave, buscando coincidencias exactas o parciales con nombres de entidades en base de datos.
2.  **Travesía de Relaciones**: Para cada entidad semilla encontrada, recupera todas las relaciones adyacentes de primer y segundo nivel (vecinos entrantes y salientes).
3.  **Serialización Semántica**: Ensambla el grafo resultante en un bloque textual legible por el LLM:
    ```text
    - Genesis [Drop] ➔ PERTENECE_A ➔ Alpha Addiction [Proyecto]
    - Alpha Addiction [Proyecto] ➔ UTILIZA ➔ Printful API [Proveedor]
    ```
4.  **Inyección en Contexto**: Este bloque se inyecta en el prompt del sistema antes del procesamiento del modelo de lenguaje, evitando que invente información sobre el roadmap o los drops del ecommerce.

---

## 🎛️ Consolas del Administrador

### 1. Knowledge Center (`/admin/knowledge`)
Pantalla de administración dedicada a la gestión de conocimiento del negocio.
*   **Entidades**: Listado completo de nodos con sus tipos y descripciones. Permite consultar localmente sus relaciones salientes/entrantes y eliminarlos en cascada.
*   **Relaciones**: Tabla navegable que muestra la red de conexiones dirigidas. Permite agregar nuevas relaciones entre entidades preexistentes o eliminarlas.
*   **Conflictos & Fusiones**: Escanea de forma inteligente nombres de entidades con similitudes fonéticas u ortográficas (ej: "Genesis" vs "Drop Genesis"). Sugiere la fusión de los nodos y reasigna automáticamente todas las relaciones huérfanas al nodo destino al hacer click en "Fusionar".

### 2. Widget en Mission Control
Muestra estadísticas operativas críticas del grafo empresarial (total de nodos, bordes, score de confianza media de las entidades y última marca de sincronización).

### 3. Tarjeta en Health Center
Reporta la salud del Knowledge Engine (estado activo/inactivo y tiempos medios de travesía/búsqueda).

---

## 🔌 Capa de Abstracción y Evolución Futura

La implementación actual utiliza tablas relacionales indexadas en Neon PostgreSQL a través de Prisma. Sin embargo, la lógica de negocio expuesta en `KnowledgeManager` se ha diseñado siguiendo el patrón de **Capa de Abstracción de Datos**:
*   Toda interacción pasa por los métodos `upsertEntity`, `upsertRelationship` y `getNeighbors`.
*   Esto asegura que en el futuro, si el volumen de conocimiento crece a millones de nodos, se pueda migrar a un motor nativo como **Neo4j** o bases de datos de vectores sin necesidad de modificar el `AlphaCore` o el `ReasoningEngine`.
