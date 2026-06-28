import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';
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
    const pendingItems: string[] = [];

    // Validar base de datos
    for (const item of PRODUCTION_CHECKLIST_KEYS) {
      const val = settings[item.key];
      if (!val || val.trim() === '') {
        pendingItems.push(item.label);
      }
    }

    // Validar SSL (el dominio debe tener https://)
    const domain = settings['company_domain'] || '';
    if (!domain.toLowerCase().startsWith('https://')) {
      pendingItems.push('Dominio Seguro con SSL (Debe comenzar con https://)');
    }

    // Validar archivos
    if (!sitemapExists) pendingItems.push('Archivo de Mapa del Sitio (sitemap.ts)');
    if (!robotsExists) pendingItems.push('Archivo de Directivas del Buscador (robots.ts)');

    // Validar integraciones críticas en producción
    const hasPrintfulProd = !!process.env.PRINTFUL_API_KEY; // En producción real se lee desde env
    const hasPaypalProd = !!process.env.PAYPAL_CLIENT_ID;
    const hasResend = !!process.env.RESEND_API_KEY;

    if (!hasPrintfulProd) pendingItems.push('API de Producción de Printful configurada');
    if (!hasPaypalProd) pendingItems.push('Credenciales de Producción de PayPal configuradas');
    if (!hasResend) pendingItems.push('Servidor de Envío de Correos Resend configurado');

    // Validar salud del sistema (no debe haber fallas críticas en Neon ni servicios)
    try {
      const degradedServices = await db.systemHealth.count({
        where: { status: { in: ['offline', 'degraded'] } }
      });
      if (degradedServices > 0) {
        pendingItems.push('Health Center libre de errores críticos');
      }
    } catch (healthErr) {
      console.warn('No se pudo verificar el estado de salud del sistema:', healthErr);
    }

    // Validar Sentry en producción
    const hasSentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!hasSentry) {
      pendingItems.push('Monitorización de errores (Sentry DSN) configurado en variables de entorno');
    }

    // Validar 2FA del Administrador Principal
    const session = await db.adminSession.findUnique({
      where: { id: verified.sessionId },
      include: { user: true }
    });
    if (!session || !session.user || !session.user.twoFactorEnabled) {
      pendingItems.push('Autenticación de Doble Factor (2FA) activa para la cuenta del Administrador');
    }

    // Calcular porcentaje de completado
    const totalChecks = PRODUCTION_CHECKLIST_KEYS.length + 8; // 12 db + ssl + sitemap + robots + printful + paypal + resend + 2fa + sentry
    const completedChecks = totalChecks - pendingItems.length;
    const completionPercentage = Math.round((completedChecks / totalChecks) * 100);

    const isReadyForProduction = pendingItems.length === 0;

    // 4. Mapear estado de integraciones enmascarado
    const integrations = {
      printful: hasPrintfulProd 
        ? (settings['system_mode'] === 'production' ? 'configured' : 'sandbox') 
        : 'pending',
      paypal: hasPaypalProd 
        ? (settings['system_mode'] === 'production' ? 'configured' : 'sandbox') 
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

    // 2. Si se intenta activar el Modo Producción, ejecutar checklist estricto
    if (settings['system_mode'] === 'production') {
      const pendingItems: string[] = [];

      for (const item of PRODUCTION_CHECKLIST_KEYS) {
        const val = mergedSettings[item.key];
        if (!val || val.trim() === '') {
          pendingItems.push(item.label);
        }
      }

      const domain = mergedSettings['company_domain'] || '';
      if (!domain.toLowerCase().startsWith('https://')) {
        pendingItems.push('Dominio Seguro con SSL (Debe comenzar con https://)');
      }

      const rootDir = process.cwd();
      const sitemapExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'sitemap.ts'));
      const robotsExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'robots.ts'));

      if (!sitemapExists) pendingItems.push('Archivo de Mapa del Sitio (sitemap.ts)');
      if (!robotsExists) pendingItems.push('Archivo de Directivas del Buscador (robots.ts)');

      const hasPrintfulProd = !!process.env.PRINTFUL_API_KEY;
      const hasPaypalProd = !!process.env.PAYPAL_CLIENT_ID;
      const hasResend = !!process.env.RESEND_API_KEY;

      if (!hasPrintfulProd) pendingItems.push('API de Producción de Printful');
      if (!hasPaypalProd) pendingItems.push('Credenciales de Producción de PayPal');
      if (!hasResend) pendingItems.push('Servidor de Envío de Correos Resend');

      // Validar que el Administrador tenga activado el Doble Factor de Autenticación (2FA)
      const session = await db.adminSession.findUnique({
        where: { id: verified.sessionId },
        include: { user: true }
      });
      if (!session || !session.user || !session.user.twoFactorEnabled) {
        pendingItems.push('Autenticación de Doble Factor (2FA) activa para la cuenta del Administrador');
      }

      if (pendingItems.length > 0) {
        return NextResponse.json({
          error: 'No se puede activar el Modo Producción.',
          message: 'Quedan requisitos críticos pendientes por configurar.',
          pendingItems
        }, { status: 400 });
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
