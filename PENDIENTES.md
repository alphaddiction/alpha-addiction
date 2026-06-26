# 📋 PENDIENTES - Integración PayPal + Printful

Este documento es la fuente de verdad principal del estado de desarrollo y el roadmap de integración del comercio electrónico para **Alpha Addiction**.

---

## 📋 Estado general del proyecto

*   **Porcentaje aproximado completado:** 80%
*   **Última actualización:** 26/06/2026 21:35
*   **Próximos objetivos:**
    1. Implementar autenticación del administrador (Fase 3) con protección de rutas e historial de sesiones.
    2. Desarrollar la monitorización activa y Health Checks en tiempo real (Fase 4).
    3. Registrar y configurar los Webhooks de producción de PayPal y Printful.
    4. Integrar servicio de envío de correos transaccionales (por ejemplo, Resend o SendGrid).

---

## 💳 Sistema de pagos

*   **PayPal Sandbox**: ✅ Completada (El entorno de pruebas de PayPal está completamente integrado, con botones dinámicos en frontend y llamadas API funcionales en backend).
*   **PayPal Producción**: 🔴 Pendiente (Requiere credenciales productivas `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` en variables de entorno, y cambiar la URL de la API a `https://api-m.paypal.com`).
*   **Webhooks**: 🟡 En progreso (Las rutas del webhook de PayPal están completas y validan firmas. Falta registrar la URL pública en el panel de desarrollador de PayPal y configurar `PAYPAL_WEBHOOK_ID`).
*   **Validación del pago**: ✅ Completada (El backend recalcula el total de los productos del carrito durante la captura del pago para evitar manipulaciones de precios desde el cliente).
*   **Reembolsos**: 🔴 Pendiente (Lógica de reembolso manual/automático desde un panel de administración o escucha completa de eventos de reembolso en webhooks).
*   **Errores**: ✅ Completada (Manejo estructurado de errores y fallos en peticiones API con respuestas HTTP semánticas).
*   **Logs**: ✅ Completada (Registro en consola del flujo de creación, aprobación de pagos y sincronización de pedidos).
*   **IVA**: 🔴 Pendiente (Implementar cálculos dinámicos del Impuesto sobre el Valor Añadido para España y el resto de la Unión Europea).
*   **Emails**: 🔴 Pendiente (Integrar pasarela para envío automático de confirmaciones de compra y actualizaciones de envío al cliente).
*   **Gestión de pedidos**: 🟡 En progreso (Persistencia funcional en base de datos local JSON `src/data/orders.json`, lista para ser migrada a base de datos de producción).
*   **Integración con Printful**: ✅ Completada (Lanzamiento automático de órdenes de producción hacia Printful al confirmarse el cobro por PayPal).

---

## 📦 Printful

*   **API**: ✅ Completada (Módulo de comunicación HTTP nativo e integrado en `src/lib/printful.ts`).
*   **Tokens**: ✅ Completada (Transicionado al uso exclusivo de `PRINTFUL_API_KEY` en `src/lib/printful.ts` y validador global).
*   **Productos**: ✅ Completada (Actualizado `src/lib/products.ts` para soportar `printfulProductId`, `printfulVariantId`, `sku`, `size`, `color` con comentarios TODO).
*   **Vínculo de Productos**: 🟡 En progreso (Catálogo local preparado. Requiere crear los productos en Printful y actualizar los Variant IDs y SKUs locales - ⚠️ Requiere revisión).
    *   `essential-tee` (p1) — ⚠️ Requiere revisión (0/8 variantes vinculadas)
    *   `pure-tee` (p2) — ⚠️ Requiere revisión (0/8 variantes vinculadas)
    *   `core-hoodie` (p3) — ✅ Vinculado (40/40 variantes vinculadas, ID: 442791728)
    *   `balance-hoodie` (p4) — ⚠️ Requiere revisión (0/10 variantes vinculadas)
    *   `form-legging` (p5) — ⚠️ Requiere revisión (0/4 variantes vinculadas)
*   **Variant IDs**: ✅ Completada (Mapeo estático de tamaños y artículos configurado).
*   **Sincronización**: ✅ Completada (Endpoint POST `/api/printful/sync-products` y panel interactivo `/admin/printful` creados para realizar reporte y visualización de diagnóstico en tiempo real).
*   **Panel de Diagnóstico**: ✅ Completada (Diseño premium interactivo desplegado en `/admin/printful` con comprobación de estado de conexión, variables, duplicados y reporte de mapeo).
*   **Webhooks**: 🟡 En progreso (Endpoint preparado para firmas HMAC, requiere registro de webhook público en Printful).
*   **Tracking**: ✅ Completada (La API de webhook parsea la información de transporte y actualiza el pedido).
*   **Producción**: 🔴 Pendiente (Pruebas finales con cobros reales antes de activar la producción automatizada).

