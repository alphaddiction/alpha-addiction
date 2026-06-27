'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/email/helpers';

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

export default function ComunicacionesPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmailLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/logs?type=email'); // Utilizaremos el endpoint de logs existente o crearemos uno ligero
      if (!res.ok) throw new Error('Fallo al recuperar logs de comunicaciones.');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron obtener los logs de correo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  // Simulador de reenvío (Boceto solicitado)
  const handleResendClick = (logId: string) => {
    alert(`[MOCK] Acción Reenviar para el log ID: ${logId}. Funcionalidad preparada para fases futuras.`);
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.emailType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.order?.orderNumber && log.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-[var(--primary)]" /> Auditoría de Comunicaciones
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1 font-sans">
            Historial detallado de correos transaccionales enviados por Resend.
          </p>
        </div>
        <button
          onClick={fetchEmailLogs}
          disabled={loading}
          className="p-2 border border-white/10 hover:border-white/20 text-[#f5f5f0] flex items-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider bg-white/[0.02]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Sincronizar'}
        </button>
      </div>

      {/* Buscador */}
      <div className="flex gap-4 items-center bg-[#121212] border border-white/5 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Buscar por destinatario, asunto, tipo de email o número de pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 text-xs text-[#f5f5f0] pl-10 pr-4 py-2.5 outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Tabla de Logs */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-xs font-mono">
          ⚠️ {error}
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
              {loading ? (
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
                        <span className="flex items-center gap-1">
                          #{log.order.orderNumber}
                          <ArrowRight className="w-3 h-3 text-[var(--primary)]" />
                        </span>
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
                        className="px-2.5 py-1.5 border border-white/10 hover:border-[var(--primary)] hover:text-black hover:bg-[var(--primary)] text-[#f5f5f0] text-[10px] font-bold uppercase tracking-wider transition-all bg-white/[0.02]"
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
  );
}
