# Backend Subsystem (/backend)

Este módulo contiene todos los componentes transaccionales, APIs, lógica de persistencia, autenticación y servicios de soporte del backend de Alpha.

## Estructura de Directorios

*   **`api/`**: Integraciones con APIs y servicios de terceros.
    *   `paypal.ts`: Gestión de cobros, órdenes y pasarela de PayPal Checkout.
    *   `printful.ts`: Sincronización de catálogo y automatización de envíos y fabricación bajo demanda.
    *   `integrations.ts`: Orquestador y comprobador de salud del ecosistema (Base de datos, PayPal, Printful, Resend, Vercel).
*   **`database/`**: Motor de persistencia y base de datos relacional.
    *   `db.ts`: Cliente Prisma instanciado para Neon Serverless PostgreSQL.
*   **`auth/`**: Mecanismos de seguridad y validación de sesiones.
    *   `auth-node.ts`: Funciones criptográficas y almacenamiento seguro.
    *   `auth-tokens.ts`: Generación y validación de tokens de sesión JWT.
    *   `auth-2fa.ts`: Gestión de tokens temporales de doble factor (2FA/TOTP).
    *   `lookup-auth.ts`: Autenticación para el portal de clientes sin contraseña.
    *   `portal-auth.ts`: Validación de tokens de clientes y pedidos.
*   **`events/`**: Broker interno y controladores de eventos.
    *   `dispatcher.ts`: Despachador de eventos asíncronos en tiempo real.
    *   `handlers/`: Callbacks específicos de negocio (`order_created`, `waitlist_registered`, `payment_confirmed`).
*   **`scheduler/`**: Planificación de tareas recurrentes.
    *   `scheduler.ts`: Automatizaciones en segundo plano y verificación de salud de la plataforma.
*   **`notifications/`**: Cola y canal de envío de alertas.
    *   `service.ts`: Controlador de alertas del sistema.
    *   `email/`: Motor transaccional de correo HTML (Resend API client).
