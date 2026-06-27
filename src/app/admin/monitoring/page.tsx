'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Database,
  Clock,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Globe,
  CloudLightning,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  ShoppingBag,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface SystemHealthData {
  status: 'green' | 'yellow' | 'red';
  timestamp: string;
  system: {
    nextVersion: string;
    environment: string;
    buildId: string;
  };
  database: {
    status: 'connected' | 'error';
    latencyMs: number;
    lastCheck: string;
  };
  printful: {
    status: 'connected' | 'error';
    lastSync: string;
    lastWebhook: string;
    lastOrder: string;
  };
  paypal: {
    status: 'configured' | 'pending_setup';
    mode: string;
    setupInfo: string;
  };
  envVariables: {
    DATABASE_URL: 'configured' | 'missing';
    PRINTFUL_API_KEY: 'configured' | 'missing';
    PRINTFUL_WEBHOOK_SECRET: 'configured' | 'missing';
    PAYPAL_CLIENT_ID: 'configured' | 'missing';
    PAYPAL_CLIENT_SECRET: 'configured' | 'missing';
    JWT_SECRET: 'configured' | 'missing';
    ADMIN_SESSION_SECRET: 'configured' | 'missing';
  };
  orders: {
    total: number;
    paid: number;
    pending: number;
    production: number;
    shipped: number;
    failed: number;
  };
  logs: Array<{
    id: string;
    action: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
  }>;
}

export default function HealthCenterPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/system/health');
      if (!response.ok) {
        throw new Error('El servidor devolvió un error de diagnóstico.');
      }
      const result = (await response.json()) as SystemHealthData;
      setData(result);
    } catch (err) {
      console.error('❌ Health status fetch error:', err);
      setError('No se pudo establecer conexión con el centro de monitorización del sistema.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Conectando Diagnósticos del Sistema...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Fallo de Conexión
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error || 'Error inesperado.'}
        </p>
        <button
          onClick={() => fetchHealth()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  const lastCheckDate = new Date(data.timestamp).toLocaleString('es-ES');

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Cabecera de Página */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Health Center & Diagnóstico
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Actualizado: {lastCheckDate}</span>
          </div>
          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de Estado General del E-Commerce */}
      <div className={`border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded ${
        data.status === 'green' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
        data.status === 'yellow' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
        'bg-red-500/5 border-red-500/20 text-red-400'
      }`}>
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold font-mono">Estado Visual Operativo</h3>
          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed max-w-2xl font-sans">
            {data.status === 'green' && '🟢 Todos los servicios críticos (Base de datos y API de Printful) están funcionando de forma correcta en producción.'}
            {data.status === 'yellow' && '🟡 Los servicios principales están en línea pero algunas pasarelas están en modo de pruebas (PayPal Sandbox).'}
            {data.status === 'red' && '🔴 Error crítico: Se ha perdido comunicación con la Base de Datos o la API de Printful. Revisa las credenciales de inmediato.'}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 border text-xs rounded font-bold uppercase tracking-wider ${
            data.status === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            data.status === 'yellow' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' :
            'bg-red-500/10 border-red-500/20 text-red-500 animate-bounce'
          }`}>
            {data.status === 'green' ? '🟢 Correcto' : data.status === 'yellow' ? '🟡 Advertencia' : '🔴 Error'}
          </span>
        </div>
      </div>

      {/* Grid de Estado Físico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Base de Datos */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">PostgreSQL (Neon)</span>
              <span className={`p-2 rounded ${data.database.status === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                <Database className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.database.status === 'connected' ? 'CONECTADA' : 'DESCONECTADA'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Latencia:</span>
                <span className="text-[#f5f5f0]">{data.database.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Último Test:</span>
                <span className="text-[#f5f5f0] truncate">{new Date(data.database.lastCheck).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Printful Sincronización */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">API Printful</span>
              <span className={`p-2 rounded ${data.printful.status === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.printful.status === 'connected' ? 'CONECTADO' : 'ERROR CONEXIÓN'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Última Sincronización:</span>
                <span className="text-[#f5f5f0]">{data.printful.lastSync}</span>
              </div>
              <div className="flex justify-between">
                <span>Último Webhook:</span>
                <span className="text-[#f5f5f0] truncate max-w-[120px]" title={data.printful.lastWebhook}>{data.printful.lastWebhook}</span>
              </div>
              <div className="flex justify-between">
                <span>Último Envío:</span>
                <span className="text-[#f5f5f0] truncate max-w-[120px]" title={data.printful.lastOrder}>{data.printful.lastOrder}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PayPal Checkout */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">PayPal Pasarela</span>
              <span className="bg-indigo-500/10 text-indigo-400 p-2 rounded">
                <Globe className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.paypal.status === 'configured' ? 'SANDBOX ACTIVO' : 'PENDIENTE'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Entorno PayPal:</span>
                <span className="text-indigo-400 uppercase font-bold">{data.paypal.mode}</span>
              </div>
              <p className="text-[9px] text-[var(--muted)] leading-relaxed mt-1">
                {data.paypal.setupInfo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Variables & Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Variables de Entorno */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm">
          <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
            Variables de Entorno
          </h2>
          <div className="space-y-2.5">
            {Object.entries(data.envVariables).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/5 font-mono text-[10px]">
                <span className="text-[#f5f5f0]/80 tracking-wider truncate mr-2" title={key}>
                  {key}
                </span>
                {val === 'configured' ? (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[8px] rounded font-bold uppercase tracking-wider">
                    ✔ Existe
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] rounded font-bold uppercase tracking-wider">
                    ❌ No existe
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Métricas de Pedidos e Info Sistema */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Métricas de Pedidos */}
          <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex-1">
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Métricas de Pedidos (OMS)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Total</span>
                <span className="text-xl font-bold text-[#f5f5f0]">{data.orders.total}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Pagados</span>
                <span className="text-xl font-bold text-green-400">{data.orders.paid}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Pendientes</span>
                <span className="text-xl font-bold text-yellow-500">{data.orders.pending}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">En fábrica</span>
                <span className="text-xl font-bold text-indigo-400">{data.orders.production}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Enviados</span>
                <span className="text-xl font-bold text-emerald-400">{data.orders.shipped}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Errores</span>
                <span className="text-xl font-bold text-red-500">{data.orders.failed}</span>
              </div>
            </div>
          </div>

          {/* Sistema */}
          <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Información de la Aplicación
            </h2>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Versión Next.js:</span>
                <span className="text-[#f5f5f0]">{data.system.nextVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Entorno:</span>
                <span className="text-indigo-400 uppercase font-bold">{data.system.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Git Commit SHA:</span>
                <span className="text-[#f5f5f0] truncate max-w-[150px]">{data.system.buildId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs de Auditoría Recientes */}
      <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
        <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[var(--primary)]" /> Historial de Accesos y Auditoría
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-[9px] tracking-wider text-[var(--muted)] uppercase font-bold">
                <th className="py-2.5">Acción</th>
                <th className="py-2.5">Detalles</th>
                <th className="py-2.5">IP Cliente</th>
                <th className="py-2.5 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--muted)]">
                    No se han registrado logs de auditoría todavía.
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-2.5 font-bold text-[#f5f5f0]">{log.action}</td>
                    <td className="py-2.5 text-[var(--muted)]">{log.details || '—'}</td>
                    <td className="py-2.5 text-[#f5f5f0]/80">{log.ipAddress || '—'}</td>
                    <td className="py-2.5 text-right text-[var(--muted)] text-[10px]">
                      {new Date(log.createdAt).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
