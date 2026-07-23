import { getEnv } from '@/shared/utils/validations';
import { db } from '@/backend/database/db';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

export async function GET() {
  try {
    const env = getEnv();
    
    // Check if current user is an authenticated administrator
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('alpha_session')?.value;
    const isAdmin = sessionToken ? !!(await verifySessionToken(sessionToken)) : false;

    // Fetch system mode from settings
    const systemModeSetting = await db.systemSetting.findUnique({
      where: { key: 'system_mode' }
    });
    const systemMode = systemModeSetting?.value || 'development';

    return Response.json({
      clientId: env.PAYPAL_CLIENT_ID,
      systemMode,
      isAdmin,
    });
  } catch (error) {
    console.error('❌ Error fetching PayPal config:', error);
    return Response.json(
      { error: 'Failed to fetch configuration', message: (error as Error).message },
      { status: 500 }
    );
  }
}
