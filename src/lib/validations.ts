import { z } from 'zod';

// Schema for environment variable validation
export const envSchema = z.object({
  PAYPAL_CLIENT_ID: z.string().min(1, 'PAYPAL_CLIENT_ID is required'),
  PAYPAL_CLIENT_SECRET: z.string().min(1, 'PAYPAL_CLIENT_SECRET is required'),
  PAYPAL_API: z.string().url('PAYPAL_API must be a valid URL'),
  PAYPAL_WEBHOOK_ID: z.string().optional(), // Optional, but recommended for webhook verification
  PRINTFUL_API_KEY: z.string().min(1, 'PRINTFUL_API_KEY is required'),
  PRINTFUL_API_TOKEN: z.string().optional(),
  PRINTFUL_STORE_ID: z.string().optional(),
  PRINTFUL_WEBHOOK_SIGNING_SECRET: z.string().optional(), // Used if verifying Printful webhook signature
});

// Safely validate and retrieve environment variables
export function getEnv() {
  const result = envSchema.safeParse({
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'MOCK_CLIENT_ID',
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || 'MOCK_CLIENT_SECRET',
    PAYPAL_API: process.env.PAYPAL_API || 'https://api-m.sandbox.paypal.com',
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID || undefined,
    PRINTFUL_API_KEY: process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_TOKEN,
    PRINTFUL_API_TOKEN: process.env.PRINTFUL_API_TOKEN,
    PRINTFUL_STORE_ID: process.env.PRINTFUL_STORE_ID,
    PRINTFUL_WEBHOOK_SIGNING_SECRET: process.env.PRINTFUL_WEBHOOK_SIGNING_SECRET,
  });

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables configuration.');
  }

  return result.data;
}

// Shipping address validator schema matching checkout page fields
export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  province: z.string().min(1, 'Province/State is required'),
  country: z.string().min(1, 'Country is required'),
});

// Cart item validator schema
export const cartItemSchema = z.object({
  cartItemId: z.string(),
  slug: z.string(),
  name: z.string(),
  priceEUR: z.number().positive(),
  size: z.string(),
  color: z.string().optional(),
  printfulVariantId: z.number().optional(),
  qty: z.number().int().positive(),
});

// Request body validator for create-order endpoint
export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
});

// Request body validator for capture-order endpoint
export const captureOrderSchema = z.object({
  paypalOrderId: z.string().min(1, 'PayPal Order ID is required'),
  shippingAddress: shippingAddressSchema,
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
});
