'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Ticket, Plus, Trash2, Edit3, Save, Calendar, Eye, RefreshCw, X, Check, Power, AlertCircle
} from 'lucide-react';
import { formatPrice } from '@/shared/utils/utils';

interface Drop {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface Discount {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  status: 'ACTIVE' | 'INACTIVE';
  maxUses: number | null;
  usedCount: number;
  startsAt: string;
  endsAt: string;
  dropId: string | null;
  productId: string | null;
  customerEmail: string | null;
  minimumOrderAmount: number;
  isWaitlistOnly: boolean;
  showInPromoBar: boolean;
  drop?: Drop | null;
  product?: Product | null;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados del editor / modal
  const [editingDiscount, setEditingDiscount] = useState<Partial<Discount> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDiscountsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [discountsRes, dropsRes, productsRes] = await Promise.all([
        fetch('/api/admin/discounts'),
        fetch('/api/drops'),
        fetch('/api/admin/products/list'),
      ]);

      if (!discountsRes.ok) throw new Error('Fallo al obtener la lista de cupones.');
      
      const discountsData = await discountsRes.json();
      setDiscounts(discountsData);

      if (dropsRes.ok) {
        const dropsData = await dropsRes.json();
        setDrops(dropsData);
      }
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (err: any) {
      console.error('Error fetching admin discounts data:', err);
      setError(err.message || 'Error desconocido al cargar cupones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscountsData();
  }, [fetchDiscountsData]);

