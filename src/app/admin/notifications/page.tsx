'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  Archive, 
  Inbox, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  status: 'unread' | 'read' | 'archived';
  module: string;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('all'); // unread, read, archived, all
  const [severityFilter, setSeverityFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        status: statusFilter,
        severity: severityFilter,
        module: moduleFilter,
        search: searchQuery
      });

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError('No autorizado. Por favor, inicia sesión de administrador.');
          return;
        }
        throw new Error('Error al consultar el centro de notificaciones.');
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, statusFilter, severityFilter, moduleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', ids: [id] })
      });
      if (res.ok) {
        // Actualizar localmente
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', ids: [id] })
      });
      if (res.ok) {
        // Eliminar de la vista actual local
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Icono según severidad
  const getSeverityIcon = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  // Clases por severidad para el panel lateral
  const getSeverityCardClass = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-950/5';
      case 'error':
        return 'border-l-orange-500 bg-orange-950/5';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-950/5';
      case 'success':
        return 'border-l-emerald-500 bg-emerald-950/5';
      default:
        return 'border-l-transparent bg-white/[0.01]';
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Consola de Control</span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wide mt-1">
            CENTRO DE NOTIFICACIONES
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 border border-white/10 hover:border-[var(--primary)] hover:bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#f5f5f0] flex items-center gap-2 cursor-pointer transition-all duration-150"
          >
            <Check className="w-3.5 h-3.5" />
            Marcar todo leído
          </button>
          <button
            onClick={fetchNotifications}
            className="p-2 border border-white/10 hover:border-white/20 text-[#f5f5f0] rounded cursor-pointer transition-all"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Caja de Búsqueda */}
        <form onSubmit={handleSearchSubmit} className="lg:col-span-4 relative flex">
          <input
            type="text"
            placeholder="Buscar en el registro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 text-xs px-3.5 py-2.5 text-[#f5f5f0] focus:outline-none focus:border-[var(--primary)] font-mono placeholder:text-white/20"
          />
          <button
            type="submit"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Filtros */}
        <div className="lg:col-span-8 grid grid-cols-3 gap-2">
          {/* Filtro Estado */}
          <div className="flex items-center bg-[#121212] border border-white/10 px-2.5">
            <span className="text-[9px] text-[var(--muted)] uppercase mr-2 hidden sm:inline">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="bg-transparent border-0 outline-none text-xs text-[#f5f5f0] w-full py-2.5 cursor-pointer font-mono"
            >
              <option value="all">Bandeja de Entrada</option>
              <option value="unread">No Leídas</option>
              <option value="read">Leídas</option>
              <option value="archived">Archivadas</option>
              <option value="any">Cualquier Estado</option>
            </select>
          </div>

          {/* Filtro Severidad */}
          <div className="flex items-center bg-[#121212] border border-white/10 px-2.5">
            <span className="text-[9px] text-[var(--muted)] uppercase mr-2 hidden sm:inline">Severidad:</span>
            <select
              value={severityFilter}
              onChange={(e) => { setPage(1); setSeverityFilter(e.target.value); }}
              className="bg-transparent border-0 outline-none text-xs text-[#f5f5f0] w-full py-2.5 cursor-pointer font-mono"
            >
              <option value="all">Severidad (Todas)</option>
              <option value="critical">Críticas</option>
              <option value="error">Errores</option>
              <option value="warning">Advertencias</option>
              <option value="success">Completadas</option>
              <option value="info">Informativas</option>
            </select>
          </div>

          {/* Filtro Módulo */}
          <div className="flex items-center bg-[#121212] border border-white/10 px-2.5">
            <span className="text-[9px] text-[var(--muted)] uppercase mr-2 hidden sm:inline">Módulo:</span>
            <select
              value={moduleFilter}
              onChange={(e) => { setPage(1); setModuleFilter(e.target.value); }}
              className="bg-transparent border-0 outline-none text-xs text-[#f5f5f0] w-full py-2.5 cursor-pointer font-mono"
            >
              <option value="all">Módulo (Todos)</option>
              <option value="orders">Pedidos</option>
              <option value="paypal">PayPal</option>
              <option value="printful">Printful</option>
              <option value="email">Emails</option>
              <option value="support">Soporte</option>
              <option value="waitlist">Waitlist</option>
              <option value="automations">Automatizaciones</option>
              <option value="backups">Copias de Seguridad</option>
              <option value="sentry">Sentry Logger</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Contenido principal */}
      {loading ? (
        <div className="py-24 text-center border border-white/5 bg-white/[0.01]">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <span className="text-xs text-[var(--muted)] uppercase tracking-wider">Cargando alertas del sistema...</span>
        </div>
      ) : error ? (
        <div className="p-6 border border-red-500/20 bg-red-950/10 text-center">
          <p className="text-red-400 text-xs font-bold uppercase">Error</p>
          <p className="text-[#f5f5f0] text-xs mt-1">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-24 text-center border border-white/5 bg-white/[0.01] text-[var(--muted)] flex flex-col items-center justify-center">
          <Inbox className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-xs uppercase tracking-wider">No se encontraron notificaciones</p>
          <p className="text-[10px] mt-1 text-[#8a8a8a]">La consola del sistema se encuentra limpia de incidencias.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border border-white/10 border-l-2 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-white/20 ${getSeverityCardClass(n.severity)} ${n.status === 'unread' ? 'shadow-[inset_0_0_15px_rgba(255,255,255,0.015)]' : 'opacity-85'}`}
            >
              {/* Información de la Alerta */}
              <div className="space-y-2 flex-grow max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityIcon(n.severity)}
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${n.severity === 'critical' ? 'text-red-400' : 'text-[#f5f5f0]'}`}>
                    {n.title}
                  </span>
                  
                  {/* Badge de Módulo */}
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-[8px] font-semibold text-[var(--muted)] uppercase tracking-wider rounded">
                    {n.module}
                  </span>

                  {/* Badge de No Leído */}
                  {n.status === 'unread' && (
                    <span className="px-1.5 py-0.5 bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-wider">
                      Nuevo
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#d4d4d4] leading-relaxed">
                  {n.message}
                </p>

                {/* Fecha */}
                <div className="text-[9px] text-[var(--muted)]">
                  <span>Registrado el: </span>
                  <span>{new Date(n.createdAt).toLocaleString('es-ES')}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2.5 justify-end mt-2 md:mt-0">
                {n.actionUrl && (
                  <Link
                    href={n.actionUrl}
                    className="h-9 px-4 border border-white/10 hover:border-white/20 text-[#f5f5f0] text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 hover:bg-white/5 transition-all"
                  >
                    <span>Ver</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                {n.status === 'unread' && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="h-9 w-9 border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 flex items-center justify-center rounded cursor-pointer transition-all"
                    title="Marcar como leída"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {n.status !== 'archived' && (
                  <button
                    onClick={() => handleArchive(n.id)}
                    className="h-9 w-9 border border-white/10 hover:border-white/20 flex items-center justify-center rounded cursor-pointer transition-all text-[var(--muted)] hover:text-white"
                    title="Archivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-6 text-[10px] text-[var(--muted)]">
              <div>
                Mostrando {notifications.length} de {total} alertas registradas.
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="h-8 px-3 border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/10 text-[#f5f5f0] flex items-center gap-1 cursor-pointer transition-all uppercase font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="px-2 font-mono">Pág. {page} / {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className="h-8 px-3 border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/10 text-[#f5f5f0] flex items-center gap-1 cursor-pointer transition-all uppercase font-bold"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
