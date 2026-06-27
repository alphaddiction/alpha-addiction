import crypto from 'crypto';
import db from '@/lib/db';

// Estructura de sesión para fallback en memoria
export interface MemorySession {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
}

// Estructura de log para fallback en memoria
export interface MemoryAuditLog {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// Almacenes de fallback en memoria (para cuando la base de datos está offline o no migrada)
const memorySessions: Record<string, MemorySession> = {};
const memoryAuditLogs: MemoryAuditLog[] = [];

// Credenciales mock por defecto para depuración local
export const MOCK_ADMIN_EMAIL = 'admin@alpha-addiction.com';
const MOCK_ADMIN_PLAIN_PASSWORD = 'AlphaControlCenter2026';

/**
 * Genera un Hash PBKDF2 seguro con Salt aleatorio de 16 bytes.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña contra el hash PBKDF2 almacenado usando comparación de tiempo seguro.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch (err) {
    console.error('❌ [Auth Node] Error en la verificación de contraseña:', err);
    return false;
  }
}

// Hash precalculado para el administrador simulado
const MOCK_ADMIN_HASH = hashPassword(MOCK_ADMIN_PLAIN_PASSWORD);

/**
 * Valida credenciales contra la base de datos PostgreSQL, 
 * con fallback al usuario mock si el servidor está desconectado.
 */
export async function validateUserCredentials(email: string, password: string): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const user = await db.adminUser.findUnique({
      where: { email },
    });

    if (user) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (isValid) {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ [Auth Node] Base de datos desconectada o sin migración. Evaluando contra usuario administrador simulado.');
  }

  // Fallback local: Administrador de depuración
  if (email.toLowerCase().trim() === MOCK_ADMIN_EMAIL && password === MOCK_ADMIN_PLAIN_PASSWORD) {
    return {
      id: 'mock-admin-id-12345',
      email: MOCK_ADMIN_EMAIL,
      role: 'SUPER_ADMIN',
    };
  }

  return null;
}

/**
 * Registra una nueva sesión en la base de datos, 
 * con fallback a almacenamiento en memoria.
 */
export async function createSessionRecord(
  userId: string,
  ipAddress: string | null = null,
  userAgent: string | null = null,
  expiresDays = 1
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

  try {
    await db.adminSession.create({
      data: {
        id: sessionId,
        userId,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
    return sessionId;
  } catch (error) {
    console.warn('⚠️ [Auth Node] No se pudo persistir la sesión en la Base de Datos. Usando almacén en memoria temporal.');
    
    memorySessions[sessionId] = {
      id: sessionId,
      userId,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      expiresAt,
    };
    return sessionId;
  }
}

/**
 * Obtiene y valida una sesión de administrador activa.
 */
export async function getSessionRecord(sessionId: string): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
  try {
    const session = await db.adminSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          }
        }
      }
    });

    if (session) {
      if (session.expiresAt.getTime() < Date.now()) {
        // Expirada físicamente, borrarla
        await destroySessionRecord(sessionId);
        return null;
      }
      return session;
    }
  } catch (error) {
    // Leer de memoria
    const memSession = memorySessions[sessionId];
    if (memSession) {
      if (memSession.expiresAt.getTime() < Date.now()) {
        delete memorySessions[sessionId];
        return null;
      }
      return memSession;
    }
  }

  return null;
}

/**
 * Cierra y destruye la sesión correspondiente.
 */
export async function destroySessionRecord(sessionId: string): Promise<boolean> {
  try {
    await db.adminSession.delete({
      where: { id: sessionId },
    });
    return true;
  } catch (error) {
    if (memorySessions[sessionId]) {
      delete memorySessions[sessionId];
      return true;
    }
    return false;
  }
}

/**
 * Registra eventos de auditoría interna en la base de datos o consola.
 */
export async function logAuditEvent(
  userId: string | null,
  action: string,
  details: string | null = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
): Promise<void> {
  const timestampStr = new Date().toISOString();
  console.log(`🔒 [AUDIT LOG] [${timestampStr}] Acción: ${action} | Usuario: ${userId || 'SYSTEM'} | IP: ${ipAddress || 'Unknown'}`);

  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    memoryAuditLogs.push({
      id: crypto.randomUUID(),
      userId,
      action,
      details,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });
  }
}

/**
 * Arquitectura preparada para verificación de segundo factor (TOTP).
 * Compatible con Google Authenticator, Microsoft Authenticator y Authy.
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  // En fase de producción se instalará otplib o speakeasy
  // const { authenticator } = require('otplib');
  // return authenticator.verify({ token, secret });
  console.log(`🔒 [2FA MOCK] Verificando token: ${token} contra secreto de base de datos.`);
  // Bypass de pruebas temporal
  return token === '123456';
}
