import { loadEnvConfig } from '@next/env';
import path from 'path';

// Cargar variables de entorno del directorio raíz
loadEnvConfig(process.cwd());

import { processInboundEmail } from '../src/lib/email/inbound-processor';
import { db } from '../src/lib/db';

async function runTest() {
  console.log('🚀 Iniciando pruebas de Inbound Email Webhook...');

  const customerEmail = 'tester-inbound-customer@example.com';
  const customerName = 'Juan Tester';
  const testMessageId1 = `<msg-id-test-1-${Date.now()}@example.com>`;
  const testMessageId2 = `<msg-id-test-2-${Date.now()}@example.com>`;

  // 1. Simular nuevo correo de consulta (Creación de Ticket)
  console.log('\n--- 1. Probando creación de Ticket nuevo ---');
  const payload1 = {
    fromName: customerName,
    fromEmail: customerEmail,
    toEmail: 'support@alphaddiction.com',
    subject: 'Problema urgente con mi pedido de ropa',
    textBody: 'Hola equipo, tengo un problema con mi compra. ¿Podéis ayudarme? Gracias.',
    messageId: testMessageId1,
  };

  const res1 = await processInboundEmail(payload1);
  console.log('Resultado 1:', res1);

  if (res1.action !== 'created' || !res1.ticketId) {
    throw new Error('❌ Error: Se esperaba acción "created" y ticketId.');
  }

  // Verificar en base de datos
  const ticket1 = await db.supportTicket.findUnique({
    where: { id: res1.ticketId },
    include: { messages: true }
  });
  console.log(`✅ Ticket creado correctamente: ${ticket1?.ticketNumber} (${ticket1?.subject})`);
  console.log(`Prioridad asignada: ${ticket1?.priority} (Esperada: high/urgent)`);
  console.log(`Mensajes en ticket: ${ticket1?.messages.length}`);

  // 2. Simular respuesta al mismo hilo (Anexión de Mensaje)
  console.log('\n--- 2. Probando anexión a hilo existente (In-Reply-To) ---');
  const payload2 = {
    fromName: customerName,
    fromEmail: customerEmail,
    toEmail: 'support@alphaddiction.com',
    subject: 'Re: Problema urgente con mi pedido de ropa',
    textBody: 'Hola de nuevo, además quería comentar que el color no es el correcto.',
    messageId: testMessageId2,
    inReplyTo: testMessageId1,
  };

  const res2 = await processInboundEmail(payload2);
  console.log('Resultado 2:', res2);

  if (res2.action !== 'appended' || res2.ticketId !== res1.ticketId) {
    throw new Error('❌ Error: Se esperaba acción "appended" al mismo ticketId.');
  }

  const ticket2 = await db.supportTicket.findUnique({
    where: { id: res1.ticketId },
    include: { messages: true }
  });
  console.log(`✅ Mensaje anexado al hilo. Mensajes totales actuales: ${ticket2?.messages.length}`);

  // Limpieza de datos de prueba
  console.log('\n🧹 Limpiando registros de prueba...');
  await db.supportMessage.deleteMany({
    where: { ticketId: res1.ticketId }
  });
  await db.supportTicket.delete({
    where: { id: res1.ticketId }
  });
  console.log('✅ Limpieza completada.');
}

runTest()
  .then(() => console.log('\n🎉 ¡Todas las pruebas de Inbound Email pasaron correctamente!'))
  .catch(err => {
    console.error('\n❌ Error durante las pruebas:', err);
    process.exit(1);
  });
