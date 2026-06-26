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
} from 'lucide-react';

interface MonitoringData {
  status: {
    web: string;
    api: string;
    database: string;
  };
  latencyMs: number;
  timestamp: string;
  environment: string;
  envVariables: {
    DATABASE_URL: string;
    PAYPAL_CLIENT_ID: string;
    PAYPAL_CLIENT_SECRET: string;
    PRINTFUL_API_TOKEN: string;
    PRINTFUL_STORE_ID: string;
    SMTP_USER: string;
  };
  deployment: {
    ssl: string;
    domain: string;
    vercel: string;
  };
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/monitoring/status');
      if (!response.ok) {
        throw new Error('No se pudo comunicar con el módulo de diagnóstico.');
      }
      const result = (await response.json()) as MonitoringData;
      setData(result);
    } catch (err) {
      console.error('❌ Monitoring status fetch error:', err);
      setError('Error de comunicación con el servicio de monitorización.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Conectando Diagnósticos...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Fallo de Conexión
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error || 'Error inesperado.'}
        </p>
        <button
          onClick={() => fetchStatus()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  const lastCheckDate = new Date(data.timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Cabecera de Página */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Monitorización de Sistemas
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Última revisión: {lastCheckDate}</span>
          </div>
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Grid de Estado Físico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Web Status */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Servidor Web</span>
            <span className="bg-green-500/10 text-green-400 p-2 rounded">
              <Globe className="w-4 h-4 animate-pulse" />
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">ONLINE</h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">Servidor operativo sin incidencias</p>
        </div>

        {/* API Status */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Gateway API</span>
            <span className="bg-green-500/10 text-green-400 p-2 rounded">
              <Server className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">ONLINE</h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">Rutas operativas para pasarelas</p>
        </div>

        {/* Database Status */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Base de Datos</span>
            <span className={`p-2 rounded ${data.status.database === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
              <Database className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f5f5f0] truncate uppercase">
            {data.status.database === 'connected' ? 'CONECTADA' : 'PENDIENTE'}
          </h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">
            {data.status.database === 'connected' ? 'Conexión PostgreSQL exitosa' : 'Modo fallback en memoria activo'}
          </p>
        </div>

        {/* Latency / Response Time */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Tiempo Respuesta</span>
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] p-2 rounded">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{data.latencyMs} ms</h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">Latencia promedio de consulta interna</p>
        </div>
      </div>

      {/* Fila central: Parámetros del Entorno & Despliegue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Variables de Entorno */}
        <div className="lg:col-span-7 bg-[#121212] border border-white/5 p-6 shadow-sm">
          <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
            Variables de Entorno Clave
          </h2>
          <div className="space-y-3.5">
            {Object.entries(data.envVariables).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 font-mono text-[11px]">
                <span className="text-[#f5f5f0]/80 tracking-wider truncate mr-2" title={key}>
                  {key}
                </span>
                {val === 'configured' ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] rounded font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-green-400" /> Configurada
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

        {/* Columna Derecha: Configuración Cloud & SSL */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Entorno e Info de compilación */}
          <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Entorno del Sistema
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-[var(--muted)] tracking-wider">Entorno de Ejecución</span>
                <span className="font-mono font-bold text-[#f5f5f0] uppercase bg-white/5 px-2 py-0.5 rounded text-[10px]">
                  {data.environment}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-[var(--muted)] tracking-wider">Compilación de Producción</span>
                <span className="font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                  Estable / Optimizada
                </span>
              </div>
            </div>
          </div>

          {/* Configuración Cloud */}
          <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex-1">
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Despliegue y Dominios
            </h2>
            <div className="space-y-4">
              {/* SSL */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--muted)]" />
                  <span className="text-[var(--muted)] tracking-wider">Certificado SSL</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${data.deployment.ssl === 'configured' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'}`}>
                  {data.deployment.ssl === 'configured' ? 'Configurado' : 'Pendiente'}
                </span>
              </div>

              {/* Dominio */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[var(--muted)]" />
                  <span className="text-[var(--muted)] tracking-wider">Dominio DNS</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${data.deployment.domain === 'configured' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'}`}>
                  {data.deployment.domain === 'configured' ? 'Configurado' : 'Pendiente'}
                </span>
              </div>

              {/* Vercel */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CloudLightning className="w-4 h-4 text-[var(--muted)]" />
                  <span className="text-[var(--muted)] tracking-wider">Infraestructura Vercel</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${data.deployment.vercel === 'configured' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'}`}>
                  {data.deployment.vercel === 'configured' ? 'Configurado' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
