'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, ShoppingCart, Tag, Package, Users, Award, 
  AlertCircle, Calendar, DollarSign, Activity, RefreshCw, Hash 
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface DropItem {
  id: string;
  name: string;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<string>('all');
  const [dropId, setDropId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('general');
  const [dropsList, setDropsList] = useState<DropItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de datos
  const [advancedData, setAdvancedData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [dropsData, setDropsData] = useState<any>(null);
  const [discountsData, setDiscountsData] = useState<any>(null);
  const [fulfillmentData, setFulfillmentData] = useState<any>(null);

  // Obtener lista de drops al montar
  useEffect(() => {
    const loadDrops = async () => {
      try {
        const res = await fetch('/api/drops');
        if (res.ok) {
          const data = await res.json();
          setDropsList(data);
        }
      } catch (e) {
        console.error('Error al cargar lista de drops:', e);
      }
    };
    loadDrops();
  }, []);

  // Función para cargar todas las analíticas
  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (range) params.append('range', range);
      if (dropId) params.append('dropId', dropId);

      const queryStr = params.toString();

      const [advRes, prodRes, dropRes, discRes, fulfRes] = await Promise.all([
        fetch(`/api/admin/analytics/advanced?${queryStr}`),
        fetch(`/api/admin/analytics/products?${queryStr}`),
        fetch(`/api/admin/analytics/drops?${queryStr}`),
        fetch(`/api/admin/analytics/discounts?${queryStr}`),
        fetch(`/api/admin/analytics/fulfillment?${queryStr}`)
      ]);

      if (!advRes.ok || !prodRes.ok || !dropRes.ok || !discRes.ok || !fulfRes.ok) {
        throw new Error('Fallo al obtener algunos módulos de métricas de Neon.');
      }

      const [adv, prod, drp, dsc, flf] = await Promise.all([
        advRes.json(),
        prodRes.json(),
        dropRes.json(),
        discRes.json(),
        fulfRes.json()
      ]);

      setAdvancedData(adv.stats);
      setProductsData(prod);
      setDropsData(drp);
      setDiscountsData(dsc);
      setFulfillmentData(flf);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con la base de datos de Neon.');
    } finally {
      setLoading(false);
    }
  }, [range, dropId]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Métricas y Rendimiento
          </h1>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Rango de Fecha */}
          <div className="flex items-center bg-[#121212] border border-white/5 px-3 py-2 text-xs font-mono text-[#f5f5f0]">
            <Calendar className="w-3.5 h-3.5 mr-2 text-[var(--primary)]" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent outline-none border-none cursor-pointer pr-4"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="this_month">Este mes</option>
            </select>
          </div>

          {/* Selector de Drop */}
          <div className="flex items-center bg-[#121212] border border-white/5 px-3 py-2 text-xs font-mono text-[#f5f5f0]">
            <Package className="w-3.5 h-3.5 mr-2 text-[var(--primary)]" />
            <select
              value={dropId}
              onChange={(e) => setDropId(e.target.value)}
              className="bg-transparent outline-none border-none cursor-pointer pr-4"
            >
              <option value="">Todos los Drops</option>
              {dropsList.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={fetchAllAnalytics}
            className="p-2 border border-white/5 bg-[#121212] hover:border-white/20 text-[var(--primary)] transition-all cursor-pointer"
            title="Refrescar Analíticas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs rounded text-center font-mono flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 text-xs font-mono">
        {[
          { id: 'general', label: 'Métricas Generales', icon: TrendingUp },
          { id: 'products', label: 'Productos', icon: ShoppingCart },
          { id: 'drops', label: 'Colecciones (Drops)', icon: Users },
          { id: 'discounts', label: 'Cupones', icon: Tag },
          { id: 'fulfillment', label: 'Logística', icon: Activity }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === t.id 
                  ? 'border-[var(--primary)] text-[var(--primary)] bg-white/[0.01]' 
                  : 'border-transparent text-[var(--muted)] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contenido de Carga */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-[#121212] border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase font-mono">
            Procesando métricas complejas en Neon...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && advancedData && (
            <div className="space-y-6">
              {/* Grid Métricas Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)]">Ingresos Brutos</span>
                  <div className="text-2xl font-serif font-bold text-[#f5f5f0]">{formatPrice(advancedData.ingresosBrutos)}</div>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)]">Beneficio Neto Est.</span>
                  <div className="text-2xl font-serif font-bold text-emerald-400">{formatPrice(advancedData.beneficioNeto)}</div>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)]">Ticket Medio (Paid)</span>
                  <div className="text-2xl font-serif font-bold text-[#f5f5f0]">{formatPrice(advancedData.ticketMedio)}</div>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)]">Prendas Vendidas</span>
                  <div className="text-2xl font-serif font-bold text-[var(--primary)]">{advancedData.productosVendidos} u.</div>
                </div>
              </div>

              {/* Pedidos Desglosados */}
              <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
                  Desglose de Pedidos Recibidos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
                  <div className="bg-black/20 p-4 border border-white/5">
                    <span className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">Pedidos Totales</span>
                    <span className="text-xl font-bold text-[#f5f5f0]">{advancedData.pedidosTotales}</span>
                  </div>
                  <div className="bg-emerald-500/5 p-4 border border-emerald-500/10">
                    <span className="block text-[10px] text-emerald-400/80 uppercase tracking-wider mb-1">Pedidos Pagados</span>
                    <span className="text-xl font-bold text-emerald-400">{advancedData.pedidosPagados}</span>
                  </div>
                  <div className="bg-red-500/5 p-4 border border-red-500/10">
                    <span className="block text-[10px] text-red-400/80 uppercase tracking-wider mb-1">Pedidos Cancelados</span>
                    <span className="text-xl font-bold text-red-400">{advancedData.pedidosCancelados}</span>
                  </div>
                  <div className="bg-yellow-500/5 p-4 border border-yellow-500/10">
                    <span className="block text-[10px] text-yellow-400/80 uppercase tracking-wider mb-1">Pedidos Reembolsados</span>
                    <span className="text-xl font-bold text-yellow-400">{advancedData.pedidosReembolsados}</span>
                  </div>
                </div>
              </div>

              {/* Uso de Descuentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Ahorro Total por Cupones</span>
                  <div className="text-xl font-serif font-bold text-yellow-400">-{formatPrice(advancedData.descuentoTotal)}</div>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-1">Importe total descontado en pedidos pagados.</p>
                </div>
                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Tasa de Uso de Cupones</span>
                  <div className="text-xl font-serif font-bold text-[#f5f5f0]">{advancedData.tasaUsoCupones.toFixed(1)}%</div>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-1">Porcentaje de transacciones pagadas que aplicaron cupón.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTOS */}
          {activeTab === 'products' && productsData && (
            <div className="space-y-6">
              {/* Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121212] border border-white/5 p-6 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Prenda Estrella</span>
                  <div className="text-lg font-serif font-bold text-[var(--primary)] uppercase tracking-wider truncate">
                    {productsData.productoMasVendido ? productsData.productoMasVendido.name : 'Ninguna'}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {productsData.productoMasVendido ? `${productsData.productoMasVendido.quantitySold} unidades vendidas` : '0 ventas'}
                  </span>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Talla Más Vendida</span>
                  <div className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
                    {productsData.tallaMasVendida ? productsData.tallaMasVendida.size : 'Ninguna'}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {productsData.tallaMasVendida ? `${productsData.tallaMasVendida.quantitySold} unidades` : '0 ventas'}
                  </span>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Color Favorito</span>
                  <div className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
                    {productsData.colorMasVendido ? productsData.colorMasVendido.color : 'Ninguno'}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {productsData.colorMasVendido ? `${productsData.colorMasVendido.quantitySold} unidades` : '0 ventas'}
                  </span>
                </div>
              </div>

              {/* Ranking de Productos */}
              <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">Ranking de Ventas por Prenda</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="py-3">Prenda</th>
                        <th className="py-3 text-right">Cantidad</th>
                        <th className="py-3 text-right">Pedidos</th>
                        <th className="py-3 text-right">Ingresos Brutos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {productsData.rankings.products.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[var(--muted)] italic">
                            No se registran ventas para este filtro.
                          </td>
                        </tr>
                      ) : (
                        productsData.rankings.products.map((p: any) => (
                          <tr key={p.id} className="hover:bg-white/[0.01]">
                            <td className="py-3 font-sans font-semibold text-[#f5f5f0]">{p.name}</td>
                            <td className="py-3 text-right">{p.quantitySold} u.</td>
                            <td className="py-3 text-right">{p.ordersCount}</td>
                            <td className="py-3 text-right text-[var(--primary)] font-bold">{formatPrice(p.revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rankings Grid (Tallas y Colores) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">Demanda de Tallas</h3>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="py-3">Talla</th>
                        <th className="py-3 text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {productsData.rankings.sizes.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-[var(--muted)] italic">Sin datos.</td>
                        </tr>
                      ) : (
                        productsData.rankings.sizes.map((s: any) => (
                          <tr key={s.size}>
                            <td className="py-3 font-semibold text-[#f5f5f0]">{s.size}</td>
                            <td className="py-3 text-right">{s.quantitySold} u.</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">Demanda de Colores</h3>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="py-3">Color</th>
                        <th className="py-3 text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {productsData.rankings.colors.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-[var(--muted)] italic">Sin datos.</td>
                        </tr>
                      ) : (
                        productsData.rankings.colors.map((c: any) => (
                          <tr key={c.color}>
                            <td className="py-3 font-sans font-semibold text-[#f5f5f0]">{c.color}</td>
                            <td className="py-3 text-right">{c.quantitySold} u.</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DROPS */}
          {activeTab === 'drops' && dropsData && (
            <div className="space-y-6">
              {/* Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121212] border border-white/5 p-6 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Drop Más Exitoso</span>
                  <div className="text-lg font-serif font-bold text-[var(--primary)] uppercase tracking-wider truncate">
                    {dropsData.dropMasVendido ? dropsData.dropMasVendido.name : 'Ninguno'}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {dropsData.dropMasVendido ? `${formatPrice(dropsData.dropMasVendido.revenue)} en ventas` : '0 €'}
                  </span>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Mayor Interés (Waitlist)</span>
                  <div className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider truncate">
                    {dropsData.dropMasWaitlist ? dropsData.dropMasWaitlist.name : 'Ninguno'}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {dropsData.dropMasWaitlist ? `${dropsData.dropMasWaitlist.waitlistCount} registrados` : '0 registrados'}
                  </span>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Conversión Waitlist → Venta</span>
                  <div className="text-lg font-serif font-bold text-emerald-400">
                    {dropsData.avgConversionRate.toFixed(1)}%
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    Promedio global entre todos los Drops.
                  </span>
                </div>
              </div>

              {/* Ranking de Drops */}
              <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">Rendimiento por Drop / Lanzamiento</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="py-3">Drop / Colección</th>
                        <th className="py-3 text-right">Waitlist</th>
                        <th className="py-3 text-right">Unidades Vendidas</th>
                        <th className="py-3 text-right">Pedidos</th>
                        <th className="py-3 text-right">Tasa Conversión</th>
                        <th className="py-3 text-right">Ventas Totales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {dropsData.rankings.drops.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[var(--muted)] italic">
                            No se registran datos para este filtro.
                          </td>
                        </tr>
                      ) : (
                        dropsData.rankings.drops.map((d: any) => (
                          <tr key={d.id} className="hover:bg-white/[0.01]">
                            <td className="py-3 font-sans font-semibold text-[#f5f5f0]">{d.name}</td>
                            <td className="py-3 text-right">{d.waitlistCount}</td>
                            <td className="py-3 text-right">{d.quantitySold} u.</td>
                            <td className="py-3 text-right">{d.salesCount}</td>
                            <td className="py-3 text-right text-emerald-400 font-semibold">{d.conversionRate.toFixed(1)}%</td>
                            <td className="py-3 text-right text-[var(--primary)] font-bold">{formatPrice(d.revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUPONES */}
          {activeTab === 'discounts' && discountsData && (
            <div className="space-y-6">
              {/* Highlights */}
              <div className="bg-[#121212] border border-white/5 p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Cupón Más Usado</span>
                  <div className="text-xl font-serif font-bold text-[var(--primary)] uppercase tracking-wider mt-1">
                    {discountsData.cuponMasUsado ? discountsData.cuponMasUsado.code : 'Ninguno'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="block text-2xl font-bold text-[#f5f5f0]">
                    {discountsData.cuponMasUsado ? discountsData.cuponMasUsado.uses : 0} usos
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">en transacciones completadas</span>
                </div>
              </div>

              {/* Ranking de Cupones */}
              <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">Uso e Impacto de Cupones</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="py-3">Código de Cupón</th>
                        <th className="py-3 text-right">Veces Redimido</th>
                        <th className="py-3 text-right">Descuento Total</th>
                        <th className="py-3 text-right">Volumen Ventas (Bruto)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {discountsData.rankings.coupons.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[var(--muted)] italic">
                            No se registra uso de cupones para este filtro.
                          </td>
                        </tr>
                      ) : (
                        discountsData.rankings.coupons.map((c: any) => (
                          <tr key={c.code} className="hover:bg-white/[0.01]">
                            <td className="py-3 font-semibold text-[#f5f5f0]">{c.code}</td>
                            <td className="py-3 text-right">{c.uses}</td>
                            <td className="py-3 text-right text-red-400">-{formatPrice(c.totalDiscount)}</td>
                            <td className="py-3 text-right text-[var(--primary)] font-bold">{formatPrice(c.totalRevenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOGÍSTICA */}
          {activeTab === 'fulfillment' && fulfillmentData && (
            <div className="space-y-6">
              {/* Tarjetas Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Enviados a Printful</span>
                  <div className="text-2xl font-serif font-bold text-[#f5f5f0]">{fulfillmentData.stats.pedidosEnviadosPrintful}</div>
                  <p className="text-[10px] text-[var(--muted)] font-mono">Pedidos con Order ID de Printful asignado.</p>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">En Producción</span>
                  <div className="text-2xl font-serif font-bold text-yellow-400">{fulfillmentData.stats.pedidosEnProduccion}</div>
                  <p className="text-[10px] text-[var(--muted)] font-mono">Pendientes de finalizar la fabricación.</p>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Despachados / Enviados</span>
                  <div className="text-2xl font-serif font-bold text-emerald-400">{fulfillmentData.stats.pedidosEnviados}</div>
                  <p className="text-[10px] text-[var(--muted)] font-mono">Con código de seguimiento tracking.</p>
                </div>

                <div className="bg-[#121212] border border-white/5 p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">Fallas de Enlace</span>
                  <div className="text-2xl font-serif font-bold text-red-500">{fulfillmentData.stats.pedidosConError}</div>
                  <p className="text-[10px] text-[var(--muted)] font-mono">Pedidos que fallaron al enviarse a Printful.</p>
                </div>
              </div>

              {/* Estados de pedidos */}
              <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">Tabla de Estados de Pedido</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                        <th className="py-3">Estado de Pedido</th>
                        <th className="py-3 text-right">Cantidad de Pedidos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {fulfillmentData.estadosResumen.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-[var(--muted)] italic">Sin transacciones registradas.</td>
                        </tr>
                      ) : (
                        fulfillmentData.estadosResumen.map((est: any) => (
                          <tr key={est.status}>
                            <td className="py-3 font-semibold text-[#f5f5f0]">{est.status}</td>
                            <td className="py-3 text-right">{est.count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
