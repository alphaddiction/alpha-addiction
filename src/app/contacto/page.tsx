'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';

function ContactForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Duda general');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ ticketNumber: string } | null>(null);

  // Pre-rellenar el pedido si viene en los parámetros de la URL
  useEffect(() => {
    const pedidoParam = searchParams.get('pedido');
    if (pedidoParam) {
      setOrderNumber(pedidoParam.trim().toUpperCase());
      setCategory('Pedido'); // Seleccionar automáticamente la categoría Pedido
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          category,
          subject,
          message,
          orderNumber: orderNumber ? orderNumber.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error inesperado al enviar el mensaje.');
      }

      setSuccessData({ ticketNumber: data.ticketNumber });
      // Limpiar formulario
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setOrderNumber('');
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-[#111111]/90 border border-white/5 p-8 md:p-12 text-center max-w-xl mx-auto space-y-6 animate-fade-in relative">
        <div className="absolute inset-0 border border-[var(--primary)]/10 pointer-events-none" />
        <div className="flex justify-center">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wide uppercase">
          ¡Solicitud Recibida!
        </h2>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Hola, tu mensaje ha sido procesado correctamente y se ha generado la solicitud de soporte:
        </p>
        <div className="bg-white/[0.02] border border-white/5 py-3 px-6 rounded inline-block font-mono text-sm font-bold text-[var(--primary)] tracking-widest">
          {successData.ticketNumber}
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
          Hemos enviado un correo electrónico de confirmación a tu dirección. Nuestro equipo de soporte revisará los detalles y te responderá lo antes posible.
        </p>
        <div className="pt-4 flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-[var(--primary)] hover:bg-black hover:text-white border border-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-[#111111]/90 border border-white/5 p-6 sm:p-10 space-y-8 relative">
      <div className="absolute inset-0 border border-[var(--primary)]/5 pointer-events-none" />
      
      <div className="space-y-2 border-b border-white/5 pb-6">
        <span className="text-[9px] tracking-[0.3em] text-[var(--primary)] uppercase font-mono font-bold">
          Soporte Técnico & Consultas
        </span>
        <h2 className="text-3xl font-serif font-bold tracking-wide text-[#f5f5f0] uppercase">
          Formulario de Contacto
        </h2>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Escríbenos y resolveremos cualquier duda, incidencia con un pedido, devolución o pregunta general sobre los drops.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 p-4 text-xs font-mono text-red-400">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
              Tu Nombre *
            </label>
            <input
              type="text"
              id="name"
              required
              placeholder="Ej. Albert Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] focus:bg-white/[0.04] transition-all placeholder-white/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
              Correo Electrónico *
            </label>
            <input
              type="email"
              id="email"
              required
              placeholder="Ej. albert@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] focus:bg-white/[0.04] transition-all placeholder-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="category" className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
              Categoría de la Consulta *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
            >
              <option value="Duda general">Duda general</option>
              <option value="Pedido">Incidencia con Pedido</option>
              <option value="Envío">Envío y Seguimiento</option>
              <option value="Devolución">Devoluciones y Cambios</option>
              <option value="Pago">Dudas sobre Pagos</option>
              <option value="Producto">Detalles de Producto</option>
              <option value="Otro">Otro asunto</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="orderNumber" className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
              Número de Pedido <span className="text-[8px] text-white/40">(Opcional)</span>
            </label>
            <input
              type="text"
              id="orderNumber"
              placeholder="Ej. AA-10001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="w-full bg-white/[0.02] border border-white/10 text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] focus:bg-white/[0.04] transition-all placeholder-white/20 font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
            Asunto del mensaje *
          </label>
          <input
            type="text"
            id="subject"
            required
            placeholder="Ej. Retraso en mi envío de Genesis Drop"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/10 text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] focus:bg-white/[0.04] transition-all placeholder-white/20"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
            Tu Mensaje *
          </label>
          <textarea
            id="message"
            required
            rows={5}
            placeholder="Escribe aquí de forma detallada tu consulta o incidencia..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/10 text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] focus:bg-white/[0.04] transition-all placeholder-white/20 resize-none font-sans leading-relaxed"
          />
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[9px] text-[var(--muted)] flex items-center gap-1.5 font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
            Los campos marcados con * son obligatorios.
          </span>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 bg-[var(--primary)] hover:bg-black hover:text-white border border-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar mensaje
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#f5f5f0] py-24 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden flex flex-col justify-center">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--primary)]/1 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/2 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative w-full">
        {/* Enlace para volver */}
        <div className="flex">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-widest text-[var(--muted)] hover:text-[#f5f5f0] flex items-center gap-1.5 transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--primary)]" /> Volver al Inicio
          </Link>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        }>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  );
}
