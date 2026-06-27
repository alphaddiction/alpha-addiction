import crypto from 'crypto';
import { 
  PrintfulOrderInput, 
  PrintfulOrderResponse, 
  PrintfulApiError,
  PrintfulSyncProduct,
  PrintfulSyncVariant,
  PrintfulProductDetails
} from '@/types/printful';
import { OrderItem, ShippingAddress } from '@/types/order';
import { db } from './db';

/**
 * Cliente de la API de Printful.
 * Realiza peticiones HTTP autenticadas usando únicamente PRINTFUL_API_KEY.
 *
 * @param endpoint Ruta del recurso de la API (por ejemplo, 'sync/products' o 'orders')
 * @param options Opciones para la petición fetch (método, cuerpo, cabeceras personalizadas)
 * @returns Promesa con los datos tipados de la respuesta
 */
export async function printfulFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_TOKEN;

  // Validación de seguridad de la API Key en el servidor
  if (!apiKey) {
    console.error('❌ Error de configuración: PRINTFUL_API_KEY (o PRINTFUL_API_TOKEN) no definida en el entorno.');
    throw new Error('La variable de entorno PRINTFUL_API_KEY no está configurada.');
  }

  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `https://api.printful.com/${cleanEndpoint}`;

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorBody: PrintfulApiError | null = null;
      try {
        errorBody = await response.json();
      } catch {
        // Ignorar si la respuesta de error no es JSON válido
      }

      const status = response.status;
      const errorMsg = errorBody?.error?.message || response.statusText || 'Error desconocido';
      const errorType = errorBody?.error?.type || 'API_ERROR';

      console.error(`❌ Error en la API de Printful [HTTP ${status}]: ${errorMsg} (Tipo: ${errorType})`);
      throw new Error(`Error en la API de Printful (${status}): ${errorMsg}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Error de red al conectar con Printful: ${String(error)}`);
  }
}

/**
 * Comprueba de forma inocua que la API responde y que la clave de API (PRINTFUL_API_KEY)
 * es válida consultando el endpoint de tiendas del usuario.
 */
export async function testPrintfulConnection(): Promise<{ success: boolean; message: string; code: number }> {
  try {
    const response = await printfulFetch<{ code: number }>('stores');
    return {
      success: true,
      message: 'Conexión con la API de Printful establecida con éxito.',
      code: response.code,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error de comunicación con la API de Printful.',
      code: 500,
    };
  }
}

/**
 * Obtiene la lista completa de productos sincronizados de la tienda de Printful.
 */
export async function getPrintfulProducts(): Promise<PrintfulSyncProduct[]> {
  const response = await printfulFetch<{ result: PrintfulSyncProduct[] }>('sync/products');
  return response.result || [];
}

/**
 * Obtiene todas las variantes sincronizadas correspondientes a un producto de Printful por su ID.
 */
export async function getPrintfulProductVariants(productId: number): Promise<PrintfulSyncVariant[]> {
  const response = await printfulFetch<{ result: PrintfulProductDetails }>(`sync/products/${productId}`);
  return response.result.sync_variants || [];
}

/**
 * Mapas locales de slugs y tamaños a Variant IDs de Printful.
 * Permite resolver la variante correspondiente antes de enviar a producción.
 */
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
    return 4012; // Variante por defecto de camiseta si no se encuentra
  }

  return productVariants[size] || productVariants['M'] || 4012;
}

/**
 * Convierte el nombre de una provincia en España en un código de estado ISO-like.
 */
function getStateCode(province: string): string {
  const provLower = province.toLowerCase();
  if (provLower.includes('madrid')) return 'M';
  if (provLower.includes('barcelona')) return 'B';
  if (provLower.includes('valencia')) return 'V';
  if (provLower.includes('sevilla')) return 'SE';
  return '';
}

/**
 * Crea un pedido de producción en la API de Printful.
 * Utilizado por los controladores del checkout para lanzar la producción tras el cobro.
 */
