'use client';

import { useState, useEffect } from 'react';
import { 
  Shirt, Edit3, Save, Layers, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, Box
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Drop {
  id: string;
  name: string;
}

interface SizeVariant {
  size: string;
  sku: string;
  available: boolean;
  virtualStock?: number;
}

interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  sizes: SizeVariant[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  priceEUR: number;
  category: string;
  descriptionShort: string;
  status: 'in_stock' | 'sold_out';
  printfulProductId?: number | null;
  colorVariants?: ColorVariant[] | null;
  dropId?: string | null;
  drop?: Drop | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados del editor
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDropId, setEditedDropId] = useState('');
  const [editedStatus, setEditedStatus] = useState<'in_stock' | 'sold_out'>('in_stock');
  const [editedColorVariants, setEditedColorVariants] = useState<ColorVariant[]>([]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, dropsRes] = await Promise.all([
        fetch('/api/admin/products/list'),
        fetch('/api/drops')
      ]);

      if (!prodRes.ok) throw new Error('Fallo al obtener productos.');
      const prodData = await prodRes.json();
      setProducts(prodData);

      if (dropsRes.ok) {
        const dropsData = await dropsRes.json();
        setDrops(dropsData);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar catálogo de productos desde Neon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditedPrice(product.priceEUR.toString());
    setEditedDropId(product.dropId || '');
    setEditedStatus(product.status);
    setEditedColorVariants(JSON.parse(JSON.stringify(product.colorVariants || [])));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          priceEUR: parseFloat(editedPrice),
          dropId: editedDropId || null,
          status: editedStatus,
          colorVariants: editedColorVariants
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar producto.');
      }

      setSelectedProduct(null);
      await fetchAllData();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStock = (colorIdx: number, sizeIdx: number, val: string) => {
    const updated = [...editedColorVariants];
    const parsedVal = parseInt(val, 10);
    updated[colorIdx].sizes[sizeIdx].virtualStock = isNaN(parsedVal) ? 0 : parsedVal;
    
    // Si el stock virtual es mayor que 0, asegurar que está disponible
    if (updated[colorIdx].sizes[sizeIdx].virtualStock > 0) {
      updated[colorIdx].sizes[sizeIdx].available = true;
    } else {
      updated[colorIdx].sizes[sizeIdx].available = false;
    }
    
    setEditedColorVariants(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
          Alpha Control Center
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
          Catálogo de Productos y Stock
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs rounded text-center font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase">Cargando catálogo desde Neon PostgreSQL...</p>
        </div>
      ) : (
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                <th className="py-4">Prenda / ID</th>
                <th className="py-4">Categoría</th>
                <th className="py-4">Drop Asignado</th>
                <th className="py-4 text-right">Precio Venta</th>
                <th className="py-4 text-center">Proveedor Printful</th>
                <th className="py-4 text-center">Estado</th>
                <th className="py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-4 font-sans font-bold text-[#f5f5f0]">
                    {product.name}
                    <span className="block font-mono text-[9px] text-[var(--muted)] mt-0.5 font-normal">ID: {product.id} · slug: {product.slug}</span>
                  </td>
                  <td className="py-4 text-[var(--muted)]">{product.category}</td>
                  <td className="py-4 text-[var(--primary)] font-bold">
                    {product.drop?.name || 'Ninguno'}
                  </td>
                  <td className="py-4 text-right text-[#f5f5f0] font-bold">{formatPrice(product.priceEUR)}</td>
                  <td className="py-4 text-center">
                    {product.printfulProductId ? (
                      <span className="text-indigo-400 font-bold">#{product.printfulProductId}</span>
                    ) : (
                      <span className="text-white/20">Local</span>
                    )}
                  </td>
                  <td className="py-4 text-center">
                    <span className={`inline-block px-2 py-0.5 border text-[9px] rounded font-bold uppercase tracking-wider ${
                      product.status === 'in_stock' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {product.status === 'in_stock' ? 'En Stock' : 'Agotado'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-1.5 border border-white/10 hover:border-white/20 text-[#f5f5f0] hover:text-[var(--primary)] transition-all cursor-pointer rounded"
                      title="Editar Producto y Configurar Stock"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 md:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <span className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold block">Configuración de Producto</span>
                <h3 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-widest mt-0.5">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-[var(--muted)] hover:text-white uppercase tracking-widest font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6 text-xs font-sans">
              
              {/* Grid Atributos Principales */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Precio Venta (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Asignar Drop</label>
                  <select
                    value={editedDropId}
                    onChange={(e) => setEditedDropId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                  >
                    <option value="">Sin Drop (Tienda Tradicional / Oculto)</option>
                    {drops.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1.5">Estado</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-2.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0]"
                  >
                    <option value="in_stock">En Stock (Venta activa)</option>
                    <option value="sold_out">Agotado (Bloquear compra)</option>
                  </select>
                </div>
              </div>

              {/* Sección de Stock Virtual */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-widest text-[#f5f5f0] font-bold flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-[var(--primary)]" />
                    Límites de Stock Virtual por Variante (Printful)
                  </h4>
                  <span className="text-[10px] text-[var(--muted)] font-mono">
                    Los límites de stock virtual impiden la compra cuando llegan a cero, independientemente del inventario de Printful.
                  </span>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {editedColorVariants.length === 0 ? (
                    <div className="p-4 bg-white/5 border border-white/10 text-center text-[var(--muted)] italic">
                      Este producto no dispone de variantes físicas cargadas.
                    </div>
                  ) : (
                    editedColorVariants.map((colorGroup, colorIdx) => (
                      <div key={colorGroup.id} className="border border-white/5 p-4 bg-white/[0.01] space-y-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0" 
                            style={{ backgroundColor: colorGroup.hex }}
                          />
                          <span className="font-semibold text-sm text-[#f5f5f0]">{colorGroup.name}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                          {colorGroup.sizes.map((sizeObj, sizeIdx) => (
                            <div key={sizeObj.sku} className="bg-[#0a0a0a] border border-white/5 p-3 space-y-1.5">
                              <div className="flex justify-between font-mono text-[9px] text-[var(--muted)]">
                                <span>Talla: {sizeObj.size}</span>
                                <span>{sizeObj.available ? 'Habilitado' : 'Agotado'}</span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={sizeObj.virtualStock !== undefined ? sizeObj.virtualStock : 50}
                                onChange={(e) => handleUpdateStock(colorIdx, sizeIdx, e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 text-center p-1.5 outline-none focus:border-[var(--primary)] text-[#f5f5f0] font-mono text-xs"
                                placeholder="Stock"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border border-white/10 text-xs text-[var(--muted)] hover:text-white uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#c29f2e] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {submitting ? 'Guardando...' : 'Aplicar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
