import crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || ''; // Debe ser de 32 bytes

/**
 * Cifra un secreto TOTP usando AES-256-CBC.
 */
export function encryptSecret(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('La clave TWO_FACTOR_ENCRYPTION_KEY no está configurada o es demasiado corta (mínimo 32 caracteres).');
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Descifra un secreto TOTP cifrado.
 */
export function decryptSecret(encryptedText: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('La clave TWO_FACTOR_ENCRYPTION_KEY no está configurada o es demasiado corta (mínimo 32 caracteres).');
  }
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('❌ Error al descifrar secreto 2FA:', err);
    throw new Error('No se pudo descifrar el secreto de segundo factor.');
  }
}

export function generate2faSecret(email: string) {
  const secret = generateSecret({ length: 20 });
  const service = 'Alpha Addiction';
  const otpauthUrl = generateURI({ issuer: service, label: email, secret });
  return { secret, otpauthUrl };
}

/**
 * Genera el código QR en formato DataURL Base64.
 */
export async function generateQrCodeUrl(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (err) {
    console.error('Error al generar código QR para 2FA:', err);
    throw new Error('No se pudo generar el código QR.');
  }
}

/**
 * Verifica un código TOTP.
 */
export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    const res = verifySync({ token, secret });
    return !!res?.valid;
  } catch (err) {
    console.error('Error al verificar token TOTP:', err);
    return false;
  }
}

/**
 * Genera 10 códigos de recuperación únicos.
 * Retorna la lista en texto plano para mostrarla al usuario y la lista hasheada para guardar en DB.
 */
export function generateRecoveryCodes(): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${part1}-${part2}`;
    plain.push(code);
    
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    hashes.push(hash);
  }
  return { plain, hashes };
}

/**
 * Hashea un código de recuperación.
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Helper para revalidaciones de seguridad en acciones críticas.
 */
export function requireFreshTwoFactor(lastUsedAt: Date | null, maxMinutes = 15): boolean {
  if (!lastUsedAt) return false;
  const elapsedMs = Date.now() - new Date(lastUsedAt).getTime();
  const maxMs = maxMinutes * 60 * 1000;
  return elapsedMs <= maxMs;
}
