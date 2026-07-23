import { ContextSanitizer } from '@/shared/utils/sanitizer';

export class SecurityLayer {
  /**
   * Sanitiza cualquier cadena de entrada recibida del usuario.
   */
  static sanitizeInput(input: string): string {
    return ContextSanitizer.sanitizeText(input);
  }

  /**
   * Sanitiza la respuesta de salida generada por la IA o herramientas antes de devolverla.
   */
  static sanitizeOutput(output: any): any {
    if (typeof output === 'string') {
      return ContextSanitizer.sanitizeText(output);
    }
    return ContextSanitizer.sanitizeObject(output);
  }

  /**
   * Valida si el rol de usuario tiene permisos para ejecutar una determinada herramienta/capacidad.
   */
  static checkPermissions(toolName: string, userRole: string): boolean {
    const role = (userRole || 'support').toLowerCase();
    
    // Superadmin tiene acceso a todas las herramientas
    if (role === 'superadmin') return true;

    // Herramientas financieras e infraestructura críticas requieren al menos rol de admin
    if (toolName === 'finance' || toolName === 'health' || toolName === 'notifications') {
      return role === 'admin';
    }

    // Herramientas estándar (orders, customers, mission_control) están abiertas para support y admin
    return role === 'admin' || role === 'support';
  }
}