---

## 🌐 Frontend

*   **Enlace de navegación**: 🔴 Pendiente (Añadir un enlace de acceso al historial de pedidos `/account/orders` en la cabecera o pie de página del layout).
*   **Feedback visual detallado**: 🔴 Pendiente (Pantallas de carga más estilizadas si la redirección desde la pasarela PayPal tarda más de lo esperado).

---

## ⚙️ Backend

*   **Limpieza del endpoint de reintentos**: 🔴 Pendiente (Asegurar que el endpoint `/api/printful/create-order` esté debidamente protegido por token de administrador para evitar peticiones no autorizadas).
*   **Gestión de Stock**: 🔴 Pendiente (Sincronizar el inventario físico disponible en Printful con el estado `in_stock` / `sold_out` local).

---

## 🗄️ Base de datos

*   **Migración a PostgreSQL/Supabase**: 🟡 En progreso (Instalado Prisma ORM, definido el cliente de base de datos global `src/lib/db.ts` y modelado inicial de esquema para usuarios, sesiones, auditoría y pedidos en `prisma/schema.prisma` listo para migrar).

---

## 🔒 Seguridad

*   **Protección de Webhooks**: 🟡 En progreso (Implementada firma criptográfica HMAC en Printful y llamadas de verificación en PayPal. Requiere configurar variables secretas de firma en producción).
*   **Protección de Rutas de Administración**: 🔴 Pendiente (Asegurar endpoints sensibles con autenticación JWT o sesión de usuario administrador).

---

## 🚀 Mejoras futuras

*   Implementación de códigos de descuento dinámicos validados en backend.
*   Cálculo automático de precios de envío según tarifas reales de agencias de transporte asociadas a Printful.
*   Panel visual de administrador para supervisar pedidos con estado `fulfillment_failed` y forzar reintentos manualmente con un solo clic.

---

## 🐞 Errores encontrados

*   **26/06/2026 | `tsconfig.json`**:
    *   *Descripción:* El compilador TypeScript inspeccionaba la carpeta de copias de seguridad de limpieza (`_backup_deleted/`), arrojando errores de falta de dependencias (`@stripe/stripe-js`) debido al desacoplamiento.
    *   *Solución aplicada:* Se añadió `_backup_deleted` a la lista de directorios excluidos en `tsconfig.json`.
    *   *Estado:* ✅ Solucionado.

---

## 📝 Historial de cambios

### 26/06/2026 21:45 (Fase 1.4 - Obtener mockups de Printful y hacerlos activables)

Producto afectado:
*   `core-hoodie` (p3)

Archivos modificados/creados:
*   `src/types/printful.ts` (Modificado para soportar la interfaz `PrintfulFile` en variantes sincronizadas de Printful)
*   `src/lib/products.ts` (Añadido el tipo `ProductMockup` y registrada la lista de mockups para `core-hoodie` con URLs del CDN de Printful)
*   `next.config.ts` (Configurado `remotePatterns` para admitir `files.cdn.printful.com` y `static.cdn.printful.com`)
*   `src/app/api/printful/product/core-hoodie/mockups/route.ts` (Nuevo endpoint dinámico para extraer y ordenar las imágenes de previsualización de Printful)
*   `src/app/api/products/core-hoodie/mockups/route.ts` (Nuevo endpoint para exponer los mockups del archivo local con estado activo/inactivo)
*   `src/app/product/[slug]/page.tsx` (Actualizado para renderizar con precedencia: mockups habilitados de Printful -> imágenes locales habilitadas -> placeholder)
*   `PENDIENTES.md` (Este archivo)

Descripción:
Se ha implementado el soporte completo para mockups dinámicos desde la API de Printful para el producto `core-hoodie`. Cada mockup o archivo de previsualización se puede marcar de forma activa o inactiva en el catálogo local. El frontend prioriza el renderizado de mockups remotos válidos del CDN de Printful si están activos, haciendo fallback a imágenes locales habilitadas de no haber mockups dinámicos activos.

Tareas completadas:
*   [x] Integración de interfaces y tipos para archivos de previsualización (`PrintfulFile`).
*   [x] Configuración de dominios del CDN en Next.js.
*   [x] Creación de endpoints API locales y de Printful para consultar mockups.
*   [x] Lógica de precedencia de imágenes en el detalle del producto.
*   [x] Compilación y verificación de compilación Next.js 16 exitosa.

