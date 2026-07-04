import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { printfulFetch } from '@/lib/printful';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  let settings: Record<string, string> = {};

  // Variables para diagnóstico de notificaciones
  let unreadNotificationsCount = 0;
  let criticalNotificationsCount = 0;
  let last24hNotificationsCount = 0;
  let lastCriticalErrorNotification: any = null;
  
  // 1. Diagnóstico de Base de Datos (Neon PostgreSQL)
  let dbStatus: 'connected' | 'error' = 'error';
  let dbLatency = 0;
  let dbLastCheck = timestamp;
  
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (error) {
    console.error('❌ [Health API] Database connection failed:', error);
    dbStatus = 'error';
  }

  // 2. Diagnóstico de Printful API
  let printfulStatus: 'connected' | 'error' = 'error';
  let printfulLastSync = 'Desconocida';
  let printfulLastWebhook = 'Ninguno';
  let printfulLastOrder = 'Ninguno';
  let paypalLastWebhook = 'Ninguno';

  let printfulStoreId: number | null = null;
  let printfulStoreName: string | null = null;
  let printfulLinkedProductsCount = 0;
  let printfulErrorsCount = 0;
  let printfulWebhookUrl = 'No registrado';

  try {
    const printfulCheck = await printfulFetch<any>('store');
    if (printfulCheck && printfulCheck.code === 200) {
      printfulStatus = 'connected';
      printfulStoreId = printfulCheck.result?.id || null;
      printfulStoreName = printfulCheck.result?.name || null;
    }

    const webhookCheck = await printfulFetch<any>('webhooks');
    if (webhookCheck && webhookCheck.code === 200 && webhookCheck.result) {
      printfulWebhookUrl = webhookCheck.result.url || 'No registrado';
    }
  } catch (error) {
    console.error('❌ [Health API] Printful API connection failed:', error);
    printfulStatus = 'error';
  }

  // Si la DB está conectada, buscar métricas e historial de Printful
  if (dbStatus === 'connected') {
    try {
      // Última sincronización de catálogo
      const lastSyncLog = await db.auditLog.findFirst({
        where: { action: 'SYNC_PRODUCTS_SUCCESS' },
        orderBy: { createdAt: 'desc' },
      });
      if (lastSyncLog) {
        printfulLastSync = lastSyncLog.createdAt.toLocaleString('es-ES');
      }

      // Último webhook recibido
      const lastWebhookEvent = await db.orderEvent.findFirst({
        where: { type: { startsWith: 'FULFILLMENT_' } },
        orderBy: { createdAt: 'desc' },
      });
      if (lastWebhookEvent) {
        printfulLastWebhook = `${lastWebhookEvent.createdAt.toLocaleString('es-ES')} (${lastWebhookEvent.type})`;
      }

      // Último pedido enviado
      const lastOrderSubmitted = await db.order.findFirst({
        where: { printfulOrderId: { not: null } },
        orderBy: { updatedAt: 'desc' },
      });
      if (lastOrderSubmitted) {
        printfulLastOrder = `#${lastOrderSubmitted.orderNumber} (Printful ID: #${lastOrderSubmitted.printfulOrderId})`;
      }

      // Productos vinculados a Printful
      printfulLinkedProductsCount = await db.product.count({
        where: { printfulProductId: { not: null } }
      });

      // Errores de envío a Printful
      printfulErrorsCount = await db.order.count({
        where: { orderStatus: 'fulfillment_failed' }
      });

      // Último webhook de PayPal recibido
      const lastPaypalEvent = await db.orderEvent.findFirst({
        where: { type: { startsWith: 'PAYPAL_' } },
        orderBy: { createdAt: 'desc' },
      });
      if (lastPaypalEvent) {
        paypalLastWebhook = `${lastPaypalEvent.createdAt.toLocaleString('es-ES')} (${lastPaypalEvent.type.replace('PAYPAL_', '')})`;
      }
      // Obtener configuraciones generales de la base de datos
      const records = await db.systemSetting.findMany();
      settings = records.reduce((acc, r) => {
        acc[r.key] = r.value;
        return acc;
      }, {} as Record<string, string>);

      // Diagnóstico de Notificaciones Internas
      try {
        unreadNotificationsCount = await db.notification.count({
          where: { status: 'unread' }
        });

        criticalNotificationsCount = await db.notification.count({
          where: { severity: 'critical', status: 'unread' }
        });

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        last24hNotificationsCount = await db.notification.count({
          where: { createdAt: { gte: twentyFourHoursAgo } }
        });

        const lastCritical = await db.notification.findFirst({
          where: { severity: 'critical' },
          orderBy: { createdAt: 'desc' }
        });
        if (lastCritical) {
          lastCriticalErrorNotification = {
            title: lastCritical.title,
            message: lastCritical.message,
            createdAt: lastCritical.createdAt.toISOString()
          };
        }
      } catch (notifErr) {
        console.warn('⚠️ [Health API] Error recuperando métricas de notificaciones:', notifErr);
      }
    } catch (dbError) {
      console.warn('⚠️ [Health API] Error recuperando detalles de la base de datos:', dbError);
    }
  }

  // 3. Diagnóstico de PayPal
  const paypalConfigured = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const paypalStatus = paypalConfigured ? 'configured' : 'pending_setup';

  // 3.1 Diagnóstico de Resend
  let resendStatus = 'pending_setup';
  let resendLastEmail = 'Ninguno';
  let resendTotalErrors = 0;
  let resendDomain = 'No configurado';
  let resendDnsStatus = 'N/A';
  let resendLatency = 0;

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'MOCK_RESEND_API_KEY') {
    resendStatus = 'configured';
    try {
      const resendStart = Date.now();
      const resendRes = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      resendLatency = Date.now() - resendStart;

      if (resendRes.ok) {
        const domainsData = await resendRes.json();
        const domainsList = domainsData.data || [];
        if (domainsList.length > 0) {
          const mainDomain = domainsList[0];
          resendDomain = mainDomain.name;
          resendDnsStatus = mainDomain.status; // 'verified', 'pending', etc.
        } else {
          resendDomain = 'Sin dominios registrados';
          resendDnsStatus = 'Pendiente';
        }
      } else {
        resendStatus = 'degraded';
        resendDnsStatus = 'Error de API';
      }
    } catch (resendError) {
      console.warn('⚠️ [Health API] Fallo al consultar dominios de Resend:', resendError);
      resendStatus = 'degraded';
      resendDnsStatus = 'Error de red';
    }
  }

  // 4. Variables de entorno (Comprobación de existencia únicamente, sin exponer valores)
  const envStatus = {
    DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
    PRINTFUL_API_KEY: process.env.PRINTFUL_API_KEY ? 'configured' : 'missing',
    PRINTFUL_WEBHOOK_SECRET: (process.env.PRINTFUL_WEBHOOK_SECRET || process.env.PRINTFUL_WEBHOOK_SIGNING_SECRET) ? 'configured' : 'missing',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'missing',
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? 'configured' : 'missing',
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID ? 'configured' : 'missing',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'configured' : 'missing',
    EMAIL_FROM: process.env.EMAIL_FROM ? 'configured' : 'missing',
    JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ? 'configured' : 'missing',
  };

  // 5. Métricas de Pedidos
  let ordersCount = {
    total: 0,
    paid: 0,
    pending: 0,
    production: 0,
    shipped: 0,
    failed: 0,
  };

  if (dbStatus === 'connected') {
    try {
      const allOrders = await db.order.findMany({
        select: { orderStatus: true, paymentStatus: true },
      });

      ordersCount.total = allOrders.length;
      allOrders.forEach(o => {
        if (o.paymentStatus === 'pagado' || o.paymentStatus === 'paid') ordersCount.paid++;
        if (o.orderStatus === 'pago_pendiente') ordersCount.pending++;
        if (o.orderStatus === 'printful_production') ordersCount.production++;
        if (o.orderStatus === 'shipped') ordersCount.shipped++;
        if (o.orderStatus === 'fulfillment_failed' || o.orderStatus === 'failed') ordersCount.failed++;
      });
    } catch (oError) {
      console.warn('⚠️ [Health API] Error contando métricas de pedidos:', oError);
    }
  }

  // 5b. Métricas de Drops
  let activeDropName = 'Ninguno';
  let activeDropStatus = 'N/A';
  let dropProductsCount = 0;
  let totalVirtualStockVal = 0;
  let activeDropOpening = '—';
  let activeDropClosing = '—';

  if (dbStatus === 'connected') {
    try {
      const activeDrop = await db.drop.findFirst({
        where: { status: 'LIVE', visible: true },
        include: { products: true }
      });
      if (activeDrop) {
        activeDropName = activeDrop.name;
        activeDropStatus = activeDrop.status;
        dropProductsCount = activeDrop.products.length;
        activeDropOpening = activeDrop.openingAt.toISOString();
        activeDropClosing = activeDrop.closingAt.toISOString();

        for (const p of activeDrop.products) {
          const colorVariants = (p.colorVariants as any[]) || [];
          colorVariants.forEach(cv => {
            cv.sizes?.forEach((sz: any) => {
              if (sz.virtualStock !== undefined) {
                totalVirtualStockVal += sz.virtualStock;
              }
            });
          });
        }
      }
    } catch (dError) {
      console.warn('⚠️ [Health API] Error obteniendo estadísticas de drops:', dError);
    }
  }

  // 5c. Métricas de Waitlist
  let waitlistTotal = 0;
  let nextDropWaitlistCount = 0;
  let nextDropName = 'Ninguno';
  let lastRegisterInfo = 'Ninguno';
  let waitlistSuccessCount = 0;
  let waitlistFailedCount = 0;

  if (dbStatus === 'connected') {
    try {
      waitlistTotal = await db.dropWaitlist.count();

      const nextDrop = await db.drop.findFirst({
        where: { status: 'COMING_SOON', visible: true },
        orderBy: { openingAt: 'asc' },
      });

      if (nextDrop) {
        nextDropName = nextDrop.name;
        nextDropWaitlistCount = await db.dropWaitlist.count({
          where: { dropId: nextDrop.id },
        });
      }

      const lastRegister = await db.dropWaitlist.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { drop: { select: { name: true } } },
      });

      if (lastRegister) {
        const emailParts = lastRegister.email.split('@');
        const local = emailParts[0];
        const domain = emailParts[1] || '';
        const maskedLocal = local.length > 2 ? `${local.substring(0, 2)}***` : '***';
        const maskedEmail = `${maskedLocal}@${domain}`;
        
        lastRegisterInfo = `${lastRegister.createdAt.toLocaleString('es-ES')} - ${maskedEmail} (Drop: ${lastRegister.drop.name})`;
      }

      waitlistSuccessCount = await db.emailLog.count({
        where: { emailType: 'WAITLIST_CONFIRMATION', status: 'success' },
      });

      waitlistFailedCount = await db.emailLog.count({
        where: { emailType: 'WAITLIST_CONFIRMATION', status: 'failed' },
      });
    } catch (wError) {
      console.warn('⚠️ [Health API] Error obteniendo estadísticas de waitlist:', wError);
    }
  }

  // 5d. Métricas de Descuentos
  let discountsActiveCount = 0;
  let discountsExpiredCount = 0;
  let discountsUsedCount = 0;
  let discountsAppliedTodaySum = 0;

  if (dbStatus === 'connected') {
    try {
      const now = new Date();
      discountsActiveCount = await db.discount.count({
        where: {
          status: 'ACTIVE',
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      });

      discountsExpiredCount = await db.discount.count({
        where: {
          OR: [
            { endsAt: { lt: now } },
            { status: 'INACTIVE' }
          ]
        },
      });

      discountsUsedCount = await db.discountRedemption.count();

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const ordersToday = await db.order.findMany({
        where: {
          createdAt: { gte: startOfToday },
          paymentStatus: 'pagado',
        },
        select: { discount: true },
      });
      discountsAppliedTodaySum = ordersToday.reduce((acc, o) => acc + o.discount, 0);
    } catch (discError) {
      console.warn('⚠️ [Health API] Error obteniendo estadísticas de descuentos:', discError);
    }
  }

  // 6. Logs de Auditoría Recientes
  let recentLogs: any[] = [];
  if (dbStatus === 'connected') {
    try {
      recentLogs = await db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          details: true,
          ipAddress: true,
          createdAt: true,
        },
      });
      // Consultar historial y errores de correos
      const lastEmailLog = await db.emailLog.findFirst({
        orderBy: { sentAt: 'desc' },
      });
      if (lastEmailLog) {
        resendLastEmail = `${lastEmailLog.sentAt.toLocaleString('es-ES')} [${lastEmailLog.emailType}] a ${lastEmailLog.recipient} (${lastEmailLog.status})`;
      }
      resendTotalErrors = await db.emailLog.count({
        where: { status: 'failed' },
      });
    } catch (lError) {
      console.warn('⚠️ [Health API] Error consultando logs de auditoría/emails:', lError);
    }
  }

  // 6b. Diagnóstico de Automatizaciones
  let automationStats = {
    lastEvent: 'Ninguno',
    pendingEvents: 0,
    errorCount: 0,
    avgDurationMs: 0,
    activeAutomationsCount: 0
  };

  if (dbStatus === 'connected') {
    try {
      const lastRunLog = await db.automationLog.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      if (lastRunLog) {
        automationStats.lastEvent = `${lastRunLog.createdAt.toLocaleString('es-ES')} - [${lastRunLog.eventType}] (${lastRunLog.status})`;
      }
      
      automationStats.errorCount = await db.automationLog.count({ where: { status: 'FAILED' } });
      
      const avgDurationObj = await db.automationLog.aggregate({
        where: { status: 'SUCCESS' },
        _avg: { durationMs: true }
      });
      automationStats.avgDurationMs = Math.round(avgDurationObj._avg.durationMs || 0);

      automationStats.pendingEvents = await db.dropWaitlist.count({
        where: { status: { in: ['registered', 'pending'] } }
      });

      const settingsKeys = ['enable_automations', 'auto_submit_to_printful', 'enable_automatic_emails', 'auto_open_drops', 'auto_close_drops'];
      const activeSettings = await db.systemSetting.count({
        where: {
          key: { in: settingsKeys },
          value: 'true'
        }
      });
      automationStats.activeAutomationsCount = activeSettings;
    } catch (autoErr) {
      console.warn('⚠️ [Health API] Error obteniendo estadísticas de automatizaciones:', autoErr);
    }
  }

  // 6d. Diagnóstico de Soporte Técnico
  let supportStats = {
    openTickets: 0,
    urgentTickets: 0,
    unrepliedTickets: 0,
    lastTicketReceived: 'Ninguno'
  };

  if (dbStatus === 'connected') {
    try {
      supportStats.openTickets = await db.supportTicket.count({
        where: { status: { in: ['open', 'pending', 'replied'] } }
      });
      supportStats.urgentTickets = await db.supportTicket.count({
        where: {
          status: { in: ['open', 'pending', 'replied'] },
          priority: 'urgent'
        }
      });
      supportStats.unrepliedTickets = await db.supportTicket.count({
        where: { status: 'open' }
      });

      const lastTicket = await db.supportTicket.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      if (lastTicket) {
        supportStats.lastTicketReceived = `${lastTicket.ticketNumber} - ${lastTicket.customerEmail} (${lastTicket.createdAt.toLocaleDateString()})`;
      }
    } catch (supErr) {
      console.warn('⚠️ [Health API] Error obteniendo estadísticas de soporte:', supErr);
    }
  }

  // 6e. Estadísticas de Portal del Cliente
  let portalStats = {
    totalCustomerAccesses: 0,
    lastCustomerAccess: 'Ninguno',
    otpErrors: 0,
    activeSecureTokens: 0,
    avgAuthTimeSeconds: 0
  };

  if (dbStatus === 'connected') {
    try {
      portalStats.totalCustomerAccesses = await db.customerAccessLog.count();

      const lastAccess = await db.customerAccessLog.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      if (lastAccess) {
        portalStats.lastCustomerAccess = `${lastAccess.createdAt.toLocaleDateString()} - ${lastAccess.email} (${lastAccess.accessType})`;
      }

      const otpErrorsSum = await db.supportOtp.aggregate({
        _sum: { attempts: true }
      });
      portalStats.otpErrors = otpErrorsSum._sum.attempts || 0;

      portalStats.activeSecureTokens = await db.activeToken.count({
        where: { expiresAt: { gte: new Date() } }
      });

      const avgAuthTimeObj = await db.customerAccessLog.aggregate({
        where: { accessType: 'OTP', durationSeconds: { not: null } },
        _avg: { durationSeconds: true }
      });
      portalStats.avgAuthTimeSeconds = Math.round(avgAuthTimeObj._avg.durationSeconds || 0);

    } catch (portErr) {
      console.warn('⚠️ [Health API] Error obteniendo estadísticas de portal:', portErr);
    }
  }

  // 6f. Diagnóstico de Communication Center y Consentimientos
  let commsCenterStats = {
    inboundEmailStatus: 'active',
    marketingConsents: 0,
    newsletterConsents: 0,
    emailProvider: 'resend',
    lastEmailReceived: 'Ninguno',
    lastInboundError: 'Ninguno',
    lastAutoCreatedTicket: 'Ninguno'
  };

  if (dbStatus === 'connected') {
    try {
      commsCenterStats.marketingConsents = await db.customerConsent.count({
        where: { consentType: 'marketing', accepted: true }
      });
      commsCenterStats.newsletterConsents = await db.customerConsent.count({
        where: { consentType: 'newsletter', accepted: true }
      });

      const lastReceivedMsg = await db.supportMessage.findFirst({
        where: { messageId: { not: null }, senderType: 'customer' },
        orderBy: { createdAt: 'desc' }
      });
      if (lastReceivedMsg) {
        commsCenterStats.lastEmailReceived = `${lastReceivedMsg.createdAt.toLocaleString('es-ES')} - de ${lastReceivedMsg.senderEmail}`;
      }

      const lastAutoTicket = await db.supportTicket.findFirst({
        where: { source: 'email' },
        orderBy: { createdAt: 'desc' }
      });
      if (lastAutoTicket) {
        commsCenterStats.lastAutoCreatedTicket = `${lastAutoTicket.ticketNumber} (${lastAutoTicket.createdAt.toLocaleString('es-ES')})`;
      }
    } catch (commsErr) {
      console.warn('⚠️ [Health API] Error obteniendo estadísticas de comms center:', commsErr);
    }
  }

  // 6c. Diagnóstico de SEO y Rendimiento
  let sitemapExists = false;
  let robotsExists = false;
  let avisoLegalExists = false;
  let cookiesExists = false;
  let privacidadExists = false;
  const warnings: string[] = [];

  try {
    const rootDir = process.cwd();
    sitemapExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'sitemap.ts'));
    robotsExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'robots.ts'));
    avisoLegalExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'legal', 'aviso-legal', 'page.tsx'));
    cookiesExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'legal', 'cookies', 'page.tsx'));
    privacidadExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'legal', 'privacidad', 'page.tsx'));

    if (!sitemapExists) warnings.push('El archivo sitemap.ts no se encuentra o no está configurado.');
    if (!robotsExists) warnings.push('El archivo robots.ts no se encuentra o no está configurado.');
    if (!avisoLegalExists) warnings.push('La página legal de Aviso Legal no está disponible.');
    if (!cookiesExists) warnings.push('La página legal de Política de Cookies no está disponible.');
    if (!privacidadExists) warnings.push('La página legal de Política de Privacidad no está disponible.');
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      warnings.push('La variable de entorno NEXT_PUBLIC_APP_URL no está configurada. Las URLs absolutas usarán el dominio por defecto.');
    }
  } catch (err) {
    console.warn('⚠️ [Health API] Error realizando diagnóstico de SEO:', err);
  }

  const seoPerformance = {
    sitemapAvailable: sitemapExists,
    robotsAvailable: robotsExists,
    metadataConfigured: true,
    legalPagesAvailable: avisoLegalExists && cookiesExists && privacidadExists,
    imagesOptimized: true,
    indexingStatus: (robotsExists && sitemapExists && avisoLegalExists && cookiesExists && privacidadExists) ? 'preparado' : 'advertencia',
    warnings: warnings,
  };

  // 5d. Estado de 2FA Admin
  let isTwoFactorEnabled = false;
  let last2faEventAt = '—';
  let twoFactorRecommendation = 'Recomendado habilitar 2FA en el panel de Configuración -> Seguridad para proteger tu tienda.';

  if (dbStatus === 'connected') {
    try {
      const mainAdmin = await db.adminUser.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      if (mainAdmin) {
        isTwoFactorEnabled = mainAdmin.twoFactorEnabled;
        if (mainAdmin.lastSecurityEventAt) {
          last2faEventAt = mainAdmin.lastSecurityEventAt.toLocaleString('es-ES');
        }
        twoFactorRecommendation = isTwoFactorEnabled
          ? '2FA habilitado correctamente. Recuerda mantener a salvo tus códigos de recuperación.'
          : 'Recomendado habilitar 2FA en el panel de Administración -> Seguridad para proteger el ecommerce.';
      }
    } catch (err2fa) {
      console.warn('⚠️ [Health API] Error obteniendo estado 2FA de admin:', err2fa);
    }
  }

  // 5e. Estado de Compras de Prueba (Test Purchases)
  const testPurchasesEnabled = process.env.ENABLE_TEST_PURCHASES === 'true';
  const isProductionEnv = (process.env.VERCEL_ENV || process.env.NODE_ENV || 'development') === 'production';
  let testPurchasesStatus: 'disabled' | 'enabled' | 'error' = 'disabled';
  let testPurchasesRecommendation = 'Las compras de prueba están desactivadas de forma segura.';

  if (testPurchasesEnabled) {
    if (isProductionEnv) {
      testPurchasesStatus = 'error';
      testPurchasesRecommendation = '❌ ERROR CRÍTICO: Las compras de prueba están habilitadas en producción. Edita la variable de entorno ENABLE_TEST_PURCHASES a false.';
      warnings.push('Las compras de prueba están habilitadas en producción. Modifícalo de inmediato.');
    } else {
      testPurchasesStatus = 'enabled';
      testPurchasesRecommendation = 'Las compras de prueba están activas en desarrollo/sandbox.';
    }
  } else {
    testPurchasesStatus = 'disabled';
    testPurchasesRecommendation = 'Las compras de prueba están desactivadas correctamente.';
  }

  // Determinar estado general del Health Center
  let systemStatus: 'green' | 'yellow' | 'red' = 'green';
  if (dbStatus === 'error' || printfulStatus === 'error' || testPurchasesStatus === 'error') {
    systemStatus = 'red';
  } else if (!paypalConfigured || warnings.length > 0) {
    systemStatus = 'yellow';
  }

  // 12. Diagnóstico de Copias de Seguridad (Neon Backups)
  let backupsInfo = {
    enabled: process.env.ENABLE_BACKUPS === 'true',
    configured: !!(process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL),
    encryptionActive: !!process.env.BACKUP_ENCRYPTION_KEY,
    lastBackupFile: null as string | null,
    lastBackupSize: null as string | null,
    lastBackupTime: null as string | null,
    recommendation: 'No se han detectado copias de seguridad generadas. Se recomienda ejecutar "npm run backup:db" para resguardar los datos.'
  };

  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('backup-') && (f.endsWith('.gz') || f.endsWith('.enc')))
        .sort();

      if (files.length > 0) {
        const latest = files[files.length - 1];
        const latestPath = path.join(backupsDir, latest);
        const stat = fs.statSync(latestPath);
        backupsInfo.lastBackupFile = latest;
        backupsInfo.lastBackupSize = `${(stat.size / 1024).toFixed(2)} KB`;
        backupsInfo.lastBackupTime = stat.mtime.toISOString();
        backupsInfo.recommendation = backupsInfo.encryptionActive
          ? 'Copias de seguridad configuradas y cifradas con éxito.'
          : 'Copia de seguridad registrada, pero se recomienda definir BACKUP_ENCRYPTION_KEY para cifrar la información sensible.';
      }
    }
  } catch (err) {
    console.warn('⚠️ [Health API] Error escaneando backups:', err);
  }

  return NextResponse.json({
    status: systemStatus,
    timestamp,
    system: {
      nextVersion: '16.1.6',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || 'local-build-2026',
    },
    backups: backupsInfo,
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      lastCheck: dbLastCheck,
    },
    printful: {
      status: printfulStatus,
      storeId: printfulStoreId,
      storeName: printfulStoreName,
      webhookUrl: printfulWebhookUrl,
      linkedProductsCount: printfulLinkedProductsCount,
      errorsCount: printfulErrorsCount,
      lastSync: printfulLastSync,
      lastWebhook: printfulLastWebhook,
      lastOrder: printfulLastOrder,
    },
    paypal: {
      status: paypalStatus,
      mode: (process.env.PAYPAL_API || 'sandbox').toLowerCase().includes('sandbox') ? 'sandbox' : 'production',
      webhookIdConfigured: !!process.env.PAYPAL_WEBHOOK_ID,
      lastWebhook: paypalLastWebhook,
      setupInfo: 'Pendiente de configurar credenciales reales de producción.',
    },
    resend: {
      status: resendStatus,
      configured: !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'MOCK_RESEND_API_KEY',
      domain: resendDomain,
      dnsStatus: resendDnsStatus,
      latencyMs: resendLatency,
      lastEmail: resendLastEmail,
      totalErrors: resendTotalErrors,
    },
    automations: automationStats,
    commsCenter: commsCenterStats,
    seoPerformance,
    support: supportStats,
    portal: portalStats,
    twoFactorAdmin: {
      enabled: isTwoFactorEnabled,
      lastEventAt: last2faEventAt,
      recommendation: twoFactorRecommendation
    },
    testPurchases: {
      status: testPurchasesStatus,
      enabled: testPurchasesEnabled,
      recommendation: testPurchasesRecommendation
    },
    sentry: {
      configured: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || null,
      recommendation: process.env.NEXT_PUBLIC_SENTRY_DSN
        ? 'Sentry está configurado correctamente para monitorizar excepciones.'
        : 'Se recomienda configurar NEXT_PUBLIC_SENTRY_DSN en las variables de entorno de producción.'
    },
    configuration: {
      completionPercentage: Math.round(((
        [
          'company_name', 'company_domain', 'company_logo', 'company_email',
          'company_nif', 'company_address', 'legal_rgpd_responsible',
          'legal_treatment_responsible', 'legal_aviso_legal',
          'legal_policy_privacy', 'legal_policy_cookies', 'legal_conditions_purchase'
        ].filter(k => !!settings[k]).length +
        (settings['company_domain']?.toLowerCase().startsWith('https://') ? 1 : 0) +
        (sitemapExists ? 1 : 0) + (robotsExists ? 1 : 0) +
        (!!process.env.PRINTFUL_API_KEY ? 1 : 0) +
        (!!process.env.PAYPAL_CLIENT_ID ? 1 : 0) +
        (!!process.env.RESEND_API_KEY ? 1 : 0)
      ) / 18) * 100),
      isReadyForProduction: (
        [
          'company_name', 'company_domain', 'company_logo', 'company_email',
          'company_nif', 'company_address', 'legal_rgpd_responsible',
          'legal_treatment_responsible', 'legal_aviso_legal',
          'legal_policy_privacy', 'legal_policy_cookies', 'legal_conditions_purchase'
        ].every(k => !!settings[k] && settings[k].trim() !== '') &&
        !!settings['company_domain']?.toLowerCase().startsWith('https://') &&
        sitemapExists && robotsExists &&
        !!process.env.PRINTFUL_API_KEY &&
        !!process.env.PAYPAL_CLIENT_ID &&
        !!process.env.RESEND_API_KEY
      ),
      pendingCount: 18 - (
        [
          'company_name', 'company_domain', 'company_logo', 'company_email',
          'company_nif', 'company_address', 'legal_rgpd_responsible',
          'legal_treatment_responsible', 'legal_aviso_legal',
          'legal_policy_privacy', 'legal_policy_cookies', 'legal_conditions_purchase'
        ].filter(k => !!settings[k]).length +
        (settings['company_domain']?.toLowerCase().startsWith('https://') ? 1 : 0) +
        (sitemapExists ? 1 : 0) + (robotsExists ? 1 : 0) +
        (!!process.env.PRINTFUL_API_KEY ? 1 : 0) +
        (!!process.env.PAYPAL_CLIENT_ID ? 1 : 0) +
        (!!process.env.RESEND_API_KEY ? 1 : 0)
      )
    },
    drops: {
      activeDrop: activeDropName,
      status: activeDropStatus,
      productsCount: dropProductsCount,
      totalVirtualStock: totalVirtualStockVal,
      openingAt: activeDropOpening,
      closingAt: activeDropClosing,
    },
    waitlist: {
      total: waitlistTotal,
      nextDropWaitlist: nextDropWaitlistCount,
      nextDropName: nextDropName,
      lastRegister: lastRegisterInfo,
      emailStatus: {
        success: waitlistSuccessCount,
        failed: waitlistFailedCount,
      }
    },
    discounts: {
      active: discountsActiveCount,
      expired: discountsExpiredCount,
      used: discountsUsedCount,
      appliedToday: discountsAppliedTodaySum,
    },
    notifications: {
      unreadCount: unreadNotificationsCount,
      criticalCount: criticalNotificationsCount,
      last24hCount: last24hNotificationsCount,
      lastCriticalError: lastCriticalErrorNotification
    },
    envVariables: envStatus,
    orders: ordersCount,
    logs: recentLogs,
  });
}
