export interface EnvVarSpec {
  key: string;
  isCritical: boolean;
  isServerOnly: boolean;
  description: string;
}

export const envVarSpecs: EnvVarSpec[] = [
  { key: 'DATABASE_URL', isCritical: true, isServerOnly: true, description: 'URL de conexión a la base de datos PostgreSQL (Prisma).' },
  { key: 'AUTH_SECRET', isCritical: true, isServerOnly: true, description: 'Clave secreta utilizada para firmar cookies de sesión encriptadas.' },
  { key: 'ADMIN_ENCRYPTION_KEY', isCritical: true, isServerOnly: true, description: 'Clave simétrica de cifrado maestro AES-256-GCM para datos administrativos.' },
  { key: 'PRINTFUL_API_KEY', isCritical: true, isServerOnly: true, description: 'Token o clave de autenticación Bearer para comunicar con la API REST de Printful.' },
  { key: 'PAYPAL_CLIENT_ID', isCritical: true, isServerOnly: false, description: 'ID de cliente público para inicializar los botones de pago del SDK de PayPal.' },
  { key: 'PAYPAL_CLIENT_SECRET', isCritical: true, isServerOnly: true, description: 'Clave secreta privada para llamadas de backend e inicio de OAuth en PayPal.' },
  { key: 'PAYPAL_WEBHOOK_ID', isCritical: false, isServerOnly: true, description: 'Identificador del webhook de PayPal necesario para verificar firmas HMAC.' },
  { key: 'SMTP_HOST', isCritical: false, isServerOnly: true, description: 'Dirección IP o dominio del servidor de correo SMTP.' },
  { key: 'SMTP_PORT', isCritical: false, isServerOnly: true, description: 'Puerto del servidor de correo (comúnmente 587 para TLS).' },
  { key: 'SMTP_USER', isCritical: false, isServerOnly: true, description: 'Usuario de autenticación del servidor SMTP de correos.' },
  { key: 'SMTP_PASS', isCritical: false, isServerOnly: true, description: 'Contraseña de autenticación del servidor SMTP de correos.' },
  { key: 'NEXT_PUBLIC_APP_URL', isCritical: false, isServerOnly: false, description: 'URL pública de la aplicación para retornos de pagos y webhooks.' },
];

export interface EnvVarStatus {
  key: string;
  exists: boolean;
  isEmpty: boolean;
  isCritical: boolean;
  isServerOnly: boolean;
  description: string;
}

export function checkEnvVar(key: string): EnvVarStatus {
  // Check both key and alternative naming (e.g. PRINTFUL_API_TOKEN fallback for PRINTFUL_API_KEY)
  let value = process.env[key];
  if (key === 'PRINTFUL_API_KEY' && !value) {
    value = process.env.PRINTFUL_API_TOKEN;
  }
  
  const exists = value !== undefined && value !== null;
  const isEmpty = exists && value!.trim() === '';
  const spec = envVarSpecs.find(s => s.key === key);

  return {
    key,
    exists,
    isEmpty,
    isCritical: spec?.isCritical ?? false,
    isServerOnly: spec?.isServerOnly ?? true,
    description: spec?.description ?? '',
  };
}

export function checkAllEnvVars(): EnvVarStatus[] {
  return envVarSpecs.map(spec => checkEnvVar(spec.key));
}
