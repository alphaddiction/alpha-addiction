import { verifyPrintfulWebhookSignature } from '@/lib/printful';
import { getOrderById, updateOrder } from '@/lib/orders';
import { PrintfulWebhookEvent } from '@/types/printful';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-printful-signature');

    // Verify HMAC SHA256 webhook signature
    const isValid = verifyPrintfulWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('❌ Printful Webhook Signature verification failed.');
      return new Response('Unauthorized Webhook Signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PrintfulWebhookEvent;
    console.log(`📥 Received Printful Webhook [${payload.type}] for store ${payload.store}`);

    const eventData = payload.data;
    const localOrderId = eventData.order.external_id;

    if (!localOrderId) {
      console.warn('⚠️ Printful Webhook event contains no external_id. Ignoring.');
      return new Response('External ID not found', { status: 200 });
    }

    // Retrieve local order
    const order = await getOrderById(localOrderId);
    if (!order) {
      console.error(`❌ Order not found in database for external_id: ${localOrderId}`);
      return new Response(`Order ${localOrderId} not found`, { status: 404 });
    }

    switch (payload.type) {
      case 'package_shipped':
        if (eventData.shipment) {
          const trackingNumber = eventData.shipment.tracking_number;
          const trackingUrl = eventData.shipment.tracking_url;
          const carrier = eventData.shipment.carrier;

          await updateOrder(localOrderId, {
            status: 'shipped',
            trackingNumber,
            trackingUrl,
            carrier,
          });

          console.log(`✅ Order ${localOrderId} marked as SHIPPED. Tracking: ${trackingNumber} (${carrier})`);
        } else {
          console.warn(`⚠️ Webhook 'package_shipped' received but shipment info is missing for order: ${localOrderId}`);
        }
        break;

      case 'order_canceled':
        await updateOrder(localOrderId, {
          status: 'canceled',
          errorMessage: 'Order canceled in Printful.',
        });
        console.log(`❌ Order ${localOrderId} marked as CANCELED from Printful Webhook.`);
        break;

      case 'order_failed':
        await updateOrder(localOrderId, {
          status: 'fulfillment_failed',
          errorMessage: 'Printful fulfillment execution failed.',
        });
        console.log(`❌ Order ${localOrderId} marked as FULFILLMENT_FAILED from Printful Webhook.`);
        break;

      case 'order_put_hold':
        await updateOrder(localOrderId, {
          errorMessage: 'Order put on hold in Printful.',
        });
        console.log(`⚠️ Order ${localOrderId} put on hold in Printful.`);
        break;

      case 'order_remove_hold':
        await updateOrder(localOrderId, {
          errorMessage: undefined,
        });
        console.log(`✅ Order ${localOrderId} hold removed in Printful.`);
        break;

      default:
        console.log(`ℹ️ Printful webhook event [${payload.type}] ignored.`);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('❌ Error processing Printful Webhook:', error);
    return Response.json(
      { error: 'Printful Webhook processing failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
