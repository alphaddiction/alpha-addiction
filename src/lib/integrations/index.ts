import db from '../db';
import { checkEnvVar, EnvVarStatus } from '../env/admin-env';

export interface IntegrationStatus {
  name: string;
  key: string;
  status: 'configured' | 'pending' | 'error';
  requiredVars: EnvVarStatus[];
  lastChecked: string;
  description: string;
  nextStep: string;
}

export async function getIntegrationsStatus(): Promise<IntegrationStatus[]> {
  // 1. Relational Database Check
  let dbStatus: 'configured' | 'pending' | 'error' = 'pending';
  const dbVars = [checkEnvVar('DATABASE_URL')];
  
  if (dbVars[0].exists && !dbVars[0].isEmpty) {
    try {
      await db.$queryRaw`SELECT 1`;
      dbStatus = 'configured';
    } catch (e) {
      console.warn('⚠️ Relational database connection check failed:', e);
      dbStatus = 'error';
    }
  }

  // 2. PayPal Check
  const paypalVars = [
    checkEnvVar('PAYPAL_CLIENT_ID'),
    checkEnvVar('PAYPAL_CLIENT_SECRET'),
    checkEnvVar('PAYPAL_WEBHOOK_ID'),
  ];
  const hasPaypalCredentials = paypalVars[0].exists && !paypalVars[0].isEmpty && paypalVars[1].exists && !paypalVars[1].isEmpty;
  const paypalStatus = hasPaypalCredentials ? 'configured' : 'pending';

  // 3. Printful Check
  const printfulVars = [
    checkEnvVar('PRINTFUL_API_KEY'),
  ];
  const printfulStatus = (printfulVars[0].exists && !printfulVars[0].isEmpty) ? 'configured' : 'pending';

  // 4. SMTP Check
  const smtpVars = [
    checkEnvVar('SMTP_HOST'),
    checkEnvVar('SMTP_PORT'),
    checkEnvVar('SMTP_USER'),
    checkEnvVar('SMTP_PASS'),
  ];
  const hasSmtpCredentials = smtpVars[0].exists && !smtpVars[0].isEmpty && smtpVars[2].exists && !smtpVars[2].isEmpty && smtpVars[3].exists && !smtpVars[3].isEmpty;
  const smtpStatus = hasSmtpCredentials ? 'configured' : 'pending';

  // 5. Vercel Check
  const vercelVars = [
    checkEnvVar('NEXT_PUBLIC_APP_URL'),
  ];
  const isVercel = process.env.VERCEL === '1' || (vercelVars[0].exists && !vercelVars[0].isEmpty);
  const vercelStatus = isVercel ? 'configured' : 'pending';

  const timestamp = new Date().toISOString();

  return [
    {
      name: 'Base de Datos (PostgreSQL)',
      key: 'database',
      status: dbStatus,
      requiredVars: dbVars,
      lastChecked: timestamp,
      description: 'Persistencia relacional mediante Prisma ORM para registrar usuarios administrativos, logs de auditoría y pedidos de compras.',
      nextStep: dbStatus === 'configured' 
        ? 'Todo operativo. No se requiere ninguna acción.'
        : dbStatus === 'error'
        ? 'Error al conectar con la base de datos. Verifica que la base de datos esté activa y que DATABASE_URL sea correcto en el entorno.'
        : 'Configura la variable DATABASE_URL en tu entorno local o en Vercel para activar el soporte de persistencia PostgreSQL.',
    },
    {
      name: 'Pasarela PayPal Checkout',
      key: 'paypal',
      status: paypalStatus,
      requiredVars: paypalVars,
      lastChecked: timestamp,
      description: 'Integración del SDK del carrito de compras y captura segura de transacciones monetarias en el checkout.',
      nextStep: paypalStatus === 'configured'
        ? 'Método de pago de PayPal configurado. Puedes realizar transacciones de prueba.'
        : 'Define PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET para habilitar la pasarela de pagos en tu e-commerce.',
    },
    {
      name: 'Fulfillment Printful API',
      key: 'printful',
      status: printfulStatus,
      requiredVars: printfulVars,
      lastChecked: timestamp,
      description: 'Sincronización automatizada de pedidos de ropa y envío de información de seguimiento/tracking a los clientes.',
      nextStep: printfulStatus === 'configured'
        ? 'API de Printful configurada y enlazada. Listo para pruebas de órdenes de producción.'
        : 'Consigue tu clave de API de Printful e insértala en PRINTFUL_API_KEY para habilitar la producción automatizada.',
    },
    {
      name: 'Servidor de Correo SMTP',
      key: 'smtp',
      status: smtpStatus,
      requiredVars: smtpVars,
      lastChecked: timestamp,
      description: 'Envío de notificaciones transaccionales al comprador cuando el pago es capturado y el pedido es enviado.',
      nextStep: smtpStatus === 'configured'
        ? 'Servidor SMTP activo. Los correos automáticos se enviarán desde la pasarela configurada.'
        : 'Completa las variables SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS para activar los correos automáticos de confirmación.',
    },
    {
      name: 'Infraestructura Cloud (Vercel)',
      key: 'vercel',
      status: vercelStatus,
      requiredVars: vercelVars,
      lastChecked: timestamp,
      description: 'Enrutamiento del proxy de middleware y hosting de la aplicación e-commerce optimizada.',
      nextStep: vercelStatus === 'configured'
        ? 'Entorno configurado correctamente para hosting y callbacks de producción.'
        : 'Inserta NEXT_PUBLIC_APP_URL con la URL base de tu tienda para asegurar que los redireccionamientos de PayPal y webhooks operen sin incidentes.',
    },
  ];
}
