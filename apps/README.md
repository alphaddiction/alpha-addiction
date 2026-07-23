# Aplicaciones (/apps)

Este directorio agrupa los distintos puntos de entrada y componentes visuales de las aplicaciones clientes del ecosistema de Alpha.

## Estructura de Directorios

*   **`web/`**: Contiene la documentación y guías para el e-commerce principal orientado a los clientes finales (rutas bajo `/` en `src/app`).
*   **`admin/`**: Contiene los componentes y vistas lógicas exclusivas del panel de administración del negocio.
    *   `components/`: Componentes compartidos de administración.
        *   `alpha-chat-drawer.tsx`: Interfaz del chatdrawer flotante y atajos rápidos del asistente inteligente para el administrador.
*   **`mobile/`**: Placeholder y notas técnicas de integración para la futura aplicación nativa (iOS/Android).

## Flujo de Integración en el Monorepo Lógico

Para mantener la compatibilidad con el servidor de desarrollo y producción sin alterar la estructura preestablecida de Node.js:
1.  **Enrutamiento Físico**: Los controladores y enrutadores de vistas residen en `src/app`.
2.  **Lógica de Vistas**: Las páginas importan la interfaz y componentes de comportamiento desde `@/apps/web` y `@/apps/admin` respectivamente, permitiendo un crecimiento modular limpio.
