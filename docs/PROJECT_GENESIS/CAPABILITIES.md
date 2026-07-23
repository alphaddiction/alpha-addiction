# CAPABILITY REGISTRY - Catálogo de Habilidades Lógicas

## Concepto de Capability

Alpha nunca asume que puede realizar una acción física o lógica. En su lugar, el planificador consulta el **Capability Registry** antes de diseñar cualquier plan de ejecución.

Una **Capability** representa una función o herramienta disponible en el sistema (ej. enviar email, crear un cupón en base de datos, consultar el stock de Printful, leer logs).

---

## Modelo de Registro y Seguridad

Toda habilidad registrada debe implementar la siguiente interfaz lógica:

```typescript
interface ICapability {
  name: string;                // Nombre único (ej. 'send_transactional_email')
  description: string;         // Explicación de lo que hace (usada por el Planner)
  parameterSchema: Schema;     // Esquema Zod de validación de parámetros de entrada
  requiredPermissions: string[]; // Permisos RBAC necesarios para ejecutarla
  constitutionalCost: number;   // Índice de riesgo constitucional (0-100)
  rateLimitPerMinute: number;  // Límite de tasa operativo
  execute(params: any, context: IExecutionContext): Promise<any>; // Ejecutor físico
}
```

---

## Flujo de Validación del Planner

1.  **Solicitud**: El modelo de lenguaje propone usar la capacidad `send_transactional_email`.
2.  **Verificación de Existencia**: El `CapabilityRegistry` comprueba que existe la firma.
3.  **Validación de Permisos**: `IdentitySecurity` comprueba si el administrador activo tiene el rol necesario.
4.  **Cortafuegos Constitucional**: `BehaviorSecurity` valida si el payload y los parámetros cumplen con las directrices de `The Constitution` (ej. no enviar emails duplicados en menos de 5 minutos, no filtrar datos privados).
5.  **Ejecución**: Si todo pasa, la acción se despacha al backend físico.
