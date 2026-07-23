# SECURITY OS - Arquitectura Segregada de Seguridad de Alpha

## Filosofía Zero Trust

La arquitectura de seguridad de Alpha parte de la premisa de que **cualquier componente del sistema puede ser comprometido en el futuro**. Si un módulo del backend o de IA falla, el atacante no debe poder comprometer la identidad completa de Alpha, extraer la base de datos cruda o inyectar código dañino sin ser detectado.

Para lograr esto, **Security OS** se subdivide en tres subsistemas completamente independientes:

```
                  [ SECURITY OS ]
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
[ Identity Security ] [ Data Security ]  [ Behavior Security ]
(Acceso y Roles)      (Cifrado y Masks)  (Cortafuegos Constitucional)
```

---

## Subsistemas de Seguridad

### 1. Identity Security
*   **Responsabilidad**: Autenticación del administrador, control de accesos basado en roles (RBAC) y firmado digital de tokens de sesión y de justificaciones de plan.
*   **Criterio**: Todo mensaje en el `CognitiveBus` debe ir acompañado de una firma de contexto autenticada. Las capacidades con alto `constitutionalCost` requieren tokens firmados por el rol de súper-administrador.

### 2. Data Security
*   **Responsabilidad**: Cifrado en reposo (AES-256-GCM para secretos de base de datos) y en tránsito.
*   **Sanitización Local (Scrubbing)**: Un motor local analiza los strings y objetos antes de ser enviados a los orquestadores LLM de terceros, reemplazando correos, teléfonos y API keys por tokens opacos temporales.

### 3. Behavior Security (Seguridad Constitucional)
*   **Responsabilidad**: Cortafuegos de comportamiento de Alpha.
*   **Análisis Antimalicioso**: Monitoriza de forma pasiva las propuestas de plan generadas por la IA. Valida de forma estricta los parámetros y el comportamiento planificado contra `The Constitution`. Si detecta anomalías lógicas (como un plan de cupones con descuento del 100% o la inyección de comandos no autorizados), bloquea el hilo inmediatamente y alerta al administrador.
