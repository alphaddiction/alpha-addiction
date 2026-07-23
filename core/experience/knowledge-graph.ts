/**
 * Estructuras de Grafo de Conocimiento (Knowledge Graph).
 * 
 * Modela las relaciones empresariales del ecosistema de marcas.
 */
export interface IGraphNode {
  id: string;
  type: 'Usuario' | 'Proyecto' | 'Drop' | 'Pedido' | 'Cliente' | 'Objetivo' | 'Hábito' | 'Proveedor';
  name: string;
  importanceScore: number; // 0 - 100
  confidenceRating: number; // 0.0 - 1.0
  lastSeen: Date;
  attributes: Record<string, any>;
}

export interface IGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: 'PERTENECE_A' | 'ASOCIADO_CON' | 'PLANIFICA_PARA' | 'DISEÑA_UN' | 'PREFIERE_TIPO' | 'CONECTA_A';
  attributes: Record<string, any>;
}

export interface IKnowledgeGraph {
  /**
   * Agrega o actualiza un nodo (Entidad) en el grafo de propiedades.
   */
  upsertNode(node: IGraphNode): Promise<IGraphNode>;

  /**
   * Agrega o actualiza un borde (Relación) tipado y dirigido.
   */
  upsertEdge(edge: IGraphEdge): Promise<IGraphEdge>;

  /**
   * Recupera los nodos adyacentes de primer y segundo nivel (vecindarios entrantes/salientes).
   */
  getNeighbors(nodeId: string, depth: number): Promise<{
    nodes: IGraphNode[];
    edges: IGraphEdge[];
  }>;

  /**
   * Genera el bloque contextual de relaciones de Graph RAG.
   */
  serializeSubGraph(nodeId: string): Promise<string>;
}
