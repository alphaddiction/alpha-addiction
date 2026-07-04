import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '../src/lib/db';
import { createNotification, markAsRead, archiveNotification, getUnreadCount } from '../src/lib/notifications/service';

async function main() {
  console.log('🧪 Iniciando pruebas del Centro de Notificaciones...');

  // 1. Limpieza de base de datos para pruebas
  console.log('🧹 Limpiando notificaciones de prueba anteriores...');
  await db.notification.deleteMany({
    where: {
      type: { in: ['test_info', 'test_critical', 'email_error', 'waitlist_registered'] }
    }
  });

  // 2. Crear una notificación de información simple
  console.log('➕ Creando notificación informativa individual...');
  const n1 = await createNotification({
    type: 'test_info',
    title: 'Prueba de Información',
    message: 'Esta es una notificación informativa de prueba.',
    severity: 'info',
    module: 'orders',
    actionUrl: '/admin/orders'
  });
  console.log('✅ Creada:', n1?.title);

  // 3. Crear una notificación crítica
  console.log('➕ Creando notificación crítica individual...');
  const n2 = await createNotification({
    type: 'test_critical',
    title: 'Alerta Crítica de Prueba',
    message: 'Se ha detectado una excepción crítica en el servidor de pruebas.',
    severity: 'critical',
    module: 'sentry'
  });
  console.log('✅ Creada:', n2?.title);

  // 4. Probar la lógica de Consolidación Anti-Ruido
  console.log('⚡ Creando 5 fallos de correo seguidos en menos de 10 minutos (Consolidación)...');
  for (let i = 1; i <= 5; i++) {
    await createNotification({
      type: 'email_error',
      title: 'Error de envío de email',
      message: `Fallo al enviar correo de prueba número ${i}`,
      severity: 'error',
      module: 'email',
      metadata: { detail: `Error SMTP socket hang up ${i}` }
    });
  }

  // Comprobar cuántas filas de 'email_error' hay realmente en la base de datos
  const countEmailError = await db.notification.count({
    where: { type: 'email_error' }
  });
  console.log(`📊 Filas creadas de tipo 'email_error' en la base de datos: ${countEmailError} (Debería ser 1 gracias a la consolidación)`);

  const consolidatedNotif = await db.notification.findFirst({
    where: { type: 'email_error' }
  });
  const meta: any = consolidatedNotif?.metadata || {};
  console.log(`📊 Contador acumulado en metadatos: ${meta.count} (Debería ser 5)`);
  console.log(`📊 Título consolidado final: "${consolidatedNotif?.title}"`);
  console.log(`📊 Mensaje consolidado final: "${consolidatedNotif?.message}"`);

  // 5. Probar marcar como leída
  if (n1) {
    console.log('📖 Marcando notificación informativa como leída...');
    await markAsRead(n1.id);
    const updatedN1 = await db.notification.findUnique({ where: { id: n1.id } });
    console.log(`✅ Estado de notificación: ${updatedN1?.status} (Debería ser 'read')`);
  }

  // 6. Probar archivar
  if (n2) {
    console.log('📦 Archivando notificación crítica...');
    await archiveNotification(n2.id);
    const updatedN2 = await db.notification.findUnique({ where: { id: n2.id } });
    console.log(`✅ Estado de notificación: ${updatedN2?.status} (Debería ser 'archived')`);
  }

  // 7. Comprobar recuento de no leídas
  const unreadCount = await getUnreadCount();
  console.log(`🔔 Total notificaciones no leídas activas: ${unreadCount}`);
}

main()
  .then(() => console.log('🎉 Pruebas finalizadas con éxito.'))
  .catch(err => {
    console.error('❌ Fallo durante las pruebas:', err);
    process.exit(1);
  });
