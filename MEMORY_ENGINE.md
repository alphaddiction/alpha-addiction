# Alpha Memory Engine v1.3 — Motor de Memoria Estructurada y Conocimiento

Bienvenido a la documentación técnica de **Alpha Memory Engine (v1.3)**, el sistema de persistencia y recuperación de conocimiento in-context de Alpha Intelligence.

A diferencia de los asistentes conversacionales estándar que cargan historiales de texto planos y redundantes, Alpha cuenta con un motor de memoria de base de datos relacional y de búsqueda selectiva. El motor está diseñado bajo la premisa de **recordar únicamente la información que aporta valor operativo de negocio** (decisiones, preferencias del staff, notas de arquitectura de proyecto), descartando saludos y datos de relleno temporales.

---

## 📐 Tipos de Memoria en la Arquitectura

El motor clasifica la información en 5 niveles de almacenamiento:

1.  **Working Memory**: Memoria efímera conversacional activa que desaparece al finalizar la sesión del administrador.
2.  **Session Memory**: Persistencia corta de entidades en pantalla (último pedido enfocado, último cliente discutido). Caduca tras 30 minutos de inactividad.
3.  **Preference Memory**: Preferencias explícitas de estilo del administrador (ej: respuestas técnicas cortas, formatos en JSON). No expiran.
4.  **Decision Memory**: Registro inalterable de decisiones de negocio y de infraestructura (ej: cambio de proveedor de base de datos, activación de PayPal productivo). No expiran.
5.  **Project Memory**: Conocimiento consolidado sobre hitos, hoja de ruta, drops en curso e integraciones activas del ecommerce. No expira.

---

## 🧠 Clasificación y Scoring de Importancia

Antes de guardar cualquier hecho, el motor lo analiza y asigna un score de relevancia (0 a 100).
*   `decision` ➔ Score 90 (Alta relevancia, persistencia obligatoria)
*   `preference` ➔ Score 80
*   `project` ➔ Score 75
*   `recommendation` ➔ Score 70
*   `session` ➔ Score 30 (Temporal)

### Umbral de Persistencia
Ajustable mediante la variable de base de datos `ai_memory_threshold`. Solo los hechos con importancia igual o superior a este umbral son guardados en PostgreSQL. Por defecto es **40**.

---

## 🔒 Privacidad y Control de Fugas

Antes de escribir en la tabla de base de datos `AiMemory`, toda cadena pasa por la **Capa de Seguridad (Security Layer)**:
*   Sanitización recursiva de contraseñas, claves API keys, tokens y números de tarjeta.
*   No se guardan datos personales de clientes (direcciones completas o teléfonos móviles) en la memoria semántica, protegiendo al ecosistema contra ataques de inyección de prompt indirectas.

---

## 📊 Integraciones en la Consola del Administrador

### 1. Memory Center (`/admin/memory`)
Consola administrativa interactiva para el control total del conocimiento de Alpha. Permite:
*   Visualizar y buscar memorias de forma filtrada por tipo.
*   Registrar de forma manual hechos, decisiones o notas de arquitectura del proyecto.
*   Editar importancia, valores o fechas de expiración.
*   Eliminar registros individuales o vaciar completamente la memoria.
*   Exportar todo el conocimiento en un archivo estructurado JSON.

### 2. Alpha Dashboard (Mission Control)
Se ha integrado el widget de **Alpha Recuerda** en la consola del dashboard principal. Renderiza tres bloques legibles de forma rápida:
*   *Decisiones Recientes* importantes.
*   *Recomendaciones Activas* pendientes de auditoría o SEO.
*   *Notas del Proyecto* sobre drops y hoja de ruta.

### 3. Health Center Card
Reporta el score de salud del motor de memoria, total de memorias guardadas (activas y expiradas en base de datos) y latencia media de las consultas de búsqueda semántica.

---

## 🗺️ Roadmap de Evolución

*   **v1 (Fase Actual) — Memory**: Clasificación por importancia, persistencia en base de datos relacional PostgreSQL, consola Memory Center, inyección contextual selectiva y Widget de Mission Control.
*   **v2 — Embeddings**: Cálculo de embeddings semánticos vectoriales para cada hecho registrado.
*   **v3 — Vector Database**: Almacenamiento indexado en base de datos vectorial (ej. pgvector) para búsquedas de similitud a gran escala.
*   **v4 — Knowledge Graph**: Estructuración del conocimiento de Alpha en grafos de relaciones complejas.
*   **v5 — Multiempresa**: Compartición selectiva de conocimiento y memorias persistentes entre empresas del ecosistema.
