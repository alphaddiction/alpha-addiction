'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShoppingBag, 
  Ticket, 
  Hourglass, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Trash2
} from 'lucide-react';

interface CustomerProfile {
  email: string;
  name: string;
  ordersCount: number;
  ticketsCount: number;
  waitlistCount: number;
  marketingConsent: boolean;
  newsletterConsent: boolean;
  lastActivity: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [marketingFilter, setMarketingFilter] = useState<string>('all');
  const [newsletterFilter, setNewsletterFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search.trim(),
      });

      if (marketingFilter !== 'all') {
        params.append('marketing', marketingFilter);
      }
      if (newsletterFilter !== 'all') {
        params.append('newsletter', newsletterFilter);
      }

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, marketingFilter, newsletterFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleManualOptOut = async (email: string, type: 'marketing' | 'newsletter') => {
    if (!confirm(`¿Estás seguro de que deseas dar de baja manualmente a ${email} de las comunicaciones de ${type}?`)) {
      return;
    }

    const actionKey = `${email}-${type}`;
    setActionLoading(actionKey);

    try {
      const res = await fetch(`/api/customer/unsubscribe?email=${encodeURIComponent(email)}&type=${type}`);
      if (res.ok) {
        // Refrescar el estado local
        setCustomers(prev => prev.map(c => {
          if (c.email === email) {
            return {
              ...c,
              marketingConsent: type === 'marketing' ? false : c.marketingConsent,
              newsletterConsent: type === 'newsletter' ? false : c.newsletterConsent,
            };
          }
          return c;
        }));
      } else {
        alert('Error al procesar la baja voluntaria.');
      }
    } catch (err) {
      console.error('Error unsubscribing customer:', err);
    } finally {
      setActionLoading(null);
    }
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
            Gestión de Clientes & CRM
          </h1>
        </div>
        <div className="bg-[#1a1a1a] border border-white/5 px-4 py-2 text-xs text-[var(--muted)] font-mono">
          Total Clientes Consolidados: <span className="text-[var(--primary)] font-bold">{total}</span>
        </div>
      </div>

      {/* Controles y Filtros */}
      <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Formulario de Búsqueda */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Buscar por email o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-4 py-2.5 pl-10 text-xs text-[#f5f5f0] outline-none focus:border-[var(--primary)] transition-colors placeholder-[#f5f5f0]/30"
            />
            <Search className="w-4 h-4 text-[#f5f5f0]/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <button type="submit" className="hidden" />
          </form>

          {/* Filtros Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span className="text-[10px] uppercase text-[var(--muted)] tracking-wider">Marketing:</span>
              <select
                value={marketingFilter}
                onChange={(e) => { setMarketingFilter(e.target.value); setPage(1); }}
                className="bg-black/40 border border-white/10 text-xs text-[#f5f5f0] px-3 py-2 outline-none focus:border-[var(--primary)]"
              >
                <option value="all">Todos</option>
                <option value="accepted">Aceptado 🟢</option>
                <option value="not_accepted">No Aceptado ⚪</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-[var(--muted)] tracking-wider">Newsletter:</span>
              <select
                value={newsletterFilter}
                onChange={(e) => { setNewsletterFilter(e.target.value); setPage(1); }}
                className="bg-black/40 border border-white/10 text-xs text-[#f5f5f0] px-3 py-2 outline-none focus:border-[var(--primary)]"
              >
                <option value="all">Todos</option>
                <option value="accepted">Aceptado 🟢</option>
                <option value="not_accepted">No Aceptado ⚪</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-[#121212] border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            <span className="text-xs uppercase tracking-widest text-[var(--muted)]">Cargando base de datos...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] text-center p-8">
            <Users className="w-8 h-8 text-[var(--muted)] mb-2 animate-pulse" />
            <h3 className="text-sm font-serif font-semibold text-[#f5f5f0] uppercase tracking-wider">
              Sin coincidencias
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-sm">
              No se han encontrado registros de clientes con los filtros de búsqueda seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/20 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                  <th className="py-4 px-6 font-semibold">Cliente</th>
                  <th className="py-4 px-4 font-semibold text-center">Compras</th>
                  <th className="py-4 px-4 font-semibold text-center">Waitlist</th>
                  <th className="py-4 px-4 font-semibold text-center">Soporte</th>
                  <th className="py-4 px-6 font-semibold">Consentimiento RGPD / LSSI</th>
                  <th className="py-4 px-6 font-semibold">Última Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {customers.map((c) => (
                  <tr key={c.email} className="hover:bg-white/[0.01] transition-colors">
                    
                    {/* Cliente Info */}
                    <td className="py-4 px-6">
                      <div className="font-serif font-bold text-[#f5f5f0]">{c.name}</div>
                      <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5">{c.email}</div>
                    </td>

                    {/* Compras Stats */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[var(--foreground)]">
                        <ShoppingBag className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span className={c.ordersCount > 0 ? "text-[#f5f5f0] font-bold" : "text-[var(--muted)]"}>
                          {c.ordersCount}
                        </span>
                      </div>
                    </td>

                    {/* Waitlist Stats */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[var(--foreground)]">
                        <Hourglass className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span className={c.waitlistCount > 0 ? "text-[var(--primary)] font-bold" : "text-[var(--muted)]"}>
                          {c.waitlistCount}
                        </span>
                      </div>
                    </td>

                    {/* Soporte Stats */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[var(--foreground)]">
                        <Ticket className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span className={c.ticketsCount > 0 ? "text-amber-500 font-bold" : "text-[var(--muted)]"}>
                          {c.ticketsCount}
                        </span>
                      </div>
                    </td>

                    {/* Consentimiento RGPD */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2">
                        {/* Marketing */}
                        <div className="flex items-center justify-between gap-4 max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            {c.marketingConsent ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-[var(--muted)]" />
                            )}
                            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Marketing</span>
                          </div>
                          {c.marketingConsent && (
                            <button
                              onClick={() => handleManualOptOut(c.email, 'marketing')}
                              disabled={actionLoading !== null}
                              title="Baja voluntaria manual"
                              className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold px-1.5 py-0.5 border border-red-500/10 hover:border-red-500/30 transition-all font-mono"
                            >
                              Baja
                            </button>
                          )}
                        </div>

                        {/* Newsletter */}
                        <div className="flex items-center justify-between gap-4 max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            {c.newsletterConsent ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-[var(--muted)]" />
                            )}
                            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Contenido</span>
                          </div>
                          {c.newsletterConsent && (
                            <button
                              onClick={() => handleManualOptOut(c.email, 'newsletter')}
                              disabled={actionLoading !== null}
                              title="Baja voluntaria manual"
                              className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold px-1.5 py-0.5 border border-red-500/10 hover:border-red-500/30 transition-all font-mono"
                            >
                              Baja
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Última Actividad */}
                    <td className="py-4 px-6 text-[var(--muted)] font-mono">
                      {new Date(c.lastActivity).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/10">
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Página {page} de {totalPages} · Mostrando {customers.length} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#f5f5f0]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#f5f5f0]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
