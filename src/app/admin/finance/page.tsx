'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Percent,
  RefreshCw,
  ShoppingBag,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { Order } from '@/shared/types/order';
import { formatPrice } from '@/shared/utils/utils';

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Error al cargar pedidos para balances.');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Fallo al recuperar balances del OMS.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Filtrar pedidos que se hayan pagado de forma efectiva
  const paidOrders = orders.filter(
    (o) => o.paymentStatus === 'paid' || o.status === 'paid' || o.status === 'shipped'
  );

  // Totales financieros consolidados
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalCost = paidOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const totalShipping = paidOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const totalProdCost = Math.max(0, totalCost - totalShipping);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Pedidos pendientes
  const pendingOrdersCount = orders.filter(
    (o) => o.paymentStatus === 'pending'
  ).length;
  const pendingRevenue = orders
    .filter((o) => o.paymentStatus === 'pending')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Balances y Rentabilidad
          </h1>
        </div>

        <button
          onClick={fetchFinanceData}
          className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar Balances</span>
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase">Analizando balances contables...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs rounded text-center font-mono">
          {error}
        </div>
      ) : (
        <>
          {/* Tarjetas de Estadísticas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tarjeta 1: Ingresos Brutos */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] tracking-wider text-[var(--muted)] uppercase font-semibold">Ingresos Brutos</span>
                <div className="p-1.5 bg-green-500/10 text-green-400 rounded">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold font-mono text-[#f5f5f0]">
                  {formatPrice(totalRevenue)}
                </h3>
                <p className="text-[10px] text-[var(--muted)] mt-1 tracking-wide font-sans">
                  Total acumulado en pedidos pagados
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Costes de Producción */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] tracking-wider text-[var(--muted)] uppercase font-semibold">Costes Proveedor</span>
                <div className="p-1.5 bg-red-500/10 text-red-400 rounded">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold font-mono text-[#f5f5f0]">
                  {formatPrice(totalCost)}
                </h3>
                <p className="text-[10px] text-[var(--muted)] mt-1 tracking-wide font-sans">
                  Prendas: {formatPrice(totalProdCost)} · Envío: {formatPrice(totalShipping)}
                </p>
              </div>
            </div>

            {/* Tarjeta 3: Beneficio Neto */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)]/5 rounded-full filter blur-xl group-hover:bg-[var(--primary)]/10 transition-colors duration-500" />
              <div className="flex justify-between items-start z-10">
                <span className="text-[10px] tracking-wider text-[var(--muted)] uppercase font-semibold">Beneficio Neto</span>
                <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 z-10">
                <h3 className="text-2xl font-bold font-mono text-[var(--primary)]">
                  {formatPrice(totalProfit)}
                </h3>
                <p className="text-[10px] text-[var(--muted)] mt-1 tracking-wide font-sans">
                  Margen bruto libre disponible
                </p>
              </div>
            </div>

            {/* Tarjeta 4: Margen de Beneficio */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] tracking-wider text-[var(--muted)] uppercase font-semibold">Margen Comercial Medio</span>
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold font-mono text-blue-400">
                  {avgMargin.toFixed(1)}%
                </h3>
                <p className="text-[10px] text-[var(--muted)] mt-1 tracking-wide font-sans">
                  Rentabilidad media por venta
                </p>
              </div>
            </div>
          </div>

          {/* Secciones Secundarias: Gráfico/Lista y Pedidos Pendientes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Desglose de Transacciones */}
            <div className="lg:col-span-8 bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-6">
                Rentabilidad por Transacción
              </h3>
              {paidOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-[var(--muted)]">
                  <p className="text-xs italic">No hay transacciones pagadas para analizar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="pb-4">ID Pedido</th>
                        <th className="pb-4">Cliente</th>
                        <th className="pb-4 text-right">Venta</th>
                        <th className="pb-4 text-right">Fab. Prendas</th>
                        <th className="pb-4 text-right">Envío Printful</th>
                        <th className="pb-4 text-right text-[var(--primary)]">Beneficio Neto</th>
                        <th className="pb-4 text-right">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {paidOrders.map((order) => {
                        const cost = order.totalCost || 0;
                        const shipCost = order.shippingCost || 0;
                        const prodCost = Math.max(0, cost - shipCost);
                        const profit = order.totalPrice - cost;
                        const margin = order.totalPrice > 0 ? (profit / order.totalPrice) * 100 : 0;
                        return (
                          <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-3.5 font-bold text-[#f5f5f0]">{order.orderNumber || order.id}</td>
                            <td className="py-3.5 font-sans text-[#f5f5f0]/80">
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                            </td>
                            <td className="py-3.5 text-right font-bold text-[#f5f5f0]">{formatPrice(order.totalPrice)}</td>
                            <td className="py-3.5 text-right text-[var(--muted)]">{formatPrice(prodCost)}</td>
                            <td className="py-3.5 text-right text-[var(--muted)]/80">{formatPrice(shipCost)}</td>
                            <td className="py-3.5 text-right text-[var(--primary)] font-bold">{formatPrice(profit)}</td>
                            <td className="py-3.5 text-right text-blue-400 font-semibold">{margin.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Previsiones de Pedidos Pendientes */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
                <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-6">
                  Previsión en Espera
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[var(--muted)] block uppercase tracking-wide">Pedidos en Cola</span>
                      <span className="text-xl font-bold font-mono text-[#f5f5f0]">{pendingOrdersCount}</span>
                    </div>
                    <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-full">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div>
                      <span className="text-[10px] text-[var(--muted)] block uppercase tracking-wide">Importe Pendiente</span>
                      <span className="text-xl font-bold font-mono text-[#f5f5f0]">{formatPrice(pendingRevenue)}</span>
                    </div>
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-full">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-[10px] text-[var(--muted)] leading-relaxed tracking-wide pt-2 border-t border-white/5">
                    Estas cantidades corresponden a carritos con checkout iniciado pero cuyo pago no ha sido confirmado aún por PayPal.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
