'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Megaphone, Plus, Trash2, Edit3, Save, Calendar, Eye, Power, RefreshCw, X, AlertTriangle, Settings, Sparkles, Check
} from 'lucide-react';

interface Announcement {
  id: string;
  type: 'MANUAL' | 'AUTOMATIC';
  category: string;
  title: string;
  text: string;
  icon: string | null;
  url: string | null;
  openInNewTab: boolean;
  priority: number;
  order: number;
  displayMode: 'CONTINUOUS' | 'ROTATE' | 'CAROUSEL';
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  config: any;
}

export default function MarketingPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del editor / modal
  const [editingAnn, setEditingAnn] = useState<Partial<Announcement> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'AUTOMATIC'>('MANUAL');

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/announcements');
      if (!res.ok) throw new Error('Fallo al obtener la lista de anuncios.');
      const data = await res.json();
      setAnnouncements(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error desconocido al cargar anuncios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta promoción?')) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Fallo al eliminar anuncio.');
      alert('Promoción eliminada correctamente.');
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (ann: Announcement) => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ann.id, active: !ann.active }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado.');
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn) return;

    setSubmitting(true);
    try {
      const isNew = !editingAnn.id;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch('/api/admin/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAnn),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar anuncio.');
      }

      alert(isNew ? 'Anuncio creado correctamente.' : 'Anuncio actualizado correctamente.');
      setIsEditing(false);
      setEditingAnn(null);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAnn({
      type: 'MANUAL',
      category: 'PROMOTION',
      title: '',
      text: '',
      icon: '🔥',
      url: '',
      openInNewTab: false,
      priority: 0,
      order: 0,
      displayMode: 'CONTINUOUS',
      active: true,
      startsAt: '',
      endsAt: '',
      config: {
        backgroundColor: '#111111',
        textColor: '#D4AF37',
        speed: 15,
        fontSize: '11px',
        height: 40,
        showIcon: true,
        separator: '·'
      }
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const toDatetimeLocal = (dateStr: string | null) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditingAnn({
      ...ann,
      startsAt: ann.startsAt ? toDatetimeLocal(ann.startsAt) : '',
      endsAt: ann.endsAt ? toDatetimeLocal(ann.endsAt) : '',
      config: ann.config || {
        backgroundColor: '#111111',
        textColor: '#D4AF37',
        speed: 15,
        fontSize: '11px',
        height: 40,
        showIcon: true,
        separator: '·'
      }
    });
    setIsEditing(true);
  };

  const manualAnnouncements = announcements.filter(a => a.type === 'MANUAL');
  const automaticAnnouncements = announcements.filter(a => a.type === 'AUTOMATIC');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Marketing y Conversión
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Barra Inteligente de Promociones
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Crear Anuncio Manual
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-400 text-xs rounded text-center font-mono">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-6 text-xs font-mono uppercase tracking-widest font-semibold">
        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`pb-3 px-1 transition-all relative cursor-pointer ${
            activeTab === 'MANUAL' ? 'text-[var(--primary)] border-b border-[var(--primary)]' : 'text-[var(--muted)] hover:text-white'
          }`}
        >
          Anuncios Manuales ({manualAnnouncements.length})
        </button>
        <button
          onClick={() => setActiveTab('AUTOMATIC')}
          className={`pb-3 px-1 transition-all relative cursor-pointer ${
            activeTab === 'AUTOMATIC' ? 'text-[var(--primary)] border-b border-[var(--primary)]' : 'text-[var(--muted)] hover:text-white'
          }`}
        >
          Alertas Inteligentes ({automaticAnnouncements.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase font-mono">Cargando centro de promociones...</p>
        </div>
      ) : activeTab === 'MANUAL' ? (
        manualAnnouncements.length === 0 ? (
          <div className="bg-[#121212] border border-white/5 p-12 text-center max-w-lg mx-auto">
            <Megaphone className="w-8 h-8 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">Sin Anuncios Manuales</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-6">
              Aún no has creado anuncios manuales. Agrega promociones de temporadas, avisos corporativos o lanzamientos con redirección.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#c29f2e] transition-colors cursor-pointer"
            >
              Crear Mi Primer Anuncio
            </button>
          </div>
        ) : (
          <div className="bg-[#121212] border border-white/5 overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="border-b border-white/5 text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  <th className="py-4 px-6">Título</th>
                  <th className="py-4 px-6">Texto Promocional</th>
                  <th className="py-4 px-6 text-center">Animación</th>
                  <th className="py-4 px-6 text-center">Icono</th>
                  <th className="py-4 px-6">Vigencia</th>
                  <th className="py-4 px-6 text-center">Prioridad</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {manualAnnouncements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6 text-[#f5f5f0] font-bold">
                      {ann.title}
                    </td>
                    <td className="py-4 px-6 text-[var(--muted)] max-w-sm truncate" title={ann.text}>
                      {ann.text}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-1.5 py-0.5 bg-white/5 text-white/60 text-[8px] rounded uppercase font-semibold">
                        {ann.displayMode === 'CONTINUOUS' ? 'Continuo' :
                         ann.displayMode === 'ROTATE' ? 'Rotación' : 'Carrusel'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-lg">{ann.icon || '—'}</td>
                    <td className="py-4 px-6 text-[10px] space-y-0.5 text-[var(--muted)]">
                      {ann.startsAt ? (
                        <>
                          <div><span className="text-white/20">Inicio:</span> {new Date(ann.startsAt).toLocaleString('es-ES')}</div>
                          <div><span className="text-white/20">Fin:</span> {ann.endsAt ? new Date(ann.endsAt).toLocaleString('es-ES') : 'Indefinido'}</div>
                        </>
                      ) : (
                        <span className="italic text-white/20">Siempre activo</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-[#f5f5f0]">{ann.priority}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(ann)}
                        className={`inline-flex p-1 border cursor-pointer rounded transition-all ${
                          ann.active
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'
                        }`}
                        title={ann.active ? 'Desactivar anuncio' : 'Activar anuncio'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ann)}
                          className="p-1.5 border border-white/10 text-white/50 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 rounded cursor-pointer transition-all"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1.5 border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 rounded cursor-pointer transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Alertas Inteligentes */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {automaticAnnouncements.map((ann) => {
            const config = ann.config || {};
            return (
              <div 
                key={ann.id} 
                className="bg-[#121212] border border-white/5 p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] tracking-widest text-[var(--primary)] uppercase font-bold font-mono">
                      Smart Trigger
                    </span>
                    <button
                      onClick={() => handleToggleActive(ann)}
                      className={`inline-flex p-1 border cursor-pointer rounded transition-all ${
                        ann.active
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'
                      }`}
                      title={ann.active ? 'Desactivar Alerta' : 'Activar Alerta'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {ann.category === 'LOW_STOCK' && `Inyecta un aviso dinámico si alguna prenda del Drop activo tiene un stock inferior a ${config.threshold || 8} unidades.`}
                    {ann.category === 'DROP_COUNTDOWN' && `Muestra una cuenta atrás animada cuando el Drop activo cierra en menos de ${config.thresholdHours || 48} horas.`}
                    {ann.category === 'FREE_SHIPPING' && 'Aviso estático inteligente para incentivar la compra ofreciendo envíos gratis.'}
                  </p>
                  <div className="bg-black/40 border border-white/5 p-3 rounded font-mono text-[10px] text-white/70">
                    <span className="text-white/30 block mb-1 uppercase tracking-widest text-[8px]">Mensaje Base:</span>
                    {ann.text}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleOpenEdit(ann)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#f5f5f0] text-xs font-mono uppercase tracking-widest font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" /> Configurar Alerta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {isEditing && editingAnn && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 md:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-md font-serif font-bold text-[#f5f5f0] uppercase tracking-widest flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[var(--primary)]" />
                {editingAnn.id ? (editingAnn.type === 'AUTOMATIC' ? 'Configurar Alerta Inteligente' : 'Modificar Anuncio') : 'Crear Nuevo Anuncio'}
              </h3>
              <button
                onClick={() => { setIsEditing(false); setEditingAnn(null); }}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
              
              {/* Título de Referencia */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Título de Identificación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Promo Invierno"
                  value={editingAnn.title}
                  onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors placeholder-white/10"
                />
              </div>

              {/* Mensaje de Anuncio */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  {editingAnn.type === 'AUTOMATIC' ? 'Plantilla del Mensaje (Soporta variables)' : 'Texto del Anuncio *'}
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder={
                    editingAnn.category === 'LOW_STOCK' 
                      ? 'Ej. 🔥 ¡Últimas unidades! Solo quedan {stock} prendas de {product}'
                      : editingAnn.category === 'DROP_COUNTDOWN'
                      ? 'Ej. ⏳ ¡Últimos días! El lanzamiento {drop} finaliza en {hours} horas'
                      : 'Texto del anuncio...'
                  }
                  value={editingAnn.text}
                  onChange={(e) => setEditingAnn({ ...editingAnn, text: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors placeholder-white/10 custom-scrollbar resize-none"
                />
                {editingAnn.type === 'AUTOMATIC' && (
                  <p className="text-[8px] text-white/30">
                    Variables disponibles: {editingAnn.category === 'LOW_STOCK' && '{stock}, {product}'} {editingAnn.category === 'DROP_COUNTDOWN' && '{drop}, {hours}'}
                  </p>
                )}
              </div>

              {/* Icono Opcional */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Icono Opcional (Emoji)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 🔥"
                  maxLength={5}
                  value={editingAnn.icon || ''}
                  onChange={(e) => setEditingAnn({ ...editingAnn, icon: e.target.value || null })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors placeholder-white/10"
                />
              </div>

              {/* URL Redirección Opcional */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  URL Redirección (Hacer Clic)
                </label>
                <input
                  type="text"
                  placeholder="Ej. /genesis o https://..."
                  value={editingAnn.url || ''}
                  onChange={(e) => setEditingAnn({ ...editingAnn, url: e.target.value || null })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors placeholder-white/10"
                />
              </div>

              {/* Modo de Visualización */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Tipo de Animación
                </label>
                <select
                  value={editingAnn.displayMode}
                  onChange={(e) => setEditingAnn({ ...editingAnn, displayMode: e.target.value as any })}
                  className="w-full bg-[#161616] border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors rounded-none appearance-none"
                >
                  <option value="CONTINUOUS">Marquee Continuo</option>
                  <option value="ROTATE">Rotativo Simple (Fade)</option>
                  <option value="CAROUSEL">Carrusel Infinito</option>
                </select>
              </div>

              {/* Abrir en nueva pestaña */}
              <div className="space-y-2 flex flex-col justify-end pb-3">
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#f5f5f0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingAnn.openInNewTab}
                    onChange={(e) => setEditingAnn({ ...editingAnn, openInNewTab: e.target.checked })}
                    className="w-4 h-4 rounded-none accent-[var(--primary)] cursor-pointer"
                  />
                  <span>Abrir enlace en nueva pestaña</span>
                </label>
              </div>

              <div className="col-span-1 md:col-span-2 h-px bg-white/5 my-2" />

              {/* CONFIGURACIÓN VISUAL */}
              <div className="col-span-1 md:col-span-2">
                <h4 className="text-[10px] tracking-widest text-[var(--primary)] uppercase font-bold mb-4 flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" /> Apariencia y Parámetros
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Color Fondo */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">Fondo:</span>
                    <input
                      type="color"
                      value={editingAnn.config?.backgroundColor || '#111111'}
                      onChange={(e) => setEditingAnn({
                        ...editingAnn,
                        config: { ...editingAnn.config, backgroundColor: e.target.value }
                      })}
                      className="w-full bg-transparent border-0 h-10 cursor-pointer"
                    />
                  </div>

                  {/* Color Texto */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">Texto:</span>
                    <input
                      type="color"
                      value={editingAnn.config?.textColor || '#D4AF37'}
                      onChange={(e) => setEditingAnn({
                        ...editingAnn,
                        config: { ...editingAnn.config, textColor: e.target.value }
                      })}
                      className="w-full bg-transparent border-0 h-10 cursor-pointer"
                    />
                  </div>

                  {/* Velocidad / Rotación */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">
                      {editingAnn.displayMode === 'ROTATE' ? 'Segundos' : 'Velocidad:'}
                    </span>
                    <input
                      type="number"
                      required
                      value={editingAnn.config?.speed ?? 15}
                      onChange={(e) => setEditingAnn({
                        ...editingAnn,
                        config: { ...editingAnn.config, speed: parseInt(e.target.value, 10) || 15 }
                      })}
                      className="w-full bg-white/5 border border-white/10 p-2 outline-none text-[#f5f5f0]"
                    />
                  </div>

                  {/* Altura Barra */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">Altura (px):</span>
                    <input
                      type="number"
                      required
                      value={editingAnn.config?.height ?? 40}
                      onChange={(e) => setEditingAnn({
                        ...editingAnn,
                        config: { ...editingAnn.config, height: parseInt(e.target.value, 10) || 40 }
                      })}
                      className="w-full bg-white/5 border border-white/10 p-2 outline-none text-[#f5f5f0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {/* Tamaño fuente */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">Fuente (CSS):</span>
                    <input
                      type="text"
                      value={editingAnn.config?.fontSize || '11px'}
                      onChange={(e) => setEditingAnn({
                        ...editingAnn,
                        config: { ...editingAnn.config, fontSize: e.target.value }
                      })}
                      className="w-full bg-white/5 border border-white/10 p-2 outline-none text-[#f5f5f0]"
                    />
                  </div>

                  {/* Separador */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">Separador:</span>
                    <input
                      type="text"
                      value={editingAnn.config?.separator || '·'}
                      onChange={(e) => setEditingAnn({
                        ...editingAnn,
                        config: { ...editingAnn.config, separator: e.target.value }
                      })}
                      className="w-full bg-white/5 border border-white/10 p-2 outline-none text-[#f5f5f0]"
                    />
                  </div>

                  {/* Mostrar Icono */}
                  <div className="space-y-1 flex items-end pb-2.5">
                    <label className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[var(--muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingAnn.config?.showIcon !== false}
                        onChange={(e) => setEditingAnn({
                          ...editingAnn,
                          config: { ...editingAnn.config, showIcon: e.target.checked }
                        })}
                        className="accent-[var(--primary)]"
                      />
                      <span>Mostrar Iconos</span>
                    </label>
                  </div>
                </div>

                {/* Parámetros Automáticos si corresponde */}
                {editingAnn.type === 'AUTOMATIC' && (
                  <div className="bg-black/30 p-4 border border-white/5 mt-4 space-y-3">
                    <span className="text-[9px] tracking-widest text-[var(--primary)] uppercase font-bold font-mono">
                      Condición del Trigger
                    </span>
                    
                    {editingAnn.category === 'LOW_STOCK' && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/60">Stock Umbral para aviso:</span>
                        <input
                          type="number"
                          value={editingAnn.config?.threshold ?? 8}
                          onChange={(e) => setEditingAnn({
                            ...editingAnn,
                            config: { ...editingAnn.config, threshold: parseInt(e.target.value, 10) || 8 }
                          })}
                          className="w-20 bg-white/5 border border-white/10 p-2 outline-none text-[#f5f5f0]"
                        />
                        <span className="text-white/20">Prendas</span>
                      </div>
                    )}

                    {editingAnn.category === 'DROP_COUNTDOWN' && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/60">Mostrar si cierra en menos de:</span>
                        <input
                          type="number"
                          value={editingAnn.config?.thresholdHours ?? 48}
                          onChange={(e) => setEditingAnn({
                            ...editingAnn,
                            config: { ...editingAnn.config, thresholdHours: parseInt(e.target.value, 10) || 48 }
                          })}
                          className="w-20 bg-white/5 border border-white/10 p-2 outline-none text-[#f5f5f0]"
                        />
                        <span className="text-white/20">Horas</span>
                      </div>
                    )}

                    {editingAnn.category === 'FREE_SHIPPING' && (
                      <p className="text-white/40 italic">Esta alerta no tiene parámetros adicionales. Se muestra de forma estática.</p>
                    )}
                  </div>
                )}
              </div>

              {/* PROGRAMACIÓN DE FECHAS (Solo para Manual) */}
              {editingAnn.type === 'MANUAL' && (
                <>
                  <div className="col-span-1 md:col-span-2 h-px bg-white/5 my-2" />
                  
                  <div className="space-y-2">
                    <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" /> Fecha y Hora Inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={editingAnn.startsAt || ''}
                      onChange={(e) => setEditingAnn({ ...editingAnn, startsAt: e.target.value || null })}
                      className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" /> Fecha y Hora Fin
                    </label>
                    <input
                      type="datetime-local"
                      value={editingAnn.endsAt || ''}
                      onChange={(e) => setEditingAnn({ ...editingAnn, endsAt: e.target.value || null })}
                      className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                </>
              )}

              <div className="col-span-1 md:col-span-2 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditingAnn(null); }}
                  className="px-4 py-2 border border-white/10 text-xs text-[var(--muted)] hover:text-white uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#c29f2e] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
