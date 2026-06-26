'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader2, Package, ArrowRight, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types/order';

export default function AccountOrdersPage() {
  const [emailSearch, setEmailSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optionally load the last 5 general orders on mount if no search is initiated, for demonstration
  useEffect(() => {
    async function loadRecentOrders() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          // Just take the first 3-5 orders for demonstration
          setOrders(data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load recent orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecentOrders();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSearch.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(emailSearch.trim())}`);
      if (!res.ok) throw new Error('Error al buscar los pedidos.');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Hubo un problema al recuperar tus pedidos.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente de Pago';
      case 'paid':
        return 'Preparando';
      case 'fulfillment_submitted':
        return 'Producción';
      case 'fulfillment_failed':
        return 'Revisando';
      case 'shipped':
        return 'Enviado';
      case 'canceled':
        return 'Cancelado';
      default:
        return 'En Proceso';
    }
  };

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'shipped':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'canceled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'paid':
      case 'fulfillment_submitted':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-[var(--surface)] text-[var(--foreground)]/60 border-[var(--border)]';
    }
  };

  return (
    <div className="min-h-screen pt-32 px-6 max-w-4xl mx-auto pb-24 animate-in fade-in">
      <div className="mb-12">
        <h1 className="text-3xl font-serif mb-2 text-[var(--foreground)]">Mis Pedidos</h1>
        <p className="text-sm text-[var(--foreground)]/50">
          Busca y sigue el estado de tus compras en Alpha Addiction.
        </p>
      </div>

      {/* Email Search Bar */}
      <form onSubmit={handleSearch} className="mb-12 max-w-md">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="email"
              required
              placeholder="Introduce tu email de compra"
              value={emailSearch}
              onChange={e => setEmailSearch(e.target.value)}
              className="
                w-full bg-transparent border border-[var(--border)] pl-10 pr-4 py-3
                text-sm focus:outline-none focus:border-[var(--primary)] transition-colors
                placeholder-[var(--foreground)]/20 text-[var(--foreground)]
              "
            />
            <Search className="w-4 h-4 text-[var(--foreground)]/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="
              px-6 py-3 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--primary)]
              uppercase tracking-widest text-xs font-semibold transition-colors disabled:opacity-50
            "
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </button>
        </div>
      </form>

      {/* Orders List */}
      {isLoading && orders.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : error ? (
        <div className="text-center text-sm text-red-500 py-8 border border-red-500/10 bg-red-500/5">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)]">
          <Package className="w-10 h-10 text-[var(--foreground)]/20 mx-auto mb-4 stroke-[1.2]" />
          <p className="text-sm text-[var(--foreground)]/50 uppercase tracking-widest mb-4">
            {hasSearched ? 'No se han encontrado pedidos.' : 'Ingresa tu email para buscar tus pedidos.'}
          </p>
          <Link
            href="/genesis"
            className="text-xs tracking-widest uppercase underline underline-offset-4 text-[var(--foreground)] hover:text-[var(--primary)]"
          >
            Ir a la Colección
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)]/40 font-semibold mb-2">
            {hasSearched ? `Pedidos para: ${emailSearch}` : 'Pedidos Recientes (Simulados / Historial)'}
          </h2>

          {orders.map(order => (
            <div
              key={order.id}
              className="border border-[var(--border)]/70 bg-white/30 backdrop-blur-[2px] p-6 transition-all hover:border-[var(--foreground)]/30"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 pb-4 border-b border-[var(--border)]/40">
                <div>
                  <span className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/40 block mb-1">
                    ID DEL PEDIDO
                  </span>
                  <span className="font-mono text-sm text-[var(--foreground)]">{order.id}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/40 block mb-1">
                      FECHA
                    </span>
                    <span className="text-[var(--foreground)]">
                      {new Date(order.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/40 block mb-1">
                      ESTADO
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-medium tracking-wide ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-3 mb-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-[var(--foreground)]">{item.name}</span>
                      <span className="text-xs text-[var(--foreground)]/50 ml-2">
                        talla {item.size} × {item.qty}
                      </span>
                    </div>
                    <span className="text-[var(--foreground)]/80">{formatPrice(item.priceEUR * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-[var(--border)]/20">
                <div className="text-sm font-serif text-[var(--foreground)]">
                  Total: <span className="font-sans font-semibold">{formatPrice(order.totalPrice)}</span>
                </div>

                <div className="flex gap-4">
                  {order.status === 'shipped' && order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        inline-flex items-center text-xs tracking-widest uppercase font-semibold
                        text-[var(--primary)] hover:underline
                      "
                    >
                      Seguir Envío <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  )}

                  <Link
                    href={`/checkout/success?orderId=${order.id}`}
                    className="
                      inline-flex items-center text-xs tracking-widest uppercase font-semibold
                      text-[var(--foreground)] hover:text-[var(--primary)] transition-colors
                    "
                  >
                    Detalles <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
