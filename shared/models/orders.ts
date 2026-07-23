import db from '@/backend/database/db';
import { Order, OrderStatus } from '@/shared/types/order';

// Mapeador de base de datos a tipo de frontend Order
export function mapDbOrderToType(dbOrder: any): Order {
  // Convertir orderStatus
  let status: OrderStatus = 'pending';
  if (dbOrder.orderStatus === 'draft') status = 'pending';
  else if (dbOrder.orderStatus === 'paid') status = 'paid';
  else if (dbOrder.orderStatus === 'shipped') status = 'shipped';
  else if (dbOrder.orderStatus === 'canceled') status = 'canceled';
  else if (dbOrder.orderStatus === 'fulfillment_submitted') status = 'fulfillment_submitted';
  else if (dbOrder.orderStatus === 'fulfillment_failed') status = 'fulfillment_failed';

  // Convertir paymentStatus
  let paymentStatus: Order['paymentStatus'] = 'pending';
  if (dbOrder.paymentStatus === 'pagado') paymentStatus = 'paid';
  else if (dbOrder.paymentStatus === 'fallido') paymentStatus = 'failed';
  else if (dbOrder.paymentStatus === 'reembolsado') paymentStatus = 'refunded';
  else if (dbOrder.paymentStatus === 'pago_pendiente') paymentStatus = 'pending';

  return {
    id: dbOrder.id,
    orderNumber: dbOrder.orderNumber, // Número de pedido legible
    status,
    shippingAddress: {
      firstName: dbOrder.name.split(' ')[0] || '',
      lastName: dbOrder.name.split(' ').slice(1).join(' ') || '',
      email: dbOrder.email,
      phone: dbOrder.phone || undefined,
      address: dbOrder.addressLine2 ? `${dbOrder.addressLine1}, ${dbOrder.addressLine2}` : dbOrder.addressLine1,
      city: dbOrder.city,
      postalCode: dbOrder.postalCode,
      province: dbOrder.state || '',
      country: dbOrder.country,
    },
    items: dbOrder.items?.map((item: any) => ({
      slug: item.productId, // Compatibilidad con Slug
      name: item.name,
      priceEUR: item.price,
      size: item.size,
      color: item.color || undefined,
      printfulVariantId: item.printfulVariantId || undefined,
      qty: item.quantity,
      costPrice: item.costPrice, // Financiero
      mockupUrl: item.mockupUrl || undefined,
    })) || [],
    subtotal: dbOrder.subtotal,
    shippingPrice: dbOrder.shipping,
    totalPrice: dbOrder.total,
    discount: dbOrder.discount,
    paymentMethod: dbOrder.paymentMethod,
    paymentStatus,
    printfulOrderId: dbOrder.printfulOrderId || undefined,
    paypalOrderId: dbOrder.paypalOrderId || undefined,
    paypalCaptureId: dbOrder.paypalCaptureId || undefined,
    trackingNumber: dbOrder.trackingNumber || undefined,
    trackingUrl: dbOrder.trackingUrl || undefined,
    createdAt: dbOrder.createdAt.toISOString(),
    updatedAt: dbOrder.updatedAt.toISOString(),
    internalNotes: dbOrder.internalNotes || undefined,
    history: dbOrder.events?.map((e: any) => ({
      timestamp: e.createdAt.toISOString(),
      event: e.message,
    })) || [],
    totalCost: dbOrder.totalCost,
    netProfit: dbOrder.netProfit,
    shippingCost: dbOrder.shippingCost,
  } as any;
}

