import { db } from './db';

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
 * 1. Firma un token de sesión general del portal de clientes
 * Válido por 2 horas.
 */
export async function signPortalSessionToken(email: string): Promise<string> {
  const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 horas
  const data = `${email.toLowerCase()}:${expiresAt}`;
  
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
 * 2. Verifica la firma y vigencia del token de sesión del portal de clientes
 * Retorna el correo electrónico del cliente si es válido, null en caso contrario.
 */
export async function verifyPortalSessionToken(token: string): Promise<string | null> {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    
    const [email, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    
    if (isNaN(expiresAt) || expiresAt < Date.now()) {
      return null;
    }
    
    const data = `${email}:${expiresAtStr}`;
    
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
    if (signature !== expectedSignature) return null;

    return email;
  } catch (error) {
    console.error('❌ [Portal Auth] Error al verificar firma de token de sesión:', error);
    return null;
  }
}

/**
 * 3. Genera un token único y seguro de 30 días para un pedido específico
 * Lo registra físicamente en la tabla ActiveToken en Neon.
 */
export async function generateSecureOrderToken(orderNumber: string, email: string): Promise<string> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanOrderNumber = orderNumber.toUpperCase().trim();

  // Comprobar si ya existe un token activo no expirado para este pedido y email
  const existing = await db.activeToken.findFirst({
    where: {
      email: cleanEmail,
      orderNumber: cleanOrderNumber,
      expiresAt: { gte: new Date() }
    }
  });

  if (existing) {
    return existing.token;
  }

  // Si no, crear uno nuevo
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

  await db.activeToken.create({
    data: {
      token,
      email: cleanEmail,
      orderNumber: cleanOrderNumber,
      expiresAt
    }
  });

  return token;
}

/**
 * 4. Valida un token seguro de 30 días
 * Retorna el correo si es válido y coincide con el número de pedido, null en caso contrario.
 */
export async function verifySecureOrderToken(token: string, orderNumber: string): Promise<string | null> {
  try {
    const cleanOrderNumber = orderNumber.toUpperCase().trim();
    const record = await db.activeToken.findUnique({
      where: { token }
    });

    if (!record) return null;
    if (record.orderNumber !== cleanOrderNumber) return null;
    if (record.expiresAt.getTime() < Date.now()) return null;

    return record.email;
  } catch (error) {
    console.error('❌ [Portal Auth] Error al verificar token seguro de pedido:', error);
    return null;
  }
}
