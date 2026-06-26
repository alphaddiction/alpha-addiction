import { createOrderSchema } from '@/lib/validations';
import { createPayPalOrder } from '@/lib/paypal';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation using Zod schema
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ validation error for create-order API:', validationResult.error.format());
      return Response.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { items, shippingAddress } = validationResult.data;

    // Calculate subtotal to prevent tampering
    const subtotal = items.reduce((sum, item) => sum + item.priceEUR * item.qty, 0);

    // Call PayPal service
    const paypalOrder = await createPayPalOrder(items, shippingAddress, subtotal);

    return Response.json({
      paypalOrderId: paypalOrder.id,
      status: paypalOrder.status,
    });
  } catch (error) {
    console.error('❌ Error creating PayPal order:', error);
    return Response.json(
      { error: 'Failed to create PayPal order', message: (error as Error).message },
      { status: 500 }
    );
  }
}
