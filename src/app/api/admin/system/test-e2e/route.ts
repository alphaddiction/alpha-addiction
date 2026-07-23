import { NextResponse } from 'next/server';
import db from '@/backend/database/db';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { cookies } from 'next/headers';
import { createPrintfulOrderFromInternalOrder } from '@/backend/api/printful';
import crypto from 'crypto';

export async function POST(req: Request) {
  const steps: { step: string; success: boolean; details?: string }[] = [];
  let orderId = '';
  let discountId = '';

  try {
    // 1. Autorización Admin
    const cookieStore = await cookies();
    const token = cookieStore.get('alpha_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
    const verifiedAdmin = await verifySessionToken(token);
    if (!verifiedAdmin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    steps.push({ step: 'AUTENTICACION_ADMIN', success: true, details: 'Administrador verificado correctamente.' });

    // 2. Resolver producto del catálogo
    const activeProduct = await db.product.findFirst();
    if (!activeProduct) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron productos activos en el catálogo de Neon para realizar las pruebas.'
      }, { status: 400 });
    }

    steps.push({ step: 'RESOLVER_PRODUCTO', success: true, details: `Producto seleccionado para prueba: ${activeProduct.name} (${activeProduct.slug}).` });

    // 3. Crear cupón de prueba
    const testDiscountCode = `E2E_DISC_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const discount = await db.discount.create({
      data: {
        code: testDiscountCode,
        type: 'FIXED_AMOUNT',
        value: 5.00,
        status: 'ACTIVE',
        startsAt: new Date(Date.now() - 3600000), // Hace 1 hora
        endsAt: new Date(Date.now() + 3600000), // En 1 hora
        maxUses: 10,
        usedCount: 0
      }
    });
    discountId = discount.id;
    steps.push({ step: 'CREACION_CUPON_TEST', success: true, details: `Cupón temporal de descuento creado: ${testDiscountCode}.` });

    // 4. Crear el pedido inicial en Neon DB
    orderId = crypto.randomUUID();
    const orderNumber = `AA-E2E-${Date.now().toString().slice(-6)}`;
    
    await db.order.create({
      data: {
        id: orderId,
        orderNumber,
        email: 'test-e2e@alphaddiction.com',
        name: 'Test E2E Buyer',
        phone: '123456789',
        addressLine1: 'Calle de las Pruebas E2E, 42',
        city: 'Madrid',
        state: 'Madrid',
        postalCode: '28001',
        country: 'España',
        orderStatus: 'draft',
        paymentStatus: 'pago_pendiente',
        paymentMethod: 'paypal',
        subtotal: 50.00,
        shipping: 0.00,
        tax: 0.00,
        discount: 5.00,
        total: 45.00,
        currency: 'EUR',
        totalCost: 15.00,
        shippingCost: 0.00,
        netProfit: 30.00,
        discountId: discount.id,
        discountCode: discount.code,
      }
    });

    await db.orderItem.create({
      data: {
        id: crypto.randomUUID(),
        orderId,
        productId: activeProduct.id,
        name: activeProduct.name,
        price: 50.00,
        quantity: 1,
        total: 50.00, // price * quantity
        size: 'M',
        color: 'Default',
        printfulVariantId: 10243, // Mock
        costPrice: 15.00,
      }
    });

    steps.push({ step: 'CREACION_PEDIDO_NEON', success: true, details: `Pedido temporal creado en OMS: ${orderNumber} (ID: ${orderId}).` });

    // 5. Simulación de Webhook de PayPal
    const origin = new URL(req.url).origin;
    const webhookPayload = {
      id: `WH-TEST-E2E-${crypto.randomUUID().slice(-8)}`,
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource_type: 'capture',
      resource: {
        id: `CAPT-TEST-${crypto.randomUUID().slice(-8)}`,
        custom_id: orderId,
        status: 'COMPLETED',
        amount: {
          currency_code: 'EUR',
          value: '45.00'
        }
      }
    };

    const webhookRes = await fetch(`${origin}/api/webhooks/paypal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-e2e-test-bypass': 'alpha-addiction-e2e-secret-key-2026'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookRes.ok) {
      throw new Error(`El webhook de PayPal respondió con error HTTP ${webhookRes.status}`);
    }

    steps.push({ step: 'SIMULACION_WEBHOOK_PAYPAL', success: true, details: 'Petición de webhook PAYMENT.CAPTURE.COMPLETED inyectada.' });

    // 6. Esperar a la resolución asíncrona de eventos y validar base de datos
    await new Promise(r => setTimeout(r, 1200));

    const updatedOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { events: true }
    });

    if (!updatedOrder) {
      throw new Error('El pedido temporal desapareció de la base de datos.');
    }

    const isPaidOk = updatedOrder.paymentStatus === 'paid' && updatedOrder.orderStatus === 'paid';
    if (!isPaidOk) {
      throw new Error(`Los estados del pedido no cambiaron a 'paid'. Estado actual - Pago: ${updatedOrder.paymentStatus}, Pedido: ${updatedOrder.orderStatus}`);
    }

    steps.push({ step: 'VALIDACION_ESTADOS_PEDIDO', success: true, details: 'El pedido fue correctamente marcado como Pagado y Procesado.' });

    // 7. Validar redención del cupón
    const updatedDiscount = await db.discount.findUnique({
      where: { id: discount.id }
    });

    if (!updatedDiscount || updatedDiscount.usedCount !== 1) {
      throw new Error(`El contador de uso del cupón no incrementó. Contador: ${updatedDiscount?.usedCount ?? 0}`);
    }

    steps.push({ step: 'VALIDACION_CUPON_REDENCION', success: true, details: 'La redención del cupón de descuento fue registrada con éxito en Neon DB.' });

    // 8. Validar el evento registrado en timeline
    const hasWebhookEvent = updatedOrder.events.some(e => e.type === 'PAYPAL_PAYMENT_CAPTURE_COMPLETED');
    if (!hasWebhookEvent) {
      throw new Error('El timeline del pedido no contiene el evento de captura de PayPal.');
    }

    steps.push({ step: 'VALIDACION_TIMELINE_EVENTOS', success: true, details: 'El evento PAYPAL_PAYMENT_CAPTURE_COMPLETED fue registrado en el historial.' });

    // 9. Validar el bloqueo de Printful para compras ficticias
    // Cambiamos el paymentMethod a 'oms_test' para comprobar si el bloqueador de Printful funciona
    await db.order.update({
      where: { id: orderId },
      data: { paymentMethod: 'oms_test' }
    });

    let printfulBlocked = false;
    try {
      await createPrintfulOrderFromInternalOrder(orderId);
    } catch (err: any) {
      if (err.message.includes('No se permiten enviar pedidos de prueba')) {
        printfulBlocked = true;
      } else {
        console.warn('⚠️ Printful error inesperado durante prueba:', err.message);
      }
    }

    if (!printfulBlocked) {
      throw new Error('El pedido ficticio (oms_test) no fue rechazado por el módulo de Printful.');
    }

    steps.push({ step: 'VALIDACION_BLOQUEO_PRINTFUL', success: true, details: 'El sistema bloqueó correctamente el envío del pedido de prueba a la API de Printful.' });

  } catch (error: any) {
    steps.push({
      step: 'ERROR_E2E',
      success: false,
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    // 10. Limpieza (Cleanup)
    try {
      if (orderId) {
        await db.orderItem.deleteMany({ where: { orderId } });
        await db.orderEvent.deleteMany({ where: { orderId } });
        await db.order.deleteMany({ where: { id: orderId } });
      }
      if (discountId) {
        await db.discount.delete({ where: { id: discountId } });
      }
    } catch (cleanupError: any) {
      console.error('⚠️ [E2E Cleanup] Falló la limpieza de registros temporales:', cleanupError.message);
    }
  }

  const successOverall = !steps.some(s => !s.success);

  return NextResponse.json({
    success: successOverall,
    timestamp: new Date().toISOString(),
    steps
  });
}
