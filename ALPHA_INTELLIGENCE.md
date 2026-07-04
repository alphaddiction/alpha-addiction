# Alpha Intelligence (Alpha) — Arquitectura y Roadmap v1.1

Bienvenido a la documentación de **Alpha Intelligence (Alpha)**, el cerebro analítico y asistente inteligente de gestión para el ecosistema de marcas digitales Alpha (Alpha Addiction, IAbly, Foedus, etc.).

Alpha Intelligence nace como un producto desacoplado dentro de la infraestructura. Aunque temporalmente reside en el repositorio de Alpha Addiction, su arquitectura ha sido diseñada bajo estrictos principios de separación de responsabilidades para permitir su extracción sencilla hacia un repositorio y microservicio independiente en el futuro.

---

## 📐 Arquitectura del Módulo

El módulo completo se encuentra encapsulado en el directorio [`src/modules/alpha-intelligence/`](file:///c:/Users/alber/alpha-addiction/src/modules/alpha-intelligence/). A continuación, se detalla el propósito de cada subdirectorio:

```
src/modules/alpha-intelligence/
├── types/          # Definiciones e interfaces de TypeScript compartidas.
├── providers/      # Capa abstracta de proveedores de LLM (OpenAI, Gemini).
├── connectors/     # Conectores de lectura seguros para las bases de datos de las marcas.
├── memory/         # Gestor de persistencia del historial de chats en PostgreSQL.
├── context/        # Detector dinámico de la página que está visualizando el administrador.
├── tools/          # Registro de Herramientas independientes (Capabilities) [v1.1].
├── ui/             # Componentes de frontend (Drawer lateral, Botón flotante y atajos).
└── utils/          # Utilidades globales (Sanitización y enmascaramiento de datos).
```

### 1. Capa de Proveedor IA (`providers/`)
*   **Abstracción base (`base-provider.ts`)**: Define el contrato `IAiProvider` mediante el cual el orquestador interactúa con cualquier modelo.
*   **OpenAI Provider (`openai-provider.ts`)**: Realiza llamadas HTTP crudas directas vía `fetch` a `/v1/chat/completions` midiendo la latencia.
*   **Gemini Provider (`gemini-provider.ts`) [v1.1]**: Utiliza la API REST de Google Gemini (v1beta/models/gemini-2.5-flash:generateContent) mediante peticiones directas HTTP sin dependencias SDK externas, midiendo la latencia de forma nativa.
*   **Factory (`factory.ts`)**: Resuelve e instancia el proveedor correspondiente según la configuración activa en el panel de administración.

### 2. Registro de Herramientas e Integración E2E (`tools/`) [v1.1]
Para evitar respuestas inventadas y acoplamientos rígidos de código, Alpha 1.1 introduce un motor extensible de **Capabilities** (Tools):
*   **Contrato de Herramienta (`base-tool.ts`)**: Define la interfaz `AiTool` con `name`, `description`, `parameters`, `requiredPermissions`, y el método asíncrono `execute`.
*   **Orquestador de Herramientas (`registry.ts`)**: Registra, filtra por permisos del administrador y configuración de estado (toggles de base de datos) y despacha las ejecuciones de herramientas de forma segura.
*   **Herramientas Implementadas**:
    1.  `orders`: Consultar estado de facturación y detalles de pedidos en tiempo real.
    2.  `customers`: Buscar registros de clientes e integrantes de la waitlist.
    3.  `finance`: Análisis detallado de ingresos por pasarela y rentabilidad comercial.
    4.  `health`: Diagnóstico técnico de base de datos y estado de servicios.
    5.  `notifications`: Inspeccionar logs de incidencias activas del servidor.
    6.  `mission_control`: Resumen agregador de métricas del ecommerce.

### 3. Conectores Seguros (`connectors/`)
*   La comunicación con la base de datos de Alpha Addiction se realiza a través de [`alpha-addiction-connector.ts`](file:///c:/Users/alber/alpha-addiction/src/modules/alpha-intelligence/connectors/alpha-addiction-connector.ts).
*   Es **estrictamente de solo lectura** (`findMany`, `findFirst`, `count`, `aggregate`). No contiene lógica de escritura, modificación ni borrado, garantizando la seguridad operacional.

### 4. Sanitización y Privacidad (`utils/sanitizer.ts`)
*   Implementa un procesador recursivo que analiza textos u objetos JSON complejos.
*   **Enmascara automáticamente**:
    *   Direcciones de email (`a***@domain.com`).
    *   Números de teléfono y tarjetas de crédito.
    *   Tokens de sesión (JWT) y cabeceras Bearer.
    *   IDs de transacciones PayPal y Printful.
    *   Cualquier propiedad de objeto que contenga palabras clave como `secret`, `password`, `key`, `token` o `auth` es reemplazada por la máscara `[SECRETO_OCULTO_POR_SEGURIDAD]`.

### 5. Detector de Contexto de Ruta (`context/detector.ts`)
*   Detecta automáticamente la URL activa del navegador.
*   Inyecta en tiempo real el contexto actual visualizado por el administrador para enriquecer el system prompt de Alpha.

---

## 🔒 Privacidad y Seguridad

*   **Sin filtración de secretos**: Las API keys de PayPal, Printful, Resend y la base de datos nunca se envían al proveedor de IA.
*   **Auditoría de Herramientas**: Cada ejecución de herramientas queda registrada de forma inalterable en `AuditLog` con la acción `AI_TOOL_EXECUTE`, guardando el nombre de la tool, parámetros pasados, tiempo de ejecución en milisegundos y estado de éxito para su análisis continuo en el Health Center.
*   **Toggles de Seguridad**: Cada herramienta se puede desactivar individualmente por el administrador desde el panel de Configuración para revocar el acceso a datos específicos por parte del modelo LLM.

---

## 🛠️ Plan de Extracción Futura

Cuando se decida mover **Alpha Intelligence** a un servicio independiente, el proceso será directo:

1.  **Mover el backend a un Microservicio**: 
    *   Extraer la carpeta `core/`, `providers/` y `utils/` a una API independiente.
    *   Los archivos `memory/` y `connectors/` dejarán de importar `PrismaClient` local de Alpha Addiction y pasarán a consultar las métricas mediante **endpoints seguros** expuestos por la API de Alpha Addiction, firmados con un token de servicio de Alpha Intelligence.
2.  **Paquetizar el Frontend (SDK)**:
    *   Convertir los componentes de `ui/` en un paquete npm o cargarlo de forma remota. El `<AlphaChatDrawer />` solo requerirá recibir como `props` la URL de la API del microservicio de Alpha Intelligence y el token JWT de sesión del administrador.

---

## 🗺️ Hoja de Ruta (Roadmap)

*   **v1 — Foundation & Consultas**:
    *   Asistente de solo lectura contextualizado en la ruta actual.
    *   Historial de chat en Postgres y configuración global.
*   **v1.1 (Fase Actual) — Capabilities & Tool Calling**:
    *   Motor modular de Herramientas independientes (Capabilities) para consultas en tiempo real.
    *   Auditoría de ejecución de herramientas en `AuditLog`.
    *   Configuración granular de toggles de herramientas en Settings.
    *   Monitorización y telemetría de herramientas en el Health Center.
*   **v2 — Análisis de Tendencias y Negocio**:
    *   Detección de patrones de carritos abandonados.
    *   Alertas predictivas de stock en base a ventas previas.
*   **v3 — Recomendaciones Proactivas**:
    *   Alpha sugiere crear cupones promocionales específicos o lanzar drops si detecta picos en waitlist.
*   **v4 — Acciones con Confirmación**:
    *   Capacidad de realizar acciones solicitadas por el administrador tras mostrar una tarjeta de validación de confirmación en la UI.