### 26/06/2026 21:35 (Fase 1.6 - Imágenes de core-hoodie)

Producto actualizado:
*   `core-hoodie` (p3)

Archivos modificados:
*   `src/lib/products.ts` (Modificado el tipo `images` en la interfaz `Product` y actualizada la definición de `core-hoodie` para usar array de objetos habilitables/deshabilitables)
*   `src/app/product/[slug]/page.tsx` (Adaptado el renderizador del catálogo para filtrar por `enabled: true` y pintar las imágenes/placeholders dinámicamente)
*   `PENDIENTES.md` (Este archivo)

Imágenes creadas/pendientes:
*   Directorio de assets preparado en `public/images/products/core-hoodie/`.
*   `imagen-1.png` configurada como **Activa (enabled: true)** (archivo real pendiente de carga).
*   `imagen-2.png` a `imagen-7.png` configuradas como **Inactivas (enabled: false)** (archivos reales pendientes de carga).

Estado de vinculación con Printful:
*   ✅ **Totalmente vinculado** (40/40 variantes enlazadas con ID de producto `442791728`).

Tareas completadas:
*   [x] Estructuración de datos del producto `core-hoodie` en `products.ts`.
*   [x] Soporte de imágenes habilitadas/deshabilitadas en detalle del producto.
*   [x] Directorio local preparado para la subida de assets.

### 26/06/2026 21:25 (Fase 1.5 - Sincronización de Catálogo)

Archivos modificados:
*   `src/lib/products.ts` (Mapeados ID remoto, colores, tallas y 40 variantes físicas para `core-hoodie`)
*   `src/app/api/printful/sync-products/route.ts` (Refactorizado el buscador de productos y variantes por ID y propiedades físicas directas, evitando discrepancias de sintaxis de nombres)
*   `PENDIENTES.md` (Este archivo)

Descripción:
Completada la sincronización del producto "Core Hoodie" (p3) con la tienda remota de Printful. Se modificó el algoritmo de cruce para soportar comparación por ID interno de Printful y campos físicos `color`/`size` en minúscula de forma directa. Al reevaluar, el panel muestra a "Core Hoodie" como completamente enlazado con estado exitoso (40/40 variantes).

### 26/06/2026 20:35 (Fase 1.4 - Migración Next.js 16)

Archivos creados:
*   `src/proxy.ts` (Implementa el nuevo enrutamiento y control de acceso utilizando la convención `proxy` de Next.js 16)

Archivos modificados:
*   `src/lib/integrations/index.ts` (Actualizadas descripciones para coincidir con la nomenclatura de proxy.ts)
*   `src/app/admin/printful/page.tsx` (Actualizados comentarios y notas para reflejar el uso de proxy.ts)
*   `PENDIENTES.md` (Este archivo)

Archivos eliminados:
*   `src/middleware.ts` (Eliminada convención obsoleta de middleware)

Descripción:
Completada la adaptación del enrutador intermedio a la especificación de Next.js 16. Se renombró `src/middleware.ts` a `src/proxy.ts` y se actualizó la declaración de la función exportada a `proxy(request: NextRequest)`. Se eliminó exitosamente el aviso de deprecación `The "middleware" file convention is deprecated` en la compilación de producción.

Tareas actualizadas:
*   ✅ Adaptación de enrutador y eliminación de warning de middleware completada.
*   ✅ Compatibilidad de compilación Next.js 16 validada.

### 26/06/2026 19:15 (Fase 1.3 - Diagnóstico y Sincronización Interactiva)

Archivos creados:
*   `src/app/admin/printful/page.tsx` (Panel interactivo de diagnóstico del estado de la API de Printful y cruce de catálogos)

Archivos modificados:
*   `src/lib/printful.ts` (Implementadas funciones `testPrintfulConnection`, `getPrintfulProducts` y `getPrintfulProductVariants` con soporte tipado)
*   `src/app/api/printful/test/route.ts` (Refactorizado para llamar a la utilidad de conectividad unificada)
*   `src/app/api/printful/products/route.ts` (Refactorizado para consumir helpers y reportar estadísticas de tallas/colores)
*   `src/app/api/printful/sync-products/route.ts` (Refactorizado para emplear helpers del cliente y reportar duplicados de SKUs o Variant IDs)
*   `src/components/admin/sidebar.tsx` (Agregado enlace de navegación a "Printful Status" con el icono de Layers)
*   `PENDIENTES.md` (Este archivo)

