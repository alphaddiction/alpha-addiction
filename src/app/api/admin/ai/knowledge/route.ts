import { NextResponse } from 'next/server';
import { db } from '@/backend/database/db';
import { KnowledgeManager } from '@/core/knowledge/knowledge-manager';

/**
 * GET /api/admin/ai/knowledge
 * Recupera listados de entidades, relaciones y/o conflictos del grafo.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'entities'; // entities, relationships, conflicts
    const search = searchParams.get('search') || '';
    const project = searchParams.get('project') || 'alpha-addiction';

    // Sembrar grafo de conocimiento si está vacío
    await KnowledgeManager.seedInitialGraph();

    if (mode === 'relationships') {
      const records = await db.aiRelationship.findMany({
        where: { project },
        include: {
          sourceEntity: true,
          targetEntity: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, relationships: records });
    }

    if (mode === 'conflicts') {
      const conflicts = await KnowledgeManager.detectConflicts(project);
      return NextResponse.json({ success: true, conflicts });
    }

    // Por defecto recuperar entidades
    const whereClause: any = { project };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const records = await db.aiEntity.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const parsed = records.map((r) => ({
      ...r,
      metadata: r.metadata ? JSON.parse(JSON.stringify(r.metadata)) : undefined
    }));

    return NextResponse.json({ success: true, entities: parsed });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error querying knowledge graph' }, { status: 500 });
  }
}

/**
 * POST /api/admin/ai/knowledge
 * Guarda o edita una entidad, relación o ejecuta fusiones (merge).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body; // upsertEntity, upsertRelationship, merge

    if (action === 'upsertRelationship') {
      const { project, type, sourceEntityId, targetEntityId, metadata } = body;
      if (!type || !sourceEntityId || !targetEntityId) {
        return NextResponse.json({ success: false, error: 'Source, target and relationship type are required' }, { status: 400 });
      }
      const rel = await KnowledgeManager.upsertRelationship({
        project: project || 'alpha-addiction',
        type,
        sourceEntityId,
        targetEntityId,
        metadata
      });
      return NextResponse.json({ success: true, relationship: rel });
    }

    if (action === 'merge') {
      const { sourceId, targetId } = body;
      if (!sourceId || !targetId) {
        return NextResponse.json({ success: false, error: 'Source ID and Target ID are required to merge nodes' }, { status: 400 });
      }
      const success = await KnowledgeManager.mergeEntities(sourceId, targetId);
      return NextResponse.json({ success });
    }

    // Por defecto upsertEntity
    const { id, project, type, name, description, status, metadata, importance, source } = body;
    if (!type || !name) {
      return NextResponse.json({ success: false, error: 'Type and name are required fields' }, { status: 400 });
    }

    const ent = await KnowledgeManager.upsertEntity({
      id,
      project: project || 'alpha-addiction',
      type,
      name,
      description,
      status: status || 'active',
      metadata,
      importance: importance !== undefined ? parseInt(importance, 10) : 50,
      source: source || 'system'
    });

    return NextResponse.json({ success: true, entity: ent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error processing request' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ai/knowledge
 * Elimina una entidad o una relación.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const relationshipId = searchParams.get('relationshipId');

    if (entityId) {
      await KnowledgeManager.deleteEntity(entityId);
      return NextResponse.json({ success: true, message: 'Entity deleted successfully' });
    }

    if (relationshipId) {
      await KnowledgeManager.deleteRelationship(relationshipId);
      return NextResponse.json({ success: true, message: 'Relationship deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Either entityId or relationshipId is required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error deleting item' }, { status: 500 });
  }
}
