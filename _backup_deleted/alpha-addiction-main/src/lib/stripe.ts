import { loadStripe } from '@stripe/stripe-js';

// This will be used later when we implement the full checkout
export const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);
