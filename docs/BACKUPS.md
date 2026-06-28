# 🗄️ Guía de Copias de Seguridad y Restauración (Neon PostgreSQL)

Este documento detalla los procedimientos técnicos para realizar copias de seguridad de la base de datos de producción de **Alpha Addiction**, así como los pasos de descifrado y restauración manual ante situaciones de emergencia.

---

## ⚙️ Variables de Entorno Requeridas

Para el correcto funcionamiento de los scripts automáticos, asegúrese de tener configuradas las siguientes variables de entorno:

- `DATABASE_URL`: URL principal de conexión a Neon PostgreSQL.
- `BACKUP_DATABASE_URL` (Opcional): Si desea utilizar una conexión alternativa para los volcados de seguridad. Si no se define, el script usará `DATABASE_URL`.
- `BACKUP_ENCRYPTION_KEY`: Clave de cifrado AES-256-CBC. Si está definida, los archivos generados se cifrarán automáticamente para proteger los datos de clientes, cupones y transacciones.
- `ENABLE_BACKUPS`: Booleano (`true`/`false`) para habilitar o deshabilitar el sistema.

---

## 🏁 Generación de Copias de Seguridad (Backup)

Para generar una copia de seguridad manual desde la terminal, ejecute el siguiente comando en el directorio raíz del proyecto:

```bash
npm run backup:db
```

### Comportamiento del Script:
1. **Detección de `pg_dump`**: El script comprueba si la utilidad nativa de base de datos de PostgreSQL `pg_dump` está disponible en el host.
2. **Volcado Principal (pg_dump)**: Si está disponible, genera un volcado SQL estructurado que incluye la definición de tablas, relaciones y datos.
3. **Volcado de Emergencia (Prisma)**: Si `pg_dump` no se encuentra instalado en la máquina, el script hace fallback de forma programática a través de Prisma ORM, consultando y volcando todos los modelos críticos (`Product`, `Order`, `Customer`, `Discount`, etc.) en formato JSON.
4. **Compresión**: El archivo se comprime usando `gzip` (`.gz`).
5. **Cifrado AES-256-CBC**: Si se definió la variable `BACKUP_ENCRYPTION_KEY`, el archivo comprimido se cifra criptográficamente, guardándose como `.enc`.
6. **Destino**: Las copias resultantes se guardan en el directorio local `backups/` del proyecto. Esta carpeta y las extensiones `.dump`, `.gz` y `.enc` se encuentran permanentemente ignoradas en Git para evitar filtraciones de seguridad.

---

## 🔍 Verificación de Copias de Seguridad (Verify)

Para validar la integridad y legibilidad de la última copia de seguridad generada en la carpeta `backups/`, ejecute:

```bash
npm run backup:verify
```

### Comportamiento del Script:
1. Detecta la copia de seguridad más reciente en el directorio `backups/`.
2. Lee y comprueba su tamaño e integridad física.
3. Si el archivo está cifrado, intenta descifrarlo en memoria utilizando `BACKUP_ENCRYPTION_KEY`.
4. Descomprime la trama gzip.
5. Inspecciona la cabecera y el contenido para determinar si es un SQL válido de `pg_dump` o un fallback JSON estructurado de Prisma.
6. **Importante**: Este script valida la integridad de los datos en memoria; **NUNCA** escribe ni restaura de forma automática los datos en la base de datos viva para evitar sobrescribir información de producción.

---

## 🚑 Procedimiento de Restauración Manual de Emergencia

> [!CAUTION]
> La restauración de la base de datos sobrescribirá las tablas existentes. Realice este procedimiento con absoluta precaución.
> Nunca intente realizar la restauración desde el entorno web o panel de administración en caliente.

### Paso 1: Descifrar el Archivo
Si el archivo de backup más reciente está cifrado (con extensión `.enc`), primero debe descifrarlo localmente.
Puede crear un pequeño script Node.js para descifrarlo o ejecutar el siguiente script rápido en consola (reemplazando `TU_CLAVE` y nombres de archivo):

```bash
# Ejemplo rápido con Node.js en consola local para descifrar
npx tsx -e "
import fs from 'fs';
import crypto from 'crypto';
const fileBuf = fs.readFileSync('backups/backup-[TIMESTAMP].sql.gz.enc');
const iv = fileBuf.subarray(0, 16);
const data = fileBuf.subarray(16);
const key = crypto.scryptSync('TU_CLAVE_SENSATA', 'salt', 32);
const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
fs.writeFileSync('backups/restored-[TIMESTAMP].sql.gz', decrypted);
console.log('Archivo descifrado listo.');
"
```

### Paso 2: Descomprimir el Archivo SQL
Descomprima el archivo `.sql.gz` utilizando la herramienta de su sistema (ej. 7-Zip, gzip, etc.) para extraer el archivo plano `.sql`:

```bash
# Usando gzip por terminal
gzip -d backups/restored-[TIMESTAMP].sql.gz
```

### Paso 3: Restaurar en Neon PostgreSQL
Una vez obtenido el archivo `restored-[TIMESTAMP].sql` plano, aplique los cambios sobre la base de datos de Neon de manera controlada.

#### Opción A: A través de Neon Console
1. Vaya a su consola de administración de Neon.
2. Ingrese en el SQL Editor de su base de datos.
3. Copie y pegue las instrucciones del archivo `.sql` (o cárguelo si la interfaz lo permite) para restaurar el esquema y las tuplas.

#### Opción B: A través de la terminal usando `psql`
Ejecute el siguiente comando PostgreSQL (requiere tener `psql` instalado en su sistema local):

```bash
psql "postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require" -f backups/restored-[TIMESTAMP].sql
```

---

## 🚫 Qué NO Hacer (Riesgos a Evitar)
- **No almacene copias de seguridad sin cifrar**: Si las variables de entorno de producción no tienen `BACKUP_ENCRYPTION_KEY`, configure una de inmediato para asegurar el cifrado AES-256.
- **No intente restaurar automáticamente**: No cree APIs que realicen llamadas destructivas de restauración a la base de datos activa.
- **No registre secretos ni DATABASE_URL**: Los logs de consola y del Health Center limpian y censuran cualquier referencia a la contraseña de base de datos. Conserve esta práctica en futuros cambios.
