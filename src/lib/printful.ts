import crypto from 'crypto';
import { getEnv } from './validations';
import { PrintfulOrderInput, PrintfulOrderResponse } from '@/types/printful';
import { OrderItem, ShippingAddress } from '@/types/order';

// Map local product slugs & sizes to Printful catalog Variant IDs.
// In a real environment, these would be the specific Printful variants (e.g. Bella+Canvas 3001, Gildan 18500, etc.)
// that are linked to the store's sync products.
export function getPrintfulVariantId(slug: string, size: string): number {
  const mapping: Record<string, Record<string, number>> = {
    'essential-tee': {
      'XS': 4011,
      'S': 4012,
      'M': 4013,
      'L': 4014,
    },
    'pure-tee': {
      'XS': 4011,
      'S': 4012,
      'M': 4013,
      'L': 4014,
    },
    'core-hoodie': {
      'XS': 1201,
      'S': 1202,
      'M': 1203,
      'L': 1204,
      'XL': 1205,
    },
    'balance-hoodie': {
      'XS': 1201,
      'S': 1202,
      'M': 1203,
      'L': 1204,
      'XL': 1205,
    },
    'form-legging': {
      'XS': 6351,
      'S': 6352,
      'M': 6353,
      'L': 6354,
    },
  };

  const productVariants = mapping[slug];
  if (!productVariants) {
    return 4012; // Fallback default variant ID (e.g., standard Unisex Tee Medium)
  }

  return productVariants[size] || productVariants['M'] || 4012;
}

// Convert Spain's region name/province to a ISO-like state code if needed
// (Printful accepts alphanumeric state code, but for Spain it is optional)
function getStateCode(province: string): string {
  const provLower = province.toLowerCase();
  if (provLower.includes('madrid')) return 'M';
  if (provLower.includes('barcelona')) return 'B';
  if (provLower.includes('valencia')) return 'V';
  if (provLower.includes('sevilla')) return 'SE';
  return '';
}

// Create a Printful order
export async function createPrintfulOrder(
  localOrderId: string,
  shippingAddress: ShippingAddress,
  items: OrderItem[]
): Promise<PrintfulOrderResponse> {
  const env = getEnv();

  // Convert standard country names to ISO 3166-1 alpha-2 codes
  let countryCode = 'ES';
  const c = shippingAddress.country.toLowerCase();
  if (c.includes('portugal')) countryCode = 'PT';
  else if (c.includes('francia') || c.includes('france')) countryCode = 'FR';
  else if (c.includes('italia') || c.includes('italy')) countryCode = 'IT';
  else if (c.includes('alemania') || c.includes('germany')) countryCode = 'DE';

  const orderPayload: PrintfulOrderInput = {
    external_id: localOrderId,
    recipient: {
      name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      address1: shippingAddress.address,
      city: shippingAddress.city,
      state_code: getStateCode(shippingAddress.province),
      country_code: countryCode,
      zip: shippingAddress.postalCode,
      phone: shippingAddress.phone || undefined,
      email: shippingAddress.email,
    },
    items: items.map(item => ({
      external_id: `${localOrderId}-${item.slug}-${item.size}`,
      variant_id: getPrintfulVariantId(item.slug, item.size),
      quantity: item.qty,
      name: `${item.name} (${item.size})`,
    })),
  };

  const url = 'https://api.printful.com/orders';
  console.log(`Sending order ${localOrderId} to Printful API at ${url}...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PRINTFUL_API_TOKEN}`,
      'X-Printful-Store-Id': env.PRINTFUL_STORE_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Printful Order Submission Error:', errorText);
    throw new Error(`Printful Order creation failed: ${errorText}`);
  }

  return (await response.json()) as PrintfulOrderResponse;
}

// Verify Printful Webhook Signature
export function verifyPrintfulWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const env = getEnv();

  // If secret not configured in env, warn and return true for testing
  if (!env.PRINTFUL_WEBHOOK_SIGNING_SECRET) {
    console.warn(
      '⚠️ PRINTFUL_WEBHOOK_SIGNING_SECRET not configured. Skipping webhook signature validation.'
    );
    return true;
  }

  if (!signature) {
    console.error('❌ Printful Webhook validation error: Signature is missing from headers');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', env.PRINTFUL_WEBHOOK_SIGNING_SECRET)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    console.error('❌ Printful Webhook validation error during signature verification:', error);
    return false;
  }
}
