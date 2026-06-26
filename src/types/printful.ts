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
  external_id: string; // Internal Order ID
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
