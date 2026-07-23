export type EmailType =
  | 'RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'PRODUCTION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'REFUNDED'
  | 'DISPUTE'
  | 'CANCELED'
  | 'WAITLIST_CONFIRMATION'
  | 'DROP_LIVE_NOTIFICATION'
  | 'SUPPORT_TICKET_RECEIVED'
  | 'SUPPORT_TICKET_REPLIED'
  | 'SUPPORT_TICKET_CLOSED'
  | 'PORTAL_OTP';

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
