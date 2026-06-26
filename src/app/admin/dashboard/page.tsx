'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MetricCard,
} from '@/components/admin/dashboard-cards';
import {
  DollarSign,
  ShoppingBag,
  Percent,
  TrendingUp,
  Server,
  KeyRound,
  ShieldCheck,
  Mail,
  Activity,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Terminal,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types/order';

interface SystemStatus {
  web: string;
  api: string;
  database: string;
  environment: string;
  timestamp: string;
  envVariables: {
    DATABASE_URL: string;
    PAYPAL_CLIENT_ID: string;
    PAYPAL_CLIENT_SECRET: string;
    PRINTFUL_API_TOKEN: string;
    PRINTFUL_STORE_ID: string;
    SMTP_USER: string;
    SMTP_PASS: string;
  };
  modules: {
    database: string;
    paypal: string;
    printful: string;
    email: string;
  };
}

export default function DashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
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
      const [statusRes, ordersRes] = await Promise.all([
        fetch('/api/admin/status'),
        fetch('/api/orders'),
      ]);

      if (!statusRes.ok || !ordersRes.ok) {
        throw new Error('Error al recuperar datos del panel de control.');
      }

      const statusData = (await statusRes.json()) as SystemStatus;
      const ordersData = (await ordersRes.json()) as Order[];

      setStatus(statusData);
      setOrders(ordersData);
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      setError('No se pudo establecer conexión con los servicios de administración. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Cargando Panel Operativo...
        </p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Error de Conexión
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error || 'Error inesperado del sistema.'}
        </p>
        <button
          onClick={() => fetchDashboardData()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  // Métricas calculadas dinámicamente en base a órdenes reales
  const activeOrders = orders.filter(o => o.status !== 'canceled');
  const totalSales = activeOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const salesCount = activeOrders.length;
  const estimatedCost = activeOrders.reduce((sum, o) => sum + o.totalPrice * 0.45, 0);
  const estimatedMargin = totalSales > 0 ? ((totalSales - estimatedCost) / totalSales) * 100 : 0;

  // Formatear fecha del último chequeo
  const lastCheckDate = new Date(status.timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Saludo y subtitulo */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#f5f5f0]">
            Consola Principal
          </h2>
          <p className="text-xs text-[var(--muted)] tracking-wider mt-1.5">
            Estado operativo general y comprobación de variables del sistema en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Check: {lastCheckDate}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Fila superior: Estado general de red y base de datos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#121212]/50 border border-white/5 p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <span className="p-2.5 bg-green-500/10 text-green-500 rounded">
            <Activity className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest block font-medium">Servidor Web</span>
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Online</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <span className="p-2.5 bg-green-500/10 text-green-500 rounded">
            <Server className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest block font-medium">Pasarela API</span>
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Online</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <span className={`p-2.5 rounded ${status.database === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            <Database className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest block font-medium">Base de Datos</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${status.database === 'connected' ? 'text-green-400' : 'text-yellow-500'}`}>
              {status.database === 'connected' ? 'Conectada' : 'Pendiente Config'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <span className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded">
            <Terminal className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest block font-medium">Entorno de Ejecución</span>
            <span className="text-xs font-bold text-[#f5f5f0] uppercase tracking-wider font-mono">
              {status.environment}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ventas Totales"
          value={formatPrice(totalSales)}
          change="+12.4%"
          changeType="positive"
          icon={DollarSign}
        />
        <MetricCard
          title="Pedidos Totales"
          value={salesCount}
          change="+8.3%"
          changeType="positive"
          icon={ShoppingBag}
        />
        <MetricCard
          title="Margen de Beneficio"
          value={`${estimatedMargin.toFixed(1)}%`}
          change="Neutral"
          changeType="neutral"
          icon={Percent}
        />
        <MetricCard
          title="Tasa de Conversión"
          value="3.4%"
          change="+0.5%"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Sección intermedia: Estado de Módulos & Variables de Entorno */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Estado de Módulos */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm">
          <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
            Estado de Módulos Operativos
          </h2>
          <div className="space-y-4">
            {/* Base de Datos */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span className="bg-white/5 p-1.5 rounded text-[#f5f5f0]/80">
                  <Database className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-semibold text-[#f5f5f0]">Base de Datos relacional</span>
                  <span className="text-[9px] text-[var(--muted)] block tracking-wider mt-0.5">
                    {status.database === 'connected' ? 'PostgreSQL conectada con Prisma' : 'Usando persistencia local temporal JSON'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider font-semibold uppercase text-[#f5f5f0]/80">
                  {status.modules.database === 'connected' ? 'Conectada' : 'Pendiente'}
                </span>
                {status.modules.database === 'connected' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* PayPal */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span className="bg-white/5 p-1.5 rounded text-[#f5f5f0]/80">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-semibold text-[#f5f5f0]">Pasarela PayPal checkout</span>
                  <span className="text-[9px] text-[var(--muted)] block tracking-wider mt-0.5">
                    Verificación de firmas y cobro automatizado de órdenes
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider font-semibold uppercase text-[#f5f5f0]/80">
                  {status.modules.paypal === 'configured' ? 'Configurado' : 'Pendiente'}
                </span>
                {status.modules.paypal === 'configured' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* Printful */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span className="bg-white/5 p-1.5 rounded text-[#f5f5f0]/80">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-semibold text-[#f5f5f0]">Fulfillment Printful API</span>
                  <span className="text-[9px] text-[var(--muted)] block tracking-wider mt-0.5">
                    Sincronización y envío de pedidos a fábrica
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider font-semibold uppercase text-[#f5f5f0]/80">
                  {status.modules.printful === 'configured' ? 'Configurado' : 'Pendiente'}
                </span>
                {status.modules.printful === 'configured' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span className="bg-white/5 p-1.5 rounded text-[#f5f5f0]/80">
                  <Mail className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-semibold text-[#f5f5f0]">Servidor de Correo SMTP</span>
                  <span className="text-[9px] text-[var(--muted)] block tracking-wider mt-0.5">
                    Notificaciones transaccionales automáticas al comprador
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider font-semibold uppercase text-[#f5f5f0]/80">
                  {status.modules.email === 'configured' ? 'Configurado' : 'Pendiente'}
                </span>
                {status.modules.email === 'configured' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Configuración de Variables de Entorno */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm">
          <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
            Variables de Entorno Detectadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(status.envVariables).map(([key, state]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 text-xs font-mono"
              >
                <span className="text-[#f5f5f0]/80 tracking-wider truncate mr-2" title={key}>
                  {key}
                </span>
                {state === 'configured' ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] rounded font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-green-400" /> Config
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] rounded font-bold uppercase tracking-wider animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-yellow-500" /> Pendiente
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila Inferior: Transacciones Recientes */}
      <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
          <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold">
            Transacciones Recientes
          </h2>
          <Link
            href="/admin/orders"
            className="text-[10px] tracking-widest uppercase font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Ver todos los pedidos <ExternalLink className="w-3 h-3" />
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
                <tr className="border-b border-white/5 text-[var(--muted)] tracking-wider uppercase font-semibold">
                  <th className="py-3 font-semibold">Pedido ID</th>
                  <th className="py-3 font-semibold">PayPal ID</th>
                  <th className="py-3 font-semibold">Cliente</th>
                  <th className="py-3 font-semibold">Importe</th>
                  <th className="py-3 font-semibold">Fecha</th>
                  <th className="py-3 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#f5f5f0]/80">
                {orders.slice(0, 5).map(order => {
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
                      <td className="py-4 font-mono text-[var(--muted)]">{order.paypalOrderId}</td>
                      <td className="py-4">{order.shippingAddress.email}</td>
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
                          className={`inline-block px-2 py-0.5 border text-[9px] uppercase tracking-wider font-semibold rounded-full ${getOrderStatusClass(
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
