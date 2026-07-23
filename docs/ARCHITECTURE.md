# Documentación de Arquitectura de Alpha — Logical Monorepo

Bienvenido a la documentación de arquitectura oficial de **Alpha**, el núcleo inteligente del ecosistema. Esta guía detalla la organización lógica del proyecto, sus flujos de datos internos, y cómo se ha preparado la infraestructura para escalar hacia millones de conversaciones en el futuro.

---

## 📐 Principio de Diseño: Monorepo Lógico

Para cumplir con las políticas operativas del ecommerce, el proyecto opera como un **Monorepo Lógico** bajo una única configuración de Node.js y compilación de Next.js, pero con una separación física estricta de responsabilidades:

```
[ Proyecto Raíz ]
 ├── /apps            <-- Puntos de entrada lógicos de UI y vistas
 ├── /backend         <-- Capa transaccional, APIs, colas y persistencia
 ├── /core            <-- Motores cognitivos de la Inteligencia de Alpha
 ├── /shared          <-- Modelos comunes, utilidades y tipados TypeScript
 ├── /config          <-- Variables y configuraciones operativas de marcas
 └── /src/app         <-- Capa de enrutamiento físico y pegamento Next.js
```

Esta separación garantiza que el Core de la IA (`/core`) sea completamente agnóstico al canal de comunicación (web, admin o app móvil) y a las llamadas directas de base de datos transaccionales (`/backend`).

---

## 🔄 Flujo de Datos Cognitivo

Cada vez que un usuario o un sistema interactúa con Alpha, la petición sigue este pipeline secuencial y desacoplado:

```
                  [ Canal de Entrada ] (Web, Mobile, Admin API)
                           │
                           ▼
                     [ /core/Context ]
            (Agregación de ruta visualizada e historial)
                           │
                           ▼
                  [ /core/Personality ]
            (Ajuste de tono de lujo e System Prompt)
                           │
                           ▼
                   [ /core/Reasoning ]
      ┌────────────────────┴────────────────────┐
      ▼                                         ▼
[ /core/Knowledge ]                     [ /core/Memory ]
(Búsqueda en Grafo RAG)            (Carga de historial de chat)
      └────────────────────┬────────────────────┘
                           │
                           ▼
                  [ /core/Identity ]
            (Cargador de Proveedores de LLM)
                           │
                           ▼
                [ Proveedor de IA / LLM ]
                           │
                           ▼
             [ Ejecución de Herramientas ] (Capabilities)
             (Llamadas controladas a /backend/api, etc.)
                           │
                           ▼
                  [ /backend/Database ]
             (Guardado de logs y mensajes de chat)
                           │
                           ▼
                    [ Canal de Salida ]
```

---

## 📂 Descripción de Módulos y Capas

### 1. `/apps`
Contiene la lógica exclusiva de interfaz de usuario de las distintas plataformas del ecosistema.
*   `web`: El e-commerce enfocado al cliente final (carreras de compra, pasarelas de pago).
*   `admin`: Consola interna para monitorización de ventas, stock, configuración y chat drawer con Alpha.
*   `mobile`: Futura integración para dispositivos móviles nativos.

### 2. `/backend`
Servicios de backend puros y utilidades transaccionales de infraestructura.
*   `api`: Clientes para interactuar con proveedores externos (Printful, PayPal Checkout).
*   `database`: Cliente Prisma centralizado y lógica de persistencia.
*   `auth`: Controladores de sesión, verificación de tokens y protección 2FA.
*   `events`: Broker interno que despacha callbacks de negocio (`order_created`, `waitlist_registered`).
*   `scheduler`: Automatización de tareas rutinarias en segundo plano (cron stubs).
*   `notifications`: Envío de alertas y mensajería transaccional vía Resend.

### 3. `/core`
El cerebro y la pila de motores cognitivos de Alpha.
*   `identity`: Gestión de tokens, definición del agente y capa abstracta de LLMs.
*   `memory`: Memoria evolutiva en 5 niveles (de PostgreSQL relacional a bases vectoriales).
*   `reasoning`: Enrutador de intenciones, planificador y pipeline de ejecución de herramientas.
*   `initiative`: Capacidad de Alpha de disparar interacciones proactivas basadas en eventos de negocio.
*   `personality`: Formateador del Prompt del Sistema forzando guías de marca elegantes y sobrias.
*   `voice`: Motores de procesamiento bidireccional de voz.
*   `goals`: Orquestador de objetivos y tareas de larga duración.
*   `context`: Detector en tiempo real de la página que está visualizando el administrador.
*   `knowledge`: Grafo de propiedades relacionales del negocio para RAG libre de alucinaciones.

### 4. `/shared`
Componentes lógicos y funciones utilitarias que sirven a todo el proyecto.
*   `types`: Definiciones tipadas estáticas compartidas.
*   `utils`: Validaciones comunes, formateadores y sanitizador de seguridad.
*   `models`: Lógica de reglas de negocio para entidades (cálculos de pedidos, reglas de cupones).

### 5. `/config`
Variables globales operativas y validaciones de variables de entorno para control multi-marca.

---

## 📈 Preparado para Millones de Conversaciones (Escalabilidad)

La arquitectura de Alpha se ha diseñado para soportar millones de conversaciones asíncronas concurrentes gracias a:

1.  **Capa de Abstracción de Datos (DAL)**: El motor de conocimiento (`/core/knowledge`) y memoria (`/core/memory`) exponen APIs limpias (`upsertEntity`, `getNeighbors`). Esto permite sustituir PostgreSQL por motores de grafos nativos (ej. Neo4j) y bases vectoriales distribuidas sin alterar el orquestador principal.
2.  **Stateless Reasoning**: El motor de razonamiento de Alpha no retiene estado en memoria de servidor. Todo el contexto es re-ensamblado al vuelo en el pipeline, permitiendo escalar de forma horizontal (servidores sin estado / Serverless Edge).
3.  **Sanitización Premura**: El sanitizador bloquea información privada a nivel de entrada, reduciendo el tamaño de los prompts enviados a los modelos de lenguaje de terceros y protegiendo la latencia del canal de red.
