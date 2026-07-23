import { loadEnvConfig } from '@next/env';
import path from 'path';
import crypto from 'crypto';

// Cargar variables de entorno del archivo raíz
loadEnvConfig(process.cwd());

import { db } from '@/backend/database/db';
import { sendOrderReceived } from '@/backend/notifications/email/send-email';

async function main() {
  console.log('📩 Iniciando envío de correo de prueba de compra para desttex98@gmail.com...');

  // Buscar si desttex98@gmail.com tiene algún pedido
  let order = await db.order.findFirst({
    where: { email: 'desttex98@gmail.com' }
  });

  if (!order) {
    console.log('ℹ️ No se encontró ningún pedido para desttex98@gmail.com. Clonando el último pedido del sistema...');
    const latestOrder = await db.order.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });

    if (!latestOrder) {
      console.error('❌ Error: No hay pedidos en la base de datos para clonar.');
      process.exit(1);
    }

    // Crear un nuevo pedido de prueba para desttex98@gmail.com
    const count = await db.order.count();
    const orderNumber = `AA-${10001 + count}`;
    order = await db.order.create({
      data: {
        id: crypto.randomUUID(),
        orderNumber,
        email: 'desttex98@gmail.com',
        name: 'Alberto Test',
        phone: latestOrder.phone,
        addressLine1: 'Calle de la Vía 42',
        addressLine2: latestOrder.addressLine2,
        city: 'Madrid',
        state: 'Madrid',
        postalCode: '28013',
        country: 'España',
        orderStatus: 'paid',
        paymentStatus: 'pagado',
        paymentMethod: 'paypal',
        subtotal: latestOrder.subtotal,
        shipping: latestOrder.shipping,
        tax: latestOrder.tax,
        discount: latestOrder.discount,
        total: latestOrder.total,
        currency: 'EUR',
        items: {
          create: latestOrder.items.map(item => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            color: item.color,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            mockupUrl: item.mockupUrl
          }))
        }
      }
    });
    console.log(`✅ Pedido de prueba clonado con número: ${order.orderNumber}`);
  }

  // Limpiar logs anteriores de RECEIVED para este pedido para saltar el control de duplicados
  await db.emailLog.deleteMany({
    where: {
      orderId: order.id,
      emailType: 'RECEIVED'
    }
  });

  console.log(`✉️ Enviando email de confirmación del pedido ${order.orderNumber} a desttex98@gmail.com...`);
  const result = await sendOrderReceived(order.id);
  console.log('Resultado del envío:', result);
}

main()
  .then(() => console.log('🎉 Envío de prueba finalizado.'))
  .catch(err => {
    console.error('❌ Error durante el envío:', err);
    process.exit(1);
  });
