'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, Truck, ArrowRight, Loader2 } from 'lucide-react';
import { formatPrice } from '@/shared/utils/utils';
import { Order } from '@/shared/types/order';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('ID de pedido no encontrado.');
      setIsLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (!res.ok) throw new Error('No se pudieron recuperar los detalles del pedido.');
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError((err as Error).message || 'Error al cargar los detalles del pedido.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-sm tracking-widest text-[var(--foreground)]/50 uppercase">
          Cargando detalles de tu pedido...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-xl font-serif mb-4 text-red-500">Error</h1>
        <p className="text-sm text-[var(--foreground)]/70 mb-8">{error || 'Pedido no encontrado.'}</p>
        <Link
          href="/genesis"
          className="underline underline-offset-4 tracking-widest text-sm uppercase text-[var(--foreground)]"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente de Pago';
      case 'paid':
        return 'Pago Confirmado · Preparando Pedido';
      case 'fulfillment_submitted':
        return 'Enviado a producción';
      case 'fulfillment_failed':
        return 'En preparación';
      case 'shipped':
        return 'Enviado';
      case 'canceled':
        return 'Cancelado';
      default:
        return 'En proceso';
    }
  };

  return (
    <div className="min-h-screen pt-32 px-6 max-w-4xl mx-auto pb-24 animate-in fade-in">
      <div className="flex flex-col items-center text-center mb-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-6 stroke-[1.5]" />
        <h1 className="text-3xl font-serif mb-3 text-[var(--foreground)]">
          ¡Gracias por tu compra!
        </h1>
        <p className="text-sm text-[var(--foreground)]/60 max-w-md">
          Tu pago ha sido procesado con éxito y el pedido se ha enviado a producción. 
          Te enviaremos actualizaciones de seguimiento por correo.
        </p>
        <div className="mt-6 bg-[var(--surface)] border border-[var(--border)] px-4 py-2 text-xs tracking-widest uppercase text-[var(--foreground)]">
          Pedido: {order.id}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Left Column: Summary and Status */}
        <div className="md:col-span-7 space-y-8">
          <section className="bg-white/40 backdrop-blur-[2px] p-6 border border-[var(--border)]/50">
            <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)]/50 mb-4 font-semibold">
              Estado de Envío
            </h2>
            <div className="flex items-start gap-4">
              {order.status === 'shipped' ? (
                <Truck className="w-6 h-6 text-[var(--primary)] mt-1 flex-shrink-0" />
              ) : (
                <Package className="w-6 h-6 text-[var(--primary)] mt-1 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {getStatusText(order.status)}
                </p>
                {order.status === 'shipped' && order.trackingNumber && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-[var(--foreground)]/70">
                      Transportista: <span className="font-semibold">{order.carrier}</span>
                    </p>
                    <p className="text-xs text-[var(--foreground)]/70">
                      Número de seguimiento:{' '}
                      <span className="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                        {order.trackingNumber}
                      </span>
                    </p>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-[var(--primary)] hover:underline mt-2"
                      >
                        Seguir envío <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </a>
                    )}
                  </div>
                )}
                {order.status !== 'shipped' && (
                  <p className="text-xs text-[var(--foreground)]/50 mt-1">
                    Nuestro equipo está produciendo tus prendas. Los pedidos personalizados suelen tardar entre 2 y 5 días laborables en enviarse.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Product Items */}
          <section className="border border-[var(--border)]/50 bg-white/40 backdrop-blur-[2px] p-6">
            <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)]/50 mb-6 font-semibold">
              Artículos
            </h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-[var(--foreground)]">{item.name}</span>
                    <p className="text-xs text-[var(--foreground)]/50 mt-0.5">
                      Talla: {item.size} · Cantidad: {item.qty}
                    </p>
                  </div>
                  <span className="text-[var(--foreground)]">{formatPrice(item.priceEUR * item.qty)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Address and Totals */}
        <div className="md:col-span-5 space-y-8">
          <section className="bg-white/40 backdrop-blur-[2px] p-6 border border-[var(--border)]/50">
            <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)]/50 mb-4 font-semibold">
              Dirección de Envío
            </h2>
            <div className="text-sm space-y-1.5 text-[var(--foreground)]/80">
              <p className="font-medium text-[var(--foreground)]">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </p>
              <p>{order.shippingAddress.province}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="text-xs text-[var(--foreground)]/60 pt-2">Tel: {order.shippingAddress.phone}</p>}
            </div>
          </section>

          <section className="bg-white/40 backdrop-blur-[2px] p-6 border border-[var(--border)]/50">
            <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)]/50 mb-4 font-semibold">
              Resumen de Pago
            </h2>
            <div className="space-y-3 text-sm text-[var(--foreground)]/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <div className="h-px bg-[var(--border)] my-2" />
              <div className="flex justify-between font-serif text-base text-[var(--foreground)]">
                <span>Total pagado</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/genesis"
          className="
            inline-block px-8 py-3 bg-[var(--foreground)] text-[var(--background)]
            uppercase tracking-widest text-xs font-semibold hover:bg-[var(--primary)] transition-colors
          "
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
