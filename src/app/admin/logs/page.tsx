'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface SystemLog {
  id: string;
  type: 'info' | 'warning' | 'error' | 'security';
  timestamp: string;
  module: string;
  message: string;
  status: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/logs');
      if (!response.ok) {
        throw new Error('Error al conectar con el servidor de registros de auditoría.');
      }
      const data = (await response.json()) as SystemLog[];
      setLogs(data);
    } catch (err) {
      console.error('❌ Error fetching logs:', err);
      setError('No se pudo establecer conexión con el repositorio de logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Apply client-side filters when logs or filter states change
  useEffect(() => {
    let result = [...logs];

    if (selectedType !== 'all') {
      result = result.filter(log => log.type.toLowerCase() === selectedType.toLowerCase());
    }

    if (selectedModule !== 'all') {
      result = result.filter(log => log.module.toLowerCase() === selectedModule.toLowerCase());
    }

    setFilteredLogs(result);
  }, [logs, selectedType, selectedModule]);

  // Unique modules extracted from logs for filter dropdown
  const uniqueModules = Array.from(new Set(logs.map(log => log.module.toUpperCase()))).sort();

  const getLogTypeIcon = (type: SystemLog['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
    }
  };

  const getLogTypeBadge = (type: SystemLog['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'security':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Cargando Bitácora de Auditoría...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Fallo de Lectura
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error}
        </p>
        <button
          onClick={() => fetchLogs()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Registro de Auditoría
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar Logs</span>
          </button>
        </div>
      </div>

      {/* Contenedor de Filtros */}
      <div className="bg-[#121212] border border-white/5 p-6 flex flex-col md:flex-row md:items-center gap-6 justify-between shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-grow max-w-2xl">
          {/* Filtrar por tipo */}
          <div className="space-y-1.5 flex-1">
            <label className="text-[9px] tracking-widest uppercase text-[var(--muted)] font-semibold block">
              Tipo de Registro
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 text-xs text-[#f5f5f0] px-3.5 py-2.5 rounded focus:outline-none focus:border-[var(--primary)] transition-colors uppercase tracking-wider font-semibold cursor-pointer"
            >
              <option value="all">TODOS LOS TIPOS</option>
              <option value="info">INFO (Información)</option>
              <option value="warning">WARNING (Advertencias)</option>
              <option value="error">ERROR (Fallos de Ejecución)</option>
              <option value="security">SECURITY (Alertas Seguridad)</option>
            </select>
          </div>

          {/* Filtrar por módulo */}
          <div className="space-y-1.5 flex-1">
            <label className="text-[9px] tracking-widest uppercase text-[var(--muted)] font-semibold block">
              Módulo Afectado
            </label>
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 text-xs text-[#f5f5f0] px-3.5 py-2.5 rounded focus:outline-none focus:border-[var(--primary)] transition-colors uppercase tracking-wider font-semibold cursor-pointer"
            >
              <option value="all">TODOS LOS MÓDULOS</option>
              {uniqueModules.map(mod => (
                <option key={mod} value={mod.toLowerCase()}>
                  {mod}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador de Logs */}
        <div className="text-right">
          <span className="text-[9px] tracking-widest uppercase text-[var(--muted)] block font-semibold">Registros Encontrados</span>
          <span className="text-2xl font-serif font-bold text-[var(--primary)]">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-[#121212] border border-white/5 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <FileText className="w-10 h-10 text-white/10 mb-3" />
            <h3 className="text-sm font-serif uppercase tracking-wider text-[#f5f5f0] font-semibold mb-1">
              Sin Registros de Auditoría
            </h3>
            <p className="text-[10px] text-[var(--muted)] tracking-wider">
              No hay logs que coincidan con los criterios de filtrado seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[var(--muted)] tracking-wider uppercase font-semibold">
                  <th className="py-4 px-6 font-semibold w-32">Fecha y Hora</th>
                  <th className="py-4 px-6 font-semibold w-28 text-center">Severidad</th>
                  <th className="py-4 px-6 font-semibold w-28">Módulo</th>
                  <th className="py-4 px-6 font-semibold">Mensaje de Evento</th>
                  <th className="py-4 px-6 font-semibold w-24 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#f5f5f0]/80">
                {filteredLogs.map(log => {
                  const logDate = new Date(log.timestamp).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors leading-relaxed">
                      <td className="py-4.5 px-6 font-mono text-[var(--muted)] text-[10px]">
                        {logDate}
                      </td>
                      <td className="py-4.5 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded ${getLogTypeBadge(log.type)}`}>
                          {getLogTypeIcon(log.type)}
                          {log.type}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 font-mono font-semibold tracking-wider text-[var(--primary)] uppercase">
                        {log.module}
                      </td>
                      <td className="py-4.5 px-6 font-medium text-[#f5f5f0]/90 text-[11px] max-w-md break-words">
                        {log.message}
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <span className={`inline-block font-mono text-[9px] uppercase tracking-wider font-semibold ${log.status === 'success' || log.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                          {log.status}
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
