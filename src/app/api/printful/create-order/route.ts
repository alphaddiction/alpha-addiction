import { getOrderById, updateOrder } from '@/lib/orders';
import { createPrintfulOrder } from '@/lib/printful';
import { z } from 'zod';

const retryFulfillmentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validationResult = retryFulfillmentSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { orderId } = validationResult.data;

    // Load order from DB
    const order = await getOrderById(orderId);
    if (!order) {
      return Response.json({ error: `Order with ID ${orderId} not found` }, { status: 404 });
    }

    // Check current status
    if (order.status === 'fulfillment_submitted' || order.status === 'shipped') {
      return Response.json(
        { error: 'Order is already submitted or shipped', orderStatus: order.status },
        { status: 400 }
      );
    }

    console.log(`Retrying Printful fulfillment for order: ${orderId}...`);

    try {
      const printfulResponse = await createPrintfulOrder(order.id, order.shippingAddress, order.items);
      const printfulOrderId = printfulResponse.result.id;

      // Update order database
      const updatedOrder = await updateOrder(orderId, {
        printfulOrderId,
        status: 'fulfillment_submitted',
        errorMessage: undefined,
      });

      return Response.json({
        success: true,
        message: 'Fulfillment successfully submitted to Printful.',
        orderId: updatedOrder.id,
        printfulOrderId: updatedOrder.printfulOrderId,
        status: updatedOrder.status,
      });
    } catch (printfulError) {
      console.error(`❌ Printful retry failed for ${orderId}:`, printfulError);
      
      await updateOrder(orderId, {
        status: 'fulfillment_failed',
        errorMessage: (printfulError as Error).message || 'Retry submission failed',
      });

      return Response.json(
        {
          error: 'Printful order creation failed',
          message: (printfulError as Error).message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in retry fulfillment API:', error);
    return Response.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
