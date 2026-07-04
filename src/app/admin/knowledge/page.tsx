'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Network, 
  Search, 
  Trash2, 
  Plus, 
  GitCommit, 
  Sliders, 
  GitPullRequest, 
  Sparkles, 
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  GitBranch,
  Layers,
  Info
} from 'lucide-react';

interface EntityItem {
  id: string;
  project: string;
  type: string;
  name: string;
  description: string | null;
  status: string;
  importance: number;
  version: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface RelationshipItem {
  id: string;
  type: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceEntity: EntityItem;
  targetEntity: EntityItem;
  createdAt: string;
}

interface ConflictItem {
  source: EntityItem;
  target: EntityItem;
  similarity: number;
}

function KnowledgeCenterInner() {
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [relationships, setRelationships] = useState<RelationshipItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'entities' | 'relationships' | 'conflicts'>('entities');
  
  // Modales
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);
  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [showNeighborsModal, setShowNeighborsModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);
  const [neighbors, setNeighbors] = useState<{ outgoing: any[]; incoming: any[] }>({ outgoing: [], incoming: [] });

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Producto');
  const [formDesc, setFormDesc] = useState('');
  const [formImportance, setFormImportance] = useState(50);
  const [formSource, setFormSource] = useState('admin');

  // Relation Form states
  const [sourceEntityId, setSourceEntityId] = useState('');
  const [targetEntityId, setTargetEntityId] = useState('');
  const [relationType, setRelationType] = useState('PERTENECE_A');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'entities') {
        const res = await fetch(`/api/admin/ai/knowledge?mode=entities&search=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (data.success) setEntities(data.entities || []);
      } else if (activeTab === 'relationships') {
        const res = await fetch(`/api/admin/ai/knowledge?mode=relationships`);
        const data = await res.json();
        if (data.success) setRelationships(data.relationships || []);
      } else if (activeTab === 'conflicts') {
        const res = await fetch(`/api/admin/ai/knowledge?mode=conflicts`);
        const data = await res.json();
        if (data.success) setConflicts(data.conflicts || []);
      }
    } catch (err) {
      console.error('Failed to load graph knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, search]);

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          name: formName,
          description: formDesc,
          importance: formImportance,
          source: formSource
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddEntityModal(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save entity:', err);
    }
  };

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsertRelationship',
          type: relationType,
          sourceEntityId,
          targetEntityId
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddRelationModal(false);
        setSourceEntityId('');
        setTargetEntityId('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create relationship:', err);
    }
  };

  const handleMerge = async (sourceId: string, targetId: string) => {
    if (!confirm('¿Deseas fusionar estos dos nodos del grafo de conocimiento? Las relaciones se reasignarán automáticamente.')) return;
    try {
      const res = await fetch('/api/admin/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'merge',
          sourceId,
          targetId
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to merge entities:', err);
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta entidad y sus relaciones conectadas?')) return;
    try {
      const res = await fetch(`/api/admin/ai/knowledge?entityId=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Failed to delete entity:', err);
    }
  };

  const handleDeleteRelation = async (id: string) => {
    if (!confirm('¿Eliminar esta relación de forma permanente?')) return;
    try {
      const res = await fetch(`/api/admin/ai/knowledge?relationshipId=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Failed to delete relation:', err);
    }
  };

  const viewNeighbors = async (entity: EntityItem) => {
    setSelectedEntity(entity);
    try {
      // Usar endpoint para cargar relaciones locales
      const res = await fetch(`/api/admin/ai/knowledge?mode=relationships`);
      const data = await res.json();
      if (data.success) {
        const list: RelationshipItem[] = data.relationships || [];
        const outgoing = list.filter((r) => r.sourceEntityId === entity.id).map((r) => ({
          type: r.type,
          entity: r.targetEntity
        }));
        const incoming = list.filter((r) => r.targetEntityId === entity.id).map((r) => ({
          type: r.type,
          entity: r.sourceEntity
        }));
        setNeighbors({ outgoing, incoming });
        setShowNeighborsModal(true);
      }
    } catch (_) {}
  };

  const resetForm = () => {
    setFormName('');
    setFormType('Producto');
    setFormDesc('');
    setFormImportance(50);
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f0] p-6 sm:p-12 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-2.5 text-[var(--primary)] uppercase text-[10px] tracking-[0.25em] font-bold mb-1">
            <Network className="w-4 h-4 animate-pulse" /> Ecosistema Alpha Intelligence
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
            Knowledge Center
          </h1>
          <p className="text-xs text-[var(--muted)] max-w-xl mt-1 leading-relaxed">
            Representación estructurada del conocimiento empresarial mediante grafos (entidades y relaciones). Conecta drops, productos, canales e integraciones de forma lógica.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { resetForm(); setShowAddEntityModal(true); }}
            className="px-5 py-2.5 bg-[var(--primary)] text-black hover:bg-black hover:text-white border border-[var(--primary)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Entidad
          </button>
          <button
            onClick={() => {
              // Cargar entidades para el formulario de relación
              fetch(`/api/admin/ai/knowledge?mode=entities`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.success) setEntities(d.entities);
                  setShowAddRelationModal(true);
                });
            }}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-[#f5f5f0] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <GitBranch className="w-3.5 h-3.5" /> Nueva Relación
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8 text-[10px] uppercase font-bold tracking-wider">
        <button
          onClick={() => setActiveTab('entities')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'entities' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-white'
          }`}
        >
          Entidades
        </button>
        <button
          onClick={() => setActiveTab('relationships')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'relationships' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-white'
          }`}
        >
          Relaciones
        </button>
        <button
          onClick={() => setActiveTab('conflicts')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'conflicts' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-white'
          }`}
        >
          Conflictos & Fusiones
        </button>
      </div>

      {/* Buscador para Entidades */}
      {activeTab === 'entities' && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar entidad en el grafo empresarial..."
            className="w-full bg-[#111111]/40 border border-white/10 p-2.5 pl-10 text-xs text-white focus:border-[var(--primary)] outline-none"
          />
        </div>
      )}

      {/* Contenido Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--muted)] tracking-widest uppercase">Explorando Grafo...</p>
        </div>
      ) : activeTab === 'entities' ? (
        entities.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 text-center text-[var(--muted)] text-xs uppercase">
            No hay entidades registradas en el grafo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map((ent) => (
              <div key={ent.id} className="bg-[#121212] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-all font-sans relative group">
                <div>
                  <div className="flex justify-between items-start mb-3 font-mono">
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {ent.type}
                    </span>
                    <span className="text-[8px] text-[var(--muted)]">v{ent.version}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono mb-2">{ent.name}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">{ent.description || 'Sin descripción.'}</p>
                </div>

                <div className="border-t border-white/5 pt-3 mt-4 flex justify-between items-center text-[8px] font-mono">
                  <button
                    onClick={() => viewNeighbors(ent)}
                    className="flex items-center gap-1 text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    <Layers className="w-3 h-3" /> Ver Conexiones
                  </button>

                  <button
                    onClick={() => handleDeleteEntity(ent.id)}
                    className="text-red-400 hover:text-red-300 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'relationships' ? (
        relationships.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 text-center text-[var(--muted)] text-xs uppercase">
            No hay conexiones registradas.
          </div>
        ) : (
          <div className="bg-[#121212] border border-white/5 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[var(--muted)] uppercase text-[9px] tracking-wider">
                  <th className="p-4">Origen (Source)</th>
                  <th className="p-4">Tipo Relación</th>
                  <th className="p-4">Destino (Target)</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {relationships.map((rel) => (
                  <tr key={rel.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-white">{rel.sourceEntity?.name}</span>{' '}
                      <span className="text-[9px] text-[var(--muted)]">[{rel.sourceEntity?.type}]</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {rel.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white">{rel.targetEntity?.name}</span>{' '}
                      <span className="text-[9px] text-[var(--muted)]">[{rel.targetEntity?.type}]</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteRelation(rel.id)}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        conflicts.length === 0 ? (
          <div className="border border-emerald-500/10 bg-emerald-500/5 p-8 text-center rounded">
            <CheckCircle2Icon className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-pulse" />
            <p className="text-xs uppercase font-bold text-white tracking-widest">Sin Conflictos de Nomenclatura</p>
            <p className="text-[10px] text-[var(--muted)] mt-1 font-sans">El grafo de conocimiento no reporta entidades duplicadas o redundantes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((conf, idx) => (
              <div key={idx} className="bg-[#121212] border border-amber-500/20 p-5 flex justify-between items-center font-sans">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold mb-2">
                    <AlertTriangle className="w-4 h-4" /> Posible nodo duplicado ({conf.similarity}% similitud)
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    "{conf.source.name}" <span className="text-xs text-[var(--muted)]">[{conf.source.type}]</span>
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1 font-mono">
                    Se sugiere fusionar en "{conf.target.name}" <span className="text-[10px] text-[var(--muted)]">[{conf.target.type}]</span>
                  </div>
                </div>

                <button
                  onClick={() => handleMerge(conf.source.id, conf.target.id)}
                  className="px-4 py-2 border border-amber-500/20 hover:border-amber-500 bg-amber-500/5 hover:text-black font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer font-mono"
                >
                  Fusionar Nodos
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: Conexiones de la Entidad (Neighbors) */}
      {showNeighborsModal && selectedEntity && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-lg p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <Network className="w-4 h-4 animate-pulse" /> Relaciones de "{selectedEntity.name}"
              </span>
              <button onClick={() => setShowNeighborsModal(false)} className="text-white/60 hover:text-white cursor-pointer font-mono">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 font-mono text-xs max-h-[350px] overflow-y-auto pr-2">
              {/* Relaciones Salientes */}
              <div>
                <h4 className="text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold mb-3 border-b border-white/5 pb-1 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5" /> Relaciones Salientes (Outgoing)
                </h4>
                {neighbors.outgoing.length === 0 ? (
                  <p className="text-[10px] text-white/40 italic">Ninguna relación saliente.</p>
                ) : (
                  <ul className="space-y-2">
                    {neighbors.outgoing.map((n, i) => (
                      <li key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/5 rounded">
                        <span>
                          {selectedEntity.name} ➔ <strong className="text-purple-400">{n.type}</strong> ➔ {n.entity.name}
                        </span>
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">{n.entity.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Relaciones Entrantes */}
              <div>
                <h4 className="text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold mb-3 border-b border-white/5 pb-1 flex items-center gap-1.5">
                  <GitPullRequest className="w-3.5 h-3.5" /> Relaciones Entrantes (Incoming)
                </h4>
                {neighbors.incoming.length === 0 ? (
                  <p className="text-[10px] text-white/40 italic">Ninguna relación entrante.</p>
                ) : (
                  <ul className="space-y-2">
                    {neighbors.incoming.map((n, i) => (
                      <li key={i} className="flex items-center justify-between p-2 bg-white/[0.01] border border-white/5 rounded">
                        <span>
                          {n.entity.name} ➔ <strong className="text-purple-400">{n.type}</strong> ➔ {selectedEntity.name}
                        </span>
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">{n.entity.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Añadir Entidad */}
      {showAddEntityModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <Network className="w-4 h-4 animate-pulse" /> Crear Entidad de Grafo
              </span>
              <button onClick={() => setShowAddEntityModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEntity} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Tipo de Entidad</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-black border border-white/10 p-2.5 text-white font-sans focus:border-[var(--primary)] outline-none"
                >
                  <option value="Producto">Producto (Prenda, mockup)</option>
                  <option value="Drop">Drop (Genesis, Discipline)</option>
                  <option value="Proyecto">Proyecto (Ecosistema ecommerce)</option>
                  <option value="Proveedor">Proveedor (Printful, Resend)</option>
                  <option value="Integración">Integración (PayPal, Sentry)</option>
                  <option value="Configuración">Configuración (Ajustes, variables)</option>
                  <option value="Documento">Documento (Pautas, guías)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Ej: Discipline Hoodie"
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Descripción / Hechos</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Añade descripción o hechos específicos..."
                  rows={4}
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Importancia (0-100)</label>
                  <input
                    type="number"
                    value={formImportance}
                    onChange={(e) => setFormImportance(parseInt(e.target.value, 10))}
                    className="w-full bg-black border border-white/10 p-2 text-white font-mono focus:border-[var(--primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Origen (Source)</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white font-mono focus:border-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddEntityModal(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-black hover:text-white border border-[var(--primary)] cursor-pointer"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Añadir Relación */}
      {showAddRelationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <GitBranch className="w-4 h-4 animate-pulse" /> Crear Relación en el Grafo
              </span>
              <button onClick={() => setShowAddRelationModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRelation} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Entidad Origen (Source)</label>
                <select
                  value={sourceEntityId}
                  onChange={(e) => setSourceEntityId(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 p-2.5 text-white font-sans focus:border-[var(--primary)] outline-none"
                >
                  <option value="">Selecciona origen...</option>
                  {entities.map((ent) => (
                    <option key={ent.id} value={ent.id}>{ent.name} ({ent.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Tipo de Relación</label>
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                  className="w-full bg-black border border-white/10 p-2.5 text-white font-mono focus:border-[var(--primary)] outline-none"
                >
                  <option value="PERTENECE_A">PERTENECE_A</option>
                  <option value="UTILIZA">UTILIZA</option>
                  <option value="DEPENDE_DE">DEPENDE_DE</option>
                  <option value="CONECTA_CON">CONECTA_CON</option>
                  <option value="PRODUCIDO_POR">PRODUCIDO_POR</option>
                  <option value="ASOCIADO_A">ASOCIADO_A</option>
                  <option value="HEREDA_DE">HEREDA_DE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Entidad Destino (Target)</label>
                <select
                  value={targetEntityId}
                  onChange={(e) => setTargetEntityId(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 p-2.5 text-white font-sans focus:border-[var(--primary)] outline-none"
                >
                  <option value="">Selecciona destino...</option>
                  {entities.map((ent) => (
                    <option key={ent.id} value={ent.id}>{ent.name} ({ent.type})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddRelationModal(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-black hover:text-white border border-[var(--primary)] cursor-pointer"
                >
                  Conectar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function KnowledgeCenterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-black text-[#f5f5f0] font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">Cargando Knowledge Center...</p>
      </div>
    }>
      <KnowledgeCenterInner />
    </Suspense>
  );
}
