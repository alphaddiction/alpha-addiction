import { verifyPayPalWebhook } from '@/lib/paypal';
import { getOrderByPayPalId, updateOrder } from '@/lib/orders';
import { PayPalWebhookEvent } from '@/types/paypal';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;

    // Verify webhook signature with PayPal API
    const isValid = await verifyPayPalWebhook(headers, rawBody);
    if (!isValid) {
      console.error('❌ PayPal Webhook Signature verification failed.');
      return new Response('Unauthorized Webhook Signature', { status: 401 });
    }

    const event = JSON.parse(rawBody) as PayPalWebhookEvent;
    console.log(`📥 Received PayPal Webhook [${event.event_type}] (ID: ${event.id})`);

    const resource = event.resource;
    let paypalOrderId: string | undefined;

    // Retrieve PayPal Order ID depending on resource type
    if (resource.supplementary_data?.related_ids?.order_id) {
      paypalOrderId = resource.supplementary_data.related_ids.order_id;
    } else if (resource.id && event.resource_type === 'checkout-order') {
      paypalOrderId = resource.id;
    } else if (resource.billing_agreement_id) {
      // Ignored for checkout orders
    }

    // Try finding the order by paypalOrderId if it's resolved, or fallback to metadata/references
    if (paypalOrderId) {
      const order = await getOrderByPayPalId(paypalOrderId);
      if (order) {
        switch (event.event_type) {
          case 'PAYMENT.CAPTURE.COMPLETED':
            if (order.status === 'pending') {
              await updateOrder(order.id, { status: 'paid' });
              console.log(`Order ${order.id} status updated to 'paid' from webhook.`);
            }
            break;

          case 'PAYMENT.CAPTURE.DENIED':
          case 'PAYMENT.CAPTURE.REVERSED':
            await updateOrder(order.id, {
              status: 'canceled',
              errorMessage: `PayPal Payment reversed/denied: ${event.summary}`,
            });
            console.log(`Order ${order.id} status updated to 'canceled' due to payment denial/reversal.`);
            break;

          case 'PAYMENT.CAPTURE.REFUNDED':
            await updateOrder(order.id, {
              status: 'canceled',
              errorMessage: `Order Refunded. Details: ${event.summary}`,
            });
            console.log(`Order ${order.id} status updated to 'canceled' due to refund.`);
            break;

          default:
            console.log(`Unhandled event type: ${event.event_type}`);
        }
      } else {
        console.warn(`⚠️ Order not found in database for PayPal Order ID: ${paypalOrderId}`);
      }
    } else {
      console.warn('⚠️ Could not resolve PayPal Order ID from webhook event resource:', event.resource_type);
    }

    return new Response('Webhook received and processed', { status: 200 });
  } catch (error: any) {
    console.error('❌ Error handling PayPal Webhook:', error);
    return Response.json(
      { error: 'PayPal Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}
