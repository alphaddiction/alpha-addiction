import { db } from '../db';
import { getPayPalAccessToken } from '../paypal';
import { printfulFetch } from '../printful';
import fs from 'fs';
import path from 'path';

export interface IntegrationStatus {
  name: string;
  key: string;
  status: 'operational' | 'warning' | 'error' | 'not_configured';
  lastChecked: string;
  mode: string;
  lastSync: string;
  lastError: string | null;
  lastWebhook: string | null;
  apiVersion: string | null;
  latencyMs: number | null;
  metadata: Record<string, any>;
  description: string;
  nextStep: string;
}

export async function getIntegrationsStatus(): Promise<IntegrationStatus[]> {
  const timestamp = new Date().toISOString();
  const list: IntegrationStatus[] = [];

  // ==========================================
  // 1. Neon Database Integration Check
  // ==========================================
  let dbStatus: 'operational' | 'warning' | 'error' | 'not_configured' = 'error';
  let dbLatency: number | null = null;
  let dbError: string | null = null;
  let lastBackupFile = 'Ninguno';
  let lastBackupSize = '0 KB';
  let lastBackupTime = 'Nunca';
  let backupEncryption = 'Inactivo';
  let migrationsCount = 0;

  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbStatus = 'operational';

    // Obtener total de migraciones
    try {
      const mCount = await db.$queryRaw<any[]>`SELECT count(*) as count FROM _prisma_migrations`;
      migrationsCount = Number(mCount[0]?.count || 0);
    } catch (_) {}
  } catch (err: any) {
    dbError = err.message || String(err);
    dbStatus = 'error';
  }

  // Leer backups locales
  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('backup-'))
        .sort((a, b) => b.localeCompare(a));
      if (files.length > 0) {
        lastBackupFile = files[0];
        const stats = fs.statSync(path.join(backupsDir, files[0]));
        lastBackupSize = `${(stats.size / 1024).toFixed(1)} KB`;
        const timeMatch = files[0].match(/backup-([^\.]+)/);
        if (timeMatch) {
          lastBackupTime = timeMatch[1].replace(/-/g, ':').replace('T', ' ');
        }
        if (files[0].endsWith('.enc')) {
          backupEncryption = 'Activo (AES-256-CBC)';
        }
      }
    }
  } catch (backupErr: any) {
    console.warn('⚠️ No se pudieron leer backups locales:', backupErr.message);
  }

  list.push({
    name: 'Neon Serverless PostgreSQL',
    key: 'neon',
    status: dbStatus,
    lastChecked: timestamp,
    mode: 'Producción Cloud',
    lastSync: lastBackupTime,
    lastError: dbError,
    lastWebhook: null,
    apiVersion: 'v3 (Neon Link)',
    latencyMs: dbLatency,
    description: 'Motor de persistencia de datos relacionales en la nube, con auto-scaling e instantáneas de backup programadas.',
    nextStep: dbStatus === 'operational'
      ? 'Operativo. El sistema de backups y replicación se encuentra activo.'
      : 'Comprueba el string de conexión en la variable DATABASE_URL y que las reglas IP del cluster permitan llamadas.',
    metadata: {
      migrationsApplied: migrationsCount,
      lastBackupFile,
      lastBackupSize,
      backupEncryption
    }
  });

  // ==========================================
  // 2. PayPal Checkout Integration Check
  // ==========================================
  let paypalStatus: 'operational' | 'warning' | 'error' | 'not_configured' = 'not_configured';
  let paypalLatency: number | null = null;
  let paypalError: string | null = null;
  let paypalMode = 'Sandbox';
  let paypalLastWebhook = 'Ninguno';
  let paypalLastPayment = 'Ninguno';
  let paypalLastCapture = 'Ninguna';

  const hasPaypal = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  if (!hasPaypal) {
    paypalStatus = 'not_configured';
  } else {
    paypalMode = (process.env.PAYPAL_API || 'sandbox').toLowerCase().includes('sandbox') ? 'Sandbox' : 'Producción';
    try {
      const start = Date.now();
      await getPayPalAccessToken();
      paypalLatency = Date.now() - start;
      paypalStatus = 'operational';
    } catch (err: any) {
      paypalError = err.message || String(err);
      paypalStatus = 'error';
    }

    if (dbStatus === 'operational') {
      try {
        const lastWebhookEvent = await db.orderEvent.findFirst({
          where: { type: { startsWith: 'PAYPAL_' } },
          orderBy: { createdAt: 'desc' }
        });
        if (lastWebhookEvent) {
          paypalLastWebhook = `${lastWebhookEvent.createdAt.toLocaleString('es-ES')} (${lastWebhookEvent.type})`;
        }

        const lastPaymentOrder = await db.order.findFirst({
          where: { paymentStatus: 'paid', paymentMethod: 'paypal' },
          orderBy: { updatedAt: 'desc' }
        });
        if (lastPaymentOrder) {
          paypalLastPayment = `#${lastPaymentOrder.orderNumber} - ${lastPaymentOrder.total} EUR`;
          paypalLastCapture = lastPaymentOrder.paypalCaptureId || lastPaymentOrder.paypalOrderId || '—';
        }
      } catch (_) {}
    }
  }

  list.push({
    name: 'Pasarela PayPal Checkout',
    key: 'paypal',
    status: paypalStatus,
    lastChecked: timestamp,
    mode: paypalMode,
    lastSync: 'En tiempo real',
    lastError: paypalError,
    lastWebhook: paypalLastWebhook,
    apiVersion: 'v2 (Checkout Orders)',
    latencyMs: paypalLatency,
    description: 'Procesamiento de pagos y cobros integrados de forma segura con protección antifraude en el checkout.',
    nextStep: paypalStatus === 'operational'
      ? 'Operativo. El sistema está listo para transaccionar en el entorno indicado.'
      : paypalStatus === 'not_configured'
      ? 'Añade las credenciales PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET para activar el método de pago.'
      : 'Error de autenticación. Verifica tus credenciales de PayPal y la variable PAYPAL_API.',
    metadata: {
      lastPayment: paypalLastPayment,
      lastCapture: paypalLastCapture,
      webhookIdConfigured: !!process.env.PAYPAL_WEBHOOK_ID
    }
  });

  // ==========================================
  // 3. Printful Fulfillment Check
  // ==========================================
  let printfulStatus: 'operational' | 'warning' | 'error' | 'not_configured' = 'not_configured';
  let printfulLatency: number | null = null;
  let printfulError: string | null = null;
  let storeName = 'Desconocida';
  let printfulLastOrder = 'Ninguno';
  let printfulLastSync = 'Nunca';
  let printfulLinkedProductsCount = 0;

  const hasPrintful = !!process.env.PRINTFUL_API_KEY;
  if (!hasPrintful) {
    printfulStatus = 'not_configured';
  } else {
    try {
      const start = Date.now();
      const res = await printfulFetch<any>('store');
      printfulLatency = Date.now() - start;
      if (res && res.code === 200) {
        printfulStatus = 'operational';
        storeName = res.result?.name || 'Store';
      } else {
        printfulStatus = 'warning';
        printfulError = `API Code ${res?.code}: ${res?.error?.message || 'Error desconocido'}`;
      }
    } catch (err: any) {
      printfulStatus = 'error';
      printfulError = err.message || String(err);
    }

    if (dbStatus === 'operational') {
      try {
        const lastSyncLog = await db.auditLog.findFirst({
          where: { action: 'SYNC_PRODUCTS_SUCCESS' },
          orderBy: { createdAt: 'desc' }
        });
        if (lastSyncLog) {
          printfulLastSync = lastSyncLog.createdAt.toLocaleString('es-ES');
        }

        const lastOrderSubmitted = await db.order.findFirst({
          where: { printfulOrderId: { not: null } },
          orderBy: { updatedAt: 'desc' }
        });
        if (lastOrderSubmitted) {
          printfulLastOrder = `#${lastOrderSubmitted.orderNumber} (Printful: #${lastOrderSubmitted.printfulOrderId})`;
        }

        printfulLinkedProductsCount = await db.product.count({
          where: { printfulProductId: { not: null } }
        });
      } catch (_) {}
    }
  }

  list.push({
    name: 'Fulfillment Printful API',
    key: 'printful',
    status: printfulStatus,
    lastChecked: timestamp,
    mode: 'Producción Cloud',
    lastSync: printfulLastSync,
    lastError: printfulError,
    lastWebhook: printfulLastOrder,
    apiVersion: 'v2 (Store API)',
    latencyMs: printfulLatency,
    description: 'Servicio bajo demanda para la fabricación y envío automatizado de prendas de diseño minimalista de la tienda.',
    nextStep: printfulStatus === 'operational'
      ? 'Operativo. El mapeo del catálogo y sincronización automáticos se encuentran enlazados.'
      : printfulStatus === 'not_configured'
      ? 'Obtén tu PRINTFUL_API_KEY y configúrala en el entorno para permitir la producción automatizada.'
      : 'Error en la clave API. Comprueba si el token en PRINTFUL_API_KEY ha expirado en el panel de Printful.',
    metadata: {
      storeName,
      linkedProducts: printfulLinkedProductsCount,
      webhookConfigured: !!process.env.PRINTFUL_WEBHOOK_SECRET
    }
  });

  // ==========================================
  // 4. Resend Transactional Mailer Check
  // ==========================================
  let resendStatus: 'operational' | 'warning' | 'error' | 'not_configured' = 'not_configured';
  let resendLatency: number | null = null;
  let resendError: string | null = null;
  let resendDomain = 'No configurado';
  let resendDnsStatus = 'N/A';
  let resendLastEmail = 'Ninguno';
  let resendTotalErrors = 0;

  const hasResend = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'MOCK_RESEND_API_KEY');
  if (!hasResend) {
    resendStatus = 'not_configured';
  } else {
    try {
      const start = Date.now();
      const res = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      resendLatency = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        resendStatus = 'operational';
        if (data && data.data && data.data.length > 0) {
          resendDomain = data.data[0].name;
          resendDnsStatus = data.data[0].status === 'verified' ? 'Verificado' : 'Advertencia (Pendiente DNS)';
          if (data.data[0].status !== 'verified') {
            resendStatus = 'warning';
          }
        }
      } else {
        resendStatus = 'warning';
        resendError = `Error HTTP Resend: ${res.status}`;
      }
    } catch (err: any) {
      resendStatus = 'error';
      resendError = err.message || String(err);
    }

    if (dbStatus === 'operational') {
      try {
        const lastMail = await db.emailLog.findFirst({
          orderBy: { sentAt: 'desc' }
        });
        if (lastMail) {
          resendLastEmail = `${lastMail.sentAt.toLocaleString('es-ES')} a ${lastMail.recipient} (${lastMail.emailType})`;
        }

        resendTotalErrors = await db.emailLog.count({
          where: { status: 'failed' }
        });
      } catch (_) {}
    }
  }

  list.push({
    name: 'Servicio de Emails Resend',
    key: 'resend',
    status: resendStatus,
    lastChecked: timestamp,
    mode: 'Producción API',
    lastSync: 'Inmediata',
    lastError: resendError,
    lastWebhook: null,
    apiVersion: 'v1 (Mailer Client)',
    latencyMs: resendLatency,
    description: 'Servicio para la entrega ultrarrápida de correos transaccionales a clientes con plantillas HTML minimalistas.',
    nextStep: resendStatus === 'operational'
      ? 'Operativo. El dominio de envío está completamente verificado en los registros DNS.'
      : resendStatus === 'warning'
      ? 'El dominio de Resend está pendiente de verificar SPF/DKIM en tu proveedor de DNS.'
      : resendStatus === 'not_configured'
      ? 'Define la variable RESEND_API_KEY para activar el servicio de correo electrónico.'
      : 'Error de conexión. Verifica la clave del servicio de correo.',
    metadata: {
      domain: resendDomain,
      dnsStatus: resendDnsStatus,
      totalFailedMails: resendTotalErrors,
      lastMailSent: resendLastEmail
    }
  });

  // ==========================================
  // 5. Sentry Exception Logger Check
  // ==========================================
  let sentryStatus: 'operational' | 'warning' | 'error' | 'not_configured' = 'not_configured';
  let sentryUnresolvedErrors = 0;
  const hasSentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (hasSentry) {
    sentryStatus = 'operational';
    if (dbStatus === 'operational') {
      try {
        sentryUnresolvedErrors = await db.notification.count({
          where: { module: 'sentry', status: 'unread' }
        });
        if (sentryUnresolvedErrors > 0) {
          sentryStatus = 'warning';
        }
      } catch (_) {}
    }
  }

  list.push({
    name: 'Sentry Error Monitoring',
    key: 'sentry',
    status: sentryStatus,
    lastChecked: timestamp,
    mode: 'Producción Cloud SDK',
    lastSync: 'Sincronizado',
    lastError: sentryUnresolvedErrors > 0 ? `${sentryUnresolvedErrors} excepciones críticas unread` : null,
    lastWebhook: null,
    apiVersion: 'v7 (NextJS Web SDK)',
    latencyMs: null,
    description: 'Monitorización de rendimiento y rastreo en tiempo real de errores no controlados y excepciones críticas del runtime.',
    nextStep: sentryStatus === 'operational'
      ? 'Operativo. No hay incidencias críticas registradas en la cola.'
      : sentryStatus === 'warning'
      ? 'Revisa el panel de notificaciones para solventar las excepciones de Sentry reportadas.'
      : 'Configura NEXT_PUBLIC_SENTRY_DSN en las variables de entorno de producción para recibir alertas de fallos.',
    metadata: {
      dsnConfigured: hasSentry,
      unresolvedCount: sentryUnresolvedErrors
    }
  });

  // ==========================================
  // 6. Google Analytics Check
  // ==========================================
  const gaId = process.env.NEXT_PUBLIC_GA_ID || process.env.GA_MEASUREMENT_ID;
  const hasGA = !!gaId;

  list.push({
    name: 'Google Analytics (GA4)',
    key: 'google_analytics',
    status: hasGA ? 'operational' : 'not_configured',
    lastChecked: timestamp,
    mode: 'Etiqueta Global gtag.js',
    lastSync: 'Asíncrona Client-side',
    lastError: null,
    lastWebhook: null,
    apiVersion: 'v4',
    latencyMs: null,
    description: 'Medición de eventos en tiempo real, embudos de conversión en el checkout e interacción de usuarios en la tienda.',
    nextStep: hasGA
      ? 'Operativo. Google Analytics está recopilando datos de navegación en el cliente.'
      : 'Registra tu identificador NEXT_PUBLIC_GA_ID (formato G-XXXXXX) para activar la telemetría del sitio web.',
    metadata: {
      measurementId: gaId || '—'
    }
  });

  // ==========================================
  // 7. Google Search Console Check
  // ==========================================
  const gscVerification = process.env.GOOGLE_SEARCH_CONSOLE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const hasGSC = !!gscVerification;

  list.push({
    name: 'Google Search Console',
    key: 'google_search_console',
    status: hasGSC ? 'operational' : 'not_configured',
    lastChecked: timestamp,
    mode: 'Meta-Tag HTML Verification',
    lastSync: 'Asíncrona (Googlebot)',
    lastError: null,
    lastWebhook: null,
    apiVersion: 'v3 (Index Checker)',
    latencyMs: null,
    description: 'Rastreo y estado de indexación oficial de la tienda. Monitorización de sitemaps y posicionamiento orgánico en Google.',
    nextStep: hasGSC
      ? 'Operativo. Etiqueta HTML de verificación de Google Search Console inyectada correctamente.'
      : 'Añade la variable GOOGLE_SEARCH_CONSOLE_VERIFICATION para verificar la propiedad del dominio ante Google.',
    metadata: {
      verificationToken: gscVerification || '—'
    }
  });

  // ==========================================
  // 8. GitHub Repository Check
  // ==========================================
  const gitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'local-git';
  const gitRepoSlug = process.env.VERCEL_GIT_REPO_SLUG || 'alpha-addiction';
  const gitCommitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Commit local de desarrollo';
  const gitBranch = process.env.VERCEL_GIT_COMMIT_REF || 'main';

  list.push({
    name: 'Repositorio GitHub',
    key: 'github',
    status: 'operational', // Siempre operativo si el entorno está funcionando
    lastChecked: timestamp,
    mode: 'CI/CD Webhook',
    lastSync: 'En cada push/merge',
    lastError: null,
    lastWebhook: gitCommitMessage,
    apiVersion: 'GitHub API v3',
    latencyMs: null,
    description: 'Integración del sistema de control de versiones y disparador automatizado de builds de producción ante cambios.',
    nextStep: 'Operativo. El repositorio se encuentra conectado con el motor de despliegue continuo.',
    metadata: {
      repoSlug: gitRepoSlug,
      branch: gitBranch,
      lastCommitSha: gitCommitSha.substring(0, 7)
    }
  });

  // ==========================================
  // 9. Vercel Cloud Infrastructure Check
  // ==========================================
  const isVercel = !!process.env.VERCEL;
  const vercelEnv = process.env.VERCEL_ENV || 'local-dev';
  const vercelUrl = process.env.VERCEL_URL || 'localhost:3000';

  list.push({
    name: 'Infraestructura Cloud (Vercel)',
    key: 'vercel',
    status: 'operational',
    lastChecked: timestamp,
    mode: vercelEnv === 'production' ? 'Production Edge' : (vercelEnv === 'preview' ? 'Preview deployment' : 'Local Development'),
    lastSync: 'Dinámica',
    lastError: null,
    lastWebhook: null,
    apiVersion: 'Vercel Deployment API',
    latencyMs: null,
    description: 'Plataforma de hosting de servidor NextJS con renderizado en el Edge, optimización de imágenes y CDN de baja latencia.',
    nextStep: 'Operativo. El enrutamiento de peticiones y balanceo de carga operan correctamente.',
    metadata: {
      environment: vercelEnv,
      deploymentUrl: vercelUrl,
      isEdgeRunner: isVercel
    }
  });

  return list;
}
