'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  X, 
  Send, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  MessageSquare,
  Bot
} from 'lucide-react';
import { AiConversation, AiMessage } from '@/shared/types/ai';

export default function AlphaChatDrawer() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  
  // Estado de salud para el indicador visual
  const [healthStatus, setHealthStatus] = useState<'green' | 'yellow' | 'red'>('green');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Atajo de teclado (Ctrl + I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Cargar salud del sistema para el punto indicador
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/admin/system/health');
        if (res.ok) {
          const data = await res.json();
          // Evaluamos alertas
          const degradedCount = data.healthCheck?.degradedCount || 0;
          const alertsCount = data.criticalAlertsCount || 0;

          if (alertsCount > 0) {
            setHealthStatus('red');
          } else if (degradedCount > 0) {
            setHealthStatus('yellow');
          } else {
            setHealthStatus('green');
          }
        }
      } catch (_) {
        setHealthStatus('yellow');
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, []);

  // 3. Cargar conversaciones al abrir
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // 4. Cargar mensajes al cambiar de conversación activa
  useEffect(() => {
    if (activeConversationId) {
      const active = conversations.find((c) => c.id === activeConversationId);
      if (active && active.messages) {
        setMessages(active.messages);
      } else {
        fetchMessages(activeConversationId);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId, conversations]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    setIsConversationsLoading(true);
    try {
      const res = await fetch('/api/admin/ai/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsConversationsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai/conversations?id=${id}`);
      if (res.ok) {
        const conversation: AiConversation = await res.json();
        if (conversation && conversation.messages) {
          setMessages(conversation.messages);
          // Actualizar en lista local
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, messages: conversation.messages } : c))
          );
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleCreateSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Conversación ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` })
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
      }
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar esta conversación?')) return;

    try {
      const res = await fetch(`/api/admin/ai/conversations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversationId || isLoading) return;

    const messageText = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Añadir mensaje de usuario localmente de forma optimista
    const tempUserMsg: AiMessage = {
      id: Math.random().toString(),
      conversationId: activeConversationId,
      role: 'user',
      content: messageText,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: messageText,
          pathname: pathname
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Recargar el historial completo para sincronizar IDs y timestamps
        await fetchMessages(activeConversationId);
      } else {
        const errData = await res.json().catch(() => ({}));
        const tempErrorMsg: AiMessage = {
          id: Math.random().toString(),
          conversationId: activeConversationId,
          role: 'assistant',
          content: `⚠️ Error: ${errData.error || 'No se pudo generar respuesta. Comprueba la API key de OpenAI.'}`,
          createdAt: new Date()
        };
        setMessages((prev) => [...prev, tempErrorMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante flotando en la esquina inferior derecha */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          w-14 h-14 bg-black/80 hover:bg-[#d4af37]/10 
          border border-white/10 hover:border-[#d4af37]/40
          text-white hover:text-[#d4af37]
          rounded-full flex items-center justify-center
          shadow-lg shadow-black/50 backdrop-blur-md
          transition-all duration-300 transform hover:scale-105
        "
        title="Abrir Alpha Intelligence (Ctrl + I)"
      >
        <Bot className="w-6 h-6 animate-pulse" />
        
        {/* Indicador discreto de salud operativa */}
        <span className={`
          absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black
          ${healthStatus === 'green' ? 'bg-emerald-500' : ''}
          ${healthStatus === 'yellow' ? 'bg-amber-500' : ''}
          ${healthStatus === 'red' ? 'bg-rose-500 animate-ping' : ''}
        `} />
      </button>

      {/* Drawer lateral deslizable */}
      <div className={`
        fixed top-0 right-0 h-screen w-full sm:w-[440px] z-50
        bg-black/95 border-l border-white/5 backdrop-blur-xl
        shadow-2xl shadow-black/80
        flex flex-col
        transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <span className="font-serif text-lg tracking-wider text-[#f5f5f0]">ALPHA</span>
            <span className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 uppercase tracking-widest rounded">v1</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateSession}
              disabled={isLoading}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded transition-all"
              title="Nueva conversación"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Listado y selector de conversaciones rápidas */}
        {conversations.length > 1 && (
          <div className="px-6 py-2 border-b border-white/5 bg-white/1 overflow-x-auto flex gap-2 max-w-full scrollbar-none">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConversationId(c.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border flex-shrink-0 transition-all
                  ${activeConversationId === c.id
                    ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]'
                    : 'bg-white/2 border-white/5 text-white/50 hover:text-white'}
                `}
              >
                <MessageSquare className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{c.title}</span>
                <span 
                  onClick={(e) => handleDeleteSession(c.id, e)} 
                  className="hover:text-red-400 p-0.5 rounded ml-1 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Lista de mensajes */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
          {isConversationsLoading && conversations.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
              <span className="text-xs uppercase tracking-widest text-white/30">Cargando asistente...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-6">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-2">Bienvenido a Alpha Intelligence</h3>
                <p className="text-xs text-white/40 max-w-[240px] leading-relaxed">
                  Inicia una conversación para consultar métricas, estado de las integraciones o interpretar eventos del panel.
                </p>
              </div>
              <button
                onClick={handleCreateSession}
                className="
                  px-6 py-2.5 bg-white text-black font-medium text-xs uppercase tracking-widest 
                  hover:bg-[#d4af37] hover:text-black transition-all
                "
              >
                Comenzar Conversación
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`
                  max-w-[80%] rounded-lg p-3 text-sm leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-white/10 border border-white/5 text-[#f5f5f0]'
                    : 'bg-white/2 border border-white/5 text-[#f5f5f0]/85'}
                `}>
                  {/* Renderizado de markdown básico de forma nativa */}
                  <div className="whitespace-pre-line space-y-2">
                    {m.content}
                  </div>
                  
                  {m.contextPath && m.role === 'user' && (
                    <div className="text-[10px] text-white/30 mt-2 font-mono flex items-center gap-1 border-t border-white/5 pt-1.5">
                      <ChevronRight className="w-3 h-3" />
                      Contexto: {m.contextPath}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/5 border border-[#d4af37]/10 flex items-center justify-center text-[#d4af37]/60 flex-shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white/2 border border-white/5 text-white/40 rounded-lg p-3 text-xs uppercase tracking-widest flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Alpha está consultando...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input formulario */}
        {conversations.length > 0 && (
          <form 
            onSubmit={handleSendMessage} 
            className="p-4 border-t border-white/5 bg-white/1 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isLoading ? 'Procesando consulta...' : 'Pregunta a Alpha...'}
              disabled={isLoading}
              className="
                flex-1 px-4 py-3 bg-black/60 border border-white/10 
                focus:border-[#d4af37]/40 text-sm text-white focus:outline-none 
                placeholder-white/20 transition-all rounded-md
              "
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="
                p-3 bg-white text-black hover:bg-[#d4af37] disabled:bg-white/5 
                disabled:text-white/20 transition-all duration-300 rounded-md
              "
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </>
  );
}
