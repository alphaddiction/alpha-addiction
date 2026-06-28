'use client';

import { useState, useEffect } from 'react';
import { 
  Cpu, Play, CheckCircle2, XCircle, Settings2, RefreshCw, 
  Activity, AlertTriangle, Clock, Server, FileText, Check 
} from 'lucide-react';

interface EventInfo {
  name: string;
  description: string;
}

interface AutomationStats {
  totalRuns: number;
  errorCount: number;
  lastEvent: {
    eventType: string;
    status: string;
    createdAt: string;
    message?: string;
    error?: string;
  } | null;
  pendingEvents: number;
  avgDurationMs: number;
  activeAutomationsCount: number;
}

interface LogEntry {
  id: string;
  eventType: string;
  status: 'SUCCESS' | 'FAILED';
  message?: string | null;
  durationMs: number;
  error?: string | null;
  createdAt: string;
}

export default function AdminAutomationsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [runningScheduler, setRunningScheduler] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del motor
  const [events, setEvents] = useState<Record<string, EventInfo>>({});
  const [settings, setSettings] = useState<Record<string, string>>({
    enable_automations: 'true',
    auto_submit_to_printful: 'false',
    enable_automatic_emails: 'true',
    auto_open_drops: 'true',
    auto_close_drops: 'true',
  });
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, historyRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/events/history')
      ]);

      if (!configRes.ok || !historyRes.ok) {
        throw new Error('Fallo al recuperar logs del motor de automatizaciones.');
      }

      const configData = await configRes.json();
      const historyData = await historyRes.json();

      setEvents(configData.events || {});
      setSettings(configData.settings || {});
      setStats(configData.stats || null);
      setHistory(historyData.history || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con la base de datos de Neon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Guardar configuraciones
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (!res.ok) throw new Error('Error al guardar configuraciones.');
      
      await loadData();
      alert('✅ Configuraciones guardadas correctamente en Neon.');
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Ejecutar el Scheduler manualmente (Test)
  const handleRunScheduler = async () => {
    setRunningScheduler(true);
    try {
      const res = await fetch('/api/admin/events/run', {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Error al ejecutar el programador.');
      const data = await res.json();
      
      const details = data.result;
      alert(`✅ Programador ejecutado con éxito.\nDrops procesados: ${details.dropsProcessed}\nCupones expirados: ${details.couponsExpired}\nErrores detectados: ${details.errors.length}`);
      
      await loadData();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setRunningScheduler(false);
    }
  };

  const handleToggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true'
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Motor de Automatizaciones y Eventos
          </h1>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunScheduler}
            disabled={runningScheduler || loading}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            {runningScheduler ? 'Ejecutando...' : 'Ejecutar Ahora'}
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-white/5 bg-[#121212] hover:border-white/20 text-[var(--primary)] transition-all cursor-pointer"
            title="Refrescar Panel"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs rounded text-center font-mono flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-[#121212] border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase font-mono">
            Conectando con el motor en Neon...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LADO IZQUIERDO: CONFIGURACIÓN Y ESTADOS */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Panel de Configuración */}
            <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Settings2 className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs uppercase tracking-widest text-[#f5f5f0] font-bold">
                  Configuración Global
                </h3>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                {[
                  { key: 'enable_automations', label: 'Activar Automatizaciones', desc: 'Habilita o pausa temporalmente el motor de eventos completo.' },
                  { key: 'auto_submit_to_printful', label: 'Envío Automático a Printful', desc: 'Envía los pedidos automáticamente al proveedor tras confirmarse el pago.' },
                  { key: 'enable_automatic_emails', label: 'Emails Automáticos', desc: 'Permite disparar correos automáticos al cambiar estados de pedidos/drops.' },
                  { key: 'auto_open_drops', label: 'Apertura Automática de Drops', desc: 'Cambia a LIVE y notifica a la waitlist cuando llega la hora de apertura.' },
                  { key: 'auto_close_drops', label: 'Cierre Automático de Drops', desc: 'Finaliza el drop de forma automática según la hora límite establecida.' },
                ].map(item => (
                  <div key={item.key} className="space-y-1 bg-black/10 border border-white/5 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#f5f5f0]">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting(item.key)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          settings[item.key] === 'true' ? 'bg-[var(--primary)]' : 'bg-white/10'
                        }`}
                      >
                        <div className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                          settings[item.key] === 'true' ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] leading-relaxed">{item.desc}</p>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </form>
            </div>

            {/* Diagnóstico en Tiempo Real */}
            {stats && (
              <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Activity className="w-4 h-4 text-[var(--primary)]" />
                  <h3 className="text-xs uppercase tracking-widest text-[#f5f5f0] font-bold">
                    Métricas de Diagnóstico
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-black/10 p-3 border border-white/5 rounded">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">Última Latencia</span>
                    <span className="text-sm font-bold text-[#f5f5f0] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                      {stats.avgDurationMs} ms
                    </span>
                  </div>

                  <div className="bg-black/10 p-3 border border-white/5 rounded">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">Pendientes Cola</span>
                    <span className="text-sm font-bold text-[#f5f5f0] flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-blue-400" />
                      {stats.pendingEvents} u.
                    </span>
                  </div>

                  <div className="bg-black/10 p-3 border border-white/5 rounded">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">Errores Logs</span>
                    <span className={`text-sm font-bold flex items-center gap-1 ${
                      stats.errorCount > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {stats.errorCount}
                    </span>
                  </div>

                  <div className="bg-black/10 p-3 border border-white/5 rounded">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">Pasos Activos</span>
                    <span className="text-sm font-bold text-[#f5f5f0] flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      {stats.activeAutomationsCount} / 5
                    </span>
                  </div>
                </div>

                {stats.lastEvent && (
                  <div className="bg-black/10 border border-white/5 p-3 rounded space-y-1 text-[10px] font-mono">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold">Último Evento Ejecutado</span>
                    <div className="flex items-center gap-1 font-bold text-[#f5f5f0]">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        stats.lastEvent.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      {stats.lastEvent.eventType}
                    </div>
                    <div className="text-[var(--muted)] truncate mt-1">{stats.lastEvent.message}</div>
                    {stats.lastEvent.error && (
                      <div className="text-red-400/80 mt-1 select-all font-sans break-words bg-red-950/20 p-2 border border-red-900/10">
                        {stats.lastEvent.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LADO DERECHO: HISTORIAL Y LISTA DE EVENTOS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Registro de Eventos Soportados */}
            <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <FileText className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs uppercase tracking-widest text-[#f5f5f0] font-bold">
                  Eventos y Suscripciones Registradas
                </h3>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar text-xs">
                {Object.keys(events).map(key => (
                  <div key={key} className="flex justify-between items-start gap-4 p-2 bg-white/[0.01] border border-white/5 font-mono">
                    <div>
                      <strong className="text-[var(--primary)]">{key}</strong>
                      <p className="font-sans text-[10px] text-[var(--muted)] mt-0.5">{events[key].description}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      Escuchando
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial de Logs de Automatización */}
            <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Activity className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs uppercase tracking-widest text-[#f5f5f0] font-bold">
                  Historial de Automatización (Últimos 100 Logs)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                      <th className="py-2.5">Fecha</th>
                      <th className="py-2.5">Evento</th>
                      <th className="py-2.5">Resultado</th>
                      <th className="py-2.5 text-center">Duración</th>
                      <th className="py-2.5">Descripción de Salida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--muted)] italic">
                          No se registran eventos en el historial de logs de Neon.
                        </td>
                      </tr>
                    ) : (
                      history.map(entry => (
                        <tr key={entry.id} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 text-[var(--muted)]">
                            {new Date(entry.createdAt).toLocaleString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </td>
                          <td className="py-2.5 text-[#f5f5f0] font-bold">{entry.eventType}</td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                              entry.status === 'SUCCESS' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {entry.status === 'SUCCESS' ? (
                                <>
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Éxito
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-2.5 h-2.5" /> Fallo
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-bold text-[#f5f5f0]">{entry.durationMs} ms</td>
                          <td className="py-2.5 max-w-[200px] truncate text-[var(--muted)]" title={entry.message || entry.error || ''}>
                            {entry.status === 'SUCCESS' ? entry.message : entry.error}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
