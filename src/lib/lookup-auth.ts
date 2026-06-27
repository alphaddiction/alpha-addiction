import { getEnv } from './validations';

const JWT_SECRET = process.env.JWT_SECRET || 'alpha-addiction-secret-key-2026';

function stringToBuffer(str: string): any {
  return new TextEncoder().encode(str);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 1. Firma un token de autorización temporal para consultar un pedido
 */
export async function signLookupToken(orderNumber: string, email: string): Promise<string> {
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutos de vigencia
  const data = `${orderNumber}:${email.toLowerCase()}:${expiresAt}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToBuffer(data)
  );
  
  const signatureHex = bufferToHex(signatureBuffer);
  return `${data}:${signatureHex}`;
}

/**
 * 2. Verifica la firma y vigencia de un token de consulta de pedido
 */
export async function verifyLookupToken(token: string, expectedOrderNumber: string): Promise<boolean> {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) return false;
    
    const [orderNumber, email, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    
    // Comprobar expiración y correspondencia de pedido
    if (isNaN(expiresAt) || expiresAt < Date.now() || orderNumber !== expectedOrderNumber) {
      return false;
    }
    
    const data = `${orderNumber}:${email}:${expiresAtStr}`;
    
    const key = await crypto.subtle.importKey(
      'raw',
      stringToBuffer(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      stringToBuffer(data)
    );
    
    const expectedSignature = bufferToHex(signatureBuffer);
    return signature === expectedSignature;
  } catch (error) {
    console.error('❌ [Lookup Auth] Error al verificar firma de token:', error);
    return false;
  }
}

/**
 * 3. Enmascaramiento de datos personales
 */

export function maskEmail(email: string): string {
  if (!email) return '—';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local.substring(0, 1)}***@${domain}`;
  }
  return `${local.substring(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return '—';
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return '***';
  return `${cleaned.substring(0, 4)}***${cleaned.substring(cleaned.length - 2)}`;
}

export function maskAddress(address: string): string {
  if (!address) return '—';
  const trimmed = address.trim();
  if (trimmed.length <= 6) return `${trimmed.substring(0, 6)}***`;
  return `${trimmed.substring(0, 6)}***${trimmed.substring(trimmed.length - 4)}`;
}

/**
 * 4. Rate Limit de búsqueda en memoria (5 intentos por 10 minutos por IP)
 */
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Limpieza periódica automática cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000);
}

export function checkLookupRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  const windowMs = 10 * 60 * 1000; // 10 minutos
  const maxAttempts = 5;

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { attempts: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
  }

  if (entry.attempts >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: entry.resetAt };
  }

  entry.attempts += 1;
  return { allowed: true, remaining: maxAttempts - entry.attempts, resetTime: entry.resetAt };
}
