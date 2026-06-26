import { getOrders, getOrderById, saveOrder, generateLocalOrderId } from '@/lib/orders';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');
    const email = searchParams.get('email');

    // If orderId is requested, fetch a single order
    if (orderId) {
      const order = await getOrderById(orderId);
      if (!order) {
        return Response.json({ error: `Order with ID ${orderId} not found` }, { status: 404 });
      }
      return Response.json(order);
    }

    const allOrders = await getOrders();

    // If email is requested, filter orders by email
    if (email) {
      const filtered = allOrders.filter(
        o => o.shippingAddress.email.toLowerCase() === email.toLowerCase()
      );
      return Response.json(filtered);
    }

    // Otherwise, return all orders (e.g. for developer review, ordered newest first)
    const sortedOrders = [...allOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return Response.json(sortedOrders);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return Response.json(
      { error: 'Failed to retrieve orders', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shippingAddress, items, discount, paymentMethod, paymentStatus } = body;

    if (!shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Faltan campos obligatorios: shippingAddress o items' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.priceEUR || 0) * (item.qty || 1), 0);
    const shippingPrice = 0; // Gastos de envío incluidos/gratuitos
    const discountVal = discount || 0;
    const totalPrice = subtotal + shippingPrice - discountVal;

    const newOrder = {
      id: generateLocalOrderId(),
      status: 'pending' as const,
      shippingAddress,
      items,
      subtotal,
      shippingPrice,
      totalPrice,
      discount: discountVal,
      paymentMethod: paymentMethod || 'Manual',
      paymentStatus: (paymentStatus || 'pending') as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          event: 'Pedido creado',
          notes: 'Pedido inicializado en el sistema central de gestión (OMS).',
        }
      ],
    };

    await saveOrder(newOrder);

    return Response.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating order in OMS:', error);
    return Response.json(
      { error: 'Failed to create order', message: (error as Error).message },
      { status: 500 }
    );
  }
}