  // Manejar eliminación
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cupón de descuento? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar cupón.');
      }
      alert('Cupón eliminado correctamente.');
      fetchDiscountsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Alternar estado activo/inactivo rápidamente
  const handleToggleStatus = async (discount: Discount) => {
    const nextStatus = discount.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: discount.id, status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar estado.');
      }
      fetchDiscountsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Guardar creación / modificación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscount) return;

    setSubmitting(true);
    try {
      const isNew = !editingDiscount.id;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch('/api/admin/discounts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDiscount),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo al guardar cupón.');

      alert(isNew ? 'Cupón creado correctamente.' : 'Cupón actualizado correctamente.');
      setIsEditing(false);
      setEditingDiscount(null);
      fetchDiscountsData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    // Inicializar fechas por defecto (hoy a hoy+1 mes)
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    const pad = (num: number) => String(num).padStart(2, '0');
    const toDatetimeLocal = (d: Date) => 
      `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setEditingDiscount({
      code: '',
      type: 'PERCENTAGE',
      value: 10,
      status: 'ACTIVE',
      maxUses: null,
      startsAt: toDatetimeLocal(start),
      endsAt: toDatetimeLocal(end),
      dropId: '',
      productId: '',
      customerEmail: '',
      minimumOrderAmount: 0,
      isWaitlistOnly: false,
      showInPromoBar: false,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (discount: Discount) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const toDatetimeLocal = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditingDiscount({
      ...discount,
      startsAt: toDatetimeLocal(discount.startsAt),
      endsAt: toDatetimeLocal(discount.endsAt),
      dropId: discount.dropId || '',
      productId: discount.productId || '',
      customerEmail: discount.customerEmail || '',
    });
    setIsEditing(true);
  };

  const isExpired = (discount: Discount) => {
    return new Date(discount.endsAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Códigos Promocionales y Campañas
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Gestión de Cupones
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Crear Cupón
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-400 text-xs rounded text-center font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase font-mono">Cargando cupones de descuento...</p>
        </div>
      ) : discounts.length === 0 ? (
        <div className="bg-[#121212] border border-white/5 p-12 text-center max-w-lg mx-auto">
          <Ticket className="w-8 h-8 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">Sin Cupones Configurados</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed mb-6">
            Aún no has creado ningún código de descuento. Puedes crear descuentos por porcentaje, importe fijo o envíos gratis para promocionar tus drops.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#c29f2e] transition-colors cursor-pointer"
          >
            Crear Mi Primer Cupón
          </button>
        </div>
      ) : (
        <div className="bg-[#121212] border border-white/5 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/5 text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6 text-center">Tipo</th>
                <th className="py-4 px-6 text-center">Valor</th>
                <th className="py-4 px-6 text-center">Min. Compra</th>
                <th className="py-4 px-6 text-center">Usos</th>
                <th className="py-4 px-6 text-center">Restricciones</th>
                <th className="py-4 px-6">Vigencia</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {discounts.map((discount) => {
                const expired = isExpired(discount);
                return (
                  <tr key={discount.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6 text-[#f5f5f0] font-bold text-xs tracking-wider">
                      {discount.code}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-1.5 py-0.5 bg-white/5 text-white/60 text-[8px] rounded uppercase font-semibold">
                        {discount.type === 'PERCENTAGE' ? 'Porcentaje' :
                         discount.type === 'FIXED_AMOUNT' ? 'Importe Fijo' : 'Envío Gratis'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-[#f5f5f0]">
                      {discount.type === 'PERCENTAGE' ? `${discount.value}%` :
                       discount.type === 'FIXED_AMOUNT' ? formatPrice(discount.value) : '100% Off'}
                    </td>
                    <td className="py-4 px-6 text-center text-[var(--muted)]">
                      {discount.minimumOrderAmount > 0 ? formatPrice(discount.minimumOrderAmount) : 'Sin mínimo'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-bold ${discount.usedCount > 0 ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                        {discount.usedCount}
                      </span>
                      <span className="text-white/20"> / {discount.maxUses ?? '∞'}</span>
                    </td>
                    <td className="py-4 px-6 text-[9px] space-y-1">
                      {discount.drop && (
                        <div className="flex items-center gap-1 text-[var(--primary)] font-bold">
                          <span>Drop:</span> <span>{discount.drop.name}</span>
                        </div>
                      )}
                      {discount.product && (
                        <div className="flex items-center gap-1 text-white/50">
                          <span>Prenda:</span> <span>{discount.product.name}</span>
                        </div>
                      )}
                      {discount.customerEmail && (
                        <div className="flex items-center gap-1 text-indigo-400">
                          <span>Email:</span> <span className="truncate max-w-[120px]" title={discount.customerEmail}>{discount.customerEmail}</span>
                        </div>
                      )}
                      {discount.isWaitlistOnly && (
                        <div className="inline-flex px-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] uppercase font-bold rounded">
                          Lista Espera
                        </div>
                      )}
                      {discount.showInPromoBar && (
                        <div className="inline-flex px-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[7px] uppercase font-bold rounded ml-1">
                          Barra Superior
                        </div>
                      )}
                      {!discount.dropId && !discount.productId && !discount.customerEmail && (
                        <span className="text-white/20 italic">Todo el catálogo</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[10px] space-y-0.5 text-[var(--muted)]">
                      <div><span className="text-white/25">Del</span> {new Date(discount.startsAt).toLocaleDateString('es-ES')}</div>
                      <div>
                        <span className="text-white/25">Al</span> {new Date(discount.endsAt).toLocaleDateString('es-ES')}
                        {expired && <span className="text-red-500 text-[8px] ml-1 uppercase font-bold">[EXPIRADO]</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(discount)}
                        className={`inline-flex p-1 border cursor-pointer rounded transition-all ${
                          discount.status === 'ACTIVE' && !expired
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'
                        }`}
                        title={discount.status === 'ACTIVE' ? 'Desactivar cupón' : 'Activar cupón'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(discount)}
                          className="p-1.5 border border-white/10 text-white/50 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 rounded cursor-pointer transition-all"
                          title="Editar cupón"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id)}
                          className="p-1.5 border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 rounded cursor-pointer transition-all"
                          title="Eliminar cupón"
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

      {/* MODAL CREAR / EDITAR */}
      {isEditing && editingDiscount && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 md:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-md font-serif font-bold text-[#f5f5f0] uppercase tracking-widest flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[var(--primary)]" />
                {editingDiscount.id ? 'Modificar Cupón' : 'Crear Nuevo Cupón'}
              </h3>
              <button
                onClick={() => { setIsEditing(false); setEditingDiscount(null); }}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
              
              {/* Código */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. SUMMER10"
                  value={editingDiscount.code}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors placeholder-white/10"
                />
                <p className="text-[8px] text-white/30">Mayúsculas, sin espacios ni caracteres especiales.</p>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Estado Inicial
                </label>
                <select
                  value={editingDiscount.status}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full bg-[#161616] border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors rounded-none appearance-none"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>

              {/* Tipo Descuento */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Tipo de Descuento
                </label>
                <select
                  value={editingDiscount.type}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, type: e.target.value as any, value: e.target.value === 'FREE_SHIPPING' ? 0 : editingDiscount.value })}
                  className="w-full bg-[#161616] border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors rounded-none appearance-none"
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED_AMOUNT">Importe Fijo (€)</option>
                  <option value="FREE_SHIPPING">Envío Gratis</option>
                </select>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Valor del Descuento
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  disabled={editingDiscount.type === 'FREE_SHIPPING'}
                  placeholder="10"
                  value={editingDiscount.value}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, value: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>

              {/* Vigencia - Inicio */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--primary)]" /> Fecha Inicio *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editingDiscount.startsAt}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, startsAt: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors"
                />
              </div>

              {/* Vigencia - Fin */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--primary)]" /> Fecha Fin *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editingDiscount.endsAt}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, endsAt: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors"
                />
              </div>

              {/* Límite de Usos */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Límite de Usos Totales
                </label>
                <input
                  type="number"
                  placeholder="Vacío para ilimitado"
                  value={editingDiscount.maxUses ?? ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, maxUses: e.target.value ? parseInt(e.target.value, 10) : null })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors"
                />
              </div>

              {/* Mínimo de Compra */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Compra Mínima Requerida (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editingDiscount.minimumOrderAmount ?? ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="col-span-1 md:col-span-2 h-px bg-white/5 my-2" />

              {/* Restricción de Drop */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Restringir a Colección (Drop)
                </label>
                <select
                  value={editingDiscount.dropId || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, dropId: e.target.value || null, isWaitlistOnly: e.target.value ? editingDiscount.isWaitlistOnly : false })}
                  className="w-full bg-[#161616] border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors rounded-none appearance-none"
                >
                  <option value="">Todo el catálogo</option>
                  {drops.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Restricción de Producto */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Restringir a Producto Concreto
                </label>
                <select
                  value={editingDiscount.productId || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, productId: e.target.value || null })}
                  className="w-full bg-[#161616] border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors rounded-none appearance-none"
                >
                  <option value="">Cualquier prenda</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Restricción de Email */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  Restringir a Cliente Único (Email)
                </label>
                <input
                  type="email"
                  placeholder="Ej. vip@gmail.com"
                  value={editingDiscount.customerEmail || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, customerEmail: e.target.value || null })}
                  className="w-full bg-white/5 border border-white/10 p-3 outline-none text-[#f5f5f0] focus:border-[var(--primary)] transition-colors placeholder-white/10"
                />
              </div>

              {/* Exclusivo para Lista de Espera */}
              <div className="space-y-2 flex flex-col justify-end pb-3">
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#f5f5f0] cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!editingDiscount.dropId}
                    checked={!!editingDiscount.isWaitlistOnly}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, isWaitlistOnly: e.target.checked })}
                    className="w-4 h-4 rounded-none accent-[var(--primary)] cursor-pointer"
                  />
                  <span>Exclusivo para Waitlist de este Drop</span>
                </label>
                {!editingDiscount.dropId && (
                  <p className="text-[8px] text-amber-500/70 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Requiere seleccionar un Drop restrictivo primero.
                  </p>
                )}
              </div>

              {/* Mostrar en barra de anuncios superior */}
              <div className="space-y-2 flex flex-col justify-end pb-3">
                <label className="flex items-center gap-2 text-[10px] font-semibold text-[#f5f5f0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingDiscount.showInPromoBar}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, showInPromoBar: e.target.checked })}
                    className="w-4 h-4 rounded-none accent-[var(--primary)] cursor-pointer"
                  />
                  <span>Mostrar en Barra Superior</span>
                </label>
                <p className="text-[8px] text-white/30 mt-1">Genera automáticamente un anuncio banner mientras el cupón esté activo.</p>
              </div>

              <div className="col-span-1 md:col-span-2 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditingDiscount(null); }}
                  className="px-4 py-2 border border-white/10 text-xs text-[var(--muted)] hover:text-white uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#c29f2e] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {submitting ? 'Guardando...' : 'Guardar Cupón'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
