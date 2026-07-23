# Shared Module (/shared)

Este módulo agrupa todos los componentes, modelos de negocio, utilidades de seguridad y tipados comunes que son consumidos transversalmente por todas las aplicaciones y servicios de soporte.

## Estructura de Directorios

*   **`types/`**: Definiciones tipadas de TypeScript para la interoperabilidad estática.
    *   `order.ts`: Interfaces de pedidos y transacciones.
    *   `paypal.ts`: Tipos del API de PayPal Checkout.
    *   `printful.ts`: Tipos del API de Printful.
    *   `ai.ts`: Estructuras y contratos del Core de IA (respuestas, proveedores, configuración).
*   **`utils/`**: Funciones auxiliares reutilizables.
    *   `logger.ts`: Logger unificado con formato minimalista y auditoría de eventos.
    *   `utils.ts`: Formateadores de fecha, precios, etc.
    *   `validations.ts`: Validaciones y esquemas comunes.
    *   `sanitizer.ts`: Motor de enmascaramiento recursivo de datos privados y secretos para seguridad de prompts.
*   **`models/`**: Lógica y reglas de negocio puras.
    *   `products.ts`: Reglas operativas y mockups de productos.
    *   `products-server.ts`: Resolutores de catálogo de servidor y Printful.
    *   `orders.ts`: Cálculos matemáticos de pedidos, impuestos y envíos.
    *   `discounts.ts`: Reglas de cupones de descuento y control de redenciones.
    *   `drops.ts`: Reglas operativas de estados y lanzamientos de Drops.
