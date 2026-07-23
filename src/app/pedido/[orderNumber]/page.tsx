import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/backend/database/db';
import { verifyLookupToken, maskEmail, maskPhone, maskAddress } from '@/backend/auth/lookup-auth';
import { verifyPortalSessionToken, verifySecureOrderToken } from '@/backend/auth/portal-auth';
import { formatPrice, formatDate } from '@/backend/notifications/email/helpers';
import OrderActionsClient from '@/components/pedido/order-actions-client';
import {
  Package,
  Calendar,
  DollarSign,
  MapPin,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ orderNumber: string }> }): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Pedido #${orderNumber.trim().toUpperCase()} | Alpha Addiction`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderLookupDetailPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { token: tokenParam } = await searchParams;
  const upperOrderNumber = orderNumber.trim().toUpperCase();

  // 1. Recuperar pedido de la base de datos de Neon
  const order = await db.order.findUnique({
    where: { orderNumber: upperOrderNumber },
    include: {
      items: true,
      events: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!order) {
    console.error(`❌ [Lookup Detail] Pedido ${upperOrderNumber} no encontrado en base de datos.`);
    redirect('/pedido?error=not_found');
  }

  // 2. Control de Autenticación
  const cookieStore = await cookies();
  let isAuthorized = false;
  let authTypeUsed = 'CREDENTIALS';

  // Opción A: Token firmado para consulta individual en Cookie
  const orderCookieToken = cookieStore.get(`order_lookup_session_${upperOrderNumber}`)?.value;
  if (orderCookieToken) {
    const isValidLookup = await verifyLookupToken(orderCookieToken, upperOrderNumber);
    if (isValidLookup) {
      isAuthorized = true;
      authTypeUsed = 'CREDENTIALS';
    }
  }

  // Opción B: Sesión activa del portal general de clientes
  if (!isAuthorized) {
    const portalSession = cookieStore.get('client_portal_session')?.value;
    if (portalSession) {
      const portalEmail = await verifyPortalSessionToken(portalSession);
      if (portalEmail && portalEmail.toLowerCase() === order.email.toLowerCase()) {
        isAuthorized = true;
        authTypeUsed = 'OTP';
      }
    }
  }

  // Opción C: Acceso mediante enlace seguro con Token en Query Param (30 días)
  if (!isAuthorized && tokenParam) {
    const tokenEmail = await verifySecureOrderToken(tokenParam, upperOrderNumber);
    if (tokenEmail && tokenEmail.toLowerCase() === order.email.toLowerCase()) {
      isAuthorized = true;
      authTypeUsed = 'TOKEN';
    }
  }

  // Si no está autorizado, denegar acceso
  if (!isAuthorized) {
    console.warn(`🔒 [Lookup Detail] Acceso bloqueado a pedido ${upperOrderNumber}: Credenciales insuficientes.`);
    redirect('/pedido?error=session_required');
  }

  // 3. Registrar acceso en la base de datos para auditoría
  const headerList = await headers();
  const reqIp = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                headerList.get('x-real-ip') || 
                '127.0.0.1';
  const reqUserAgent = headerList.get('user-agent') || 'Unknown';

  try {
    await db.customerAccessLog.create({
      data: {
        email: order.email,
        orderNumber: order.orderNumber,
        accessType: authTypeUsed,
        ipAddress: reqIp,
        userAgent: reqUserAgent
      }
    });
  } catch (logErr) {
    console.error('⚠️ [Lookup Detail] Error al registrar el log de acceso:', logErr);
  }

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

  // Explicación inteligente basada en el estado actual
  let statusExplanation = '';
  if (order.orderStatus === 'printful_production' || order.orderStatus === 'printful_submitted') {
    statusExplanation = 'Tu prenda se está fabricando bajo demanda.';
  } else if (order.orderStatus === 'shipped') {
    statusExplanation = 'Tu pedido ya está de camino.';
  } else if (order.orderStatus === 'delivered') {
    statusExplanation = 'Esperamos que disfrutes tu compra.';
  }

  // 4. Enmascarar datos del cliente
  const maskedEmailVal = maskEmail(order.email || '');
  const maskedPhoneVal = order.phone ? maskPhone(order.phone) : '—';
  const maskedAddressVal = maskAddress(order.addressLine1 || '');

  // 5. Construcción del Timeline elegante de 6 pasos
  const steps = [
    { type: 'CREATED', label: 'Pedido recibido' },
    { type: 'PAYMENT_CONFIRMED', label: 'Pago confirmado' },
    { type: 'FULFILLMENT_SUBMITTED', label: 'Enviado a Printful' },
    { type: 'FULFILLMENT_IN_PRODUCTION', label: 'En producción' },
    { type: 'FULFILLMENT_SHIPPED', label: 'Enviado' },
    { type: 'DELIVERED', label: 'Entregado' }
  ];

  // Mapear eventos reales de Neon para asociar fechas a cada paso
  const timelineSteps = steps.map((step) => {
    // Buscar si existe el evento en el historial del pedido
    const realEvent = order.events.find(
      e => e.type === step.type || 
           (step.type === 'CREATED' && e.type === 'CREATED') || 
           (step.type === 'PAYMENT_CONFIRMED' && e.type === 'PAYMENT_CONFIRMED')
    );

    // Determinar si el paso ya se completó basándonos en el estado del pedido
    let completed = !!realEvent;
    
    // Validaciones de fallback en caso de estados avanzados sin eventos explícitos guardados
    if (step.type === 'CREATED') completed = true;
    if (step.type === 'PAYMENT_CONFIRMED' && ['paid', 'printful_submitted', 'printful_production', 'shipped', 'delivered'].includes(order.orderStatus)) completed = true;
    if (step.type === 'FULFILLMENT_SUBMITTED' && ['printful_submitted', 'printful_production', 'shipped', 'delivered'].includes(order.orderStatus)) completed = true;
    if (step.type === 'FULFILLMENT_IN_PRODUCTION' && ['printful_production', 'shipped', 'delivered'].includes(order.orderStatus)) completed = true;
    if (step.type === 'FULFILLMENT_SHIPPED' && ['shipped', 'delivered'].includes(order.orderStatus)) completed = true;
    if (step.type === 'DELIVERED' && order.orderStatus === 'delivered') completed = true;

    return {
      label: step.label,
      completed,
      date: realEvent ? realEvent.createdAt : null,
      message: realEvent ? realEvent.message : null
    };
  });

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
            <ArrowLeft className="w-4 h-4 text-[var(--primary)]" /> Volver al portal
          </Link>
          <span className="text-[10px] font-mono text-[var(--muted)]">
            Sesión segura de cliente
          </span>
        </div>

        {/* Bloque principal del Pedido */}
        <div className="bg-[#111111]/90 border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-6 border-b border-white/5">
            <div>
              <span className="text-[10px] tracking-[0.25em] text-[var(--muted)] uppercase font-semibold block mb-1">
                Detalle de Pedido
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
              {statusExplanation && (
                <p className="text-[10px] text-[var(--primary)] font-bold tracking-wide mt-1.5 uppercase font-mono">
                  {statusExplanation}
                </p>
              )}
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all text-center"
              >
                Seguir Envío
              </a>
            </div>
          )}

          {/* PANELES DE ACCIÓN DE CLIENTE (Rebuy, Soporte Modal, Facturas, Devoluciones) */}
          <OrderActionsClient order={{ id: order.id, orderNumber: order.orderNumber, email: order.email, items: order.items }} />

          {/* Desglose de Artículos */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono">
              Artículos en el pedido
            </h3>
            <div className="border border-white/5 divide-y divide-white/5 bg-white/[0.01]">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-4">
                    {item.mockupUrl && (
                      <div className="w-14 h-14 relative shrink-0">
                        <Image
                          src={item.mockupUrl}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="bg-white/[0.02] border border-white/5 object-cover"
                        />
                      </div>
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
                <div className="flex justify-between font-bold text-white/40">
                  <span>Datos Adicionales:</span>
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
                {order.discountCode && (
                  <div className="flex justify-between text-[10px] text-[var(--primary)] font-mono">
                    <span>Cupón utilizado:</span>
                    <span>{order.discountCode.toUpperCase()}</span>
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

        {/* TIMELINE ELEGANTE DE SEGUIMIENTO */}
        <div className="bg-[#111111]/90 border border-white/5 p-6 sm:p-8 space-y-6">
          <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono">
            Estado de Fabricación y Envío
          </h3>

          <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Icono de círculo del paso */}
                <span className={`absolute -left-[31px] top-0.5 p-1 bg-[#070707] border rounded-full flex items-center justify-center ${
                  step.completed ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-white/10 text-white/20'
                }`}>
                  {step.completed ? (
                    <Check className="w-2.5 h-2.5" />
                  ) : (
                    <span className="w-2.5 h-2.5 block bg-transparent" />
                  )}
                </span>
                
                {step.date ? (
                  <span className="text-[9px] text-[var(--muted)] font-mono block">
                    {new Date(step.date).toLocaleDateString()} {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-[9px] text-white/20 font-mono block">Pendiente</span>
                )}
                
                <span className={`text-xs font-semibold mt-0.5 block ${step.completed ? 'text-[#f5f5f0]' : 'text-white/30'}`}>
                  {step.completed ? '✔' : '⬜'} {step.label}
                </span>

                {step.completed && step.message && (
                  <span className="text-[10px] text-[var(--muted)] block mt-0.5">
                    {step.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
