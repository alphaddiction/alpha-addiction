import { getOrders, getOrderById } from '@/lib/orders';

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
