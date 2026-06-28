import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { loadEnvConfig } from '@next/env';

// Cargar variables de entorno estilo Next.js (soporta .env.local, .env, etc.)
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

async function main() {
  console.log('🔍 Iniciando verificación de copias de seguridad (Verify)...');

  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;

  if (!fs.existsSync(BACKUPS_DIR)) {
    console.error('❌ Error: El directorio backups/ no existe.');
    process.exit(1);
  }

  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.gz') || f.endsWith('.enc')))
    .sort();

  if (files.length === 0) {
    console.error('❌ Error: No se encontraron archivos de backup en el directorio backups/.');
    process.exit(1);
  }

  const latestFile = files[files.length - 1];
  const latestPath = path.join(BACKUPS_DIR, latestFile);
  console.log(`📄 Último archivo detectado: ${latestFile}`);

  const stat = fs.statSync(latestPath);
  console.log(`- Tamaño en disco: ${(stat.size / 1024).toFixed(2)} KB`);
  console.log(`- Creado en: ${stat.mtime.toISOString()}`);

  try {
    let fileBuf = fs.readFileSync(latestPath);
    let decryptedBuf = fileBuf;

    // Descifrar si termina en .enc
    if (latestFile.endsWith('.enc')) {
      if (!encryptionKey || encryptionKey.trim() === '') {
        throw new Error('El archivo está cifrado pero BACKUP_ENCRYPTION_KEY no está configurada.');
      }
      console.log('🔒 Descifrando archivo cifrado con AES-256-CBC...');
      const iv = fileBuf.subarray(0, 16);
      const encryptedData = fileBuf.subarray(16);
      const key = crypto.scryptSync(encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      decryptedBuf = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      console.log('✅ Descifrado correcto.');
    }

    // Descomprimir gzip
    console.log('🗜️ Descomprimiendo archivo...');
    const uncompressedBuf = zlib.gunzipSync(decryptedBuf);
    console.log(`✅ Descompresión correcta. Tamaño descomprimido: ${(uncompressedBuf.length / 1024).toFixed(2)} KB`);

    // Validar integridad estructural básica
    const contentStr = uncompressedBuf.toString('utf-8');
    
    let isSql = contentStr.includes('-- PostgreSQL database dump') || contentStr.includes('CREATE TABLE');
    let isJson = false;

    if (!isSql) {
      try {
        const json = JSON.parse(contentStr);
        if (json.type === 'json_fallback_dump' && json.data) {
          isJson = true;
        }
      } catch {
        // No es JSON válido
      }
    }

    if (isSql) {
      console.log('📊 Formato detectado: PostgreSQL SQL dump');
      console.log('✅ Estructura validada: El archivo contiene marcas SQL válidas de pg_dump.');
    } else if (isJson) {
      console.log('📊 Formato detectado: Fallback JSON dump (Prisma)');
      console.log('✅ Estructura validada: El archivo contiene el esquema JSON e instancias de tablas.');
    } else {
      throw new Error('El contenido del backup no tiene un formato reconocido (ni SQL válido ni JSON estructurado).');
    }

    console.log('🎉 Verificación completada con éxito. INTEGRIDAD OK.');
  } catch (err: any) {
    console.error('❌ Error de validación de backup:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error inesperado ejecutando verificación:', err);
  process.exit(1);
});
