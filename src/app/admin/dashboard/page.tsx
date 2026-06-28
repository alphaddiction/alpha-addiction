'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Activity,
  Clock,
  RefreshCw,
  Terminal,
  Database,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Ticket,
  Users,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types/order';

interface DashboardStats {
  salesToday: number;
  salesMonth: number;
  pendingCount: number;
  productionCount: number;
  shippedCount: number;
  openTicketsCount: number;
  activeCustomers: number;
  waitlistCount: number;
}

interface DashboardPayload {
  success: boolean;
  metrics: DashboardStats;
  integrations: {
    paypal: boolean;
    printful: boolean;
    resend: boolean;
    sentry: boolean;
    backups: boolean;
  };
  alerts: string[];
  healthStatus: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardPayload | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/orders'),
      ]);

      if (!statsRes.ok || !ordersRes.ok) {
        throw new Error('Error al recuperar datos del panel de control.');
      }

      const statsData = (await statsRes.json()) as DashboardPayload;
      const ordersData = (await ordersRes.json()) as Order[];

      setStats(statsData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message || 'No se pudo establecer conexión con los servicios de administración.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const triggerGlobalSearch = () => {
    // Disparar evento sintáctico Ctrl+K para abrir Command Palette en Header
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Inicializando Consola Operativa...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Error de Sincronización
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error || 'Error del servidor al cargar las métricas.'}
        </p>
        <button
          onClick={() => fetchDashboardData()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  const { metrics, integrations, alerts, healthStatus } = stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Saludo y subtitulo */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase">
            Consola Principal
          </h2>
          <p className="text-xs text-[var(--muted)] tracking-wider mt-1.5 font-mono">
            Centro de control administrativo y estado general de la plataforma Alpha Addiction.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Última Sincronización: {new Date().toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50 font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Grid de Estado Rápido / Health & Panic alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/10 p-4 font-mono text-[10px] text-amber-400 space-y-1.5">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Advertencias y Alertas del Sistema:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-sans text-[11px] leading-relaxed">
            {alerts.map((alert, idx) => (
              <li key={idx}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid Superior de KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Ventas Hoy */}
        <div className="bg-[#121212] border border-white/5 p-6 hover:border-white/10 transition-colors shadow-sm font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Ventas Hoy</span>
              <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{formatPrice(metrics.salesToday)}</h3>
          </div>
          <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Ingresos acumulados hoy</p>
        </div>

        {/* KPI 2: Ventas Mes */}
        <div className="bg-[#121212] border border-white/5 p-6 hover:border-white/10 transition-colors shadow-sm font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Ventas Mes</span>
              <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{formatPrice(metrics.salesMonth)}</h3>
          </div>
          <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Acumulado mes en curso</p>
        </div>

        {/* KPI 3: Clientes Activos */}
        <div className="bg-[#121212] border border-white/5 p-6 hover:border-white/10 transition-colors shadow-sm font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Clientes</span>
              <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{metrics.activeCustomers}</h3>
          </div>
          <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Compradores recurrentes</p>
        </div>

        {/* KPI 4: Waitlist Registros */}
        <div className="bg-[#121212] border border-white/5 p-6 hover:border-white/10 transition-colors shadow-sm font-mono flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Waitlist</span>
              <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{metrics.waitlistCount}</h3>
          </div>
          <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Registros de lanzamientos</p>
        </div>
      </div>

      {/* Atajos y Accesos Rápidos */}
      <div className="bg-[#121212] border border-white/5 p-6 shadow-sm font-mono">
        <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" /> Atajos de Acceso Rápido
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/admin/drops" className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.04] transition-all duration-300 text-[10px] uppercase tracking-wider text-[#f5f5f0] gap-2.5 font-bold cursor-pointer group text-center">
            <Plus className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
            <span>Nuevo Drop</span>
          </Link>
          <Link href="/admin/discounts" className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.04] transition-all duration-300 text-[10px] uppercase tracking-wider text-[#f5f5f0] gap-2.5 font-bold cursor-pointer group text-center">
            <Plus className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
            <span>Nuevo Cupón</span>
          </Link>
          <button onClick={triggerGlobalSearch} className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.04] transition-all duration-300 text-[10px] uppercase tracking-wider text-[#f5f5f0] gap-2.5 font-bold cursor-pointer group text-center w-full">
            <Search className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
            <span>Buscar Pedido</span>
          </button>
          <Link href="/admin/discounts" className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.04] transition-all duration-300 text-[10px] uppercase tracking-wider text-[#f5f5f0] gap-2.5 font-bold cursor-pointer group text-center">
            <Ticket className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
            <span>Crear Descuento</span>
          </Link>
          <Link href="/admin/drops" className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.04] transition-all duration-300 text-[10px] uppercase tracking-wider text-[#f5f5f0] gap-2.5 font-bold cursor-pointer group text-center">
            <Users className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
            <span>Ver Waitlist</span>
          </Link>
          <Link href="/admin/monitoring" className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.04] transition-all duration-300 text-[10px] uppercase tracking-wider text-[#f5f5f0] gap-2.5 font-bold cursor-pointer group text-center">
            <Activity className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
            <span>Health Center</span>
          </Link>
        </div>
      </div>

      {/* Grid de Estado de Pedidos y Monitorizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
        {/* Columna Izquierda: Estado de Pedidos */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Fulfillment & Estados de Pedidos
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                <span className="text-xs text-[var(--muted)] uppercase font-medium">Pedidos en Cola / Pendientes:</span>
                <span className="text-xs font-bold text-white bg-white/5 px-2 py-0.5 border border-white/10">{metrics.pendingCount}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                <span className="text-xs text-[var(--muted)] uppercase font-medium">En Fabricación (Printful):</span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 border border-blue-500/20">{metrics.productionCount}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                <span className="text-xs text-[var(--muted)] uppercase font-medium">Pedidos Enviados / Entregados:</span>
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 border border-green-500/20">{metrics.shippedCount}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                <span className="text-xs text-[var(--muted)] uppercase font-medium">Incidencias de Soporte Activas:</span>
                <span className={`text-xs font-bold px-2 py-0.5 border ${
                  metrics.openTicketsCount > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>{metrics.openTicketsCount} abiertas</span>
              </div>
            </div>
          </div>
          <Link href="/admin/orders" className="text-[9px] tracking-widest text-[var(--primary)] uppercase font-bold hover:underline flex items-center gap-1.5 mt-6 justify-end">
            Ir al listado de Pedidos <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Columna Derecha: Estado de Integraciones & Health check rápido */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Estado de Integraciones del Sistema
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-white/60">PayPal Checkout</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                  integrations.paypal ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                }`}>{integrations.paypal ? 'CONFIG' : 'PENDIENTE'}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-white/60">Printful API</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                  integrations.printful ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                }`}>{integrations.printful ? 'CONFIG' : 'PENDIENTE'}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-white/60">Servidor SMTP</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                  integrations.resend ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                }`}>{integrations.resend ? 'CONFIG' : 'PENDIENTE'}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-white/60">Sentry Logger</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                  integrations.sentry ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                }`}>{integrations.sentry ? 'ACTIVO' : 'PENDIENTE'}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 text-xs col-span-2">
                <span className="text-white/60">Copia de Seguridad (Backups)</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                  integrations.backups ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/10'
                }`}>{integrations.backups ? 'AUTOMÁTICO' : 'MANUAL'}</span>
              </div>
            </div>
          </div>
          <Link href="/admin/monitoring" className="text-[9px] tracking-widest text-[var(--primary)] uppercase font-bold hover:underline flex items-center gap-1.5 mt-6 justify-end">
            Ver diagnósticos completos (Health Center) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Fila Inferior: Transacciones Recientes */}
      <div className="bg-[#121212] border border-white/5 p-6 shadow-sm font-mono">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
          <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold">
            Pedidos Recientes en el Sistema
          </h2>
          <Link
            href="/admin/orders"
            className="text-[9px] tracking-widest uppercase font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Ver todos los pedidos <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-[#f5f5f0]/30 text-xs tracking-widest uppercase">
            No se han registrado transacciones aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[var(--muted)] tracking-wider uppercase font-semibold text-[9px] pb-2">
                  <th className="py-3 font-semibold">Pedido ID</th>
                  <th className="py-3 font-semibold">PayPal ID</th>
                  <th className="py-3 font-semibold">Cliente</th>
                  <th className="py-3 font-semibold">Importe</th>
                  <th className="py-3 font-semibold">Fecha</th>
                  <th className="py-3 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#f5f5f0]/80">
                {orders.slice(0, 6).map(order => {
                  const getOrderStatusClass = (status: string) => {
                    switch (status) {
                      case 'shipped':
                        return 'bg-green-500/10 text-green-400 border-green-500/20';
                      case 'canceled':
                        return 'bg-red-500/10 text-red-400 border-red-500/20';
                      case 'paid':
                      case 'fulfillment_submitted':
                        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      default:
                        return 'bg-white/5 text-white/50 border-white/10';
                    }
                  };
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 font-mono font-medium">{order.id}</td>
                      <td className="py-4 font-mono text-[var(--muted)]">{order.paypalOrderId || '—'}</td>
                      <td className="py-4 font-sans">{order.shippingAddress.email}</td>
                      <td className="py-4 font-medium">{formatPrice(order.totalPrice)}</td>
                      <td className="py-4 text-[var(--muted)]">
                        {new Date(order.createdAt).toLocaleDateString('es-ES', {
                          year: '2-digit',
                          month: 'short',
                          day: '2-digit',
                        })}
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 border text-[9px] uppercase tracking-wider font-semibold rounded ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
