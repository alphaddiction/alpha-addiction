'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Brain, 
  Search, 
  Trash2, 
  Plus, 
  Download, 
  Sliders, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle,
  FileText,
  AlertTriangle,
  Loader2,
  X,
  Edit2
} from 'lucide-react';

interface MemoryItem {
  id: string;
  project: string;
  type: 'session' | 'preference' | 'decision' | 'recommendation' | 'project';
  key: string;
  value: string;
  importance: number;
  expiration: string | null;
  createdAt: string;
  updatedAt: string;
}

function MemoryCenterInner() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeItem, setActiveItem] = useState<Partial<MemoryItem> | null>(null);

  // Form states
  const [formType, setFormType] = useState<'session' | 'preference' | 'decision' | 'recommendation' | 'project'>('decision');
  const [formKey, setFormKey] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formImportance, setFormImportance] = useState(70);
  const [formExpiration, setFormExpiration] = useState('');

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/ai/memory?search=${encodeURIComponent(search)}&type=${selectedType}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [search, selectedType]);

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ai/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          key: formKey.trim() || `mem:manual:${Date.now()}`,
          value: formValue,
          importance: formImportance,
          expiration: formExpiration || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        resetForm();
        fetchMemories();
      }
    } catch (err) {
      console.error('Failed to save memory:', err);
    }
  };

  const handleUpdateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      const res = await fetch('/api/admin/ai/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeItem.type,
          key: activeItem.key,
          value: formValue,
          importance: formImportance,
          expiration: formExpiration || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setActiveItem(null);
        resetForm();
        fetchMemories();
      }
    } catch (err) {
      console.error('Failed to update memory:', err);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este fragmento de memoria?')) return;
    try {
      const res = await fetch(`/api/admin/ai/memory?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchMemories();
      }
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ ATENCIÓN: Esto vaciará permanentemente toda la memoria estructurada de Alpha. ¿Proceder?')) return;
    try {
      const res = await fetch('/api/admin/ai/memory?clearAll=true', {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchMemories();
      }
    } catch (err) {
      console.error('Failed to clear memories:', err);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `alpha_memory_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const resetForm = () => {
    setFormType('decision');
    setFormKey('');
    setFormValue('');
    setFormImportance(70);
    setFormExpiration('');
  };

  const openEdit = (item: MemoryItem) => {
    setActiveItem(item);
    setFormValue(item.value);
    setFormImportance(item.importance);
    setFormExpiration(item.expiration ? item.expiration.substring(0, 10) : '');
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f0] p-6 sm:p-12 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-2.5 text-[var(--primary)] uppercase text-[10px] tracking-[0.25em] font-bold mb-1">
            <Brain className="w-4 h-4 animate-pulse" /> Ecosistema Alpha Intelligence
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
            Memory Center
          </h1>
          <p className="text-xs text-[var(--muted)] max-w-xl mt-1 leading-relaxed">
            Administra el conocimiento estructurado que Alpha recuerda sobre decisiones, preferencias, recomendaciones y detalles operativos del negocio.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-5 py-2.5 bg-[var(--primary)] text-black hover:bg-black hover:text-white border border-[var(--primary)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Memoria
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-[#f5f5f0] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Exportar JSON
          </button>
          <button
            onClick={handleClearAll}
            className="px-5 py-2.5 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Vaciar Todo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111111]/40 border border-white/5 p-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en el conocimiento de Alpha..."
            className="w-full bg-black border border-white/10 p-2.5 pl-10 text-xs text-white focus:border-[var(--primary)] outline-none"
          />
        </div>

        <div className="flex gap-2">
          {['', 'decision', 'preference', 'recommendation', 'project', 'session'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-4 py-2 border text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                selectedType === t 
                  ? 'bg-white/[0.02] border-[var(--primary)] text-[var(--primary)]' 
                  : 'bg-black border-white/10 text-[var(--muted)] hover:text-white'
              }`}
            >
              {t === '' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Memorias */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--muted)] tracking-widest uppercase">Consultando Memoria...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-lg p-16 text-center bg-[#111111]/10">
          <AlertTriangle className="w-8 h-8 text-[var(--muted)] mx-auto mb-4" />
          <p className="text-sm font-bold text-white uppercase tracking-wider">No se encontraron registros de memoria</p>
          <p className="text-xs text-[var(--muted)] mt-2">Prueba modificando los filtros o registra una memoria manualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((item) => (
            <div 
              key={item.id} 
              className="bg-[#121212] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-all font-sans relative group"
            >
              <div>
                <div className="flex justify-between items-start mb-3 font-mono">
                  <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border ${
                    item.type === 'decision' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    item.type === 'preference' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                    item.type === 'recommendation' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    item.type === 'project' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-white/5 text-white/50 border-white/10'
                  }`}>
                    {item.type}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-[var(--muted)]">
                    <span>Score:</span>
                    <span className={`font-bold ${item.importance >= 80 ? 'text-[var(--primary)]' : 'text-white'}`}>{item.importance}</span>
                  </div>
                </div>

                <p className="text-xs text-white leading-relaxed font-sans mb-4">
                  {item.value}
                </p>
              </div>

              <div className="border-t border-white/5 pt-3 mt-4 flex justify-between items-center text-[8px] text-[var(--muted)] font-mono">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.updatedAt).toLocaleDateString('es-ES')}</span>
                </div>

                <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEdit(item)}
                    className="p-1 text-white hover:text-[var(--primary)] cursor-pointer"
                    title="Editar memoria"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.key)}
                    className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                    title="Eliminar memoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Añadir Memoria */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <Brain className="w-4 h-4 animate-pulse" /> Registrar Memoria Estructurada
              </span>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Tipo de Memoria</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full bg-black border border-white/10 p-2.5 text-white font-sans focus:border-[var(--primary)] outline-none"
                >
                  <option value="decision">Purple Decision (Acuerdos, cambios)</option>
                  <option value="preference">Cyan Preference (Ajustes de respuestas, estilo)</option>
                  <option value="recommendation">Amber Recommendation (Acciones de negocio)</option>
                  <option value="project">Blue Project (Definición del ecommerce, hitos)</option>
                  <option value="session">White Session (Temporal, caduca rápido)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Clave única (Key)</label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="Ej: mem:production:paypal_live"
                  className="w-full bg-black border border-white/10 p-2 text-white font-mono focus:border-[var(--primary)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Valor (Contenido de Memoria)</label>
                <textarea
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Escribe el hecho o decisión que Alpha debe recordar..."
                  required
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
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Expira (Opcional)</label>
                  <input
                    type="date"
                    value={formExpiration}
                    onChange={(e) => setFormExpiration(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white font-mono focus:border-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-black hover:text-white border border-[var(--primary)] cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Memoria */}
      {showEditModal && activeItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5 animate-pulse" /> Editar Hecho Recordado
              </span>
              <button onClick={() => setShowEditModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMemory} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold block">Clave (No editable)</span>
                <span className="text-white text-[10px] block py-2 border-b border-white/5 font-mono truncate">{activeItem.key}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Valor (Contenido de Memoria)</label>
                <textarea
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  required
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
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Expira (Opcional)</label>
                  <input
                    type="date"
                    value={formExpiration}
                    onChange={(e) => setFormExpiration(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white font-mono focus:border-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-black hover:text-white border border-[var(--primary)] cursor-pointer"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemoryCenterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-black text-[#f5f5f0] font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">Cargando Memory Center...</p>
      </div>
    }>
      <MemoryCenterInner />
    </Suspense>
  );
}
