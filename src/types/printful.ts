export interface PrintfulRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  zip: string;
  phone?: string;
  email: string;
}

export interface PrintfulItemInput {
  external_id?: string;
  variant_id: number;
  quantity: number;
  name?: string;
}

export interface PrintfulOrderInput {
  external_id: string; // ID interno de pedido local
  recipient: PrintfulRecipient;
  items: PrintfulItemInput[];
}

export interface PrintfulOrderResponse {
  code: number;
  result: {
    id: number;
    external_id: string;
    store: number;
    status: 'draft' | 'failed' | 'pending' | 'approved' | 'canceled';
    shipping: string;
    recipient: PrintfulRecipient & { country_name: string };
    items: Array<{
      id: number;
      external_id: string;
      variant_id: number;
      quantity: number;
      price: string;
      retail_price: string;
      name: string;
    }>;
    created: number;
    updated: number;
  };
}

export interface PrintfulWebhookEvent {
  type:
    | 'package_shipped'
    | 'order_canceled'
    | 'order_failed'
    | 'package_returned'
    | 'order_put_hold'
    | 'order_remove_hold';
  created: number;
  retries: number;
  store: number;
  data: {
    order: {
      id: number;
      external_id: string;
      status: string;
      shipping_service_name?: string;
    };
    shipment?: {
      tracking_number: string;
      tracking_url: string;
      carrier: string;
    };
  };
}

// NUEVOS TIPOS PARA LA FASE 1: PRODUCTOS, VARIANTES, RESPUESTAS Y ERRORES DE API

export interface PrintfulSyncProduct {
  id: number;
  external_id: string | null;
  name: string;
  variants: number;
  synced: number;
}

export interface PrintfulFile {
  id: number;
  type: string;
  hash: string;
  url: string | null;
  filename: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
  dpi: number | null;
  status: string;
  created: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  visible: boolean;
}

export interface PrintfulSyncVariant {
  id: number;
  parent_product_id: number;
  external_id: string | null;
  variant_id: number;
  name: string;
  synced: boolean;
  sku: string | null;
  retail_price: string;
  currency: string;
  color?: string | null;
  size?: string | null;
  files?: PrintfulFile[];
}

export interface PrintfulProductDetails {
  sync_product: PrintfulSyncProduct;
  sync_variants: PrintfulSyncVariant[];
}

export interface PrintfulApiResponse<T> {
  code: number;
  result: T;
}

export interface PrintfulApiError {
  error: {
    message: string;
    type: string;
  };
}
