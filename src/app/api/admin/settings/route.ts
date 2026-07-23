import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import fs from 'fs';
import path from 'path';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

// Lista de configuraciones requeridas para Producción
const PRODUCTION_CHECKLIST_KEYS = [
  { key: 'company_name', label: 'Nombre Comercial de la Empresa' },
  { key: 'company_domain', label: 'Dominio Oficial (SSL)' },
  { key: 'company_logo', label: 'Logotipo de la Marca' },
  { key: 'company_email', label: 'Correo Electrónico de Contacto' },
  { key: 'company_nif', label: 'NIF / CIF Fiscal' },
  { key: 'company_address', label: 'Dirección Fiscal' },
  { key: 'legal_rgpd_responsible', label: 'Responsable de Protección de Datos (RGPD)' },
  { key: 'legal_treatment_responsible', label: 'Responsable del Tratamiento Legal' },
  { key: 'legal_aviso_legal', label: 'Texto de Aviso Legal' },
  { key: 'legal_policy_privacy', label: 'Texto de Política de Privacidad' },
  { key: 'legal_policy_cookies', label: 'Texto de Política de Cookies' },
  { key: 'legal_conditions_purchase', label: 'Texto de Condiciones Generales de Compra' }
];

export async function GET() {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    // 1. Obtener todas las configuraciones de la base de datos
    const records = await db.systemSetting.findMany();
    const settings = records.reduce((acc, r) => {
      acc[r.key] = r.value;
      return acc;
    }, {} as Record<string, string>);

    // 2. Comprobar archivos físicos en el servidor
    const rootDir = process.cwd();
    const sitemapExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'sitemap.ts'));
    const robotsExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'robots.ts'));

    // 3. Ejecutar validación del Checklist de Producción
    const pendingTechnicalItems: string[] = [];
    const pendingLegalItems: string[] = [];

    // --- REQUISITOS TÉCNICOS ---
    const hasPaypalLive = !!process.env.PAYPAL_CLIENT_ID && 
                          !!process.env.PAYPAL_CLIENT_SECRET && 
                          !!process.env.PAYPAL_WEBHOOK_ID && 
                          process.env.PAYPAL_API === 'https://api-m.paypal.com';

    if (!process.env.PAYPAL_CLIENT_ID) pendingTechnicalItems.push('PAYPAL_CLIENT_ID configurado');
    if (!process.env.PAYPAL_CLIENT_SECRET) pendingTechnicalItems.push('PAYPAL_CLIENT_SECRET configurado');
    if (!process.env.PAYPAL_WEBHOOK_ID) pendingTechnicalItems.push('PAYPAL_WEBHOOK_ID configurado');
    if (process.env.PAYPAL_API !== 'https://api-m.paypal.com') {
      pendingTechnicalItems.push('PAYPAL_API establecido en https://api-m.paypal.com');
    }

    if (!process.env.DATABASE_URL) pendingTechnicalItems.push('DATABASE_URL configurado');
    if (!process.env.PRINTFUL_API_KEY) pendingTechnicalItems.push('API de Producción de Printful (PRINTFUL_API_KEY) configurada');
    if (!process.env.RESEND_API_KEY) pendingTechnicalItems.push('Servidor de Envío de Correos (RESEND_API_KEY) configurado');
    if (!process.env.JWT_SECRET) pendingTechnicalItems.push('JWT_SECRET configurada');
    if (!process.env.ADMIN_SESSION_SECRET) pendingTechnicalItems.push('ADMIN_SESSION_SECRET configurada');
    if (!process.env.TWO_FACTOR_ENCRYPTION_KEY) pendingTechnicalItems.push('TWO_FACTOR_ENCRYPTION_KEY configurada');

    if (process.env.ENABLE_TEST_PURCHASES === 'true') {
      pendingTechnicalItems.push('Las compras de prueba deben estar desactivadas (ENABLE_TEST_PURCHASES = false)');
    }

    // Validar salud del sistema (no debe haber fallas críticas en Neon ni servicios)
    try {
      const degradedServices = await db.systemHealth.count({
        where: { status: { in: ['offline', 'degraded'] } }
      });
      if (degradedServices > 0) {
        pendingTechnicalItems.push('Health Center libre de errores críticos');
      }
    } catch (healthErr) {
      console.warn('No se pudo verificar el estado de salud del sistema:', healthErr);
    }

    // Validar 2FA del Administrador Principal
    const session = await db.adminSession.findUnique({
      where: { id: verified.sessionId },
      include: { user: true }
    });
    if (!session || !session.user || !session.user.twoFactorEnabled) {
      pendingTechnicalItems.push('Autenticación de Doble Factor (2FA) activa para la cuenta del Administrador');
    }

    // --- REQUISITOS LEGALES / COMERCIALES ---
    for (const item of PRODUCTION_CHECKLIST_KEYS) {
      const val = settings[item.key];
      if (!val || val.trim() === '') {
        pendingLegalItems.push(item.label);
      }
    }

    // Validar SSL (el dominio debe tener https://)
    const domain = settings['company_domain'] || '';
    if (domain && !domain.toLowerCase().startsWith('https://')) {
      pendingLegalItems.push('Dominio Seguro con SSL (Debe comenzar con https://)');
    }

    // Validar archivos
    if (!sitemapExists) pendingLegalItems.push('Archivo de Mapa del Sitio (sitemap.ts)');
    if (!robotsExists) pendingLegalItems.push('Archivo de Directivas del Buscador (robots.ts)');

    // Determinar modo activo seleccionado
    const activeMode = settings['system_mode'] || 'development';
    let pendingItems: string[] = [];

    if (activeMode === 'production_verification') {
      pendingItems = pendingTechnicalItems;
    } else if (activeMode === 'production_open') {
      pendingItems = [...pendingTechnicalItems, ...pendingLegalItems];
    } else {
      // En modo development mostramos ambos como guía
      pendingItems = [...pendingTechnicalItems, ...pendingLegalItems];
    }

    // Calcular porcentaje de completado
    const totalChecks = PRODUCTION_CHECKLIST_KEYS.length + 11 + 2; // 12 db + 11 tech + 2 files
    const completedChecks = totalChecks - (pendingTechnicalItems.length + pendingLegalItems.length);
    const completionPercentage = Math.round((completedChecks / totalChecks) * 100);

    const isReadyForProduction = activeMode === 'production_verification'
      ? pendingTechnicalItems.length === 0
      : (pendingTechnicalItems.length === 0 && pendingLegalItems.length === 0);

    // 4. Mapear estado de integraciones enmascarado
    const hasPrintfulProd = !!process.env.PRINTFUL_API_KEY;
    const hasPaypalProd = !!process.env.PAYPAL_CLIENT_ID;
    const hasResend = !!process.env.RESEND_API_KEY;

    const integrations = {
      printful: hasPrintfulProd 
        ? (activeMode !== 'development' ? 'configured' : 'sandbox') 
        : 'pending',
      paypal: hasPaypalProd 
        ? (activeMode !== 'development' ? 'configured' : 'sandbox') 
        : 'pending',
      resend: hasResend ? 'configured' : 'pending',
      google_analytics: settings['ga_measurement_id'] ? 'configured' : 'pending',
      google_search_console: settings['gsc_verification_id'] ? 'configured' : 'pending',
      meta_pixel: settings['meta_pixel_id'] ? 'configured' : 'pending',
      tiktok_pixel: settings['tiktok_pixel_id'] ? 'configured' : 'pending',
    };

    return NextResponse.json({
      success: true,
      settings,
      checklist: {
        completionPercentage,
        isReadyForProduction,
        pendingTechnicalItems,
        pendingLegalItems,
        pendingItems
      },
      integrations
    });

  } catch (error: any) {
    console.error('❌ [Settings GET] Error:', error);
    return NextResponse.json({ error: 'Error al recuperar configuración.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { settings } = await req.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Formato de configuración no válido.' }, { status: 400 });
    }

    // 1. Obtener configuraciones actuales mezcladas con las nuevas para validación completa
    const currentRecords = await db.systemSetting.findMany();
    const mergedSettings = currentRecords.reduce((acc, r) => {
      acc[r.key] = r.value;
      return acc;
    }, {} as Record<string, string>);

    Object.assign(mergedSettings, settings);

    // 2. Ejecutar validaciones según el modo de destino
    const targetMode = settings['system_mode'] || mergedSettings['system_mode'] || 'development';

    if (targetMode === 'production_verification' || targetMode === 'production_open') {
      const pendingTechnicalItems: string[] = [];

      // Validar requisitos técnicos
      if (!process.env.PAYPAL_CLIENT_ID) pendingTechnicalItems.push('PAYPAL_CLIENT_ID configurado');
      if (!process.env.PAYPAL_CLIENT_SECRET) pendingTechnicalItems.push('PAYPAL_CLIENT_SECRET configurado');
      if (!process.env.PAYPAL_WEBHOOK_ID) pendingTechnicalItems.push('PAYPAL_WEBHOOK_ID configurado');
      if (process.env.PAYPAL_API !== 'https://api-m.paypal.com') {
        pendingTechnicalItems.push('PAYPAL_API establecido en https://api-m.paypal.com');
      }

      if (!process.env.DATABASE_URL) pendingTechnicalItems.push('DATABASE_URL configurado');
      if (!process.env.PRINTFUL_API_KEY) pendingTechnicalItems.push('API de Producción de Printful (PRINTFUL_API_KEY) configurada');
      if (!process.env.RESEND_API_KEY) pendingTechnicalItems.push('Servidor de Envío de Correos (RESEND_API_KEY) configurado');
      if (!process.env.JWT_SECRET) pendingTechnicalItems.push('JWT_SECRET configurada');
      if (!process.env.ADMIN_SESSION_SECRET) pendingTechnicalItems.push('ADMIN_SESSION_SECRET configurada');
      if (!process.env.TWO_FACTOR_ENCRYPTION_KEY) pendingTechnicalItems.push('TWO_FACTOR_ENCRYPTION_KEY configurada');

      if (process.env.ENABLE_TEST_PURCHASES === 'true') {
        pendingTechnicalItems.push('Las compras de prueba deben estar desactivadas (ENABLE_TEST_PURCHASES = false)');
      }

      // Validar 2FA del Administrador Principal
      const session = await db.adminSession.findUnique({
        where: { id: verified.sessionId },
        include: { user: true }
      });
      if (!session || !session.user || !session.user.twoFactorEnabled) {
        pendingTechnicalItems.push('Autenticación de Doble Factor (2FA) activa para la cuenta del Administrador');
      }

      if (targetMode === 'production_verification') {
        if (pendingTechnicalItems.length > 0) {
          return NextResponse.json({
            error: 'No se puede activar el Modo Producción Verificación.',
            message: 'Quedan requisitos técnicos críticos pendientes por configurar.',
            pendingItems: pendingTechnicalItems
          }, { status: 400 });
        }
      } else if (targetMode === 'production_open') {
        const pendingLegalItems: string[] = [];

        // Validar base de datos
        for (const item of PRODUCTION_CHECKLIST_KEYS) {
          const val = mergedSettings[item.key];
          if (!val || val.trim() === '') {
            pendingLegalItems.push(item.label);
          }
        }

        // Validar SSL (el dominio debe tener https://)
        const domain = mergedSettings['company_domain'] || '';
        if (domain && !domain.toLowerCase().startsWith('https://')) {
          pendingLegalItems.push('Dominio Seguro con SSL (Debe comenzar con https://)');
        }

        // Validar archivos
        const rootDir = process.cwd();
        const sitemapExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'sitemap.ts'));
        const robotsExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'robots.ts'));

        if (!sitemapExists) pendingLegalItems.push('Archivo de Mapa del Sitio (sitemap.ts)');
        if (!robotsExists) pendingLegalItems.push('Archivo de Directivas del Buscador (robots.ts)');

        const allPending = [...pendingTechnicalItems, ...pendingLegalItems];
        if (allPending.length > 0) {
          return NextResponse.json({
            error: 'No se puede activar el Modo Producción Abierta.',
            message: 'Quedan requisitos técnicos o legales pendientes por configurar.',
            pendingItems: allPending
          }, { status: 400 });
        }
      }
    }

    // 3. Guardar todas las configuraciones en transacción
    await db.$transaction(
      Object.entries(settings).map(([key, val]) => {
        return db.systemSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) }
        });
      })
    );

    console.log(`✅ [Settings POST] Configuración actualizada por admin ${verified.sessionId}`);
    return NextResponse.json({ success: true, message: 'Configuración guardada correctamente.' });

  } catch (error: any) {
    console.error('❌ [Settings POST] Error:', error);
    return NextResponse.json({ error: 'Error al guardar la configuración.' }, { status: 500 });
  }
}
