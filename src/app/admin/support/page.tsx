'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, MessageSquare, AlertCircle, Calendar, ArrowRight, User } from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  category: string;
  subject: string;
  status: 'open' | 'pending' | 'replied' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: string;
  createdAt: string;
  updatedAt: string;
  orderNumber: string | null;
  lastMessageBody: string;
  lastMessageSender: 'customer' | 'agent' | null;
  lastMessageAt: string | null;
}

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/admin/support/tickets?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError('No autorizado. Por favor, inicia sesión.');
          return;
        }
        throw new Error('Error al listar los tickets de soporte.');
      }
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  // Badges estilizados de estado
  const getStatusBadge = (status: Ticket['status']) => {
    const styles: Record<Ticket['status'], string> = {
      open: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      replied: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      closed: 'bg-white/5 text-white/40 border border-white/5',
    };
    return styles[status] || 'bg-white/5 text-white/80';
  };

  // Badges estilizados de prioridad
  const getPriorityBadge = (priority: Ticket['priority']) => {
    const styles: Record<Ticket['priority'], string> = {
      low: 'bg-green-500/10 text-green-400 border border-green-500/10',
      normal: 'bg-white/5 text-white/70 border border-white/5',
      high: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      urgent: 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse font-bold',
    };
    return styles[priority] || 'bg-white/5 text-white/80';
  };

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Atención al Cliente</span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wide mt-1">
            INBOX DE SOPORTE
          </h1>
        </div>
        <button
          onClick={fetchTickets}
          className="px-4 py-2 border border-white/10 hover:border-[var(--primary)] text-[#f5f5f0] hover:text-black hover:bg-[var(--primary)] text-xs uppercase tracking-widest transition-all cursor-pointer font-bold"
        >
          Refrescar Bandeja
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-[#121212] border border-white/5 p-4 flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
        <form onSubmit={handleSearchSubmit} className="flex w-full md:max-w-md items-center relative">
          <input
            type="text"
            placeholder="Buscar por Ticket #, cliente, asunto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-white/5 px-4 py-2.5 pr-10 outline-none focus:border-[var(--primary)] text-white placeholder-white/20 transition-all font-mono"
          />
          <button type="submit" className="absolute right-3 text-white/40 hover:text-[var(--primary)] transition-colors cursor-pointer">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center justify-end font-mono">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span className="text-[10px] uppercase text-[var(--muted)]">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0d0d0d] border border-white/5 text-[#f5f5f0] px-3 py-1.5 outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="open">Abierto (open)</option>
              <option value="pending">Pendiente (pending)</option>
              <option value="replied">Respondido (replied)</option>
              <option value="resolved">Resuelto (resolved)</option>
              <option value="closed">Cerrado (closed)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-[var(--muted)]">Prioridad:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#0d0d0d] border border-white/5 text-[#f5f5f0] px-3 py-1.5 outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="">Todas</option>
              <option value="low">Baja (low)</option>
              <option value="normal">Normal (normal)</option>
              <option value="high">Alta (high)</option>
              <option value="urgent">Urgente (urgent)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 p-4 text-xs font-mono text-red-400 flex gap-2 items-center">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Contenedor de Listado */}
      <div className="bg-[#121212] border border-white/5 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Cargando bandeja de soporte...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <MessageSquare className="w-12 h-12 text-white/5 mx-auto" />
            <h3 className="font-serif font-bold text-lg uppercase tracking-wide text-white/60">Bandeja Vacía</h3>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
              No se han encontrado tickets de soporte que coincidan con los filtros o parámetros de búsqueda activos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-white/5 text-[9px] tracking-wider text-[var(--muted)] uppercase font-mono font-bold bg-[#181818]/50">
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Asunto</th>
                  <th className="p-4 text-center">Prioridad</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4">Último Mensaje</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-4 font-mono font-bold text-[var(--primary)]">
                      {ticket.ticketNumber}
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-semibold text-[#f5f5f0] flex items-center gap-1">
                        <User className="w-3 h-3 text-[var(--muted)]" /> {ticket.customerName}
                      </div>
                      <div className="text-[10px] text-[var(--muted)] font-mono">{ticket.customerEmail}</div>
                      {ticket.orderNumber && (
                        <div className="inline-block px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] rounded font-mono mt-1">
                          Pedido: {ticket.orderNumber}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono text-[10px] uppercase text-[var(--muted)]">
                      {ticket.category}
                    </td>
                    <td className="p-4 max-w-xs font-serif font-bold text-[#f5f5f0] tracking-wide truncate" title={ticket.subject}>
                      {ticket.subject}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-[10px] text-[var(--muted)] truncate" title={ticket.lastMessageBody}>
                        {ticket.lastMessageBody}
                      </p>
                      {ticket.lastMessageAt && (
                        <span className="text-[8px] font-mono text-white/20 block mt-1 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(ticket.lastMessageAt).toLocaleDateString()} {new Date(ticket.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {ticket.lastMessageSender === 'agent' ? ' (Agente)' : ' (Cliente)'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-white/10 hover:border-[var(--primary)] text-[10px] uppercase tracking-widest font-bold font-mono text-[#f5f5f0] hover:text-black hover:bg-[var(--primary)] transition-all"
                      >
                        Gestionar <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
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

// Loader2 animation helper
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
