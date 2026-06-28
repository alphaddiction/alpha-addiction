# Walkthrough - Fase X: Centro de Soporte e Inbox de Clientes

He finalizado con éxito la implementación del **Centro de Soporte e Inbox de Clientes** de **Alpha Addiction** para gestionar todas las dudas, quejas, incidencias y solicitudes de soporte directamente desde el panel de control del administrador.

---

## 📊 Arquitectura e Integración

### 1. Modelos de Base de Datos (Neon PostgreSQL)

Se agregaron dos nuevos modelos en [schema.prisma](file:///c:/Users/alber/alpha-addiction/prisma/schema.prisma) y se sincronizaron con Neon DB (`npx prisma db push`):

- **`SupportTicket`**: Almacena el número de caso único (`TK-XXXXX`), datos de cliente, estado (`open`, `pending`, `replied`, `resolved`, `closed`), prioridad (`low`, `normal`, `high`, `urgent`), origen, categorías y relaciones con pedidos.
- **`SupportMessage`**: Almacena el hilo de mensajes (historial completo de conversación), discriminando respuestas oficiales del cliente, respuestas del agente y notas internas privadas (`internalNote`).

---

### 2. Rutas y Formularios Públicos

- **Página de Contacto (`/contacto`)**: Formulario de contacto elegante integrado bajo el diseño de lujo de la tienda (cristal acrílico, fondos puros oscuros `#070707` y bordes dorados). Soporta pre-rellenado automático de número de pedido a través de query params.
- **Módulo de Incidencias en Pedidos (`/pedido/[orderNumber]`)**: Se inyectó un botón interactivo `Contactar sobre este pedido` en la cabecera que redirige al cliente a `/contacto` con el pedido pre-asociado.

---

### 3. API Pública

- **`POST /api/support/contact`**: 
  - Sanitiza todas las entradas del usuario (remueve HTML peligroso).
  - Valida obligatoriedad y formato de correo electrónico.
  - Implementa rate limit de seguridad en memoria (máximo 5 mensajes cada 10 minutos por IP).
  - Si se proporciona un número de pedido, busca en Neon DB. Si el pedido existe y coincide con el correo, lo asocia. Si no coincide o no existe, lanza un error genérico idéntico para **evitar la enumeración de pedidos**.
  - Genera un código correlativo `TK-XXXXX` y crea los registros correspondientes.
  - Despacha una confirmación automática al cliente por email.

---

### 4. API de Administración (Protegida)

- **`GET /api/admin/support/tickets`**: Listar tickets de soporte con filtros por Estado, Prioridad y buscador de texto (`q`).
- **`GET /api/admin/support/tickets/[id]`**: Obtiene el detalle de un ticket y el historial de mensajes ordenados cronológicamente.
- **`PATCH /api/admin/support/tickets/[id]`**: Permite actualizar el estado y prioridad del ticket (registra la fecha `closedAt` y despacha el correo de cierre si se marca como `closed`).
- **`POST /api/admin/support/tickets/[id]/reply`**: Registra la respuesta oficial del agente (vía sesión `alpha_session`), marca el ticket como `replied` y envía el correo al cliente.
- **`POST /api/admin/support/tickets/[id]/note`**: Registra una nota de uso interno (no se notifica al cliente, se resalta visualmente en amarillo en el panel, y marca el estado como `pending`).

---

### 5. Área de Administración

- **Barra Lateral (`components/admin/sidebar.tsx`)**: Nueva opción **Soporte** (icono `MessageSquare`) asociada a la bandeja de entrada.
- **Bandeja de Tickets (`/admin/support`)**: Panel de control con filtros rápidos, buscador de texto, estados en colores de lujo y vista del último mensaje con fecha.
- **Detalle de Conversación (`/admin/support/[id]`)**: Vista en formato chat de toda la conversación, tarjetas con detalles del cliente y pedido enlazado, controles dinámicos de prioridad/estado y pestañas independientes para "Responder al Cliente" y "Añadir Nota Interna".

---

### 6. Email Transaccionales (Resend)

Se agregaron tres nuevas plantillas de email adaptadas al diseño de lujo en `src/lib/email/templates/index.ts`:
1. `getTicketReceivedEmail`: Confirmación de recepción con número `TK-XXXXX` y resumen.
2. `getTicketRepliedEmail`: Transmite la respuesta del agente de soporte dentro de un bloque destacado.
3. `getTicketClosedEmail`: Notificación de caso resuelto y cerrado.

---

### 7. Monitorización en Health Center

Se actualizó el Health API Route (`/api/admin/system/health`) y la vista visual (`/admin/monitoring`) agregando:
- Número de tickets abiertos activos.
- Tickets urgentes pendientes de atención.
- Tickets sin responder.
- Información del último ticket recibido (código y fecha).

---

## 🧪 Guía de Pruebas y Validación

### 1. Formulario de Contacto
- Entra en `/contacto`.
- Rellena con Nombre, Correo, Categoría y Mensaje.
- Envía y verifica la pantalla de éxito con tu número `TK-10001` y el email de confirmación.

### 2. Incidencia con Pedido
- Consulta un pedido válido en `/pedido/[orderNumber]`.
- Pulsa en `Contactar sobre este pedido` y verifica que el campo del número de pedido esté pre-rellenado y la categoría "Incidencia con Pedido" seleccionada.
- Introduce un correo diferente al del pedido y valida el error de protección contra enumeración.
- Introduce el correo correcto de compra y envía. Verifica que en el panel admin el ticket se crea correctamente enlazado al ID del pedido.

### 3. Rate Limit
- Realiza 6 envíos consecutivos desde `/contacto` o mediante scripts y comprueba el bloqueo con respuesta `429 Too Many Requests`.

### 4. Bandeja de Soporte y Gestión
- Accede a `/admin/support`.
- Filtra por estado o prioridad y busca el ticket.
- Accede al detalle, escribe una nota interna y luego envía una respuesta al cliente. Comprueba cómo cambian los estados de forma automatizada y el formato del hilo.

---

## 🚀 Próxima Fase Recomendada

**Fase XI — Integración Inbound Email e Inteligencia de Soporte**:
- **Inbound Email**: Configurar un webhook receptor de correos entrantes de Resend/SendGrid para mapear y responder directamente a los tickets a partir de las respuestas del cliente a los correos transaccionales.
- **Soporte con Adjuntos**: Implementar el backend de subida de imágenes y PDFs en Neon/AWS S3 para capturas de pantalla de incidencias.