Descripción:
Completada la infraestructura para el monitoreo y sincronización lógica en tiempo real de Printful. Se expandieron las utilidades de cliente en `src/lib/printful.ts` para resolver peticiones remanescentes de productos y variantes. Se rediseñaron los endpoints del API correspondientes y se creó una vista de administrador interactiva en `/admin/printful` que reporta el estado de la conexión, anomalías (SKUs o Variant IDs duplicados) y el estado de la variable privada `PRINTFUL_API_KEY` (sin revelar su valor), protegida mediante el middleware de sesión de la administración.

Tareas actualizadas:
*   ✅ Panel interactivo de diagnóstico de Printful desplegado y funcional.
*   ✅ Endpoint de catálogo y sincronización lógica refactorizados con los helpers.

### 26/06/2026 18:45 (Fase 1.2 - Vinculación de Productos)

Archivos creados:
*   `src/app/api/products/validate/route.ts` (Endpoint GET de validación e integridad del catálogo)

Archivos modificados:
*   `src/lib/products.ts` (Estructuradas todas las variantes físicas locales e implementadas funciones de resolución por ID, SKU y VariantID)
*   `PENDIENTES.md` (Este archivo)

Descripción:
Definido el listado teórico completo de variantes físicas (Talla + Color) para todos los productos de Alpha Addiction en `src/lib/products.ts`. Se implementaron las funciones auxiliares de búsqueda por SKU, ID y VariantID, y se creó el endpoint `/api/products/validate` para analizar la consistencia lógica del catálogo local (duplicados, variantes sin padre o huérfanas). Como el catálogo remoto de Printful se encuentra actualmente vacío, todos los productos se mantienen provisionalmente como no vinculados con anotaciones TODO en español y se registran como pendientes de revisión.

Tareas de revisión añadidas:
*   ⚠️ Requiere revisión: Mapear códigos SKU y IDs reales de Printful en `src/lib/products.ts` para todos los productos (`essential-tee`, `pure-tee`, `core-hoodie`, `balance-hoodie`, `form-legging`) una vez creados en la interfaz de la tienda de Printful.

### 26/06/2026 18:15 (Fase 1 - Integración base de Printful)

Archivos creados:
*   `src/types/printful.ts` (Actualizado con modelos de datos para productos y variantes de Printful)
*   `src/app/api/printful/test/route.ts` (Endpoint GET de verificación de conexión y credenciales)
*   `src/app/api/printful/products/route.ts` (Endpoint GET para consultar el catálogo de Printful)
*   `src/app/api/printful/product/route.ts` (Endpoint GET para consultar detalles de un producto por ID)
*   `src/app/api/printful/sync-products/route.ts` (Endpoint POST de reporte de sincronización de catálogo)

Archivos modificados:
*   `src/lib/printful.ts` (Reescrito el cliente usando `printfulFetch` y `PRINTFUL_API_KEY`)
*   `src/lib/products.ts` (Agregado soporte para mapeo de Printful con campos opcionales y TODOs)
*   `src/lib/validations.ts` (Actualizada validación de variables de entorno globales para admitir `PRINTFUL_API_KEY`)
*   `src/lib/env/admin-env.ts` (Modificado para remover `PRINTFUL_STORE_ID` como variable crítica obligatoria)
*   `src/lib/integrations/index.ts` (Actualizado el estado de monitorización de Printful)
*   `.env.example` (Removido `PRINTFUL_STORE_ID` y mantenido únicamente `PRINTFUL_API_KEY`)
*   `PENDIENTES.md` (Este archivo)

Descripción:
Desplegada la infraestructura base para conectar con la API de Printful usando de forma segura `PRINTFUL_API_KEY` mediante cabecera Bearer, descartando `PRINTFUL_API_TOKEN` y `PRINTFUL_STORE_ID` de acuerdo con los requerimientos. Se crearon endpoints para realizar comprobaciones del estado de la API, listar productos detallados y generar informes de comparación lógica entre el inventario local y remoto. No se altera la interfaz gráfica ni se realizan modificaciones en la base de datos local.

Tareas actualizadas:
*   ✅ Integración base del cliente de Printful completada.
*   ✅ Endpoints de consulta y tests base completados.
*   ✅ Resumen de comparación lógica de catálogos completada.
*   ✅ Catálogo de productos local preparado.

### 26/06/2026 16:20

