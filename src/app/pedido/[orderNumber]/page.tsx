import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { verifyLookupToken, maskEmail, maskPhone, maskAddress } from '@/lib/lookup-auth';
import { formatPrice, formatDate } from '@/lib/email/helpers';
import {
  Package,
  Calendar,
  DollarSign,
  MapPin,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Check,
} from 'lucide-react';

interface Props {
  params: Promise<{
    orderNumber: string;
  }>;
}

export default async function OrderLookupDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const upperOrderNumber = orderNumber.trim().toUpperCase();

  // 1. Obtener cookie de sesión de consulta
  const cookieStore = await cookies();
  const token = cookieStore.get(`order_lookup_session_${upperOrderNumber}`)?.value;

  // 2. Validar token firmado y vigencia
  if (!token) {
    console.warn(`🔒 [Lookup Detail] Acceso bloqueado a pedido ${upperOrderNumber}: Cookie de sesión ausente.`);
    redirect('/pedido?error=session_required');
  }

  const isValid = await verifyLookupToken(token, upperOrderNumber);
  if (!isValid) {
    console.warn(`🔒 [Lookup Detail] Acceso bloqueado a pedido ${upperOrderNumber}: Firma de token inválida o expirada.`);
    redirect('/pedido?error=session_invalid');
  }

  // 3. Recuperar pedido de la base de datos de Neon
  const order = await db.order.findUnique({
    where: { orderNumber: upperOrderNumber },
    include: {
      items: true,
      events: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    console.error(`❌ [Lookup Detail] Pedido ${upperOrderNumber} no encontrado en base de datos.`);
    redirect('/pedido?error=not_found');
  }

  // 4. Enmascarar datos del cliente
  const maskedEmailVal = maskEmail(order.email || '');
  const maskedPhoneVal = maskPhone(order.phone || '');
  const maskedAddressVal = maskAddress(order.addressLine1 || '');

  // Mapeo de estados legibles para el cliente
  const clientStatusLabels: Record<string, { label: string; color: string; desc: string }> = {
    draft: { label: 'Borrador', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Tu pedido está registrado y pendiente de confirmación de pago.' },
    paid: { label: 'Pago Confirmado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'Hemos recibido tu pago y estamos preparando el envío a fabricación.' },
    printful_submitted: { label: 'Enviado a Fábrica', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', desc: 'Tu pedido ha sido recibido en el centro de producción de Printful.' },
    printful_production: { label: 'En Confección', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', desc: 'Tus prendas están siendo confeccionadas e impresas a medida.' },
    shipped: { label: 'Enviado', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', desc: '¡Tu pedido ya está en camino! Puedes realizar el seguimiento abajo.' },
    delivered: { label: 'Entregado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'Tu pedido ha sido entregado en la dirección indicada.' },
    canceled: { label: 'Cancelado', color: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'El pedido ha sido cancelado en el sistema.' },
    failed: { label: 'Error de Envío', color: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'Hubo una retención o error en la gestión del pedido. Te contactaremos.' },
  };

  const statusInfo = clientStatusLabels[order.orderStatus] || {
    label: order.orderStatus.toUpperCase(),
    color: 'text-[#f5f5f0] bg-white/5 border-white/10',
    desc: 'Tu pedido se encuentra en proceso.',
  };

  // Filtrar el historial de eventos para mostrar solo los útiles para el cliente
  const clientEvents = order.events.filter(
    (e) =>
      e.type === 'CREATED' ||
      e.type === 'PAYMENT_CONFIRMED' ||
      e.type === 'FULFILLMENT_SUBMITTED' ||
      e.type === 'FULFILLMENT_IN_PRODUCTION' ||
      e.type === 'FULFILLMENT_SHIPPED' ||
      e.type === 'DELIVERED' ||
      e.type === 'CANCELED'
  );

  return (
    <div className="min-h-screen bg-[#070707] text-[#f5f5f0] py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--primary)]/2 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative">
        {/* Header de Navegación */}
        <div className="flex justify-between items-center border-b border-white/5 pb-5">
          <Link
            href="/pedido"
            className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[#f5f5f0] flex items-center gap-1.5 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--primary)]" /> Volver a buscar
          </Link>
          <span className="text-[10px] font-mono text-[var(--muted)]">
            Sesión válida por 30 minutos
          </span>
        </div>

        {/* Bloque principal del Pedido */}
        <div className="bg-[#111111]/90 border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-6 border-b border-white/5">
            <div>
              <span className="text-[10px] tracking-[0.25em] text-[var(--muted)] uppercase font-semibold block mb-1">
                Estado del Pedido
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wide">
                PEDIDO #{order.orderNumber}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-xs text-[var(--muted)] font-mono">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                <Package className="w-3.5 h-3.5" /> {statusInfo.label}
              </span>
              <p className="text-[10px] text-[var(--muted)] max-w-xs mt-2.5 leading-relaxed md:ml-auto">
                {statusInfo.desc}
              </p>
            </div>
          </div>

          {/* Información del Tracking si existe */}
          {order.trackingNumber && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded">
                  <Truck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-indigo-300 block">Envío despachado</span>
                  <span className="text-xs text-[#f5f5f0] font-semibold mt-0.5 block">Código: {order.trackingNumber}</span>
                </div>
              </div>
              <a
                href={order.trackingUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                Seguir Envío
              </a>
            </div>
          )}

          {/* Desglose de Artículos */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono">
              Artículos en el pedido
            </h3>
            <div className="border border-white/5 divide-y divide-white/5">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-4">
                    {item.mockupUrl && (
                      <img
                        src={item.mockupUrl}
                        alt={item.name}
                        className="w-14 h-14 bg-white/[0.02] border border-white/5 shrink-0 object-cover"
                      />
                    )}
                    <div>
                      <h4 className="text-sm font-serif font-bold text-[#f5f5f0]">{item.name}</h4>
                      <p className="text-[10px] text-[var(--muted)] font-mono mt-1">
                        Talla: <span className="text-[#f5f5f0]">{item.size}</span>
                        {item.color && (
                          <>
                            {' · '}Color: <span className="text-[#f5f5f0]">{item.color}</span>
                          </>
                        )}
                        {' · '}Cant: <span className="text-[#f5f5f0]">{item.quantity}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#f5f5f0]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales y Datos Enmascarados (Grid 2 columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Datos de Entrega Enmascarados */}
            <div className="space-y-4 bg-white/[0.01] border border-white/5 p-5">
              <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" /> Dirección de Entrega
              </h3>
              <div className="text-xs space-y-2 font-mono text-[var(--muted)]">
                <div className="flex justify-between">
                  <span>Destinatario:</span>
                  <span className="text-[#f5f5f0]">{order.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dirección:</span>
                  <span className="text-[#f5f5f0]">{maskedAddressVal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Localidad:</span>
                  <span className="text-[#f5f5f0]">{order.city}, {order.postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span className="text-[#f5f5f0]">{maskedPhoneVal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-[#f5f5f0]">{maskedEmailVal}</span>
                </div>
              </div>
            </div>

            {/* Totales Financieros */}
            <div className="space-y-4 bg-white/[0.01] border border-white/5 p-5 flex flex-col justify-between">
              <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[var(--primary)]" /> Resumen Económico
              </h3>
              <div className="text-xs space-y-2 font-mono text-[var(--muted)]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-[#f5f5f0]">{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Descuento aplicado:</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/5 pt-3">
                  <span className="text-sm font-sans font-bold text-[#f5f5f0]">TOTAL PAGADO</span>
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historial simplificado de eventos */}
        <div className="bg-[#111111]/90 border border-white/5 p-6 sm:p-8 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono">
            Historial de Seguimiento
          </h3>
          <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
            {clientEvents.length === 0 ? (
              <p className="text-xs text-[var(--muted)] font-mono">No hay registros de seguimiento de fabricación disponibles.</p>
            ) : (
              clientEvents.map((evt) => (
                <div key={evt.id} className="relative">
                  {/* Icono de círculo del paso */}
                  <span className="absolute -left-[31px] top-0.5 p-1 bg-[#070707] border border-white/10 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-[var(--primary)]" />
                  </span>
                  <span className="text-[10px] text-[var(--muted)] font-mono block">
                    {formatDate(evt.createdAt)}
                  </span>
                  <span className="text-xs text-[#f5f5f0] font-semibold mt-0.5 block">
                    {evt.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
