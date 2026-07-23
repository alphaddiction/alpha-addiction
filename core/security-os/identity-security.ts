import { IExecutionContext } from '../goals/capabilities';

/**
 * Identity Security - Capa de Control de Accesos y Permisos (Identity Layer).
 */
export interface IIdentitySecurity {
  /**
   * Valida un token de sesión JWT y retorna el contexto de ejecución verificado.
   */
  authenticateSession(token: string): Promise<IExecutionContext>;

  /**
   * Comprueba si el rol y los permisos del contexto satisfacen los requisitos
   * de una capacidad y firma digitalmente la autorización del plan de acción.
   */
  authorizeCapabilityExecution(
    context: IExecutionContext,
    capabilityName: string
  ): Promise<IAuthorizationSignature>;
}

export interface IAuthorizationSignature {
  authorized: boolean;
  signedToken?: string; // Token criptográfico de corta duración autorizando la acción
  errorReason?: string;
}
