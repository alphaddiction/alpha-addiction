/**
 * Configuración Centralizada del Sistema (OMS) de Alpha Addiction.
 * 
 * Contiene los parámetros operativos globales que controlan el comportamiento de la tienda,
 * unificando las opciones de pago, fabricación, monedas y envíos en una sola fuente de verdad.
 */
export interface OmsConfig {
  store: {
    name: string;
    domain: string;
    contactEmail: string;
  };
  currency: {
    code: string;       // E.g., "EUR"
    symbol: string;     // E.g., "€"
    locale: string;     // E.g., "es-ES"
  };
  shipping: {
    flatRateEUR: number; // Tarifa plana de envío
    freeShippingThresholdEUR: number; // Mínimo de compra para envío gratuito
  };
  providers: {
    print: 'printful' | 'mock';
    payment: 'paypal' | 'stripe' | 'mock';
    email: 'resend' | 'sendgrid' | 'smtp' | 'mock';
  };
  emails: {
    senderName: string;
    senderEmail: string;
    templates: {
      orderCreated: string;
      orderPaid: string;
      orderShipped: string;
    };
  };
}

/**
 * Variables operativas por defecto del sistema OMS de Alpha Addiction.
 */
export const storeConfig: OmsConfig = {
  store: {
    name: 'Alpha Addiction',
    domain: 'alpha-addiction.com',
    contactEmail: 'soporte@alpha-addiction.com',
  },
  currency: {
    code: 'EUR',
    symbol: '€',
    locale: 'es-ES',
  },
  shipping: {
    flatRateEUR: 0.0, // El IVA y gastos de envío están ya incluidos
    freeShippingThresholdEUR: 0.0,
  },
  providers: {
    print: 'printful',
    payment: 'paypal',
    email: 'mock', // TODO: Integrar servicio de email Resend/SendGrid en futuras fases
  },
  emails: {
    senderName: 'Alpha Addiction HQ',
    senderEmail: 'orders@alpha-addiction.com',
    templates: {
      orderCreated: 'order_created_template',
      orderPaid: 'order_paid_template',
      orderShipped: 'order_shipped_template',
    },
  },
};
