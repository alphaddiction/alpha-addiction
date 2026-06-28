'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { HelpCircle, RefreshCw, FileText, CornerUpLeft, Loader2, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  printfulVariantId?: number | null;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  items: OrderItem[];
}

export default function OrderActionsClient({ order }: { order: Order }) {
  const router = useRouter();
  const { addItem, clearCart } = useCart();

  // Estados de carga e interfaz
  const [loadingRebuy, setLoadingRebuy] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Modales
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Soporte rápido
  const [supportCategory, setSupportCategory] = useState('Pedido');
  const [supportSubject, setSupportSubject] = useState(`Consulta sobre pedido ${order.orderNumber}`);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);

  // Handler: Recomprar (Volver a comprar)
  const handleRebuy = async () => {
    setLoadingRebuy(true);
    try {
      // 1. Validar disponibilidad de variantes con el API
      const res = await fetch('/api/products/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.items.map(item => ({
            productId: item.productId,
            name: item.name,
            color: item.color,
            size: item.size
          }))
        })
      });

      if (!res.ok) throw new Error('Error al validar stock de productos.');

      const data = await res.json();

      // 2. Avisar sobre productos no disponibles
      if (data.missing && data.missing.length > 0) {
        const missingNames = data.missing.map((m: any) => `• ${m.name} (${m.color} / ${m.size}): ${m.reason}`).join('\n');
        alert(
          `Algunos productos de este pedido ya no se encuentran disponibles o no hay suficiente stock:\n\n${missingNames}\n\nSe agregarán los productos restantes al carrito.`
        );
      }

      // 3. Agregar los productos disponibles al carrito
      if (data.available && data.available.length > 0) {
        // Opcional: limpiar carrito previo
        if (confirm('¿Deseas vaciar el carrito actual antes de cargar los productos de este pedido?')) {
          clearCart();
        }

        for (const item of data.available) {
          const originalQty = order.items.find(
            oi => oi.productId === item.product.id && oi.color === item.color && oi.size === item.size
          )?.quantity || 1;

          addItem(item.product, item.size, item.color, item.printfulVariantId, originalQty);
        }

        // Redirigir al carrito
        router.push('/cart');
      } else {
        alert('Ninguno de los artículos de este pedido está disponible actualmente para recomprar.');
      }

    } catch (err: any) {
      alert(err.message || 'Ocurrió un error al procesar la recompra.');
    } finally {
      setLoadingRebuy(false);
    }
  };

  // Handler: Soporte rápido
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setLoadingSupport(true);
    setSupportError(null);
    setSupportSuccess(null);

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente Portal',
          email: order.email,
          category: supportCategory,
          subject: supportSubject,
          message: supportMessage,
          orderNumber: order.orderNumber
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar la solicitud.');

      setSupportSuccess(data.ticketNumber);
      setSupportMessage('');
    } catch (err: any) {
      setSupportError(err.message || 'Error de conexión.');
    } finally {
      setLoadingSupport(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botonera Principal de Acciones del Portal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Botón: Recomprar */}
        <button
          onClick={handleRebuy}
          disabled={loadingRebuy}
          className="p-3.5 bg-white/[0.02] hover:bg-[var(--primary)] border border-white/5 hover:border-[var(--primary)] text-white hover:text-black transition-all flex flex-col items-center justify-center gap-1.5 text-center disabled:opacity-50 cursor-pointer"
        >
          {loadingRebuy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Volver a comprar</span>
        </button>

        {/* Botón: Necesito Ayuda (Soporte Rápido) */}
        <button
          onClick={() => {
            setShowSupportModal(true);
            setSupportSuccess(null);
            setSupportError(null);
          }}
          className="p-3.5 bg-white/[0.02] hover:bg-[var(--primary)] border border-white/5 hover:border-[var(--primary)] text-white hover:text-black transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Necesito ayuda</span>
        </button>

        {/* Botón: Devolución */}
        <button
          onClick={() => setShowReturnModal(true)}
          className="p-3.5 bg-white/[0.02] hover:bg-[var(--primary)] border border-white/5 hover:border-[var(--primary)] text-white hover:text-black transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer"
        >
          <CornerUpLeft className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Solicitar devolución</span>
        </button>

        {/* Botón: Facturas */}
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="p-3.5 bg-white/[0.02] hover:bg-[var(--primary)] border border-white/5 hover:border-[var(--primary)] text-white hover:text-black transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer"
        >
          <FileText className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold">Descargar factura</span>
        </button>
      </div>

      {/* MODAL 1: SOPORTE RÁPIDO */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111111] border border-white/10 p-6 max-w-md w-full space-y-4 relative">
            <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
              Solicitar Soporte Directo
            </h3>

            {supportSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center text-emerald-400">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Tu ticket ha sido creado correctamente con el código de seguimiento:
                </p>
                <div className="inline-block px-4 py-2 bg-white/[0.02] border border-white/5 text-[var(--primary)] font-mono font-bold text-sm">
                  {supportSuccess}
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  Te hemos enviado una confirmación a tu correo. El equipo responderá a la brevedad.
                </p>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="w-full py-2 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Pedido Asociado</label>
                  <input
                    type="text"
                    disabled
                    value={order.orderNumber}
                    className="w-full bg-[#0d0d0d] border border-white/5 px-3 py-2 text-[var(--muted)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Categoría *</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="Pedido">Incidencia con Pedido</option>
                    <option value="Envío">Envío y Seguimiento</option>
                    <option value="Devolución">Devoluciones y Cambios</option>
                    <option value="Pago">Duda de Pagos</option>
                    <option value="Otro">Otro Asunto</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Asunto *</label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Mensaje *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe detalladamente qué ocurre..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                  />
                </div>

                {supportError && (
                  <p className="text-[10px] font-mono text-red-400">{supportError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="flex-1 py-2 border border-white/10 hover:border-white/20 text-white font-bold uppercase text-[9px] tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingSupport || !supportMessage.trim()}
                    className="flex-1 py-2 bg-[var(--primary)] text-black font-bold uppercase text-[9px] tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {loadingSupport ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        Enviar Ticket <Send className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: SOLICITUD DE DEVOLUCIÓN */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111111] border border-white/10 p-6 max-w-md w-full space-y-4 text-center">
            <div className="flex justify-center text-amber-400">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
              Solicitar Devolución
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Las devoluciones de Alpha Addiction están sujetas a un período de <strong>14 días naturales</strong> tras la recepción del producto. 
            </p>
            <p className="text-[10px] text-amber-300 bg-amber-500/5 border border-amber-500/10 p-3 leading-relaxed font-mono">
              Esta sección de devoluciones automáticas se habilitará físicamente cuando el estado de tu envío sea marcado como "Entregado" por el transportista.
            </p>
            <button
              onClick={() => setShowReturnModal(false)}
              className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold uppercase text-[9px] tracking-wider transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: DESCARGAR FACTURA */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111111] border border-white/10 p-6 max-w-md w-full space-y-4 text-center">
            <div className="flex justify-center text-[var(--primary)]">
              <FileText className="w-12 h-12" />
            </div>
            <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
              Descargar Factura PDF
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Tu factura oficial en formato PDF está siendo procesada en nuestros servidores contables.
            </p>
            <p className="text-[10px] text-[var(--muted)] bg-white/[0.02] border border-white/5 p-3 leading-relaxed font-mono">
              La arquitectura del sistema de facturación está preparada. Las facturas individuales estarán disponibles para descarga directa tan pronto como finalice el drop actual y se procesen los despachos globales.
            </p>
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold uppercase text-[9px] tracking-wider transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
