import { getEnv } from './validations';
import {
  PayPalAccessTokenResponse,
  PayPalOrderCreationRequest,
  PayPalOrderResponse,
  PayPalCaptureResponse,
} from '@/types/paypal';
import { OrderItem, ShippingAddress } from '@/types/order';

// Helper to base64 encode credentials
function getBasicAuthHeader(clientId: string, clientSecret: string) {
  const auth = `${clientId}:${clientSecret}`;
  return `Basic ${Buffer.from(auth).toString('base64')}`;
}

// Get Access Token
export async function getPayPalAccessToken(): Promise<string> {
  const env = getEnv();
  const authHeader = getBasicAuthHeader(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);

  const response = await fetch(`${env.PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PayPal OAuth Error:', errorText);
    throw new Error(`Fallo de autenticación con PayPal (OAuth): ${response.statusText}`);
  }

  const data = (await response.json()) as PayPalAccessTokenResponse;
  return data.access_token;
}

// Create PayPal Order
export async function createPayPalOrder(
  orderId: string,
  orderNumber: string,
  items: OrderItem[],
  shippingAddress: ShippingAddress,
  subtotal: number,
  discount: number = 0
): Promise<PayPalOrderResponse> {
  const env = getEnv();
  const accessToken = await getPayPalAccessToken();

  // Standardize shipping address country code to ISO 3166-1 alpha-2
  let countryCode = 'ES';
  const c = shippingAddress.country.toLowerCase();
  if (c.includes('portugal')) countryCode = 'PT';
  else if (c.includes('francia') || c.includes('france')) countryCode = 'FR';
  else if (c.includes('italia') || c.includes('italy')) countryCode = 'IT';
  else if (c.includes('alemania') || c.includes('germany')) countryCode = 'DE';

  const totalValue = Math.max(0, subtotal - discount);

  const orderPayload: PayPalOrderCreationRequest = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: orderNumber,
        custom_id: orderId,
        amount: {
          currency_code: 'EUR',
          value: totalValue.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'EUR',
              value: subtotal.toFixed(2),
            },
            shipping: {
              currency_code: 'EUR',
              value: '0.00', // Free shipping
            },
            discount: discount > 0 ? {
              currency_code: 'EUR',
              value: discount.toFixed(2),
            } : undefined,
          },
        },
        items: items.map(item => ({
          name: `${item.name} (${item.size})`,
          unit_amount: {
            currency_code: 'EUR',
            value: item.priceEUR.toFixed(2),
          },
          quantity: item.qty.toString(),
          category: 'PHYSICAL_GOODS',
        })),
        shipping: {
          name: {
            full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          },
          address: {
            address_line_1: shippingAddress.address,
            admin_area_2: shippingAddress.city,
            admin_area_1: shippingAddress.province,
            postal_code: shippingAddress.postalCode,
            country_code: countryCode,
          },
        },
      },
    ],
    application_context: {
      brand_name: 'Alpha Addiction',
      locale: 'es-ES',
      shipping_preference: 'SET_PROVIDED_ADDRESS',
      user_action: 'PAY_NOW',
    },
  };

  const response = await fetch(`${env.PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PayPal Create Order Error:', errorText);
    throw new Error(`Error al crear la orden en PayPal: ${errorText}`);
  }

  return (await response.json()) as PayPalOrderResponse;
}

// Capture PayPal Order
export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCaptureResponse> {
  const env = getEnv();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${env.PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PayPal Capture Order Error:', errorText);
    throw new Error(`Error al capturar la orden en PayPal: ${errorText}`);
  }

  return (await response.json()) as PayPalCaptureResponse;
}

// Verify Webhook Signature using PayPal API
export async function verifyPayPalWebhook(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const env = getEnv();
  if (!env.PAYPAL_WEBHOOK_ID) {
    console.warn('⚠️ PAYPAL_WEBHOOK_ID not configured. Skipping PayPal Webhook verification.');
    return true; // Bypass signature verification in dev if webhook id is not set
  }

  const accessToken = await getPayPalAccessToken();

  const verifyPayload = {
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_time: headers.get('paypal-transmission-time'),
    cert_url: headers.get('paypal-cert-url'),
    auth_algo: headers.get('paypal-auth-algo'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    webhook_id: env.PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(rawBody),
  };

  const response = await fetch(`${env.PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verifyPayload),
  });

  if (!response.ok) {
    console.error('❌ PayPal Webhook verification API call failed:', await response.text());
    return false;
  }

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}
