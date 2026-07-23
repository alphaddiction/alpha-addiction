import { loadEnvConfig } from '@next/env';
// Cargar variables de entorno estilo Next.js (soporta .env.local, .env, etc.)
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

function parseDbUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      user: parsed.username,
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.substring(1),
    };
  } catch (err) {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?#]+)/);
    if (match) {
      return {
        user: match[1],
        password: decodeURIComponent(match[2]),
        host: match[3],
        port: match[4],
        database: match[5],
      };
    }
    return null;
  }
}

async function runFallbackBackup(prisma: any): Promise<string> {
  console.log('⚠️ pg_dump no está disponible o falló. Ejecutando backup alternativo (fallback JSON) a través de Prisma...');
  
  const tables = [
    'product',
    'drop',
    'dropWaitlist',
    'discount',
    'discountRedemption',
    'order',
    'orderItem',
    'orderEvent',
    'announcement',
    'auditLog',
    'supportTicket',
    'supportMessage',
    'supportNote',
    'adminUser',
    'adminSession',
    'systemHealth'
  ];

  const dumpData: Record<string, any[]> = {};

  for (const table of tables) {
    if (prisma[table]) {
      try {
        dumpData[table] = await prisma[table].findMany();
      } catch (err: any) {
        console.warn(`⚠️ No se pudo volcar la tabla ${table}:`, err.message);
      }
    }
  }

  return JSON.stringify({
    type: 'json_fallback_dump',
    timestamp: new Date().toISOString(),
    data: dumpData
  }, null, 2);
}

async function main() {
  console.log('🏁 Iniciando proceso de copia de seguridad (Backup)...');

  const dbUrl = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;

  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL o BACKUP_DATABASE_URL no definida.');
    process.exit(1);
  }

  // Asegurar que la carpeta de backups exista
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tempSqlFile = path.join(BACKUPS_DIR, `temp-${timestamp}.sql`);
  
  let backupContent: Buffer = Buffer.from([]);
  let isSql = false;

  // Intentar pg_dump
  try {
    const parsed = parseDbUrl(dbUrl);
    if (!parsed) throw new Error('No se pudo parsear el formato de la URL de base de datos.');

    console.log(`🔌 Conectando a PostgreSQL Host: ${parsed.host} para pg_dump...`);

    // Ejecutar pg_dump
    const cmd = `pg_dump -h "${parsed.host}" -p "${parsed.port}" -U "${parsed.user}" -d "${parsed.database}" -F p -f "${tempSqlFile}"`;
    execSync(cmd, {
      env: {
        ...process.env,
        PGPASSWORD: parsed.password
      },
      stdio: 'pipe'
    });

    if (fs.existsSync(tempSqlFile)) {
      const sqlContent = fs.readFileSync(tempSqlFile);
      // Comprimir contenido SQL
      backupContent = zlib.gzipSync(sqlContent);
      isSql = true;
      fs.unlinkSync(tempSqlFile); // Limpiar archivo temporal
      console.log('✅ Volcado pg_dump generado y comprimido correctamente.');
    } else {
      throw new Error('Archivo temporal sql no fue generado.');
    }
  } catch (err: any) {
    const cleanMessage = err.message
      .replace(new RegExp(dbUrl, 'g'), '[DATABASE_URL]')
      .replace(/:\/\/.*@/g, '://[USER:PASSWORD]@');
    console.warn(`⚠️ pg_dump no disponible o falló: ${cleanMessage}`);

    // Fallback con Prisma Client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const jsonContent = await runFallbackBackup(prisma);
      backupContent = zlib.gzipSync(Buffer.from(jsonContent));
    } catch (fallbackErr: any) {
      console.error('❌ Error crítico: Falló tanto pg_dump como la consulta de fallback:', fallbackErr.message);
      
      try {
        const { createNotification } = await import('@/backend/notifications/service');
        await createNotification({
          type: 'backup_failed',
          title: 'Fallo crítico de Backup',
          message: `Fallaron tanto pg_dump como la consulta alternativa. Error: ${fallbackErr.message}`,
          severity: 'critical',
          module: 'backups'
        });
      } catch (nErr) {
        console.error('No se pudo crear la notificación de fallo de backup:', nErr);
      }

      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  let finalContent = backupContent;
  let ext = isSql ? '.sql.gz' : '.json.gz';

  // Cifrar si se especifica clave de cifrado
  if (encryptionKey && encryptionKey.trim() !== '') {
    console.log('🔒 Cifrando archivo de copia de seguridad con AES-256-CBC...');
    try {
      const key = crypto.scryptSync(encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      finalContent = Buffer.concat([iv, cipher.update(finalContent), cipher.final()]);
      ext += '.enc';
      console.log('✅ Archivo cifrado correctamente.');
    } catch (cryptErr: any) {
      console.error('❌ Error de cifrado:', cryptErr.message);
      
      try {
        const { createNotification } = await import('@/backend/notifications/service');
        await createNotification({
          type: 'backup_failed',
          title: 'Fallo de Cifrado en Backup',
          message: `El proceso de cifrado AES del backup falló. Error: ${cryptErr.message}`,
          severity: 'critical',
          module: 'backups'
        });
      } catch (nErr) {
        console.error(nErr);
      }

      process.exit(1);
    }
  } else {
    console.log('⚠️ Alerta: No se ha configurado BACKUP_ENCRYPTION_KEY. El backup no estará cifrado.');
  }

  const finalFileName = `backup-${timestamp}${ext}`;
  const finalFilePath = path.join(BACKUPS_DIR, finalFileName);
  fs.writeFileSync(finalFilePath, finalContent);

  console.log(`🎉 Backup guardado con éxito:`);
  console.log(`- Archivo: ${finalFileName}`);
  console.log(`- Ruta: ${finalFilePath}`);
  console.log(`- Tamaño: ${(finalContent.length / 1024).toFixed(2)} KB`);
}

main().catch(async err => {
  console.error('❌ Error inesperado ejecutando backup:', err);
  try {
    const { createNotification } = await import('@/backend/notifications/service');
    await createNotification({
      type: 'backup_failed',
      title: 'Error inesperado en proceso de Backup',
      message: `Se lanzó una excepción no controlada: ${err.message || String(err)}`,
      severity: 'critical',
      module: 'backups'
    });
  } catch (nErr) {
    console.error(nErr);
  }
  process.exit(1);
});
