import { NextResponse } from 'next/server';
import db from '@/backend/database/db';
import { products } from '@/shared/models/products';
import { validateDiscountCode, recordDiscountRedemption } from '@/shared/models/discounts';
import { dispatchEvent } from '@/backend/events/dispatcher';

// Resolver coste de producción unitario estimado según la categoría
function getProductionCost(category: string): number {
  const cat = category.toLowerCase();
  if (cat.includes('hoodie') || cat.includes('sweater') || cat.includes('sudadera')) {
    return 18.50; // Sudaderas
  }
  if (cat.includes('tee') || cat.includes('shirt') || cat.includes('camiseta') || cat.includes('top')) {
    return 10.00; // Camisetas
  }
  if (cat.includes('legging') || cat.includes('bottom') || cat.includes('malla') || cat.includes('pant')) {
    return 12.00; // Mallas/Leggings
  }
  return 15.00; // Por defecto
}

import { cookies } from 'next/headers';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

import { saveCustomerConsent } from '@/backend/notifications/email/consents';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shippingAddress, items, discountCode, consentMarketing, consentNewsletter } = body;

    // Check system mode in database
    const systemModeSetting = await db.systemSetting.findUnique({
      where: { key: 'system_mode' }
    });
    const systemMode = systemModeSetting?.value || 'development';

    if (systemMode === 'production_verification') {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('alpha_session')?.value;
      const isAdmin = sessionToken ? await verifySessionToken(sessionToken) : null;

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Acceso denegado.', message: 'La tienda se encuentra en modo de verificación. Solo los administradores pueden realizar compras.' },
          { status: 403 }
        );
      }
    }

    // 1. Validaciones básicas
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Faltan los datos de envío (shippingAddress).' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito no contiene artículos.' }, { status: 400 });
    }

    const { firstName, lastName, email, address, city, postalCode, province, country, phone } = shippingAddress;
    if (!firstName || !lastName || !email || !address || !city || !postalCode || !province || !country) {
      return NextResponse.json({ error: 'Faltan campos requeridos en la dirección de envío.' }, { status: 400 });
    }

    // Registrar consentimientos de forma asíncrona o antes de crear la orden
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (typeof consentMarketing === 'boolean') {
      await saveCustomerConsent({
        email: email.trim().toLowerCase(),
        consentType: 'marketing',
        accepted: consentMarketing,
        ipAddress,
        userAgent,
        legalTextVersion: 'v1.0'
      });
    }

    if (typeof consentNewsletter === 'boolean') {
      await saveCustomerConsent({
        email: email.trim().toLowerCase(),
        consentType: 'newsletter',
        accepted: consentNewsletter,
        ipAddress,
        userAgent,
        legalTextVersion: 'v1.0'
      });
    }

     // 2. Procesamiento y validación de artículos desde el Backend
     const validatedItems: any[] = [];
     let calculatedSubtotal = 0;
     let calculatedTotalCost = 0;
 
     for (const item of items) {
       // Buscar el producto en la tabla Product de Neon
       let catalogProduct = null;
       if (item.productId) {
         catalogProduct = await db.product.findUnique({
           where: { id: item.productId }
         });
       }
       if (!catalogProduct && item.slug) {
         catalogProduct = await db.product.findUnique({
           where: { slug: item.slug }
         });
       }
 
       if (!catalogProduct) {
         return NextResponse.json(
           { error: `El producto con ID/Slug "${item.productId || item.slug}" no existe en el catálogo.` },
           { status: 400 }
         );
       }

       // Validar que el Drop esté activo (LIVE)
       if (catalogProduct.dropId) {
         const drop = await db.drop.findUnique({ where: { id: catalogProduct.dropId } });
         if (drop && drop.status !== 'LIVE') {
           return NextResponse.json(
             { error: `Lo sentimos, la colección "${drop.name}" no está activa actualmente.` },
             { status: 400 }
           );
         }
       }

       // Validar cantidad
       const quantity = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));

       // Validar stock virtual
       if (catalogProduct.colorVariants) {
         const colorVariants = catalogProduct.colorVariants as any[];
         const colorNormalized = (item.color || 'Default').toLowerCase().replace(/\s+/g, '-');
         const selectedColorGroup = colorVariants.find(
           (cv) => cv.id === colorNormalized || cv.name.toLowerCase() === (item.color || '').toLowerCase()
         );
         const selectedSizeObj = selectedColorGroup?.sizes?.find(
           (sz: any) => sz.size.toUpperCase() === (item.size || 'M').toUpperCase()
         );
         if (selectedSizeObj && selectedSizeObj.virtualStock !== undefined) {
           if (selectedSizeObj.virtualStock < quantity) {
             return NextResponse.json(
               { error: `Lo sentimos, no hay suficiente stock disponible para ${catalogProduct.name} - ${item.size} (${item.color}). Stock disponible: ${selectedSizeObj.virtualStock} uds.` },
               { status: 400 }
             );
           }
         }
       }

      // Usar precios reales del backend
      const price = catalogProduct.priceEUR;
      const lineTotal = price * quantity;

      // Calcular coste de producción estimado
      const costPrice = getProductionCost(catalogProduct.category);
      const lineCostTotal = costPrice * quantity;

      calculatedSubtotal += lineTotal;
      calculatedTotalCost += lineCostTotal;

      // Buscar mockup correspondiente en el color si existe
      let mockupUrl = item.mockupUrl || null;
      if (!mockupUrl && catalogProduct.colorVariants) {
        const colorVariants = (catalogProduct.colorVariants as any[]) || [];
        const colorNormalized = (item.color || 'Default').toLowerCase().replace(/\s+/g, '-');
        const selectedColorGroup = colorVariants.find(
          (cv) => cv.id === colorNormalized || cv.name.toLowerCase() === (item.color || '').toLowerCase()
        ) || colorVariants[0];

        if (selectedColorGroup && selectedColorGroup.mockups && selectedColorGroup.mockups.length > 0) {
          const matchingMockup = selectedColorGroup.mockups.find((m: any) => m.enabled) || selectedColorGroup.mockups[0];
          if (matchingMockup) mockupUrl = matchingMockup.url;
        }
      }

      validatedItems.push({
        productId: catalogProduct.id,
        name: catalogProduct.name,
        size: item.size || 'M',
        color: item.color || 'Default',
        sku: item.sku || null,
        printfulProductId: catalogProduct.printfulProductId || null,
        printfulVariantId: item.printfulVariantId || null,
        quantity,
        price,
        total: lineTotal,
        costPrice,
        mockupUrl,
        dropId: catalogProduct.dropId,
      });
    }

    // Validar y aplicar el descuento si se proporciona discountCode
    let discountVal = 0;
    let dbDiscountId: string | null = null;
    let dbDiscountCode: string | null = null;
    let shippingPrice = 0.0; // Envío gratuito por defecto
    const taxPrice = 0.0;

    if (discountCode) {
      const validation = await validateDiscountCode(discountCode, email, validatedItems);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      discountVal = validation.discountAmount || 0;
      dbDiscountId = validation.discountId || null;
      dbDiscountCode = validation.code || null;
      if (validation.freeShipping) {
        shippingPrice = 0.0;
      }
    }

    const finalTotal = Math.max(0, calculatedSubtotal + shippingPrice + taxPrice - discountVal);

    // Calcular coste de envío estimado que cobrará Printful
    const isDomestic = ['españa', 'spain', 'portugal'].includes(country.toLowerCase().trim());
    const totalQty = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const shippingCost = totalQty > 0
      ? (isDomestic ? 4.50 + (totalQty - 1) * 1.50 : 6.50 + (totalQty - 1) * 2.00)
      : 0.0;

    const totalCost = calculatedTotalCost + shippingCost;
    const netProfit = finalTotal - totalCost;

    // 3. Generar identificadores únicos de pedido
    const internalId = crypto.randomUUID();
    const count = await db.order.count();
    const orderNumber = `AA-${10001 + count}`;

    const isTestOrder = !!body.isTestOrder;

    if (isTestOrder) {
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TEST_PURCHASES !== 'true') {
        return NextResponse.json(
          { error: 'Acceso denegado.', message: 'Las compras de prueba están desactivadas en este entorno.' },
          { status: 403 }
        );
      }
    }

    // 4. Crear el pedido relacional en Neon mediante transacción
    const createdOrder = await db.$transaction(async (tx) => {
      // Crear cabecera de pedido
      const newOrder = await tx.order.create({
        data: {
          id: internalId,
          orderNumber,
          email,
          name: `${firstName} ${lastName}`,
          phone: phone || null,
          addressLine1: address,
          addressLine2: null,
          city,
          state: province,
          postalCode,
          country,
          orderStatus: isTestOrder ? 'paid' : 'draft',
          paymentStatus: isTestOrder ? 'pagado' : 'pago_pendiente',
          paymentMethod: isTestOrder ? 'oms_test' : 'paypal',
          subtotal: calculatedSubtotal,
          shipping: shippingPrice,
          tax: taxPrice,
          discount: discountVal,
          total: finalTotal,
          currency: 'EUR',
          totalCost: totalCost,
          shippingCost: shippingCost,
          netProfit: netProfit,
          createdAt: new Date(),
          updatedAt: new Date(),
          internalNotes: isTestOrder ? 'Pedido de prueba creado desde OMS.' : null,
          discountId: dbDiscountId,
          discountCode: dbDiscountCode,
        },
      });

      // Crear las líneas del pedido (items)
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: internalId,
            productId: item.productId,
            name: item.name,
            size: item.size,
            color: item.color,
            sku: item.sku,
            printfulProductId: item.printfulProductId,
            printfulVariantId: item.printfulVariantId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            costPrice: item.costPrice,
            mockupUrl: item.mockupUrl,
          },
        });
      }

      // Crear eventos iniciales del historial
      await tx.orderEvent.create({
        data: {
          orderId: internalId,
          type: 'CREATED',
          message: 'Pedido inicializado en el sistema central de gestión (OMS).',
          createdAt: new Date(),
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: internalId,
          type: 'PAYMENT_PENDING',
          message: 'Esperando confirmación del pago en la pasarela.',
          createdAt: new Date(),
        },
      });

      return newOrder;
    });

    if (isTestOrder && dbDiscountId) {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
      await recordDiscountRedemption(createdOrder.id, dbDiscountId, clientIp);
    }

    // Disparar eventos de automatización de forma asíncrona sin bloquear la respuesta del cliente
    dispatchEvent('ORDER_CREATED', { orderId: createdOrder.id })
      .then(() => {
        if (isTestOrder) {
          return dispatchEvent('PAYMENT_CONFIRMED', { orderId: createdOrder.id });
        }
      })
      .catch(err => console.error('❌ [Event Engine Dispatcher] Error al disparar eventos en create-draft:', err));

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error in /api/orders/create-draft:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el pedido.', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
