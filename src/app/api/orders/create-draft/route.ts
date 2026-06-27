import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { products } from '@/lib/products';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shippingAddress, items, discount } = body;

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

    // 2. Procesamiento y validación de artículos desde el Backend
    const validatedItems: any[] = [];
    let calculatedSubtotal = 0;
    let calculatedTotalCost = 0;

    for (const item of items) {
      // Buscar el producto en el catálogo por ID o Slug para validar
      const catalogProduct = products.find(
        (p) => p.id === item.productId || p.slug === item.slug
      );

      if (!catalogProduct) {
        return NextResponse.json(
          { error: `El producto con ID/Slug "${item.productId || item.slug}" no existe en el catálogo.` },
          { status: 400 }
        );
      }

      // Validar cantidad
      const quantity = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));

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
      if (!mockupUrl && catalogProduct.mockups) {
        const matchingMockup = catalogProduct.mockups.find((m) => m.enabled);
        if (matchingMockup) mockupUrl = matchingMockup.url;
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
      });
    }

    // Calcular descuento, tasas e importes finales
    const discountVal = discount || 0;
    const shippingPrice = 0.0; // Envío gratuito
    const taxPrice = 0.0;
    const finalTotal = Math.max(0, calculatedSubtotal + shippingPrice + taxPrice - discountVal);
    const netProfit = finalTotal - calculatedTotalCost;

    // 3. Generar identificadores únicos de pedido
    const internalId = crypto.randomUUID();
    const count = await db.order.count();
    const orderNumber = `AA-${10001 + count}`;

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
          orderStatus: 'draft',
          paymentStatus: 'pago_pendiente',
          paymentMethod: 'paypal',
          subtotal: calculatedSubtotal,
          shipping: shippingPrice,
          tax: taxPrice,
          discount: discountVal,
          total: finalTotal,
          currency: 'EUR',
          totalCost: calculatedTotalCost,
          netProfit: netProfit,
          createdAt: new Date(),
          updatedAt: new Date(),
          internalNotes: null,
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
