'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Terminal,
  Activity,
  Database,
  Mail,
  KeyRound,
  CloudLightning,
} from 'lucide-react';

interface EnvVarStatus {
  key: string;
  exists: boolean;
  isEmpty: boolean;
  isCritical: boolean;
  isServerOnly: boolean;
  description: string;
}

interface IntegrationStatus {
  name: string;
  key: string;
  status: 'configured' | 'pending' | 'error';
  requiredVars: EnvVarStatus[];
  lastChecked: string;
  description: string;
  nextStep: string;
}

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntegrations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/integrations/status');
      if (!response.ok) {
        throw new Error('Error al conectar con el servidor de diagnóstico de integraciones.');
      }
      const data = (await response.json()) as IntegrationStatus[];
      setIntegrations(data);
    } catch (err) {
      console.error('❌ Error fetching integrations:', err);
      setError('No se pudo establecer conexión con el panel de control de integraciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const getIntegrationIcon = (key: string) => {
    switch (key) {
      case 'database':
        return <Database className="w-5 h-5 text-blue-400" />;
      case 'paypal':
        return <KeyRound className="w-5 h-5 text-[var(--primary)]" />;
      case 'printful':
        return <Activity className="w-5 h-5 text-purple-400" />;
      case 'smtp':
        return <Mail className="w-5 h-5 text-orange-400" />;
      case 'vercel':
        return <CloudLightning className="w-5 h-5 text-pink-400" />;
      default:
        return <Settings className="w-5 h-5 text-[var(--muted)]" />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'configured':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configurado
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] rounded font-bold uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Pendiente
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] rounded font-bold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" /> Error Conexión
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Evaluando Integraciones...
        </p>
      </div>
    );
  }

  if (error || integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Fallo de Lectura
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error || 'No se han encontrado integraciones registradas.'}
        </p>
        <button
          onClick={() => fetchIntegrations()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
        >
          Reintentar Comprobación
        </button>
      </div>
    );
  }

  // Get date of verification
  const lastCheckDate = new Date(integrations[0]?.lastChecked || '').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Configuración del Panel
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Módulos e Integraciones
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Último análisis: {lastCheckDate}</span>
          </div>
          <button
            onClick={() => fetchIntegrations(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Reevaluar</span>
          </button>
        </div>
      </div>

      {/* Lista de Integraciones */}
      <div className="space-y-8">
        {integrations.map(integration => (
          <div
            key={integration.key}
            className="bg-[#121212] border border-white/5 p-6 md:p-8 shadow-sm flex flex-col gap-6"
          >
            {/* Fila Superior: Nombre, Icono e Indicador de Estado */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3.5">
                <span className="bg-white/5 p-2 rounded block">
                  {getIntegrationIcon(integration.key)}
                </span>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#f5f5f0] tracking-wider uppercase">
                    {integration.name}
                  </h3>
                  <p className="text-[10px] text-[var(--muted)] tracking-wider mt-0.5 max-w-xl leading-relaxed">
                    {integration.description}
                  </p>
                </div>
              </div>
              <div className="self-start sm:self-center">
                {getStatusBadge(integration.status)}
              </div>
            </div>

            {/* Fila Central: Listado de variables requeridas */}
            <div>
              <h4 className="text-[9px] tracking-widest uppercase text-[var(--muted)] font-semibold mb-3">
                Variables de Entorno Requeridas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integration.requiredVars.map(v => (
                  <div
                    key={v.key}
                    className="bg-white/[0.01] border border-white/5 p-3.5 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-[10px] text-[#f5f5f0]/80 tracking-wider truncate" title={v.key}>
                        {v.key}
                      </span>
                      {v.exists ? (
                        <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] rounded font-bold uppercase font-mono">
                          Activo
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] rounded font-bold uppercase font-mono">
                          Vacío
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-[var(--muted)] tracking-wide leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fila Inferior: Próximo Paso Recomendado */}
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded flex items-start gap-3">
              <span className="bg-[var(--primary)]/10 text-[var(--primary)] p-1.5 rounded flex-shrink-0 mt-0.5">
                <Terminal className="w-3.5 h-3.5" />
              </span>
              <div className="text-xs">
                <h5 className="font-semibold text-[#f5f5f0] tracking-wide">Próximo paso operativo recomendado:</h5>
                <p className="text-[10px] text-[var(--muted)] tracking-wider mt-1 leading-relaxed">
                  {integration.nextStep}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
