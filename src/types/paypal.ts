export interface PayPalAccessTokenResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

export interface PayPalOrderCreationRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: Array<{
    reference_id?: string;
    amount: {
      currency_code: string;
      value: string;
      breakdown?: {
        item_total: {
          currency_code: string;
          value: string;
        };
        shipping?: {
          currency_code: string;
          value: string;
        };
        discount?: {
          currency_code: string;
          value: string;
        };
      };
    };
    items?: Array<{
      name: string;
      unit_amount: {
        currency_code: string;
        value: string;
      };
      quantity: string;
      category?: 'PHYSICAL_GOODS' | 'DIGITAL_GOODS' | 'DONATION';
    }>;
    shipping?: {
      name: {
        full_name: string;
      };
      address: {
        address_line_1: string;
        address_line_2?: string;
        admin_area_2: string; // City
        admin_area_1: string; // Province / State
        postal_code: string;
        country_code: string; // ISO 3166-1 alpha-2
      };
    };
  }>;
  application_context?: {
    brand_name?: string;
    locale?: string;
    landing_page?: 'LOGIN' | 'BILLING';
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
    user_action?: 'CONTINUE' | 'PAY_NOW';
  };
}

export interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'FAILED' | 'PENDING';
  purchase_units: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: 'COMPLETED' | 'DECLINED' | 'FAILED' | 'PENDING';
        amount: {
          currency_code: string;
          value: string;
        };
        seller_protection?: {
          status: string;
        };
        final_capture: boolean;
        create_time: string;
        update_time: string;
      }>;
    };
  }>;
}

export interface PayPalWebhookEvent {
  id: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: unknown;
}
