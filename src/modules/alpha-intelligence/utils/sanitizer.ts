export class ContextSanitizer {
  private static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/g;
  private static CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

  /**
   * Sanitiza un texto plano reemplazando información sensible por máscaras seguras.
   */
  static sanitizeText(text: string): string {
    if (!text) return '';
    let clean = text;

    // 1. Enmascarar correos electrónicos
    clean = clean.replace(this.EMAIL_REGEX, (email) => {
      const parts = email.split('@');
      const name = parts[0];
      const domain = parts[1];
      if (name.length <= 2) return `*@${domain}`;
      return `${name[0]}***${name[name.length - 1]}@${domain}`;
    });

    // 2. Enmascarar teléfonos
    clean = clean.replace(this.PHONE_REGEX, '[TELÉFONO_ENMASCARADO]');

    // 3. Enmascarar números de tarjeta
    clean = clean.replace(this.CARD_REGEX, '[TARJETA_ENMASCARADA]');

    // 4. Enmascarar posibles secretos o tokens
    clean = clean.replace(/JWT_[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[JWT_TOKEN_MASCARADO]');
    clean = clean.replace(/bearer\s+[a-zA-Z0-9-_=.]+/gi, 'Bearer [TOKEN_MASCARADO]');

    return clean;
  }

  /**
   * Sanitiza recursivamente un objeto o estructura JSON antes de enviarlo al LLM.
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // 1. Reemplazo drástico de campos altamente sensibles
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('apikey') ||
          lowerKey.includes('key') ||
          lowerKey.includes('jwt') ||
          lowerKey.includes('auth') ||
          lowerKey.includes('cvv') ||
          lowerKey.includes('cardnumber')
        ) {
          sanitized[key] = '[SECRETO_OCULTO_POR_SEGURIDAD]';
          continue;
        }

        // 2. Enmascarar datos personales específicos (manteniendo metadatos generales)
        if (lowerKey === 'address' || lowerKey.includes('address1') || lowerKey.includes('addressline')) {
          sanitized[key] = '[DIRECCIÓN_FILTRADA]';
          continue;
        }

        if (lowerKey === 'phone' || lowerKey.includes('telephone') || lowerKey.includes('cellphone')) {
          sanitized[key] = '[TELÉFONO_FILTRADO]';
          continue;
        }

        if (lowerKey.includes('paypalorderid') || lowerKey.includes('paypalcaptureid') || lowerKey.includes('captureid')) {
          sanitized[key] = '[ID_TRANSACCION_PAYPAL_OCULTO]';
          continue;
        }

        // De lo contrario, sanitizar recursivamente el contenido
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}
