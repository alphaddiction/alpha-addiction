# Memory Engine (/core/memory)

Este módulo gestiona la persistencia e historial conversacional en 5 niveles modulares:
1.  **Conversacional Activo (PostgreSQL)**: Guardado inmediato en base de datos.
2.  **Efímero / Sesión Corta**: Datos temporales de la sesión.
3.  **Contextual / Ruta Visualizada**: Variables del drawer y la página actual.
4.  **Cross-Proyecto**: Memoria compartida del ecosistema.
5.  **Permanente (Vectorial)**: Memoria a largo plazo.
