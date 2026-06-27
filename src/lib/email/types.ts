export type EmailType =
  | 'RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'PRODUCTION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'REFUNDED'
  | 'DISPUTE'
  | 'CANCELED';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  emailType: EmailType;
  orderId?: string;
}

export interface ResendResponse {
  id?: string;
  error?: {
    message: string;
    status: number;
    type: string;
  };
}
