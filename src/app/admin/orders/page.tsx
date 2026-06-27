'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  DollarSign,
  Calendar,
  User,
  Hash,
  ArrowRight,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';
import { formatPrice } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Estado del modal de detalle
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Fallo al obtener pedidos.');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los pedidos del servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Crear pedido simulado para probar el OMS
  const handleCreateMockOrder = async () => {
    setCreating(true);
    try {
      const mockOrder = {
        shippingAddress: {
          firstName: 'Alejandro',
          lastName: 'Gómez',
          email: `cliente.mock.${Math.floor(Math.random() * 1000)}@ejemplo.com`,
          phone: '+34 600 123 456',
          address: 'Calle del Lujo Silencioso 42, 3B',
          city: 'Madrid',
          postalCode: '28001',
          province: 'Madrid',
          country: 'España',
        },
        items: [
          {
            slug: 'core-hoodie',
            name: 'Core Hoodie',
            priceEUR: 45.0,
            size: 'M',
            color: 'Maroon',
            printfulVariantId: 5491,
            qty: 1,
          },
          {
            slug: 'essential-tee',
            name: 'Essential Tee',
            priceEUR: 25.0,
            size: 'L',
            color: 'Black',
            qty: 2,
          }
        ],
        discount: 5.0,
        paymentMethod: 'PayPal Sandbox',
        paymentStatus: 'paid',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOrder),
      });

      if (!res.ok) throw new Error('Error creando pedido simulado.');
      
      const result = await res.json();
      if (result.success) {
        // Recargar pedidos
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
      alert('Error al crear el pedido simulado.');
    } finally {
      setCreating(false);
    }
  };

  // Actualizar pedido
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);

    try {
      const payload: any = {};
      if (newStatus) {
        payload.status = newStatus;
        payload.notes = statusNotes || `Estado del pedido cambiado a: ${newStatus}`;
      }
      if (internalNotes !== selectedOrder.internalNotes) {
        payload.internalNotes = internalNotes;
      }

      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al actualizar el pedido.');
      const result = await res.json();
      
      if (result.success) {
        setSelectedOrder(result.order);
        setNewStatus('');
        setStatusNotes('');
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
      alert('Error actualizando pedido.');
    } finally {
      setUpdating(false);
    }
  };

  // Eliminar pedido
  const handleDeleteOrder = async (id: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el pedido ${id}?`)) return;

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Fallo al eliminar pedido.');
      const result = await res.json();
      
      if (result.success) {
        setSelectedOrder(null);
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
      alert('Error eliminando pedido.');
    }
  };

  // Ayudante para colores de estados
  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'payment_pending':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse';
      case 'paid':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'processing':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'printful_submitted':
      case 'fulfillment_submitted':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
      case 'printful_production':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'shipped':
        return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
      case 'delivered':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'canceled':
      case 'fulfillment_failed':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'refunded':
        return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
      default:
        return 'bg-white/5 border-white/10 text-[#f5f5f0]';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'payment_pending': return 'Pago Pendiente';
      case 'paid': return 'Pagado';
      case 'processing': return 'Procesando';
      case 'printful_submitted': return 'Enviado a Printful';
      case 'printful_production': return 'En Producción';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'canceled': return 'Cancelado';
      case 'refunded': return 'Reembolsado';
      case 'fulfillment_submitted': return 'Enviado a Printful (Legacy)';
      case 'fulfillment_failed': return 'Error Printful (Legacy)';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Gestión de Pedidos (OMS)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
          </button>
          <button
            onClick={handleCreateMockOrder}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-1.5 bg-[var(--primary)] text-black text-xs font-bold transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50 hover:bg-transparent hover:text-[var(--primary)] border border-[var(--primary)]"
          >
            {creating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            <span>Crear Pedido Simulado</span>
          </button>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
            <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase">Cargando catálogo de pedidos OMS...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs rounded text-center font-mono">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8">
            <div className="bg-white/5 border border-white/10 p-4 rounded-full mb-4 text-[var(--muted)]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">Sin Pedidos en el OMS</h3>
            <p className="text-xs text-[var(--muted)] max-w-sm tracking-wider leading-relaxed mb-6">
              El panel de gestión está listo. Crea un pedido simulado para verificar la visualización y las operaciones.
            </p>
            <button
              onClick={handleCreateMockOrder}
              disabled={creating}
              className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black transition-all text-xs font-semibold uppercase tracking-widest cursor-pointer"
            >
              Iniciar primer pedido
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  <th className="py-4">Pedido</th>
                  <th className="py-4">Cliente</th>
                  <th className="py-4">Estado</th>
                  <th className="py-4 text-right">Importe</th>
                  <th className="py-4 text-center">Fecha</th>
                  <th className="py-4 text-center">Tracking</th>
                  <th className="py-4 text-center">Proveedor</th>
                  <th className="py-4 text-center">Pago</th>
                  <th className="py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 font-bold text-[#f5f5f0]">{(order as any).orderNumber || order.id}</td>
                    <td className="py-4 font-sans text-[#f5f5f0]/80">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      <span className="block font-mono text-[10px] text-[var(--muted)] mt-0.5 font-normal">
                        {order.shippingAddress.email}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-block px-2 py-0.5 border text-[9px] rounded font-bold uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold text-[#f5f5f0]">{formatPrice(order.totalPrice)}</td>
                    <td className="py-4 text-center text-[10px] text-[var(--muted)]">
                      {new Date(order.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-4 text-center">
                      {order.trackingNumber ? (
                        <span className="text-[10px] text-green-400" title={order.trackingCarrier}>
                          {order.trackingNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--muted)]/50">—</span>
                      )}
                    </td>
                    <td className="py-4 text-center text-[10px] text-[var(--muted)]">
                      {order.printfulOrderId ? (
                        <span className="text-indigo-400 font-bold">#{order.printfulOrderId}</span>
                      ) : (
                        <span className="text-white/20">No enviado</span>
                      )}
                    </td>
                    <td className="py-4 text-center text-[10px] text-[var(--muted)] font-sans">
                      {order.paymentMethod || '—'}
                      <span className={`block font-mono text-[9px] mt-0.5 ${order.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-500'}`}>
                        ({order.paymentStatus || 'pending'})
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setInternalNotes(order.internalNotes || '');
                          }}
                          className="p-1.5 border border-white/10 hover:border-white/20 text-[#f5f5f0] hover:text-[var(--primary)] transition-all cursor-pointer rounded"
                          title="Ver detalle del pedido"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 border border-white/10 hover:border-red-500/30 text-[var(--muted)] hover:text-red-500 transition-all cursor-pointer rounded"
                          title="Eliminar del OMS"
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
        )}
      </div>

      {/* Modal de Detalle de Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div>
                <span className="text-[9px] tracking-widest text-[var(--muted)] uppercase font-semibold block">Detalle de Pedido</span>
                <h3 className="text-xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase font-mono mt-0.5">
                  {(selectedOrder as any).orderNumber || selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 border border-white/10 text-xs text-[var(--muted)] hover:text-[#f5f5f0] hover:border-white/20 uppercase tracking-widest font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Bloque Izquierdo: Información y Líneas */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Info Cliente */}
                <div className="border border-white/5 p-4 bg-white/[0.01]">
                  <h4 className="text-[10px] tracking-widest text-[var(--muted)] uppercase font-bold mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--primary)]" /> Datos del Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] text-[var(--muted)] block">Nombre completo</span>
                      <span className="text-[#f5f5f0]">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--muted)] block">Email</span>
                      <span className="text-[#f5f5f0] font-mono">{selectedOrder.shippingAddress.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--muted)] block">Teléfono</span>
                      <span className="text-[#f5f5f0] font-mono">{selectedOrder.shippingAddress.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--muted)] block">Destino</span>
                      <span className="text-[#f5f5f0]">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-[var(--muted)] block">Dirección de envío</span>
                      <span className="text-[#f5f5f0]">{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.postalCode}</span>
                    </div>
                  </div>
                </div>

                {/* Líneas de productos */}
                <div className="border border-white/5 p-4 bg-white/[0.01]">
                  <h4 className="text-[10px] tracking-widest text-[var(--muted)] uppercase font-bold mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[var(--primary)]" /> Productos del Pedido
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3 text-xs">
                        <div>
                          <span className="font-semibold text-[#f5f5f0]">{item.name}</span>
                          <span className="block font-mono text-[9px] text-[var(--muted)] mt-0.5">
                            Talla: {item.size} {item.color ? `· Color: ${item.color}` : ''} {item.printfulVariantId ? `· Variant ID: ${item.printfulVariantId}` : ''}
                          </span>
                          {(item as any).costPrice > 0 && (
                            <span className="block font-mono text-[9px] text-green-500/80 mt-0.5">
                              Coste Prod: {formatPrice((item as any).costPrice)} · Beneficio Unitario: {formatPrice(item.priceEUR - (item as any).costPrice)}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block text-[#f5f5f0] font-bold font-mono">
                            {item.qty}x {formatPrice(item.priceEUR)}
                          </span>
                          <span className="block font-mono text-[9px] text-[var(--muted)] mt-0.5">
                            Total: {formatPrice(item.priceEUR * item.qty)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen importes */}
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount ? (
                      <div className="flex justify-between text-red-400">
                        <span>Descuento</span>
                        <span>-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Envío</span>
                      <span>{formatPrice(selectedOrder.shippingPrice)}</span>
                    </div>
                    <div className="flex justify-between text-[#f5f5f0] font-bold text-sm pt-2 border-t border-white/5">
                      <span className="font-sans">TOTAL VENTA</span>
                      <span>{formatPrice(selectedOrder.totalPrice)}</span>
                    </div>
                    {(selectedOrder as any).totalCost > 0 && (
                      <div className="border-t border-white/5 pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-[var(--muted)] text-[10px]">
                          <span>COSTE PRODUCCIÓN (PRINTFUL)</span>
                          <span>{formatPrice((selectedOrder as any).totalCost)}</span>
                        </div>
                        <div className="flex justify-between text-green-400 font-bold text-xs pt-1">
                          <span className="font-sans">BENEFICIO NETO</span>
                          <span>
                            {formatPrice((selectedOrder as any).netProfit)}
                            <span className="text-[9px] font-normal font-sans ml-2 text-green-500">
                              ({((selectedOrder as any).netProfit / (selectedOrder as any).totalPrice * 100).toFixed(1)}% Margen)
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Bloque Derecho: Estado, Logs y Nota */}
              <div className="md:col-span-5 space-y-6">
                
                {/* Formulario de actualización de estado */}
                <form onSubmit={handleUpdateOrder} className="border border-white/5 p-4 bg-white/[0.01] space-y-4">
                  <h4 className="text-[10px] tracking-widest text-[var(--muted)] uppercase font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[var(--primary)]" /> Acciones del Gestor
                  </h4>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] tracking-wider text-[var(--muted)] uppercase font-semibold block">Cambiar Estado</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-xs text-[#f5f5f0] p-2.5 outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Mantener actual ({selectedOrder.status})</option>
                      <option value="pending">Pendiente</option>
                      <option value="payment_pending">Pago Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="processing">Procesando</option>
                      <option value="printful_submitted">Enviado a Printful</option>
                      <option value="printful_production">En Producción</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="canceled">Cancelado</option>
                      <option value="refunded">Reembolsado</option>
                    </select>
                  </div>

                  {newStatus && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[9px] tracking-wider text-[var(--muted)] uppercase font-semibold block">Nota del evento (Historial)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Pago recibido mediante transferencia"
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 text-xs text-[#f5f5f0] p-2.5 outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] tracking-wider text-[var(--muted)] uppercase font-semibold block">Notas internas del Administrador</label>
                    <textarea
                      placeholder="Escribe notas de control interno..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 text-xs text-[#f5f5f0] p-2.5 h-20 outline-none resize-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updating || (!newStatus && internalNotes === selectedOrder.internalNotes)}
                    className="w-full py-2.5 bg-[var(--primary)] text-black text-xs font-bold uppercase tracking-widest cursor-pointer disabled:opacity-30 hover:bg-transparent hover:text-[var(--primary)] border border-[var(--primary)] transition-all"
                  >
                    {updating ? 'Guardando...' : 'Aplicar Cambios'}
                  </button>
                </form>

                {/* Timeline del Historial */}
                <div className="border border-white/5 p-4 bg-white/[0.01]">
                  <h4 className="text-[10px] tracking-widest text-[var(--muted)] uppercase font-bold mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary)]" /> Historial de Eventos (OMS)
                  </h4>
                  
                  <div className="space-y-4 pl-2 border-l border-white/10 relative ml-2 text-xs font-sans">
                    {selectedOrder.history && selectedOrder.history.length > 0 ? (
                      selectedOrder.history.map((event, index) => (
                        <div key={index} className="relative pl-4 space-y-1">
                          {/* Círculo indicador */}
                          <div className="absolute -left-[14px] top-1.5 w-2 h-2 rounded-full bg-[var(--primary)] border border-[#121212]" />
                          
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-[#f5f5f0] uppercase tracking-wider">{event.event}</span>
                            <span className="text-[9px] text-[var(--muted)] font-mono">
                              {new Date(event.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {event.notes && (
                            <p className="text-[10px] text-[var(--muted)] leading-relaxed italic">{event.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[var(--muted)] pl-2 italic">Sin historial de eventos inicializado.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Simple loader icon component
function Loader2({ className }: { className?: string }) {
  return <RefreshCw className={`animate-spin ${className}`} />;
}
