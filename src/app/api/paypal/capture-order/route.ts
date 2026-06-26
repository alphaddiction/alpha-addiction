import { captureOrderSchema } from '@/lib/validations';
import { capturePayPalOrder } from '@/lib/paypal';
import { createPrintfulOrder } from '@/lib/printful';
import { generateLocalOrderId, saveOrder } from '@/lib/orders';
import { Order } from '@/types/order';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation using Zod schema
    const validationResult = captureOrderSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Validation error for capture-order API:', validationResult.error.format());
      return Response.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { paypalOrderId, shippingAddress, items } = validationResult.data;

    // 1. Capture PayPal Payment
    console.log(`Capturing PayPal order: ${paypalOrderId}...`);
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      return Response.json(
        { error: `Payment not completed. Status: ${captureResult.status}` },
        { status: 400 }
      );
    }

    const captureId = captureResult.purchase_units[0]?.payments?.captures?.[0]?.id;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.priceEUR * item.qty, 0);
    const shippingPrice = 0; // Free shipping
    const totalPrice = subtotal + shippingPrice;

    // 2. Save Order to Database (marked as paid)
    const localOrderId = generateLocalOrderId();
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: localOrderId,
      paypalOrderId,
      paypalCaptureId: captureId,
      shippingAddress,
      items,
      subtotal,
      shippingPrice,
      totalPrice,
      status: 'paid',
      createdAt: now,
      updatedAt: now,
    };

    await saveOrder(newOrder);
    console.log(`✅ Order ${localOrderId} saved in database as 'paid'.`);

    // 3. Automatically submit the order to Printful
    let printfulOrderId: number | undefined;
    let fulfillmentStatus: Order['status'] = 'paid';
    let errorMessage: string | undefined;

    try {
      console.log(`Submitting order ${localOrderId} to Printful...`);
      const printfulResponse = await createPrintfulOrder(localOrderId, shippingAddress, items);
      printfulOrderId = printfulResponse.result.id;
      fulfillmentStatus = 'fulfillment_submitted';
      console.log(`✅ Printful order created successfully. ID: ${printfulOrderId}`);
    } catch (printfulError) {
      console.error(`❌ Printful order creation failed for ${localOrderId}:`, printfulError);
      fulfillmentStatus = 'fulfillment_failed';
      errorMessage = (printfulError as Error).message || 'Failed to submit order to Printful';
    }

    // 4. Update order status in DB with Printful ID/errors
    const finalOrder = {
      ...newOrder,
      printfulOrderId,
      status: fulfillmentStatus,
      errorMessage,
      updatedAt: new Date().toISOString(),
    };

    await saveOrder(finalOrder);

    return Response.json({
      success: true,
      orderId: localOrderId,
      paypalCaptureId: captureId,
      printfulOrderId,
      status: fulfillmentStatus,
      errorMessage,
    });
  } catch (error) {
    console.error('❌ Error capturing PayPal order:', error);
    return Response.json(
      { error: 'Failed to capture PayPal order', message: (error as Error).message },
      { status: 500 }
    );
  }
}
