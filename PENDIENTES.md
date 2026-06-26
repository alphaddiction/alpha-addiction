# 📋 PENDIENTES - Integración PayPal + Printful

Este documento es la fuente de verdad principal del estado de desarrollo y el roadmap de integración del comercio electrónico para **Alpha Addiction**.

---

## 📋 Estado general del proyecto

*   **Porcentaje aproximado completado:** 75%
*   **Última actualización:** 26/06/2026 15:58
*   **Próximos objetivos:**
    1. Registrar y configurar los Webhooks de producción de PayPal y Printful.
    2. Migrar de base de datos local en JSON a una base de datos relacional (por ejemplo, PostgreSQL/Supabase con Prisma).
    3. Integrar servicio de envío de correos transaccionales (por ejemplo, Resend o SendGrid).
    4. Implementar los cálculos dinámicos de impuestos (IVA/VAT) y envíos basados en la dirección de destino.

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
*   **Tokens**: 🟡 En progreso (Configurado para leer `PRINTFUL_API_TOKEN` de forma dinámica, requiere clave productiva).
*   **Productos**: 🟡 En progreso (Mapeo inicial de variantes completado, requiere sincronización física en catálogo de Printful).
*   **Variant IDs**: ✅ Completada (Mapeo estático de tamaños y artículos configurado).
*   **Sincronización**: 🟡 En progreso (Pruebas de envío de pedidos de pruebas completadas con datos de sandbox).
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

*   **Migración a PostgreSQL/Supabase**: 🔴 Pendiente (Reemplazar la persistencia simulada de `orders.json` por un cliente robusto tipo Prisma u ORM equivalente para entornos serverless multi-instancia).

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
