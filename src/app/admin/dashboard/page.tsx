import { getOrders } from '@/lib/orders';
import {
  MetricCard,
  IntegrationsStatus,
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
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Recuperar pedidos reales de la base de datos para calcular métricas operativas
  const orders = await getOrders();

  const activeOrders = orders.filter(o => o.status !== 'canceled');
  const totalSales = activeOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const salesCount = activeOrders.length;
  
  // Calcular estimaciones financieras
  const estimatedCost = activeOrders.reduce((sum, o) => {
    // Simulamos un coste de producción aproximado del 45% para el margen estimado
    return sum + o.totalPrice * 0.45;
  }, 0);
  const estimatedMargin = totalSales > 0 ? ((totalSales - estimatedCost) / totalSales) * 100 : 0;

  // Estado simulado de los servicios (se conectará con monitorización en Fase 4)
  const services = [
    { name: 'Base de Datos PostgreSQL', status: 'online' as const, details: 'Latencia: 12ms', icon: Server },
    { name: 'PayPal Sandbox API', status: 'online' as const, details: 'Modo Sandbox activo', icon: KeyRound },
    { name: 'Printful Fulfillment API', status: 'online' as const, details: 'Sincronizado v1', icon: Activity },
    { name: 'Certificado SSL Let\'s Encrypt', status: 'online' as const, details: 'Vence en 78 días', icon: ShieldCheck },
    { name: 'Servidor de Correo SMTP', status: 'online' as const, details: 'Puerto 587 activo', icon: Mail },
  ];

  // Incidencias recientes simuladas para el log del panel
  const recentIncidents = [
    { id: '1', date: 'Hace 2 horas', msg: 'Intento de login sospechoso bloqueado (IP: 198.51.100.42)', severity: 'warning' },
    { id: '2', date: 'Hace 4 horas', msg: 'Webhook de PayPal recibido con éxito (TX: PAYID-MN345)', severity: 'info' },
    { id: '3', date: 'Ayer', msg: 'Reintento manual de orden exitoso (ID: AA-89234)', severity: 'success' },
  ];

  const getIncidentBadge = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0 mt-1" />;
      case 'success':
        return <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1" />;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1" />;
    }
  };

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
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Saludo y subtitulo */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#f5f5f0]">
            Consola Principal
          </h2>
          <p className="text-xs text-[var(--muted)] tracking-wider mt-1.5">
            Estado operativo general y métricas en tiempo real de Alpha Addiction.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Último deploy: 26/06/2026 15:45</span>
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

      {/* Sección intermedia: Integraciones & Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Estado Integraciones */}
        <div className="lg:col-span-5">
          <IntegrationsStatus services={services} />
        </div>

        {/* Columna Derecha: Bitácora de Alertas e Incidencias */}
        <div className="lg:col-span-7 bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Alertas y Bitácora de Seguridad
            </h2>
            <div className="space-y-4">
              {recentIncidents.map(inc => (
                <div key={inc.id} className="flex items-start gap-3.5 text-xs">
                  {getIncidentBadge(inc.severity)}
                  <div className="flex-1">
                    <p className="text-[#f5f5f0]/80 leading-relaxed font-medium">
                      {inc.msg}
                    </p>
                    <span className="text-[9px] text-[var(--muted)] block tracking-wider mt-0.5">
                      {inc.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 pt-4 mt-6">
            <Link
              href="/admin/logs"
              className="inline-flex items-center text-xs text-[var(--primary)] hover:underline"
            >
              Ver registro completo de auditoría <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
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
                {orders.slice(0, 5).map(order => (
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