export async function createPrintfulOrder(
  localOrderId: string,
  shippingAddress: ShippingAddress,
  items: OrderItem[]
): Promise<PrintfulOrderResponse> {
  // Convertir el nombre del país a código ISO 3166-1 alpha-2
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
      external_id: `${localOrderId}-${item.slug}-${item.color ? item.color.toLowerCase().replace(/\s+/g, '-') : 'default'}-${item.size}`,
      variant_id: item.printfulVariantId || getPrintfulVariantId(item.slug, item.size),
      quantity: item.qty,
      name: item.color ? `${item.name} (${item.color} / ${item.size})` : `${item.name} (${item.size})`,
    })),
  };

  console.log(`[Printful] Enviando pedido ${localOrderId} mediante printfulFetch...`);

  return await printfulFetch<PrintfulOrderResponse>('orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
}

/**
 * Verifica la firma criptográfica HMAC SHA256 enviada por los webhooks de Printful.
 * Previene la suplantación de identidad en callbacks de cambios de estado (envíos, cancelaciones).
 */
export function verifyPrintfulWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.PRINTFUL_WEBHOOK_SIGNING_SECRET;

  // Si no está configurado el secreto del webhook, omitimos en local/pruebas
  if (!secret) {
    console.warn(
      '⚠️ Advertencia: PRINTFUL_WEBHOOK_SIGNING_SECRET no configurada en el entorno. Omitiendo validación de firma.'
    );
    return true;
  }

  if (!signature) {
    console.error('❌ Error de webhook de Printful: Firma vacía en x-printful-signature.');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    console.error('❌ Excepción al validar firma de webhook de Printful:', error);
    return false;
  }
}

/**
 * Busca un pedido pagado en Neon PostgreSQL y lo envía a la API de Printful.
 */
export async function createPrintfulOrderFromInternalOrder(orderId: string): Promise<PrintfulOrderResponse> {
  // 1. Buscar el pedido en Neon PostgreSQL
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('No se encontró el pedido en la base de datos de Neon.');
  }

  // 2. Validar que esté pagado
  if (order.paymentStatus !== 'pagado') {
    throw new Error(`El pedido no se puede enviar a Printful porque no está pagado. Estado actual: ${order.paymentStatus}`);
  }

  // 3. Validar que no tenga ya printfulOrderId para evitar duplicados
  if (order.printfulOrderId) {
    throw new Error(`El pedido ya tiene un ID de Printful asignado (${order.printfulOrderId}). Se previene el envío duplicado.`);
  }

  // 4. Validar que todos los artículos tengan printfulVariantId
  for (const item of order.items) {
    if (!item.printfulVariantId) {
      throw new Error(`El artículo "${item.name}" no está vinculado correctamente a Printful (falta printfulVariantId).`);
    }
  }

  // 5. Convertir la dirección de envío al formato de Printful
  let countryCode = 'ES';
  const c = order.country.toLowerCase();
  if (c.includes('portugal')) countryCode = 'PT';
  else if (c.includes('francia') || c.includes('france')) countryCode = 'FR';
  else if (c.includes('italia') || c.includes('italy')) countryCode = 'IT';
  else if (c.includes('alemania') || c.includes('germany')) countryCode = 'DE';

  const nameParts = order.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const orderPayload: PrintfulOrderInput = {
    external_id: order.id,
    recipient: {
      name: `${firstName} ${lastName}`,
      address1: order.addressLine1,
      city: order.city,
      state_code: getStateCode(order.state || ''),
      country_code: countryCode,
      zip: order.postalCode,
      phone: order.phone || undefined,
      email: order.email,
    },
    items: order.items.map((item) => ({
      external_id: `${order.id}-${item.productId}-${item.color ? item.color.toLowerCase().replace(/\s+/g, '-') : 'default'}-${item.size}`,
      variant_id: item.printfulVariantId!,
      quantity: item.quantity,
      name: item.color ? `${item.name} (${item.color} / ${item.size})` : `${item.name} (${item.size})`,
    })),
  };

  console.log(`[Printful] Enviando pedido interno ${order.orderNumber} (Neon ID: ${order.id}) a Printful...`);

  const response = await printfulFetch<PrintfulOrderResponse>('orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });

  return response;
}
