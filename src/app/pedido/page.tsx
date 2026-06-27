'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PedidoLookupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/customer/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orderNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al buscar el pedido.');
      }

      // Redirigir a la página de detalles del pedido si es correcto
      router.push(`/pedido/${data.orderNumber}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#f5f5f0] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background premium gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#111111]/80 backdrop-blur-md border border-white/5 p-8 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-white/[0.02] border border-white/5 rounded-full mb-4">
            <ShoppingBag className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-serif font-bold uppercase tracking-widest text-[#f5f5f0]">
            Consultar Pedido
          </h1>
          <p className="text-xs text-[var(--muted)] mt-2 font-sans max-w-xs mx-auto">
            Introduce tus datos de compra para acceder al estado actual de fabricación y envío sin necesidad de registrarte.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-2 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="ej. comprador@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#070707] border border-white/10 text-xs text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-2 flex items-center gap-1.5">
              <Search className="w-3 h-3" /> Número de Pedido
            </label>
            <input
              type="text"
              required
              placeholder="ej. AA-10001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full bg-[#070707] border border-white/10 text-xs text-[#f5f5f0] px-4 py-3 outline-none focus:border-[var(--primary)] uppercase transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 text-xs flex gap-2 items-start font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--primary)] hover:bg-[#c29f2e] text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Buscando...' : 'Consultar Estado'}
          </button>
        </form>

        {/* Footer seguridad */}
        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[9px] text-[var(--muted)] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Acceso cifrado y protegido por firma digital.</span>
        </div>
      </div>
    </div>
  );
}