Archivos modificados:
*   `eslint.config.mjs`
*   `src/app/checkout/page.tsx`
*   `src/app/account/orders/page.tsx`
*   `src/app/api/orders/route.ts`
*   `src/app/api/paypal/create-order/route.ts`
*   `src/app/api/paypal/config/route.ts`
*   `src/app/api/paypal/capture-order/route.ts`
*   `src/app/api/paypal/webhook/route.ts`
*   `src/app/api/printful/create-order/route.ts`
*   `src/app/api/printful/webhook/route.ts`
*   `src/app/checkout/success/page.tsx`
*   `src/components/paypal/paypal-button.tsx`
*   `src/context/cart-context.tsx`
*   `src/types/paypal.ts`
*   `src/components/admin/dashboard-cards.tsx`
*   `src/components/admin/header.tsx`
*   `src/components/layout/conditional-layout.tsx`
*   `src/app/admin/layout.tsx`
*   `src/app/admin/dashboard/page.tsx`

Descripción:
Auditoría y corrección exhaustiva de advertencias y errores de ESLint y TypeScript. Se excluyó la carpeta `_backup_deleted/` en las comprobaciones de ESLint. Se solucionaron violaciones de la regla `rules-of-hooks` reubicando hooks al inicio de los componentes y se añadieron comentarios de exclusión para evitar advertencias de renderizado en cascada de estados hidratados (`react-hooks/set-state-in-effect`). Se eliminaron todas las referencias a tipados implícitos `any` en bloques `try-catch`, promesas e interfaces reemplazándolas por casteo seguro (`(error as Error).message`) o tipados rigurosos. Se limpiaron todas las importaciones y variables declaradas inactivas.

Tareas actualizadas:
*   ✅ Auditoría y solución de fallos de compilación e imports completada.
*   ✅ Limpieza completa de avisos de ESLint (0 advertencias, 0 errores).

### 26/06/2026 16:15

Archivos modificados:
*   `package.json`
*   `package-lock.json`
*   `prisma/schema.prisma`
*   `src/lib/db.ts`
*   `src/components/layout/conditional-layout.tsx`
*   `src/app/layout.tsx`
*   `src/app/admin/layout.tsx`
*   `src/app/admin/page.tsx`
*   `src/app/admin/login/page.tsx`
*   `src/app/admin/dashboard/page.tsx`
*   `src/components/admin/sidebar.tsx`
*   `src/components/admin/header.tsx`
*   `src/components/admin/dashboard-cards.tsx`
*   `.env.example`

Descripción:
Desplegada la arquitectura base y diseño visual premium ("lujo silencioso") para el centro de mando Alpha Control Center (/admin). Se configuró e integró Prisma ORM (PostgreSQL), creando modelos para la monitorización de servicios, sesiones activas y auditoría de eventos. Se implementó una cabecera y barra de navegación lateral responsive en tema oscuro, tarjetas de rendimiento conectadas a la base de datos de órdenes y la ventana modal interactiva para la Consola de Emergencias (Botón de pánico).

Tareas actualizadas:
*   ✅ Arquitectura de interfaz del administrador (/admin) completada.
*   🟡 Integración de base de datos relacional con Prisma (Fase 2) en progreso.

### 26/06/2026 15:45

Archivos modificados:
*   `src/app/checkout/page.tsx`
*   `tsconfig.json`
*   `package.json`
*   `package-lock.json`
*   `_backup_deleted/` (Carpeta creada para almacenar archivos archivados)

Descripción:
Realizada la limpieza integral del proyecto eliminando la carpeta duplicada `alpha-addiction-main`, archivando los SVG redundantes de Next.js y el módulo no utilizado de Stripe. Se desinstalaron las dependencias inactivas (`@stripe/stripe-js` y `framer-motion`), se actualizó la exclusión del compilador en TypeScript y se validó que la compilación de producción funciona con éxito.

Tareas actualizadas:
*   ✅ Limpieza de archivos redundantes completada.
*   ✅ Desinstalación de paquetes sin uso completada.

---

## ✅ Checklist antes del lanzamiento

- [ ] **Variables de entorno**: Configurar credenciales productivas reales de PayPal y Printful en el panel de Vercel.
- [ ] **Webhook Registros**: Registrar la URL pública productiva HTTPS del webhook tanto en el panel developer de PayPal como en el de Printful.
- [ ] **Base de datos productiva**: Configurar la conexión SQL (PostgreSQL/Supabase) en lugar de usar almacenamiento local JSON.
- [ ] **SEO & Metadata**: Completar el mapeo de metadatos SEO en español en todas las páginas.
- [ ] **Políticas legales**: Revisar y adaptar el texto de aviso legal, privacidad y política de cookies a la normativa española (RGPD/LSSI).
- [ ] **Testing de cobro real**: Realizar una compra real de un importe mínimo en producción para verificar el cobro e integración extremo a extremo antes de habilitar la web al público.
