# Config Subsystem (/config)

Este módulo almacena las configuraciones estáticas del negocio y las validaciones de las variables de entorno de la plataforma.

## Estructura de Directorios

*   **`config.ts`**: Configuración centralizada de las variables operativas de la marca y del Order Management System (OMS) [Alpha Addiction]. Define monedas, impuestos, envíos y toggles de proveedores activos (PayPal, Printful, Resend).
*   **`env/`**: Esquemas de control y carga del entorno.
    *   `admin-env.ts`: Validación estructurada de variables secretas de entorno (Neon, Sentry, PayPal, Printful, Resend).
