'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  CreditCard,
  Package,
  Activity,
  BarChart,
  Globe,
  Github,
  Cloud,
  ExternalLink,
  BookOpen,
  Settings,
  HelpCircle,
  AlertTriangle,
  AlertOctagon,
  FileText,
  TrendingUp
} from 'lucide-react';
import { formatDate } from '@/backend/notifications/email/helpers';

interface EmailLog {
  id: string;
  orderId: string | null;
  emailType: string;
  recipient: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  sentAt: string;
  order?: {
    orderNumber: string;
  } | null;
}

interface IntegrationStatus {
  name: string;
  key: string;
  status: 'operational' | 'warning' | 'error' | 'not_configured';
  lastChecked: string;
  mode: string;
  lastSync: string;
  lastError: string | null;
  lastWebhook: string | null;
  apiVersion: string | null;
  latencyMs: number | null;
  metadata: Record<string, any>;
  description: string;
  nextStep: string;
}

export default function IntegrationHubPage() {
  // Pestañas principales: Hub de Integraciones y Auditoría de Correo
  const [activeTab, setActiveTab] = useState<'hub' | 'emails'>('hub');

  // Estados de Integraciones
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'error' | 'warning' | 'not_configured'>('all');

  // Estados de Logs de Correo
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logError, setLogError] = useState<string | null>(null);
  const [emailSearchTerm, setEmailSearchTerm] = useState('');

  // Fetch Integraciones
  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    setIntegrationError(null);
    try {
      const res = await fetch('/api/admin/integrations/status');
      if (!res.ok) throw new Error('Error al consultar integraciones.');
      const data = await res.json();
      setIntegrations(data);
    } catch (err: any) {
      console.error(err);
      setIntegrationError('No se pudo obtener el estado de las integraciones externas.');
    } finally {
      setLoadingIntegrations(false);
    }
  };

  // Fetch Logs de Correo
  const fetchEmailLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogError(null);
    try {
      const res = await fetch('/api/admin/logs?type=email');
      if (!res.ok) throw new Error('Fallo al recuperar logs de comunicaciones.');
      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      setLogError('No se pudieron obtener los logs de correo.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  // Handler de reenvío de correo
  const handleResendClick = (logId: string) => {
    alert(`[MOCK] Acción Reenviar para el log ID: ${logId}. Funcionalidad preparada para fases futuras.`);
  };

  // Filtrado de Integraciones
  const filteredIntegrations = integrations.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.key.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  // Filtrado de Logs de Correo
  const filteredLogs = logs.filter(
    (log) =>
      log.recipient.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
      log.emailType.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
      (log.order?.orderNumber && log.order.orderNumber.toLowerCase().includes(emailSearchTerm.toLowerCase()))
  );

  // Iconos de Integraciones
  const getIntegrationIcon = (key: string) => {
    switch (key) {
      case 'paypal':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'printful':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'resend':
        return <Mail className="w-5 h-5 text-emerald-400" />;
      case 'neon':
        return <Database className="w-5 h-5 text-indigo-400" />;
      case 'sentry':
        return <Activity className="w-5 h-5 text-red-500" />;
      case 'google_analytics':
        return <BarChart className="w-5 h-5 text-orange-400" />;
      case 'google_search_console':
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case 'github':
        return <Github className="w-5 h-5 text-stone-300" />;
      case 'vercel':
        return <Cloud className="w-5 h-5 text-white" />;
      default:
        return <HelpCircle className="w-5 h-5 text-white/40" />;
    }
  };

  // Badge de Estado
  const getStatusBadge = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operativo
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Advertencia
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 text-white/40 border border-white/5 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> No Configurado
          </span>
        );
    }
  };

  // Enlaces de Dashboard Oficiales
  const getDashboardUrl = (key: string) => {
    switch (key) {
      case 'paypal': return 'https://developer.paypal.com/dashboard';
      case 'printful': return 'https://www.printful.com/dashboard';
      case 'resend': return 'https://resend.com/emails';
      case 'neon': return 'https://console.neon.tech';
      case 'sentry': return 'https://sentry.io';
      case 'google_analytics': return 'https://analytics.google.com';
      case 'google_search_console': return 'https://search.google.com/search-console';
      case 'github': return 'https://github.com';
      case 'vercel': return 'https://vercel.com';
      default: return '#';
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Consola del Administrador</span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wide mt-1">
            INTEGRATION HUB
          </h1>
        </div>

        <div className="flex bg-white/5 p-1 border border-white/5 rounded gap-1 text-[10px] uppercase font-bold tracking-wider">
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'hub' ? 'bg-[var(--primary)] text-black' : 'text-[#f5f5f0]/60 hover:text-white'
            }`}
          >
            Servicios Externos
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'emails' ? 'bg-[var(--primary)] text-black' : 'text-[#f5f5f0]/60 hover:text-white'
            }`}
          >
            Auditoría de Email
          </button>
        </div>
      </div>

      {activeTab === 'hub' ? (
        <div className="space-y-6">
          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Buscador */}
            <div className="md:col-span-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Buscar servicio o tecnología externa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 text-xs text-[#f5f5f0] pl-10 pr-4 py-2.5 outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* Selector de Estado */}
            <div className="md:col-span-4 flex items-center bg-[#121212] border border-white/10 px-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent border-0 outline-none text-xs text-[#f5f5f0] w-full py-2.5 cursor-pointer"
              >
                <option value="all">Todos los Estados</option>
                <option value="operational">🟢 Operativo</option>
                <option value="warning">🟡 Advertencias</option>
                <option value="error">🔴 Errores</option>
                <option value="not_configured">⚪ No configurados</option>
              </select>
            </div>
          </div>

          {/* Grid de Tarjetas */}
          {loadingIntegrations ? (
            <div className="py-24 text-center border border-white/5 bg-white/[0.01]">
              <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto mb-4" />
              <span className="text-xs text-[var(--muted)] uppercase tracking-wider">Verificando estado de conexiones API...</span>
            </div>
          ) : integrationError ? (
            <div className="p-6 border border-red-500/20 bg-red-950/10 text-center">
              <p className="text-red-400 text-xs font-bold uppercase">Error</p>
              <p className="text-[#f5f5f0] text-xs mt-1">{integrationError}</p>
            </div>
          ) : filteredIntegrations.length === 0 ? (
            <div className="py-16 text-center border border-white/5 text-[var(--muted)] text-xs uppercase">
              No se encontraron integraciones con los filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIntegrations.map((item) => (
                <div 
                  key={item.key}
                  className={`bg-[#121212] border border-white/10 p-5 flex flex-col justify-between transition-all duration-150 hover:border-white/20 relative ${
                    item.status === 'error' ? 'shadow-[0_0_15px_rgba(239,68,68,0.05)] border-red-500/20' : 
                    (item.status === 'warning' ? 'shadow-[0_0_15px_rgba(245,158,11,0.05)] border-yellow-500/20' : '')
                  }`}
                >
                  <div className="space-y-4">
                    {/* Fila Cabecera */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 bg-white/5 border border-white/5 rounded">
                          {getIntegrationIcon(item.key)}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-[#f5f5f0] uppercase tracking-wide">{item.name}</h3>
                          <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">{item.apiVersion || 'API N/A'}</span>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    <p className="text-[10px] text-[var(--muted)] leading-relaxed font-sans">
                      {item.description}
                    </p>

                    {/* Tabla de Parámetros */}
                    <div className="border-t border-white/5 pt-3.5 space-y-1.5 text-[9px] text-[var(--muted)] uppercase font-mono">
                      <div className="flex justify-between">
                        <span>Modo:</span>
                        <span className="text-[#f5f5f0]">{item.mode}</span>
                      </div>
                      {item.latencyMs !== null && (
                        <div className="flex justify-between">
                          <span>Latencia:</span>
                          <span className={item.latencyMs > 500 ? 'text-amber-400 font-bold' : 'text-green-400'}>
                            {item.latencyMs} ms
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Comprobación:</span>
                        <span className="text-[#f5f5f0]">{new Date(item.lastChecked).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      
                      {/* Webhook (si aplica) */}
                      {item.lastWebhook && (
                        <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5">
                          <span>Último webhook / Acción:</span>
                          <span className="text-[#f5f5f0] truncate lowercase font-sans max-w-xs block" title={item.lastWebhook}>
                            {item.lastWebhook}
                          </span>
                        </div>
                      )}

                      {/* Metadatos Dinámicos */}
                      {Object.keys(item.metadata).length > 0 && (
                        <div className="pt-2 border-t border-white/5 space-y-1">
                          {Object.entries(item.metadata).map(([mKey, mVal]) => (
                            <div key={mKey} className="flex justify-between text-[8px]">
                              <span className="capitalize">{mKey.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="text-[#f5f5f0] truncate max-w-[120px] font-sans" title={String(mVal)}>{String(mVal)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Último Error (si aplica) */}
                      {item.status === 'error' && item.lastError && (
                        <div className="p-2 border border-red-500/20 bg-red-950/10 text-red-400 lowercase font-sans text-[8px] max-h-16 overflow-y-auto block whitespace-pre-wrap rounded">
                          <strong>error:</strong> {item.lastError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="border-t border-white/5 mt-4 pt-3.5 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider">
                    {item.status !== 'not_configured' && (
                      <a
                        href={getDashboardUrl(item.key)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1.5 border border-white/10 hover:border-white/20 text-[#f5f5f0] hover:bg-white/5 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Dashboard</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <Link
                      href="/admin/monitoring"
                      className="px-2 py-1.5 border border-white/10 hover:border-white/20 text-[#f5f5f0] hover:bg-white/5 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Diagnóstico</span>
                      <TrendingUp className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sección de Recomendación e Integración Complementaria con Health Center */}
          <div className="p-4 border border-white/5 bg-white/[0.01] text-[10px] text-[var(--muted)] flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans leading-relaxed">
            <div>
              <p>📌 <strong>Nota sobre Monitorización:</strong> El <em>Integration Hub</em> supervisa la conexión y validez de las APIs de terceros.</p>
              <p className="mt-0.5">Para analizar el rendimiento, la base de datos local y los recursos de cómputo del servidor de NextJS, visita el <Link href="/admin/monitoring" className="text-[var(--primary)] hover:underline font-mono">HEALTH CENTER</Link>.</p>
            </div>
            <Link
              href="/admin/monitoring"
              className="h-8 px-4 border border-white/10 hover:border-white/20 text-[#f5f5f0] font-mono text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 bg-white/[0.02] shrink-0 cursor-pointer"
            >
              <span>Ir a Health Center</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Buscador Logs */}
          <div className="flex gap-4 items-center bg-[#121212] border border-white/5 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Buscar por destinatario, asunto, tipo de email o número de pedido..."
                value={emailSearchTerm}
                onChange={(e) => setEmailSearchTerm(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-xs text-[#f5f5f0] pl-10 pr-4 py-2.5 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button
              onClick={fetchEmailLogs}
              disabled={loadingLogs}
              className="p-2 border border-white/10 hover:border-white/20 text-[#f5f5f0] flex items-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider bg-white/[0.02] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              {loadingLogs ? 'Cargando...' : 'Sincronizar'}
            </button>
          </div>

          {/* Tabla de Logs */}
          {logError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-xs font-mono">
              ⚠️ {logError}
            </div>
          )}

          <div className="bg-[#121212] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[var(--muted)] uppercase tracking-wider font-mono text-[10px]">
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Pedido</th>
                    <th className="p-4 font-semibold">Tipo de Email</th>
                    <th className="p-4 font-semibold">Destinatario</th>
                    <th className="p-4 font-semibold">Asunto</th>
                    <th className="p-4 font-semibold text-center">Estado</th>
                    <th className="p-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--muted)] font-mono">
                        <Clock className="w-5 h-5 mx-auto animate-pulse mb-2 text-[var(--primary)]" />
                        Cargando historial de comunicaciones...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--muted)] font-mono">
                        No se encontraron registros de envío.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-mono text-[10px] text-[var(--muted)]">
                          {formatDate(log.sentAt)}
                        </td>
                        <td className="p-4 font-bold font-mono">
                          {log.order ? (
                            <Link href={`/admin/orders`} className="flex items-center gap-1 hover:underline">
                              #{log.order.orderNumber}
                              <ArrowRight className="w-3 h-3 text-[var(--primary)]" />
                            </Link>
                          ) : (
                            <span className="text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[10px]">
                          <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-semibold text-[#f5f5f0]">
                            {log.emailType}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-[#f5f5f0]">{log.recipient}</td>
                        <td className="p-4 text-[var(--muted)] max-w-xs truncate" title={log.subject}>
                          {log.subject}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.status === 'success' ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Enviado
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Fallido
                              </>
                            )}
                          </span>
                          {log.errorMessage && (
                            <span className="block text-[9px] text-red-400 font-mono mt-1 max-w-[150px] truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleResendClick(log.id)}
                            className="px-2.5 py-1.5 border border-white/10 hover:border-[var(--primary)] hover:text-black hover:bg-[var(--primary)] text-[#f5f5f0] text-[10px] font-bold uppercase tracking-wider transition-all bg-white/[0.02] cursor-pointer"
                          >
                            Reenviar
                          </button>
                        </td>
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
  );
}