export async function getOrders(): Promise<Order[]> {
  try {
    const orders = await db.order.findMany({
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(mapDbOrderToType);
  } catch (error) {
    console.error('❌ Error in getOrders from Neon:', error);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) return null;
    return mapDbOrderToType(order);
  } catch (error) {
    console.error(`❌ Error in getOrderById (${id}) from Neon:`, error);
    return null;
  }
}

export async function getOrderByPayPalId(paypalOrderId: string): Promise<Order | null> {
  try {
    const order = await db.order.findFirst({
      where: { paypalOrderId },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) return null;
    return mapDbOrderToType(order);
  } catch (error) {
    console.error(`❌ Error in getOrderByPayPalId (${paypalOrderId}) from Neon:`, error);
    return null;
  }
}

export async function saveOrder(order: Order): Promise<Order> {
  try {
    const exists = await db.order.findUnique({ where: { id: order.id } });
    if (exists) {
      return updateOrder(order.id, order);
    }

    const name = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
    let orderStatus = 'draft';
    if (order.status === 'paid') orderStatus = 'paid';
    else if (order.status === 'shipped') orderStatus = 'shipped';
    else if (order.status === 'canceled') orderStatus = 'canceled';

    let paymentStatus = 'pago_pendiente';
    if (order.paymentStatus === 'paid') paymentStatus = 'pagado';
    else if (order.paymentStatus === 'failed') paymentStatus = 'fallido';
    else if (order.paymentStatus === 'refunded') paymentStatus = 'reembolsado';

    const count = await db.order.count();
    const orderNumber = `AA-${10001 + count}`;

    // Calcular costes financieros por si acaso
    let calculatedCost = 0;
    const itemsData = order.items.map(item => {
      const isHoodie = item.name.toLowerCase().includes('hoodie') || item.name.toLowerCase().includes('sweater');
      const isTee = item.name.toLowerCase().includes('tee') || item.name.toLowerCase().includes('shirt');
      const cost = isHoodie ? 18.50 : isTee ? 10.00 : 12.00;
      calculatedCost += cost * item.qty;
      return {
        productId: item.slug,
        name: item.name,
        size: item.size,
        color: item.color || 'Default',
        printfulVariantId: item.printfulVariantId || null,
        quantity: item.qty,
        price: item.priceEUR,
        total: item.priceEUR * item.qty,
        costPrice: cost,
        mockupUrl: (item as any).mockupUrl || null,
      };
    });

    // Calcular coste de envío estimado
    const isDomestic = ['españa', 'spain', 'portugal'].includes(order.shippingAddress.country.toLowerCase().trim());
    const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
    const shippingCost = totalQty > 0
      ? (isDomestic ? 4.50 + (totalQty - 1) * 1.50 : 6.50 + (totalQty - 1) * 2.00)
      : 0.0;

    const totalCost = calculatedCost + shippingCost;
    const netProfit = order.totalPrice - totalCost;

    const created = await db.order.create({
      data: {
        id: order.id,
        orderNumber,
        email: order.shippingAddress.email,
        name,
        phone: order.shippingAddress.phone || null,
        addressLine1: order.shippingAddress.address,
        addressLine2: null,
        city: order.shippingAddress.city,
        state: order.shippingAddress.province,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        orderStatus,
        paymentStatus,
        paymentMethod: order.paymentMethod || 'paypal',
        subtotal: order.subtotal,
        shipping: order.shippingPrice,
        tax: 0.0,
        discount: order.discount || 0.0,
        total: order.totalPrice,
        currency: 'EUR',
        totalCost,
        shippingCost,
        netProfit,
        paypalOrderId: order.paypalOrderId || null,
        paypalCaptureId: order.paypalCaptureId || null,
        printfulOrderId: order.printfulOrderId || null,
        trackingNumber: order.trackingNumber || null,
        trackingUrl: order.trackingUrl || null,
        internalNotes: order.internalNotes || null,
        items: {
          create: itemsData,
        },
        events: {
          create: order.history?.map(h => ({
            type: 'INFO',
            message: h.event,
            createdAt: new Date(h.timestamp),
          })) || [
            {
              type: 'CREATED',
              message: 'Pedido inicializado en el sistema central de gestión (OMS).',
            }
          ],
        },
      },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return mapDbOrderToType(created);
  } catch (error) {
    console.error('❌ Error in saveOrder in Neon:', error);
    throw error;
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  try {
    const dataToUpdate: any = {};
    if (updates.status !== undefined) {
      let orderStatus = 'draft';
      if (updates.status === 'paid') orderStatus = 'paid';
      else if (updates.status === 'shipped') orderStatus = 'shipped';
      else if (updates.status === 'canceled') orderStatus = 'canceled';
      else if (updates.status === 'fulfillment_submitted') orderStatus = 'fulfillment_submitted';
      else if (updates.status === 'fulfillment_failed') orderStatus = 'fulfillment_failed';
      dataToUpdate.orderStatus = orderStatus;
    }
    if (updates.paymentStatus !== undefined) {
      let paymentStatus = 'pago_pendiente';
      if (updates.paymentStatus === 'paid') paymentStatus = 'pagado';
      else if (updates.paymentStatus === 'failed') paymentStatus = 'fallido';
      else if (updates.paymentStatus === 'refunded') paymentStatus = 'reembolsado';
      dataToUpdate.paymentStatus = paymentStatus;
    }
    if (updates.paypalOrderId !== undefined) dataToUpdate.paypalOrderId = updates.paypalOrderId;
    if (updates.paypalCaptureId !== undefined) dataToUpdate.paypalCaptureId = updates.paypalCaptureId;
    if (updates.printfulOrderId !== undefined) dataToUpdate.printfulOrderId = updates.printfulOrderId;
    if (updates.trackingNumber !== undefined) dataToUpdate.trackingNumber = updates.trackingNumber;
    if (updates.trackingUrl !== undefined) dataToUpdate.trackingUrl = updates.trackingUrl;
    if (updates.internalNotes !== undefined) dataToUpdate.internalNotes = updates.internalNotes;

    const updated = await db.order.update({
      where: { id },
      data: dataToUpdate,
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    return mapDbOrderToType(updated);
  } catch (error) {
    console.error(`❌ Error in updateOrder (${id}) in Neon:`, error);
    throw error;
  }
}

export function generateLocalOrderId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AA-${timestamp}-${random}`;
}

export async function deleteOrder(id: string): Promise<boolean> {
  try {
    await db.order.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error(`❌ Error in deleteOrder (${id}) in Neon:`, error);
    return false;
  }
}
