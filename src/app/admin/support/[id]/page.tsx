'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  AlertCircle,
  FileText,
  Lock,
  Send,
  MessageSquare,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface Message {
  id: string;
  senderType: 'customer' | 'agent';
  senderEmail: string;
  body: string;
  createdAt: string;
  internalNote: boolean;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  customerEmail: string;
  customerName: string;
  orderId: string | null;
  orderNumber: string | null;
  category: string;
  subject: string;
  status: 'open' | 'pending' | 'replied' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages: Message[];
}

interface CustomerAccessInfo {
  totalAccesses: number;
  tokenAccesses: number;
  otpAccesses: number;
  credentialsAccesses: number;
  logs: Array<{
    id: string;
    createdAt: string;
    accessType: string;
    orderNumber: string | null;
    ipAddress: string | null;
  }>;
}

export default function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [customerAccess, setCustomerAccess] = useState<CustomerAccessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de formularios
  const [activeTab, setActiveTab] = useState<'reply' | 'note'>('reply');
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError('No autorizado.');
          return;
        }
        throw new Error('Error al recuperar detalles del ticket.');
      }
      const data = await res.json();
      setTicket(data.ticket);
      setCustomerAccess(data.customerAccess || null);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Cambiar prioridad o estado
  const handleUpdateMeta = async (fields: { status?: string; priority?: string }) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      if (!res.ok) throw new Error('Error al actualizar metadatos del ticket.');
      
      // Refrescar ticket
      await fetchTicket();
    } catch (err: any) {
      alert(err.message || 'Error de servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  // Enviar Respuesta
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText })
      });
      if (!res.ok) throw new Error('Error al enviar respuesta.');
      
      setReplyText('');
      await fetchTicket();
    } catch (err: any) {
      alert(err.message || 'Error de servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  // Enviar Nota Interna
  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText })
      });
      if (!res.ok) throw new Error('Error al registrar nota interna.');
      
      setNoteText('');
      await fetchTicket();
    } catch (err: any) {
      alert(err.message || 'Error de servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Cargando ticket...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 p-6 text-xs font-mono text-red-400 flex gap-2 items-center">
        <AlertCircle className="w-4 h-4" /> {error || 'No se pudo recuperar el ticket de soporte.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Volver */}
      <div className="flex">
        <Link
          href="/admin/support"
          className="text-[10px] uppercase tracking-widest text-[var(--muted)] hover:text-[#f5f5f0] flex items-center gap-1.5 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--primary)]" /> Volver a la Bandeja
        </Link>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Lado Izquierdo: Conversación y Respuestas (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Cabecera del Caso */}
          <div className="bg-[#111111]/90 border border-white/5 p-6 space-y-3 relative">
            <div className="absolute inset-0 border border-[var(--primary)]/5 pointer-events-none" />
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-[var(--primary)]">{ticket.ticketNumber}</span>
              <span className="text-[9px] font-mono text-[var(--muted)]">{ticket.category}</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wide uppercase">
              {ticket.subject}
            </h1>
            <div className="text-[9px] text-[var(--muted)] font-mono flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                Creado: {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Actualizado: {new Date(ticket.updatedAt).toLocaleDateString()} {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Conversación / Mensajes */}
          <div className="bg-[#111111]/90 border border-white/5 p-6 space-y-6">
            <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono border-b border-white/5 pb-3">
              Hilo de Conversación
            </h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex flex-col">
              {ticket.messages.map((msg) => {
                if (msg.internalNote) {
                  // Nota interna
                  return (
                    <div key={msg.id} className="w-full bg-amber-500/5 border border-amber-500/20 p-4 space-y-2 rounded">
                      <div className="flex justify-between items-center text-[9px] font-mono text-amber-400 uppercase font-bold">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Nota Interna de {msg.senderEmail}
                        </span>
                        <span>
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/90 whitespace-pre-wrap leading-relaxed font-mono">
                        {msg.body}
                      </p>
                    </div>
                  );
                }

                const isAgent = msg.senderType === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] p-4 rounded space-y-1.5 flex flex-col ${
                      isAgent
                        ? 'self-end bg-white/[0.02] border border-[var(--primary)]/20 text-[#f5f5f0] text-right'
                        : 'self-start bg-[#161616] border border-white/5 text-[#f5f5f0]'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--muted)] uppercase">
                      <span className={isAgent ? 'order-2 text-[var(--primary)] font-bold' : 'font-bold'}>
                        {isAgent ? 'Agente Support' : ticket.customerName}
                      </span>
                      <span className={isAgent ? 'order-1 ml-auto' : 'mr-auto'}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs whitespace-pre-wrap leading-relaxed text-left">
                      {msg.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario de Respuesta / Notas Internas */}
          {ticket.status !== 'closed' ? (
            <div className="bg-[#111111]/90 border border-white/5 overflow-hidden">
              {/* Pestañas */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveTab('reply')}
                  className={`flex-1 py-3 text-center text-[10px] uppercase tracking-widest font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'reply'
                      ? 'bg-white/[0.02] text-[var(--primary)] border-b-2 border-[var(--primary)]'
                      : 'text-[var(--muted)] hover:text-[#f5f5f0]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Responder al Cliente
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('note')}
                  className={`flex-1 py-3 text-center text-[10px] uppercase tracking-widest font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'note'
                      ? 'bg-white/[0.02] text-amber-400 border-b-2 border-amber-500'
                      : 'text-[var(--muted)] hover:text-[#f5f5f0]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Nota Interna
                  </span>
                </button>
              </div>

              {/* Formularios */}
              <div className="p-6">
                {activeTab === 'reply' ? (
                  <form onSubmit={handleSendReply} className="space-y-4">
                    <textarea
                      rows={4}
                      required
                      placeholder="Redactar respuesta oficial al cliente..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-white/10 text-xs text-[#f5f5f0] p-4 outline-none focus:border-[var(--primary)] resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-6 py-2.5 bg-[var(--primary)] hover:bg-black hover:text-white border border-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {actionLoading ? (
                          'Enviando...'
                        ) : (
                          <>
                            Enviar Respuesta <Send className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSendNote} className="space-y-4">
                    <textarea
                      rows={4}
                      required
                      placeholder="Añadir comentario privado (sólo visible para agentes)..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-white/10 text-xs text-[#f5f5f0] p-4 outline-none focus:border-amber-500 resize-none font-mono"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-black hover:text-amber-500 border border-amber-500 text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {actionLoading ? (
                          'Registrando...'
                        ) : (
                          <>
                            Guardar Nota Interna <Lock className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#121212] border border-white/5 p-6 text-center text-xs font-mono text-[var(--muted)] uppercase tracking-wider">
              🔒 Este ticket está cerrado. Para responder, cambia el estado del ticket en el panel derecho.
            </div>
          )}

        </div>

        {/* Lado Derecho: Metadatos y Datos del Cliente (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Controles de Estado y Prioridad */}
          <div className="bg-[#111111]/90 border border-white/5 p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono border-b border-white/5 pb-3">
              Gestión del Ticket
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold block">
                  Estado del Caso:
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleUpdateMeta({ status: e.target.value })}
                  disabled={actionLoading}
                  className="w-full bg-[#0d0d0d] border border-white/5 text-[#f5f5f0] px-3 py-2.5 outline-none focus:border-[var(--primary)] cursor-pointer"
                >
                  <option value="open">Abierto (open)</option>
                  <option value="pending">Pendiente (pending)</option>
                  <option value="replied">Respondido (replied)</option>
                  <option value="resolved">Resuelto (resolved)</option>
                  <option value="closed">Cerrado (closed)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold block">
                  Prioridad del Caso:
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handleUpdateMeta({ priority: e.target.value })}
                  disabled={actionLoading}
                  className="w-full bg-[#0d0d0d] border border-white/5 text-[#f5f5f0] px-3 py-2.5 outline-none focus:border-[var(--primary)] cursor-pointer"
                >
                  <option value="low">Baja (low)</option>
                  <option value="normal">Normal (normal)</option>
                  <option value="high">Alta (high)</option>
                  <option value="urgent">Urgente (urgent)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-[#111111]/90 border border-white/5 p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono border-b border-white/5 pb-3">
              Información de Cliente
            </h3>

            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex gap-2 items-start">
                <User className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                <div>
                  <span className="text-white/40 block text-[8px] uppercase">Nombre completo</span>
                  <span className="text-[#f5f5f0] text-xs font-serif font-bold">{ticket.customerName}</span>
                </div>
              </div>
              
              <div className="flex gap-2 items-start pt-2">
                <Mail className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                <div>
                  <span className="text-white/40 block text-[8px] uppercase">Correo de contacto</span>
                  <span className="text-[#f5f5f0]">{ticket.customerEmail}</span>
                </div>
              </div>

              <div className="flex gap-2 items-start pt-2 border-t border-white/5">
                <FileText className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                <div>
                  <span className="text-white/40 block text-[8px] uppercase">Canal de origen</span>
                  <span className="text-[#f5f5f0] uppercase">{ticket.source}</span>
                </div>
              </div>

              {ticket.orderNumber && (
                <div className="flex gap-2 items-start pt-2 border-t border-white/5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-indigo-400/50 block text-[8px] uppercase">Pedido Relacionado</span>
                    <Link
                      href={`/admin/orders?q=${ticket.orderNumber}`}
                      className="text-indigo-300 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      {ticket.orderNumber}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auditoría de Acceso Portal */}
          {customerAccess && (
            <div className="bg-[#111111]/90 border border-white/5 p-6 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono border-b border-white/5 pb-3">
                Auditoría de Acceso Portal
              </h3>
              <div className="space-y-3 font-mono text-[9px]">
                <div className="flex justify-between">
                  <span className="text-white/40">Total consultas:</span>
                  <span className="text-white font-bold">{customerAccess.totalAccesses}</span>
                </div>
                <div className="flex justify-between text-[8px] pl-2">
                  <span className="text-white/30">• Vía OTP (código):</span>
                  <span>{customerAccess.otpAccesses}</span>
                </div>
                <div className="flex justify-between text-[8px] pl-2">
                  <span className="text-white/30">• Vía Token (enlace):</span>
                  <span>{customerAccess.tokenAccesses}</span>
                </div>
                <div className="flex justify-between text-[8px] pl-2">
                  <span className="text-white/30">• Vía Credencial:</span>
                  <span>{customerAccess.credentialsAccesses}</span>
                </div>
                
                {/* Historial de últimos accesos */}
                {customerAccess.logs.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-white/40 uppercase block text-[8px]">Últimas consultas</span>
                    {customerAccess.logs.map((log) => (
                      <div key={log.id} className="text-[8px] border-b border-white/2 pb-1 last:border-0">
                        <div className="flex justify-between">
                          <span className="text-[var(--primary)] font-bold">{log.accessType}</span>
                          <span className="text-white/20">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-white/30 text-[7px] mt-0.5">
                          IP: {log.ipAddress || '—'} {log.orderNumber ? `(Ped: ${log.orderNumber})` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

// Loader helper
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
