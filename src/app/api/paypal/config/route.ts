import { getEnv } from '@/lib/validations';

export async function GET() {
  try {
    const env = getEnv();
    return Response.json({
      clientId: env.PAYPAL_CLIENT_ID,
    });
  } catch (error) {
    console.error('❌ Error fetching PayPal config:', error);
    return Response.json(
      { error: 'Failed to fetch configuration', message: (error as Error).message },
      { status: 500 }
    );
  }
}
