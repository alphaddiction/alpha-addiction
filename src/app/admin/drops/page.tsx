'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Layers, Plus, Trash2, Edit3, Save, Calendar, Eye, EyeOff, Sparkles, Check, RefreshCw, ChevronRight
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  dropId: string | null;
}

interface Drop {
  id: string;
  name: string;
  slug: string;
  description: string;
  mainImage: string;
  banner: string;
  videoUrl?: string | null;
  status: 'DRAFT' | 'COMING_SOON' | 'LIVE' | 'SOLD_OUT' | 'ENDED' | 'ARCHIVED';
  openingAt: string;
  closingAt: string;
  primaryColor: string;
  order: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  visible: boolean;
  featured: boolean;
  products: Product[];
  _count?: {
    waitlist: number;
  };
}

export default function AdminDropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados del editor
  const [editingDrop, setEditingDrop] = useState<Partial<Drop> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Estados de la lista de espera (Waitlist)
  const [selectedWaitlistDrop, setSelectedWaitlistDrop] = useState<Drop | null>(null);
  const [waitlistRecords, setWaitlistRecords] = useState<any[]>([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const handleOpenWaitlist = async (drop: Drop) => {
    setSelectedWaitlistDrop(drop);
    setLoadingWaitlist(true);
    setWaitlistError(null);
    setWaitlistRecords([]);
    try {
      const res = await fetch(`/api/admin/drops/${drop.id}/waitlist`);
      if (!res.ok) throw new Error('Error al obtener la lista de espera.');
      const data = await res.json();
      setWaitlistRecords(data);
    } catch (err: any) {
      setWaitlistError(err.message);
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const fetchDropsAndProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dropsRes, productsRes] = await Promise.all([
        fetch('/api/drops'),
        fetch('/api/admin/system/health') // We'll write an API for products or load from Neon
      ]);

      if (!dropsRes.ok) throw new Error('Fallo al obtener drops.');
      const dropsData = await dropsRes.json();
      setDrops(dropsData);

      // Obtener todos los productos para poder asignarlos
      const prodRes = await fetch('/api/admin/drops'); // We'll just return products too
      // Wait, let's query products from a dedicated route or check if we can query from health or get them from db
      const productsRes2 = await fetch('/api/admin/products/list');
      if (productsRes2.ok) {
        const prodData = await productsRes2.json();
        setProducts(prodData);
      }
    } catch (err) {
      console.error(err);
      setError('Error cargando los drops del servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Para simplificar, creamos un endpoint rápido en /api/admin/products/list o cargamos desde la lista de drops
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const resDrops = await fetch('/api/drops');
        const dropsData = await resDrops.json();
        setDrops(dropsData);

        const resProds = await fetch('/api/admin/products/list');
        if (resProds.ok) {
          const prodsData = await resProds.json();
          setProducts(prodsData);
        }
      } catch (e) {
        console.error(e);
        setError('Error al conectar con la base de datos de Neon.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleOpenCreate = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    setEditingDrop({
      name: '',
      slug: '',
      description: '',
      mainImage: '/images/essential-tee-1.jpg',
      banner: '/images/essential-tee-1.jpg',
      status: 'DRAFT',
      openingAt: now.toISOString().slice(0, 16),
      closingAt: nextWeek.toISOString().slice(0, 16),
      primaryColor: '#d4af37',
      order: 0,
      visible: true,
      featured: false,
      products: [],
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (drop: Drop) => {
    setEditingDrop({
      ...drop,
      openingAt: new Date(drop.openingAt).toISOString().slice(0, 16),
      closingAt: new Date(drop.closingAt).toISOString().slice(0, 16),
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrop) return;
    setSubmitting(true);

    try {
      const isNew = !editingDrop.id;
      const url = '/api/admin/drops';
      const method = isNew ? 'POST' : 'PATCH';

      const selectedProductIds = editingDrop.products?.map(p => p.id) || [];

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingDrop,
          productIds: selectedProductIds
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar el Drop.');
      }

      setIsEditing(false);
      setEditingDrop(null);
      
      // Recargar datos
      const resDrops = await fetch('/api/drops');
      const dropsData = await resDrops.json();
      setDrops(dropsData);

      const resProds = await fetch('/api/admin/products/list');
      if (resProds.ok) {
        const prodsData = await resProds.json();
        setProducts(prodsData);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este Drop permanentemente?')) return;

    try {
      const res = await fetch(`/api/admin/drops?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('No se pudo eliminar el drop.');
      
      setDrops(drops.filter(d => d.id !== id));
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleToggleProduct = (product: Product) => {
    if (!editingDrop) return;

    const assignedProducts = editingDrop.products || [];
    const exists = assignedProducts.some(p => p.id === product.id);

    let newProducts = [];
    if (exists) {
      newProducts = assignedProducts.filter(p => p.id !== product.id);
    } else {
      newProducts = [...assignedProducts, product];
    }

    setEditingDrop({
      ...editingDrop,
      products: newProducts
    });
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'COMING_SOON': return 'Próximamente';
      case 'LIVE': return 'Activo (Live)';
      case 'SOLD_OUT': return 'Agotado';
      case 'ENDED': return 'Finalizado';
      case 'ARCHIVED': return 'Archivado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Lanzamientos Exclusivos
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Gestión de Drops
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Crear Drop
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs rounded text-center font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase">Cargando lanzamientos y drops...</p>
        </div>
      ) : drops.length === 0 ? (
        <div className="bg-[#121212] border border-white/5 p-12 text-center max-w-lg mx-auto">
          <Layers className="w-8 h-8 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">Sin Drops Configurados</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed mb-6">
            Comienza creando tu primer Drop para agrupar prendas exclusivas y programar su cuenta atrás de lanzamiento.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black transition-all text-xs font-semibold uppercase tracking-widest cursor-pointer"
          >
            Crear Primer Lanzamiento
          </button>
        </div>
      ) : (
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                <th className="py-4">Drop / Nombre</th>
                <th className="py-4">Estado</th>
                <th className="py-4">Apertura</th>
                <th className="py-4">Cierre</th>
                <th className="py-4 text-center">Productos</th>
                <th className="py-4 text-center">Lista de Espera</th>
                <th className="py-4 text-center">Visible</th>
                <th className="py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {drops.map((drop) => {
                const statusColors: Record<string, string> = {
                  DRAFT: 'text-white/40 bg-white/5 border-white/10',
                  COMING_SOON: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                  LIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  SOLD_OUT: 'text-red-400 bg-red-500/10 border-red-500/20',
                  ENDED: 'text-red-400/60 bg-red-500/5 border-red-500/10',
                  ARCHIVED: 'text-white/20 bg-white/5 border-white/5',
                };

                return (
                  <tr key={drop.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2.5 h-10 shrink-0" 
                          style={{ backgroundColor: drop.primaryColor }}
                        />
                        <div>
                          <span className="font-serif font-bold text-sm text-[#f5f5f0] tracking-wide block">{drop.name}</span>
                          <span className="text-[10px] text-[var(--muted)] font-mono">/drops/{drop.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-block px-2.5 py-0.5 border text-[9px] rounded font-bold uppercase tracking-wider ${statusColors[drop.status]}`}>
                        {translateStatus(drop.status)}
                      </span>
                    </td>
                    <td className="py-4 text-[10px] text-[var(--muted)]">
                      {new Date(drop.openingAt).toLocaleString('es-ES')}
                    </td>
                    <td className="py-4 text-[10px] text-[var(--muted)]">
                      {new Date(drop.closingAt).toLocaleString('es-ES')}
                    </td>
                    <td className="py-4 text-center font-bold text-[#f5f5f0]">
                      {drop.products?.length || 0}
                    </td>
                    <td 
                      onClick={() => handleOpenWaitlist(drop)}
                      className="py-4 text-center font-bold text-[var(--primary)] hover:underline cursor-pointer"
                      title="Ver lista de espera de registrados"
                    >
                      {drop._count?.waitlist || 0} uds
                    </td>
                    <td className="py-4 text-center">
                      {drop.visible ? (
                        <span className="inline-flex p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex p-1 bg-white/5 border border-white/10 text-white/20 rounded">
                          <EyeOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(drop)}
                          className="p-1.5 border border-white/10 hover:border-white/20 text-[#f5f5f0] hover:text-[var(--primary)] transition-all cursor-pointer rounded"
                          title="Editar Drop"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(drop.id)}
                          className="p-1.5 border border-white/10 hover:border-red-500/30 text-[var(--muted)] hover:text-red-500 transition-all cursor-pointer rounded"
                          title="Eliminar Drop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      {isEditing && editingDrop && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 md:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                {editingDrop.id ? 'Editar Drop' : 'Crear Nuevo Drop'}
              </h3>
              <button
                onClick={() => { setIsEditing(false); setEditingDrop(null); }}
                className="text-xs text-[var(--muted)] hover:text-white uppercase tracking-widest font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
              
              {/* Formulario Izquierda */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Nombre del Drop</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Genesis Drop 01"
                    value={editingDrop.name || ''}
                    onChange={(e) => setEditingDrop({ ...editingDrop, name: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Slug (Ruta URL)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: genesis-drop-01"
                    value={editingDrop.slug || ''}
                    onChange={(e) => setEditingDrop({ ...editingDrop, slug: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Descripción de la Colección</label>
                  <textarea
                    required
                    placeholder="Escribe la historia o descripción de este lanzamiento..."
                    value={editingDrop.description || ''}
                    onChange={(e) => setEditingDrop({ ...editingDrop, description: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 h-20 outline-none resize-none focus:border-[var(--primary)] text-[#f5f5f0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Fecha Apertura</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingDrop.openingAt || ''}
                      onChange={(e) => setEditingDrop({ ...editingDrop, openingAt: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Fecha Cierre</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingDrop.closingAt || ''}
                      onChange={(e) => setEditingDrop({ ...editingDrop, closingAt: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Color del Drop (HEX)</label>
                    <input
                      type="color"
                      value={editingDrop.primaryColor || '#d4af37'}
                      onChange={(e) => setEditingDrop({ ...editingDrop, primaryColor: e.target.value })}
                      className="w-full h-10 bg-[#0a0a0a] border border-white/10 p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Prioridad (Orden)</label>
                    <input
                      type="number"
                      value={editingDrop.order || 0}
                      onChange={(e) => setEditingDrop({ ...editingDrop, order: parseInt(e.target.value, 10) })}
                      className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingDrop.visible}
                      onChange={(e) => setEditingDrop({ ...editingDrop, visible: e.target.checked })}
                      className="rounded border-white/10 accent-[var(--primary)]"
                    />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Visible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingDrop.featured}
                      onChange={(e) => setEditingDrop({ ...editingDrop, featured: e.target.checked })}
                      className="rounded border-white/10 accent-[var(--primary)]"
                    />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Destacado</span>
                  </label>
                </div>
              </div>

              {/* Formulario Derecha (Imágenes, SEO y Selección de Productos) */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Banner Principal (URL)</label>
                  <input
                    type="text"
                    required
                    placeholder="URL del banner de la colección"
                    value={editingDrop.banner || ''}
                    onChange={(e) => setEditingDrop({ ...editingDrop, banner: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Estado</label>
                  <select
                    value={editingDrop.status || 'DRAFT'}
                    onChange={(e) => setEditingDrop({ ...editingDrop, status: e.target.value as any })}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                  >
                    <option value="DRAFT">Borrador</option>
                    <option value="COMING_SOON">Próximamente (Coming Soon)</option>
                    <option value="LIVE">Activo (Live)</option>
                    <option value="SOLD_OUT">Agotado (Sold Out)</option>
                    <option value="ENDED">Finalizado (Ended)</option>
                    <option value="ARCHIVED">Archivado (Archived)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Meta Title (SEO)</label>
                    <input
                      type="text"
                      placeholder="SEO Title"
                      value={editingDrop.metaTitle || ''}
                      onChange={(e) => setEditingDrop({ ...editingDrop, metaTitle: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Meta Description (SEO)</label>
                    <input
                      type="text"
                      placeholder="SEO Description"
                      value={editingDrop.metaDescription || ''}
                      onChange={(e) => setEditingDrop({ ...editingDrop, metaDescription: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                    />
                  </div>
                </div>

                {/* Seleccionador de Productos */}
                <div className="border border-white/5 p-4 bg-white/[0.01]">
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
                    Asignar Productos al Drop
                  </span>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
                    {products.length === 0 ? (
                      <p className="text-[10px] text-[var(--muted)] italic">No hay productos en Neon.</p>
                    ) : (
                      products.map((p) => {
                        const isAssigned = editingDrop.products?.some(ep => ep.id === p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleToggleProduct(p)}
                            className={`
                              flex items-center justify-between p-2.5 border cursor-pointer transition-colors text-[11px]
                              ${isAssigned 
                                ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[#f5f5f0]' 
                                : 'border-white/5 bg-[#0a0a0a] text-[var(--muted)] hover:border-white/20'
                              }
                            `}
                          >
                            <span>{p.name}</span>
                            {isAssigned ? (
                              <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
                            ) : p.dropId ? (
                              <span className="text-[8px] uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded text-white/35">
                                En otro Drop
                              </span>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditingDrop(null); }}
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

      {/* Modal de Lista de Espera (Waitlist) */}
      {selectedWaitlistDrop && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 md:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-widest">
                  Lista de Espera: {selectedWaitlistDrop.name}
                </h3>
                <p className="text-[10px] text-[var(--muted)] font-mono mt-1">
                  Total registrados: {waitlistRecords.length} usuarios
                </p>
              </div>
              <button
                onClick={() => setSelectedWaitlistDrop(null)}
                className="text-xs text-[var(--muted)] hover:text-white uppercase tracking-widest font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {loadingWaitlist ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
                <p className="text-[9px] text-[var(--muted)] tracking-wider uppercase font-mono">Cargando registros...</p>
              </div>
            ) : waitlistError ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                {waitlistError}
              </div>
            ) : waitlistRecords.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.01] border border-white/5 text-[var(--muted)] text-xs">
                No hay registros en la lista de espera para este lanzamiento.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Botón Exportación MOCK */}
                <div className="flex justify-end">
                  <button
                    onClick={() => alert('Exportación a CSV estará disponible próximamente en la fase de producción.')}
                    className="px-3.5 py-1.5 border border-white/10 hover:border-white/20 text-[#f5f5f0] hover:text-[var(--primary)] transition-all text-[10px] font-semibold uppercase tracking-widest cursor-pointer rounded"
                  >
                    Exportar CSV (Próximamente)
                  </button>
                </div>

                <div className="border border-white/5 shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Nombre</th>
                        <th className="py-3 px-4">Origen</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Fecha Registro</th>
                        <th className="py-3 px-4">ipHash / UA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {waitlistRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 px-4 text-[#f5f5f0] font-bold">{record.email}</td>
                          <td className="py-3 px-4 text-[var(--muted)]">{record.name || '—'}</td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.5 bg-white/5 text-white/50 text-[8px] rounded uppercase tracking-wider">
                              {record.origin}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-1.5 py-0.5 text-[8px] rounded uppercase font-bold tracking-wider ${
                              record.status === 'registered' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              record.status === 'notified' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              'bg-white/5 text-white/40 border border-white/10'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--muted)]">
                            {new Date(record.createdAt).toLocaleString('es-ES')}
                          </td>
                          <td className="py-3 px-4 text-[9px] text-white/20 select-all" title={`UA Hash: ${record.userAgentHash || 'N/A'}`}>
                            {record.ipHash ? `${record.ipHash.substring(0, 8)}...` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
