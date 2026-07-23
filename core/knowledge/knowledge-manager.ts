import { db } from '@/backend/database/db';
import { SecurityLayer } from '@/core/identity/security-layer';

export interface EntityData {
  id?: string;
  project: string;
  type: string;
  name: string;
  description?: string | null;
  status?: string;
  metadata?: any;
  importance?: number;
  version?: number;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RelationshipData {
  id?: string;
  project: string;
  type: string;
  sourceEntityId: string;
  targetEntityId: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export class KnowledgeManager {
  /**
   * Crea o actualiza una entidad de conocimiento sanitizando cualquier información secreta.
   */
  static async upsertEntity(data: EntityData): Promise<EntityData> {
    const cleanDescription = data.description ? SecurityLayer.sanitizeInput(data.description) : null;
    const cleanName = SecurityLayer.sanitizeInput(data.name);

    const record = await db.aiEntity.upsert({
      where: { id: data.id || '' },
      create: {
        project: data.project || 'alpha-addiction',
        type: data.type,
        name: cleanName,
        description: cleanDescription,
        status: data.status || 'active',
        metadata: data.metadata ? (data.metadata as any) : null,
        importance: data.importance !== undefined ? data.importance : 50,
        version: data.version || 1,
        source: data.source || 'system'
      },
      update: {
        name: cleanName,
        description: cleanDescription,
        status: data.status || 'active',
        metadata: data.metadata ? (data.metadata as any) : null,
        importance: data.importance !== undefined ? data.importance : 50,
        version: { increment: 1 },
        source: data.source || 'system'
      }
    });

    return {
      ...record,
      metadata: record.metadata || undefined
    } as unknown as EntityData;
  }

  /**
   * Crea o actualiza una relación entre dos entidades.
   */
  static async upsertRelationship(data: RelationshipData): Promise<RelationshipData> {
    const record = await db.aiRelationship.upsert({
      where: {
        sourceEntityId_targetEntityId_type: {
          sourceEntityId: data.sourceEntityId,
          targetEntityId: data.targetEntityId,
          type: data.type
        }
      },
      create: {
        project: data.project || 'alpha-addiction',
        type: data.type,
        sourceEntityId: data.sourceEntityId,
        targetEntityId: data.targetEntityId,
        metadata: data.metadata ? (data.metadata as any) : null
      },
      update: {
        metadata: data.metadata ? (data.metadata as any) : null
      }
    });

    return {
      ...record,
      metadata: record.metadata || undefined
    } as unknown as RelationshipData;
  }

  /**
   * Obtiene los vecinos de 1 grado para una entidad dada (entrantes y salientes).
   */
  static async getNeighbors(entityId: string) {
    const [outgoing, incoming] = await Promise.all([
      db.aiRelationship.findMany({
        where: { sourceEntityId: entityId },
        include: { targetEntity: true }
      }),
      db.aiRelationship.findMany({
        where: { targetEntityId: entityId },
        include: { sourceEntity: true }
      })
    ]);

    return {
      outgoing: outgoing.map((rel) => ({
        relationshipId: rel.id,
        type: rel.type,
        entity: {
          id: rel.targetEntity.id,
          name: rel.targetEntity.name,
          type: rel.targetEntity.type,
          status: rel.targetEntity.status
        }
      })),
      incoming: incoming.map((rel) => ({
        relationshipId: rel.id,
        type: rel.type,
        entity: {
          id: rel.sourceEntity.id,
          name: rel.sourceEntity.name,
          type: rel.sourceEntity.type,
          status: rel.sourceEntity.status
        }
      }))
    };
  }

  /**
   * Elimina una entidad y todas sus relaciones conectadas en cascada.
   */
  static async deleteEntity(id: string): Promise<boolean> {
    try {
      await db.aiEntity.delete({ where: { id } });
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Elimina una relación específica.
   */
  static async deleteRelationship(id: string): Promise<boolean> {
    try {
      await db.aiRelationship.delete({ where: { id } });
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Fusiona dos entidades (mueve las relaciones de origen al destino y borra la entidad origen).
   */
  static async mergeEntities(sourceId: string, targetId: string): Promise<boolean> {
    try {
      // 1. Obtener todas las relaciones salientes de la entidad origen
      const outgoing = await db.aiRelationship.findMany({ where: { sourceEntityId: sourceId } });
      for (const rel of outgoing) {
        try {
          await db.aiRelationship.upsert({
            where: {
              sourceEntityId_targetEntityId_type: {
                sourceEntityId: targetId,
                targetEntityId: rel.targetEntityId,
                type: rel.type
              }
            },
            create: {
              project: rel.project,
              type: rel.type,
              sourceEntityId: targetId,
              targetEntityId: rel.targetEntityId,
              metadata: rel.metadata ? (rel.metadata as any) : null
            },
            update: {}
          });
        } catch (_) {}
      }

      // 2. Obtener todas las relaciones entrantes de la entidad origen
      const incoming = await db.aiRelationship.findMany({ where: { targetEntityId: sourceId } });
      for (const rel of incoming) {
        try {
          await db.aiRelationship.upsert({
            where: {
              sourceEntityId_targetEntityId_type: {
                sourceEntityId: rel.sourceEntityId,
                targetEntityId: targetId,
                type: rel.type
              }
            },
            create: {
              project: rel.project,
              type: rel.type,
              sourceEntityId: rel.sourceEntityId,
              targetEntityId: targetId,
              metadata: rel.metadata ? (rel.metadata as any) : null
            },
            update: {}
          });
        } catch (_) {}
      }

      // 3. Eliminar la entidad origen
      await db.aiEntity.delete({ where: { id: sourceId } });
      console.log(`🧠 [KnowledgeManager] Merged entity "${sourceId}" into "${targetId}" successfully.`);
      return true;
    } catch (err) {
      console.error('❌ [KnowledgeManager] Failed to merge entities:', err);
      return false;
    }
  }

  /**
   * Escanea entidades y sugiere fusiones de duplicados por coincidencia parcial de nombres.
   */
  static async detectConflicts(project = 'alpha-addiction') {
    const entities = await db.aiEntity.findMany({ where: { project } });
    const conflicts: { source: EntityData; target: EntityData; similarity: number }[] = [];

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const name1 = entities[i].name.toLowerCase();
        const name2 = entities[j].name.toLowerCase();

        if (name1 !== name2 && (name1.includes(name2) || name2.includes(name1))) {
          conflicts.push({
            source: entities[i] as unknown as EntityData,
            target: entities[j] as unknown as EntityData,
            similarity: 85
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * RAG Knowledge Search & Context Builder.
   * Recorre el grafo de relaciones a partir de coincidencias y retorna una representación contextual textual.
   */
  static async buildContextFromGraph(project: string, query: string): Promise<string> {
    const startTime = performance.now();
    try {
      const cleanQuery = query.toLowerCase().trim();
      const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 3);

      const allEntities = await db.aiEntity.findMany({
        where: { project }
      });

      // 1. Encontrar nodos semillas
      const seedEntities = allEntities.filter((ent) => {
        const entName = ent.name.toLowerCase();
        return entName.includes(cleanQuery) || terms.some((t) => entName.includes(t));
      });

      if (seedEntities.length === 0) return '';

      // 2. Obtener relaciones de los nodos semilla
      const seedIds = seedEntities.map((s) => s.id);
      const relations = await db.aiRelationship.findMany({
        where: {
          OR: [
            { sourceEntityId: { in: seedIds } },
            { targetEntityId: { in: seedIds } }
          ]
        },
        include: {
          sourceEntity: true,
          targetEntity: true
        }
      });

      if (relations.length === 0) {
        // Retornar solo listado de entidades
        return `\n--- ENTIDADES DE CONOCIMIENTO DETECTADAS ---\n` +
          seedEntities.map((ent) => `- [${ent.type}] ${ent.name}: ${ent.description || 'Sin descripción'}`).join('\n') + '\n';
      }

      // 3. Serializar relaciones semánticas del grafo
      let graphContext = `\n--- GRAFO DE CONOCIMIENTO Y RELACIONES (KNOWLEDGE GRAPH) ---\n`;
      const addedLines = new Set<string>();

      for (const rel of relations) {
        const line = `- ${rel.sourceEntity.name} [${rel.sourceEntity.type}] ➔ ${rel.type} ➔ ${rel.targetEntity.name} [${rel.targetEntity.type}]`;
        if (!addedLines.has(line)) {
          graphContext += line + '\n';
          addedLines.add(line);
        }
      }

      const duration = Math.round(performance.now() - startTime);
      console.log(`🧠 [KnowledgeManager] Built graph context with ${addedLines.size} relations in ${duration}ms.`);
      
      // Registrar log de auditoría
      try {
        await db.auditLog.create({
          data: {
            action: 'AI_KNOWLEDGE_RETRIEVE',
            details: JSON.stringify({
              query,
              relationsCount: addedLines.size,
              durationMs: duration
            })
          }
        });
      } catch (_) {}

      return graphContext;
    } catch (err) {
      console.error('❌ [KnowledgeManager] Failed to build context from graph:', err);
      return '';
    }
  }

  /**
   * Sembrar datos iniciales si el grafo está vacío (drops, proveedores, configuraciones).
   */
  static async seedInitialGraph(): Promise<void> {
    const count = await db.aiEntity.count();
    if (count > 0) return;

    try {
      console.log('🧠 [KnowledgeManager] Seeding initial business knowledge graph...');

      // 1. Proyecto
      const project = await this.upsertEntity({
        project: 'alpha-addiction',
        type: 'Proyecto',
        name: 'Alpha Addiction',
        description: 'Ecommerce minimalista premium de edición limitada.',
        status: 'active',
        source: 'system'
      });

      // 2. Drops
      const dropGenesis = await this.upsertEntity({
        project: 'alpha-addiction',
        type: 'Drop',
        name: 'Genesis',
        description: 'Colección inaugural del ecommerce.',
        status: 'active',
        source: 'system'
      });

      const dropDiscipline = await this.upsertEntity({
        project: 'alpha-addiction',
        type: 'Drop',
        name: 'Discipline',
        description: 'Próximo lanzamiento del roadmap comercial.',
        status: 'active',
        source: 'system'
      });

      // 3. Integración
      const printful = await this.upsertEntity({
        project: 'alpha-addiction',
        type: 'Proveedor',
        name: 'Printful API',
        description: 'Proveedor de fulfillment y mockups en impresión bajo demanda.',
        status: 'active',
        source: 'system'
      });

      const paypal = await this.upsertEntity({
        project: 'alpha-addiction',
        type: 'Integración',
        name: 'PayPal Sandbox',
        description: 'Plataforma de pagos transaccional configurada.',
        status: 'active',
        source: 'system'
      });

      // Relacionar todo
      if (project.id && dropGenesis.id && dropDiscipline.id && printful.id && paypal.id) {
        await this.upsertRelationship({
          project: 'alpha-addiction',
          type: 'PERTENECE_A',
          sourceEntityId: dropGenesis.id,
          targetEntityId: project.id
        });

        await this.upsertRelationship({
          project: 'alpha-addiction',
          type: 'PERTENECE_A',
          sourceEntityId: dropDiscipline.id,
          targetEntityId: project.id
        });

        await this.upsertRelationship({
          project: 'alpha-addiction',
          type: 'UTILIZA',
          sourceEntityId: project.id,
          targetEntityId: printful.id
        });

        await this.upsertRelationship({
          project: 'alpha-addiction',
          type: 'CONECTA_CON',
          sourceEntityId: project.id,
          targetEntityId: paypal.id
        });

        console.log('✓ Business knowledge graph seeded successfully.');
      }
    } catch (err) {
      console.error('❌ Failed to seed knowledge graph:', err);
    }
  }
}
