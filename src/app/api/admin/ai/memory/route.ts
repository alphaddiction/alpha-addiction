import { NextResponse } from 'next/server';
import { db } from '@/backend/database/db';
import { MemoryManager, MemoryType } from '@/core/memory/memory-manager';

/**
 * GET /api/admin/ai/memory
 * Recupera el listado de memorias del proyecto de forma filtrada.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const project = searchParams.get('project') || 'alpha-addiction';

    const whereClause: any = { project };

    if (type) {
      whereClause.type = type;
    }

    if (search) {
      whereClause.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } }
      ];
    }

    const records = await db.aiMemory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const parsedRecords = records.map((r) => ({
      ...r,
      metadata: r.metadata ? JSON.parse(r.metadata as string) : undefined
    }));

    return NextResponse.json({ success: true, memories: parsedRecords });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error listing memories' }, { status: 500 });
  }
}

/**
 * POST /api/admin/ai/memory
 * Inserta o actualiza un elemento de memoria estructurado.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project, type, key, value, importance, expiration, metadata } = body;

    if (!type || !key || !value) {
      return NextResponse.json({ success: false, error: 'Type, key, and value fields are required.' }, { status: 400 });
    }

    const memoryData = {
      project: project || 'alpha-addiction',
      type: type as MemoryType,
      key,
      value,
      importance: importance !== undefined ? parseInt(importance, 10) : 50,
      expiration: expiration ? new Date(expiration) : null,
      metadata
    };

    const saved = await MemoryManager.setMemory(memoryData);
    return NextResponse.json({ success: true, memory: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error saving memory' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ai/memory
 * Elimina una memoria o vacía todas las memorias.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await db.aiMemory.deleteMany({
        where: { project: 'alpha-addiction' }
      });
      console.log('🧹 [Memory API] All memories cleared by administrator.');
      return NextResponse.json({ success: true, message: 'All memories cleared successfully.' });
    }

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required to delete memory' }, { status: 400 });
    }

    await MemoryManager.deleteMemory(key);
    return NextResponse.json({ success: true, message: `Memory "${key}" deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error deleting memory' }, { status: 500 });
  }
}
