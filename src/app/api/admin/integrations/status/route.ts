import { NextResponse } from 'next/server';
import { getIntegrationsStatus } from '@/backend/api/integrations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const integrations = await getIntegrationsStatus();
    return NextResponse.json(integrations);
  } catch (error) {
    console.error('❌ Error fetching integrations status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve integrations status', message: (error as Error).message },
      { status: 500 }
    );
  }
}
