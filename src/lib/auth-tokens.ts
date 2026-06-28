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
 * Firma criptográficamente un identificador de sesión y fecha de expiración
 * utilizando HMAC SHA-256 con Web Crypto API (compatible con Edge y Node).
 */
export async function signSessionToken(sessionId: string, expiresAt: number): Promise<string> {
  const data = `${sessionId}:${expiresAt}`;
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
 * Verifica la firma criptográfica y la vigencia de un token de sesión.
 * Retorna el identificador de sesión si es válido, o null si fue alterado o expiró.
 */
export async function verifySessionToken(token: string): Promise<{ sessionId: string; expiresAt: number } | null> {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    const [sessionId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    
    if (isNaN(expiresAt) || expiresAt < Date.now()) {
      return null; // Expirado
    }
    
    const data = `${sessionId}:${expiresAtStr}`;
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
    
    if (signature !== expectedSignature) {
      return null; // Token alterado o firma inválida
    }
    
    return { sessionId, expiresAt };
  } catch (error) {
    console.error('❌ [Auth Tokens] Error al verificar firma del token:', error);
    return null;
  }
}

/**
 * Firma un token temporal de 2FA para el segundo paso del login (duración 5 minutos).
 */
export async function signTemporary2faToken(userId: string, expiresAt: number): Promise<string> {
  const data = `${userId}:${expiresAt}`;
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
 * Verifica la vigencia y firma de un token temporal de 2FA.
 */
export async function verifyTemporary2faToken(token: string): Promise<string | null> {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    const [userId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    
    if (isNaN(expiresAt) || expiresAt < Date.now()) {
      return null; // Expirado
    }
    
    const data = `${userId}:${expiresAtStr}`;
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
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    return userId;
  } catch (error) {
    console.error('❌ [Auth Tokens] Error al verificar token temporal 2FA:', error);
    return null;
  }
}
