import { promises as fs } from 'fs';
import path from 'path';
import db from '@/backend/database/db';

export type LogType = 'info' | 'warning' | 'error' | 'security';

export interface SystemLog {
  id: string;
  type: LogType;
  timestamp: string;
  module: string;
  message: string;
  status: string;
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

let inMemoryLogs: SystemLog[] = [];

// Initialize logs persistence
async function ensureLogsStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const data = await fs.readFile(LOGS_FILE, 'utf-8');
      inMemoryLogs = JSON.parse(data) as SystemLog[];
    } catch {
      await fs.writeFile(LOGS_FILE, JSON.stringify([], null, 2));
      inMemoryLogs = [];
    }
  } catch (error) {
    console.warn('⚠️ Warning: File system not fully writable. Logger falling back to memory.', error);
  }
}

export async function addLog(type: LogType, module: string, message: string, status = 'success'): Promise<SystemLog> {
  await ensureLogsStore();
  const log: SystemLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    timestamp: new Date().toISOString(),
    module,
    message,
    status,
  };

  // Safe AuditLog database insertion (prepared for Phase 4 deployment)
  try {
    await db.auditLog.create({
      data: {
        action: `${type.toUpperCase()}_${module.toUpperCase()}`,
        details: JSON.stringify({ message, status }),
      },
    });
  } catch (dbErr) {
    // Silent fail if relational database is unconfigured/offline
  }

  inMemoryLogs.unshift(log);
  
  // Cap logs at 100 entries for safety
  if (inMemoryLogs.length > 100) {
    inMemoryLogs = inMemoryLogs.slice(0, 100);
  }

  try {
    await fs.writeFile(LOGS_FILE, JSON.stringify(inMemoryLogs, null, 2));
  } catch (error) {
    // Fail silently
  }

  return log;
}

export async function getLogs(): Promise<SystemLog[]> {
  await ensureLogsStore();
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    inMemoryLogs = JSON.parse(data) as SystemLog[];
  } catch {
    // Fallback to cache
  }

  // Seed initial dummy logs if store is empty to preview Phase 3 features
  if (inMemoryLogs.length === 0) {
    const initialLogs: SystemLog[] = [
      {
        id: 'log-1',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
        module: 'PAYPAL',
        message: 'Suscripción del webhook verificada con éxito para notificaciones de pago (PAYMENT.CAPTURE.COMPLETED).',
        status: 'success',
      },
      {
        id: 'log-2',
        type: 'security',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2h ago
        module: 'AUTH',
        message: 'Intento de inicio de sesión sospechoso bloqueado desde dirección IP: 198.51.100.42.',
        status: 'blocked',
      },
      {
        id: 'log-3',
        type: 'warning',
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3h ago
        module: 'PRINTFUL',
        message: 'Reintento de sincronización fallido para la orden local AA-89234: Variantes temporales sin stock.',
        status: 'warning',
      },
      {
        id: 'log-4',
        type: 'error',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        module: 'DATABASE',
        message: 'Fallo temporal en conexión de base de datos relacional PostgreSQL. Reintentando pool.',
        status: 'failed',
      },
    ];
    inMemoryLogs = initialLogs;
    try {
      await fs.writeFile(LOGS_FILE, JSON.stringify(inMemoryLogs, null, 2));
    } catch {
      // Ignore
    }
  }

  return inMemoryLogs;
}
