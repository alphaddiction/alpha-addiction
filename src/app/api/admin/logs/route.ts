import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const moduleName = searchParams.get('module');

    let allLogs = await getLogs();

    // Apply filtering if parameters are present
    if (type) {
      allLogs = allLogs.filter(l => l.type.toLowerCase() === type.toLowerCase());
    }

    if (moduleName) {
      allLogs = allLogs.filter(l => l.module.toLowerCase() === moduleName.toLowerCase());
    }

    return NextResponse.json(allLogs);
  } catch (error) {
    console.error('❌ Error retrieving system logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve logs', message: (error as Error).message },
      { status: 500 }
    );
  }
}
