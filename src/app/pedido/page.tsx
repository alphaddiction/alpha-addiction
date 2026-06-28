'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Mail,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  Loader2,
  Calendar,
  DollarSign,
  ArrowRight,
  LogOut,
  Tag,
  Package,
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  currency: string;
  email: string;
  items: OrderItem[];
}

export default function PedidoLookupPage() {
  const router = useRouter();

  // Estados generales del portal
  const [activeTab, setActiveTab] = useState<'credentials' | 'otp'>('credentials');
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingPortal, setLoadingPortal] = useState(true);

  // Formulario 1: Email + Pedido
  const [emailCred, setEmailCred] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loadingCred, setLoadingCred] = useState(false);
  const [errorCred, setErrorCred] = useState<string | null>(null);

  // Formulario 2: OTP
  const [emailOtp, setEmailOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [errorOtp, setErrorOtp] = useState<string | null>(null);
  const [successOtpMsg, setSuccessOtpMsg] = useState<string | null>(null);

  // Comprobar si el cliente ya está autenticado en el portal
  const checkPortalSession = async () => {
    try {
      const res = await fetch('/api/customer/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setAuthenticatedEmail(data.email || 'Cliente');
      }
    } catch (err) {
      console.warn('No active portal session:', err);
    } finally {
      setLoadingPortal(false);
    }
  };

  useEffect(() => {
    checkPortalSession();
  }, []);

  // Handler 1: Email + Pedido
  const handleCredSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCred(true);
    setErrorCred(null);

    try {
      const res = await fetch('/api/customer/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailCred, orderNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'El número de pedido o el correo electrónico no son correctos.');
      }

      router.push(`/pedido/${data.orderNumber}`);
    } catch (err: any) {
      setErrorCred(err.message);
    } finally {
      setLoadingCred(false);
    }
  };

  // Handler 2a: Enviar OTP
  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp.trim()) return;
    setLoadingOtp(true);
    setErrorOtp(null);
    setSuccessOtpMsg(null);

    try {
      const res = await fetch('/api/customer/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al solicitar el código.');
      }

      setSuccessOtpMsg(data.message);
      setOtpStep('verify');
    } catch (err: any) {
      setErrorOtp(err.message);
    } finally {
      setLoadingOtp(false);
    }
  };

  // Handler 2b: Verificar OTP
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setLoadingOtp(true);
    setErrorOtp(null);

    try {
      const res = await fetch('/api/customer/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOtp, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Código incorrecto o inválido.');
      }

      // Logueado correctamente -> Cargar portal
      setSuccessOtpMsg(null);
      await checkPortalSession();
    } catch (err: any) {
      setErrorOtp(err.message);
    } finally {
      setLoadingOtp(false);
    }
  };

  // Logout del portal
  const handleLogout = async () => {
    setLoadingPortal(true);
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
      setAuthenticatedEmail(null);
      setOrders([]);
      setOtpStep('request');
      setOtpCode('');
      setEmailOtp('');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoadingPortal(false);
    }
  };

  // Helper estilizado de estados de pedido
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'pagado') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (s === 'shipped' || s === 'enviado') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    if (s === 'canceled' || s === 'cancelado') return 'bg-red-500/10 text-red-500 border border-red-500/20';
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  if (loadingPortal) {
    return (
      <div className="min-h-screen bg-[#070707] text-[#f5f5f0] flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Cargando Portal de Cliente...</span>
      </div>
    );
  }

  // RENDER 1: VISTA DASHBOARD PORTAL DE CLIENTE AUTENTICADO
  if (authenticatedEmail) {
    return (
      <div className="min-h-screen bg-[#070707] text-[#f5f5f0] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--primary)]/1 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/2 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative">
          
          {/* Cabecera del Portal */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <span className="text-[9px] tracking-[0.3em] text-[var(--primary)] uppercase font-mono font-bold">
                Portal Inteligente del Cliente
              </span>
              <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wide mt-1 uppercase">
                Mis Pedidos
              </h1>
              <p className="text-xs text-[var(--muted)] mt-1 font-mono">
                Sesión activa para: <span className="text-[var(--primary)]">{authenticatedEmail}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="self-start sm:self-center px-4 py-2 border border-red-500/20 hover:border-red-500/50 bg-red-500/5 text-red-400 hover:text-red-300 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
            </button>
          </div>

          {/* Listado de Pedidos */}
          {orders.length === 0 ? (
            <div className="bg-[#111111]/90 border border-white/5 p-12 text-center space-y-4 max-w-xl mx-auto">
              <ShoppingBag className="w-12 h-12 text-white/5 mx-auto" />
              <h3 className="font-serif font-bold text-lg uppercase tracking-wide">Sin Pedidos Registrados</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                No hemos encontrado ningún pedido asociado a tu dirección de correo electrónico. Si realizaste una compra recientemente, es posible que el pago esté procesándose.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#111111]/90 border border-white/5 p-6 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative"
                >
                  <div className="absolute inset-0 border border-[var(--primary)]/2 pointer-events-none" />
                  
                  {/* Datos Identificadores del Pedido */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[var(--primary)] tracking-wider">
                        {order.orderNumber}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${getStatusBadge(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="text-[10px] text-[var(--muted)] font-mono flex flex-wrap items-center gap-x-6 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-white/40" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-white/40" />
                        Importe: <strong className="text-[#f5f5f0]">{order.total.toFixed(2)} {order.currency}</strong>
                      </span>
                    </div>

                    {/* Pre-visualización de Productos */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className="px-2 py-1 bg-white/[0.02] border border-white/5 rounded text-[9px] text-white/70 font-mono"
                        >
                          {item.name} ({item.color} / {item.size}) <span className="text-[var(--primary)]">x{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Acciones del Pedido */}
                  <div className="flex md:flex-col items-stretch justify-end gap-3 shrink-0">
                    <Link
                      href={`/pedido/${order.orderNumber}`}
                      className="px-5 py-2.5 bg-[var(--primary)] hover:bg-black hover:text-white border border-[var(--primary)] text-black font-bold text-[10px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 font-mono"
                    >
                      Ver detalles <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER 2: VISTA LOGIN (DOBLE PESTAÑA: PEDIDO / OTP)
  return (
    <div className="min-h-screen bg-[#070707] text-[#f5f5f0] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#111111]/80 backdrop-blur-md border border-white/5 relative">
        <div className="absolute inset-0 border border-[var(--primary)]/5 pointer-events-none" />
        
        {/* Cabecera del login */}
        <div className="text-center p-6 pb-2 border-b border-white/5">
          <div className="inline-flex p-3 bg-white/[0.02] border border-white/5 rounded-full mb-3">
            <ShoppingBag className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <h1 className="text-xl font-serif font-bold uppercase tracking-widest text-[#f5f5f0]">
            Portal del Cliente
          </h1>
          <p className="text-[10px] text-[var(--muted)] mt-1.5 max-w-xs mx-auto">
            Accede al estado de fabricación, timeline de envío y soporte de compras sin registro convencional.
          </p>
        </div>

        {/* Pestañas de Selección */}
        <div className="flex border-b border-white/5 text-[10px] uppercase font-mono font-bold">
          <button
            onClick={() => {
              setActiveTab('credentials');
              setErrorOtp(null);
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer border-r border-white/5 ${
              activeTab === 'credentials' ? 'bg-white/[0.02] text-[var(--primary)] border-b border-[var(--primary)]' : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            Buscar Pedido
          </button>
          <button
            onClick={() => {
              setActiveTab('otp');
              setErrorCred(null);
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'otp' ? 'bg-white/[0.02] text-[var(--primary)] border-b border-[var(--primary)]' : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            Acceso con Código OTP
          </button>
        </div>

        {/* Cuerpos de Pestaña */}
        <div className="p-6">
          
          {/* TIPO 1: EMAIL + PEDIDO */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[var(--primary)]" /> Correo electrónico de compra
                </label>
                <input
                  type="email"
                  required
                  placeholder="ej. comprador@correo.com"
                  value={emailCred}
                  onChange={(e) => setEmailCred(e.target.value)}
                  className="w-full bg-[#070707] border border-white/10 text-xs text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold flex items-center gap-1">
                  <Search className="w-3 h-3 text-[var(--primary)]" /> Número de pedido
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. AA-10001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-[#070707] border border-white/10 text-xs text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] uppercase transition-colors font-mono"
                />
              </div>

              {errorCred && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-3 text-[10px] font-mono flex gap-1.5 items-start">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{errorCred}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingCred}
                className="w-full py-3 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingCred ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
                  </>
                ) : (
                  'Consultar Pedido'
                )}
              </button>
            </form>
          )}

          {/* TIPO 2: OTP POR EMAIL */}
          {activeTab === 'otp' && (
            <div className="space-y-4 text-xs font-sans">
              
              {otpStep === 'request' ? (
                <form onSubmit={handleOtpRequest} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[var(--primary)]" /> Introduce tu Correo Electrónico
                    </label>
                    <p className="text-[9px] text-[var(--muted)] leading-relaxed">
                      Te enviaremos un código de verificación temporal de 6 cifras.
                    </p>
                    <input
                      type="email"
                      required
                      placeholder="ej. comprador@correo.com"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="w-full bg-[#070707] border border-white/10 text-xs text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  {errorOtp && (
                    <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-3 text-[10px] font-mono flex gap-1.5 items-start">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{errorOtp}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingOtp}
                    className="w-full py-3 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Solicitando...
                      </>
                    ) : (
                      'Solicitar Código Temporal'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[var(--primary)]" /> Introduce el Código OTP
                    </label>
                    {successOtpMsg && (
                      <p className="text-[9px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-2 font-mono">
                        {successOtpMsg}
                      </p>
                    )}
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Ej. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-[#070707] border border-white/10 text-center tracking-[0.5em] text-sm text-[var(--primary)] font-bold px-4 py-3 outline-none focus:border-[var(--primary)] transition-colors font-mono"
                    />
                  </div>

                  {errorOtp && (
                    <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-3 text-[10px] font-mono flex gap-1.5 items-start">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorOtp}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('request');
                        setOtpCode('');
                        setErrorOtp(null);
                      }}
                      className="flex-1 py-3 border border-white/10 hover:border-white/20 text-white font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loadingOtp || otpCode.length !== 6}
                      className="flex-1 py-3 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loadingOtp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...
                        </>
                      ) : (
                        'Ingresar al Portal'
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

        {/* Footer seguridad */}
        <div className="mt-4 p-5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[9px] text-[var(--muted)] font-mono bg-[#141414]/30">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Acceso cifrado de un solo uso. Sin contraseñas.</span>
        </div>
      </div>
    </div>
  );
}
