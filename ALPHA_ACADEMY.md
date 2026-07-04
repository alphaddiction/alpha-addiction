# Alpha Academy v1.0 — Base de Conocimiento Viva y Aprendizaje Corporativo

Bienvenido a la documentación técnica de **Alpha Academy (v1.0)**, el sistema de aprendizaje corporativo y directrices operativas in-context de Alpha Intelligence.

A diferencia de un repositorio documental plano (Wiki), Alpha Academy permite estructurar procedimientos de negocio, políticas de soporte y la filosofía comunicativa de la marca de forma relacional. Esto le permite a Alpha comprender cómo trabaja la empresa, cómo toma decisiones y cómo debe responder a los clientes.

---

## 📐 Estructura de Cursos y Lecciones

El motor organiza el conocimiento empresarial en dos niveles:

### 1. Cursos (Courses)
Representan áreas de competencia de la empresa. Cada curso cuenta con:
*   `id`: Identificador único UUID.
*   `title`: Título descriptivo (ej: "Filosofía y Tono de Marca").
*   `description`: Resumen o alcance del entrenamiento.
*   `category`: Categoría del curso (`Marca`, `Soporte`, `Drops`, `Logística`, `PayPal`, `Printful`, `Marketing`, etc.).
*   `version`: Historial de ediciones (versionado incremental).
*   `status`: Estado del curso (`draft` ➔ borrador, `suggested` ➔ sugerencia automática para revisar, `approved` ➔ aprobado y activo, `rejected` ➔ rechazado).
*   `priority`: Urgencia de asimilación (`low`, `normal`, `high`, `critical`).
*   `level`: Nivel formativo (`basic`, `intermediate`, `advanced`).

### 2. Lecciones (Lessons)
Cada curso cuenta con una o más lecciones que documentan hechos de negocio específicos:
*   `title`: Título de la lección (ej: "Tono, Voz y Mensajería").
*   `content`: Directrices detalladas del negocio en texto plano.
*   `objective`: Qué busca asegurar esta lección.
*   `rules`: Array JSON de reglas de negocio restrictivas de obligado cumplimiento.

---

## 💡 Enfoque de Base de Conocimiento Viva (Living Knowledge Base)

Alpha no depende únicamente de las pautas dadas de alta a mano por el staff. El sistema opera como una base de conocimiento viva:

1.  **Detección de Patrones Conversacionales**:
    *   Si el administrador utiliza frases clave como *"Recuerda que..."*, *"A partir de ahora..."*, o *"Decisión:..."*, el Reasoning Engine captura el enunciado.
    *   Crea automáticamente una propuesta de curso formativo en estado `suggested` etiquetada como procedente de *"Conversación Administrativa"*.
2.  **Importador Markdown / Texto**:
    *   Permite cargar bloques completos de texto.
    *   La herramienta analiza el contenido y genera un curso propuesto en la cola en estado `suggested`.
3.  **Aprobación Humana Obligatoria (Gated Knowledge)**:
    *   El conocimiento en estado `suggested` o `draft` **NUNCA** influye en las respuestas del chatbot de Alpha.
    *   Solo cuando el administrador aprueba expresamente la sugerencia en la cola de revisión (`status` pasa a `approved`), esta pasa a formar parte de las directrices inyectadas en el Reasoning Engine.

---

## 🎛️ Consolas del Administrador

### 1. Centro Academy (`/admin/academy`)
*   **Listado de Cursos**: Muestra tarjetas visuales con su versión, nivel y cantidad de lecciones asociadas en estado `approved` o `draft`.
*   **Acceso a la Cola**: Botón directo para ingresar a la cola de aprobación.
*   **Índice de Cobertura**: Gráficos de cobertura por categorías (Logística, PayPal, Soporte, etc.).

### 2. Cola de Revisión (`/admin/academy/review`)
*   **Propuestas Pendientes**: Lista de cursos sugeridos por el chat o importadores.
*   **Acciones Directas**:
    *   *Aprobar*: Publica el conocimiento oficial (`approved`).
    *   *Rechazar*: Marca el conocimiento como descartado (`rejected`).
    *   *Editar*: Abre un editor inline para corregir la lección sugerida antes de guardarla.
*   **Caja de Importación**: Importa texto y crea sugerencias al vuelo.

### 3. Widget en Mission Control (Dashboard)
*   **Sugerencias Pendientes**: Muestra una alerta interactiva si existen propuestas de aprendizaje pendientes en la cola, redirigiendo a la pantalla de revisión.

### 4. Tarjeta en Health Center
*   Muestra el estado activo de la academia, cantidad de lecciones y total de cursos marcados para revisión (`suggested`).
