# Mobile App Stub (/apps/mobile)

Este módulo está reservado para el desarrollo de la futura aplicación móvil nativa de **Alpha**.

## Hoja de Ruta del Canal Móvil

1.  **Canal del Asistente**: Comunicación vía WebSocket/gRPC con el microservicio `/core` de Alpha para respuestas inmediatas e interacciones de voz.
2.  **Notificaciones Push en Tiempo Real**: Envío de alertas de negocio críticas despachadas por `/backend/events` directamente al dispositivo del administrador.
3.  **Mando a Distancia (Mobile Dashboard)**: Interfaz minimalista de gestión de Drops y visualización de telemetría del Health Center.
